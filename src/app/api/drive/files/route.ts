import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";
import {
  getCloudFiles,
  getStorageForAccount,
  runFullSync,
} from "@/lib/cloud/sync";
import { deleteCloudFileForUser } from "@/lib/cloud/delete";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    const folderId = searchParams.get("folderId") || null;
    const view = (searchParams.get("view") as any) || "list";
    const q = searchParams.get("q");
    const sync = searchParams.get("sync") === "true";

    if (sync) {
      try {
        await runFullSync(userId);
      } catch (e) {
        console.error("drive sync error:", e);
      }
    }

    const rawFiles = await getCloudFiles(userId, { view, accountId, folderId, q });
    
    // Deduplicate files by id (remoteFileId)
    // If a file is shared across multiple connected accounts or duplicated during sync, 
    // it will have the same id, which causes React duplicate key warnings.
    const fileMap = new Map();
    for (const f of rawFiles) {
      if (!fileMap.has(f.id)) {
        fileMap.set(f.id, f);
      }
    }
    const files = Array.from(fileMap.values());

    let storage = null;
    if (accountId) storage = await getStorageForAccount(userId, accountId);
    return successResponse({ files, storage });
  } catch (error) {
    console.error("GET /api/drive/files error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Gagal mengambil file dari Google Drive",
      500
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    const fileId = searchParams.get("fileId");

    // Bulk delete via body
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await request.json().catch(() => ({}));
      const ids: string[] = Array.isArray(body.ids) ? body.ids : [];
      if (ids.length === 0) return errorResponse("Tidak ada file dipilih", 400);
      for (const rid of ids) {
        const mirror = await prisma.cloudFile.findFirst({
          where: { remoteFileId: rid, userId },
        });
        if (mirror) await deleteCloudFileForUser(userId, mirror.accountId, rid);
      }
      return successResponse(null, "File berhasil dihapus");
    }

    if (!accountId || !fileId)
      return errorResponse("accountId & fileId wajib diisi", 400);
    await deleteCloudFileForUser(userId, accountId, fileId);
    return successResponse(null, "File berhasil dihapus");
  } catch (error) {
    console.error("DELETE /api/drive/files error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Gagal menghapus file",
      500
    );
  }
}
