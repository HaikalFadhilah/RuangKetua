import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";
import { GoogleDriveAdapter } from "@/lib/cloud/google-drive";
import { upsertFile } from "@/lib/cloud/sync";

export const runtime = "nodejs";

const FOLDER_MIME = "application/vnd.google-apps.folder";

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const body = await request.json();
    const accountId = body.accountId as string | null;
    const name = (body.name as string | null)?.trim();
    const parentId = (body.parentId as string | null) || undefined;

    if (!accountId) return errorResponse("accountId wajib diisi", 400);
    if (!name) return errorResponse("Nama folder wajib diisi", 400);

    const account = await prisma.cloudAccount.findFirst({
      where: { id: accountId, userId, provider: "google_drive" },
    });
    if (!account) return errorResponse("Akun tidak ditemukan", 404);

    const adapter = new GoogleDriveAdapter(account);
    const folder = await adapter.createFolder({ name, parentId });
    await upsertFile(userId, accountId, {
      id: folder.id,
      name: folder.name,
      mimeType: FOLDER_MIME,
      size: 0,
      parents: folder.parentId ? [folder.parentId] : [],
      webViewLink: null,
      thumbnailLink: null,
      starred: false,
      shared: false,
      createdTime: new Date().toISOString(),
      modifiedTime: new Date().toISOString(),
    });
    return successResponse({ ...folder, accountId }, "Folder berhasil dibuat", 201);
  } catch (error) {
    console.error("POST /api/drive/folders error:", error);
    return errorResponse(error instanceof Error ? error.message : "Gagal membuat folder", 500);
  }
}
