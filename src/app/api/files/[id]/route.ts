import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";
import { unlink } from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import crypto from "crypto";
import { deleteCloudFileForUser } from "@/lib/cloud/delete";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    const { id } = await params;

    const file = await prisma.sharedFile.findFirst({ where: { id, userId } });
    if (!file) return errorResponse("File tidak ditemukan", 404);

    return successResponse(file);
  } catch (error) {
    console.error("File GET error:", error);
    return errorResponse("Gagal mengambil file", 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.sharedFile.findFirst({ where: { id, userId } });
    if (!existing) return errorResponse("File tidak ditemukan", 404);

    // Handle share toggle
    if (body.action === "share") {
      const shareToken = crypto.randomBytes(16).toString("hex");
      const file = await prisma.sharedFile.update({
        where: { id },
        data: { shareToken, isPublic: true },
      });
      return successResponse(file, "Share link berhasil dibuat");
    }

    if (body.action === "unshare") {
      const file = await prisma.sharedFile.update({
        where: { id },
        data: { shareToken: null, isPublic: false },
      });
      return successResponse(file, "Share link dihapus");
    }

    // Normal rename
    const file = await prisma.sharedFile.update({
      where: { id },
      data: { name: body.name || undefined },
    });

    return successResponse(file, "File berhasil diupdate");
  } catch (error) {
    console.error("File PUT error:", error);
    return errorResponse("Gagal mengupdate file", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    const { id } = await params;

    const file = await prisma.sharedFile.findFirst({ where: { id, userId } });
    if (!file) return errorResponse("File tidak ditemukan", 404);

    const syncedRemoteId = file.shareToken?.startsWith("sync_")
      ? file.shareToken.slice("sync_".length)
      : null;
    const cloudFile = await prisma.cloudFile.findFirst({
      where: {
        userId,
        OR: [
          ...(syncedRemoteId ? [{ remoteFileId: syncedRemoteId }] : []),
          { webViewLink: file.fileUrl },
        ],
      },
    });

    if (cloudFile) {
      await deleteCloudFileForUser(userId, cloudFile.accountId, cloudFile.remoteFileId);
    } else {
      const publicDir = path.resolve(process.cwd(), "public");
      const filePath = path.resolve(publicDir, file.fileUrl);
      if (filePath.startsWith(publicDir) && existsSync(filePath)) {
        await unlink(filePath);
      }
      await prisma.sharedFile.delete({ where: { id } });
    }

    await prisma.activityLog.create({
      data: {
        userId,
        action: "DELETE",
        entity: "file",
        entityId: id,
        description: `Menghapus file: ${file.name}`,
      },
    });

    return successResponse(null, "File berhasil dihapus");
  } catch (error) {
    console.error("File DELETE error:", error);
    return errorResponse("Gagal menghapus file", 500);
  }
}
