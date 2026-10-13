import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";
import { GoogleDriveAdapter } from "@/lib/cloud/google-drive";

export const runtime = "nodejs";

async function resolveAccount(userId: string, remoteFileId: string, accountId?: string | null) {
  if (accountId) {
    const acc = await prisma.cloudAccount.findFirst({ where: { id: accountId, userId, provider: "google_drive" } });
    if (!acc) throw new Error("Akun tidak ditemukan");
    return acc;
  }
  const mirror = await prisma.cloudFile.findFirst({ where: { remoteFileId, userId } });
  if (!mirror) throw new Error("File tidak ditemukan");
  const acc = await prisma.cloudAccount.findFirst({ where: { id: mirror.accountId, userId, provider: "google_drive" } });
  if (!acc) throw new Error("Akun tidak ditemukan");
  return acc;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = getUserIdFromRequest(request);
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const account = await resolveAccount(userId, id, body.accountId);

    const mirror = await prisma.cloudFile.findFirst({ where: { remoteFileId: id, userId } });
    const next = typeof body.starred === "boolean" ? body.starred : !mirror?.isStarred;

    const adapter = new GoogleDriveAdapter(account);
    await adapter.setFileStarred(id, next);
    await prisma.cloudFile.updateMany({
      where: { remoteFileId: id },
      data: { isStarred: next },
    });
    return successResponse({ starred: next }, "Berhasil");
  } catch (error) {
    console.error("POST /api/drive/files/[id]/star error:", error);
    return errorResponse(error instanceof Error ? error.message : "Gagal mengubah bintang", 500);
  }
}
