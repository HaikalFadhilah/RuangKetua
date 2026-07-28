import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";
import prisma from "@/lib/prisma";
import { GoogleDriveAdapter } from "@/lib/cloud/google-drive";
import { upsertFile, updateAccountStorage } from "@/lib/cloud/sync";

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const body = await request.json();
    const { accountId, fileId, courseId, repoUpload } = body;

    if (!accountId || !fileId) {
      return errorResponse("Parameter tidak lengkap dari browser", 400);
    }

    const account = await prisma.cloudAccount.findFirst({
      where: { id: accountId, userId, provider: "google_drive" },
    });

    if (!account) return errorResponse("Akun tidak ditemukan", 404);

    // 1. Dapatkan metadata (size, mimeType, webViewLink, dll) file yang baru saja di-upload
    const adapter = new GoogleDriveAdapter(account);
    const result = await adapter.getFileDetails(fileId);

    // 2. Potong Quota akun Drive pengguna di Database kita
    const used = Number(account.quotaUsed || 0) + (result.size || 0);
    await updateAccountStorage(accountId, Number(account.quotaTotal || 0), used);

    // 3. Simpan ke tabel CloudFile (File Manager)
    await upsertFile(userId, accountId, {
      id: result.id,
      name: result.name,
      mimeType: result.mimeType,
      size: result.size,
      parents: result.parents || [],
      webViewLink: result.webViewLink ?? null,
      thumbnailLink: result.thumbnailLink ?? null,
      starred: false,
      shared: false,
      createdTime: new Date().toISOString(),
      modifiedTime: new Date().toISOString(),
    });

    // 4. Catat aktivitas
    await prisma.activityLog.create({
      data: {
        userId,
        action: "CREATE",
        entity: "cloud_file",
        entityId: result.id,
        description: `Direct Upload file ke Google Drive: ${result.name}`,
      },
    });

    let sharedFileResult = null;

    // 5. JIKA ini adalah upload dari halaman Repository, kita WAJIB merekamnya ke tabel SharedFile
    if (repoUpload) {
      const savedFile = await prisma.sharedFile.create({
        data: {
          userId,
          courseId: courseId || null,
          name: result.name,
          fileUrl: result.webViewLink || "#",
          fileType: result.mimeType.replace(".", ""),
          fileSize: result.size || 0,
          shareToken: `sync_${result.id}`, // Sinkronisasi KTP (agar bisa dihapus dari File Manager)
        },
      });
      sharedFileResult = savedFile;

      await prisma.activityLog.create({
        data: {
          userId,
          action: "CREATE",
          entity: "repository",
          entityId: savedFile.id,
          description: `Direct Upload file ke Repository: ${result.name}`,
        },
      });
    }

    return successResponse({ file: result, sharedFile: sharedFileResult });

  } catch (error) {
    console.error("Upload Confirm API Error:", error);
    return errorResponse(error instanceof Error ? error.message : "Terjadi kesalahan sistem", 500);
  }
}
