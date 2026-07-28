import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";
import { GoogleDriveAdapter } from "@/lib/cloud/google-drive";

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);

    const sheets = await prisma.cloudFile.findMany({
      where: {
        userId,
        mimeType: "application/vnd.google-apps.spreadsheet",
        isFolder: false,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        webViewLink: true,
        createdAt: true,
        mimeType: true,
      },
    });

    return successResponse(sheets);
  } catch (error) {
    console.error("GET /api/drive/spreadsheets/list error:", error);
    return errorResponse("Gagal mengambil daftar spreadsheet", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return errorResponse("ID wajib diisi", 400);

    const file = await prisma.cloudFile.findFirst({
      where: { id, userId },
      include: { account: true },
    });

    if (!file) return errorResponse("Spreadsheet tidak ditemukan", 404);

    // Hapus dari Google Drive
    try {
      const adapter = new GoogleDriveAdapter(file.account);
      await adapter.deleteFile(file.remoteFileId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!/404|notFound|not found/i.test(msg)) throw e;
    }

    // Hapus dari DB
    await prisma.cloudFile.delete({ where: { id } });

    return successResponse(null, "Spreadsheet berhasil dihapus");
  } catch (error) {
    console.error("DELETE /api/drive/spreadsheets/list error:", error);
    return errorResponse("Gagal menghapus spreadsheet", 500);
  }
}
