import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import prisma from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/api-utils";
import { selectBestAccount } from "@/lib/cloud/allocation";
import { GoogleDriveAdapter } from "@/lib/cloud/google-drive";

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) return errorResponse("Unauthorized", 401);

    const body = await request.json();
    const { title, templateType } = body; // templateType: "UANG_KAS" | "TUGAS" | "KELOMPOK"

    if (!title) return errorResponse("Judul spreadsheet wajib diisi", 400);

    // 1. Dapatkan akun Google Drive terbaik via allocation
    const result = await selectBestAccount(userId, 1024);
    if (!result) return errorResponse("Tidak ada akun Google Drive yang tersedia atau kuota penuh", 400);

    // Fetch akun lengkap (termasuk encryptedCredentials) dari DB
    const account = await prisma.cloudAccount.findUnique({
      where: { id: result.selected.id },
    });
    if (!account) return errorResponse("Akun Google Drive tidak ditemukan", 400);

    // 2. Ambil data anggota kelas dari "Buku Induk"
    const members = await prisma.classMember.findMany({
      where: { userId, status: "ACTIVE" },
      orderBy: { name: "asc" },
    });

    // 3. Siapkan template kolom dan baris berdasarkan pilihan
    let headers: string[] = [];
    let rows: any[][] = [];

    if (templateType === "UANG_KAS") {
      headers = ["No", "Nama Mahasiswa", "NIM", "Total Tagihan", "Sudah Bayar", "Sisa Tagihan", "Status Lunas"];
      rows = members.map((m, i) => [
        i + 1,
        m.name,
        m.nim || "-",
        50000, // Default tagihan (bisa diedit di Excel nanti)
        0,     // Default bayar
        "=D" + (i + 2) + "-E" + (i + 2), // Formula Sisa: D - E
        '=IF(F' + (i + 2) + '<=0, "LUNAS", "BELUM")' // Formula Status
      ]);
    } else if (templateType === "TUGAS") {
      headers = ["No", "Nama Mahasiswa", "NIM", "Status Pengumpulan", "Link File / Keterangan", "Nilai"];
      rows = members.map((m, i) => [
        i + 1,
        m.name,
        m.nim || "-",
        "Belum Kumpul",
        "",
        ""
      ]);
    } else if (templateType === "KELOMPOK") {
      headers = ["Kelompok", "Topik Pembahasan", "Anggota 1", "Anggota 2", "Anggota 3", "Anggota 4"];
      // Buat beberapa row kelompok kosong
      for (let i = 1; i <= 10; i++) {
        rows.push([`Kelompok ${i}`, "", "", "", "", ""]);
      }
    } else {
      // Default / Kosong
      headers = ["Kolom 1", "Kolom 2", "Kolom 3"];
      rows = [["", "", ""]];
    }

    // Gabungkan header dan baris isi
    const sheetData = [headers, ...rows];

    // 4. Inisiasi koneksi ke Google API v4
    const adapter = new GoogleDriveAdapter(account);

    // 5. Buat file spreadsheet baru
    const spreadsheetId = await adapter.createSpreadsheet(title);

    // 6. Tulis data ke dalam sheet (Sheet1)
    const endColumn = String.fromCharCode(65 + headers.length - 1); // e.g. A..G
    const range = `Sheet1!A1:${endColumn}${sheetData.length}`;
    await adapter.appendSpreadsheetValues(spreadsheetId, range, sheetData);

    // 7. Format Header (Baris 1 jadi tebal + kuning)
    await adapter.formatSpreadsheetHeader(spreadsheetId, 0, headers.length);

    // 8. Simpan metadata file ke database kita agar muncul di File Manager
    const cloudFile = await prisma.cloudFile.create({
      data: {
        userId,
        accountId: account.id,
        remoteFileId: spreadsheetId,
        name: title,
        mimeType: "application/vnd.google-apps.spreadsheet",
        size: 0, // native gsuite docs technically don't consume byte quota directly
        isFolder: false,
        virtualPath: `/${title}`,
        webViewLink: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`, // Generate link langsung
      },
    });

    return successResponse({
      fileId: cloudFile.id,
      remoteFileId: spreadsheetId,
      webViewLink: cloudFile.webViewLink,
    }, `Spreadsheet ${title} berhasil dibuat dengan template ${templateType}`, 201);

  } catch (error: any) {
    console.error("POST /api/drive/spreadsheets/generate error:", error);
    return errorResponse(error.message || "Gagal membuat spreadsheet otomatis", 500);
  }
}