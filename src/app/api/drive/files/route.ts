import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";
import { GoogleDriveAdapter } from "@/lib/cloud/google-drive";
import {
  getCloudFiles,
  getStorageForAccount,
  deleteCloudFile,
  runFullSync,
} from "@/lib/cloud/sync";

export const runtime = "nodejs";

async function deleteOne(
  userId: string,
  accountId: string,
  remoteFileId: string
) {
  const account = await prisma.cloudAccount.findFirst({
    where: { id: accountId, userId, provider: "google_drive" },
  });
  if (!account) return;
  // capture size before deleting from mirror
  const mirror = await prisma.cloudFile.findFirst({ where: { remoteFileId } });
  try {
    const adapter = new GoogleDriveAdapter(account);
    await adapter.deleteFile(remoteFileId);
  } catch (e) {
    // jika file sudah tidak ada di Google, abaikan error delete
    const msg = e instanceof Error ? e.message : String(e);
    if (!/404|notFound|not found/i.test(msg)) throw e;
  }
  if (mirror) {
    const used = Math.max(0, Number(account.quotaUsed || 0) - (mirror.size || 0));
    await prisma.cloudAccount.update({
      where: { id: accountId },
      data: { quotaUsed: String(used) },
    });
    
    // Hapus juga catatan di repository (Material) dan SharedFile 
    // agar file yang musnah di Drive tidak nyangkut menjadi "ghost file"
    try {
      await prisma.material.deleteMany({
        where: { 
          OR: [
             { fileUrl: { contains: remoteFileId } },
             { fileUrl: mirror.webViewLink || "impossible-match" }
          ]
        }
      });
      await prisma.sharedFile.deleteMany({
        where: { 
          OR: [
             { fileUrl: { contains: remoteFileId } },
             { fileUrl: mirror.webViewLink || "impossible-match" },
             { shareToken: { contains: remoteFileId } }
          ]
        }
      });
    } catch(e) {
      console.error("Gagal membersihkan dependensi file hantu:", e);
    }
  }
  await deleteCloudFile(remoteFileId);
}

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
        if (mirror) await deleteOne(userId, mirror.accountId, rid);
      }
      return successResponse(null, "File berhasil dihapus");
    }

    if (!accountId || !fileId)
      return errorResponse("accountId & fileId wajib diisi", 400);
    await deleteOne(userId, accountId, fileId);
    return successResponse(null, "File berhasil dihapus");
  } catch (error) {
    console.error("DELETE /api/drive/files error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Gagal menghapus file",
      500
    );
  }
}
