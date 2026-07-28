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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = getUserIdFromRequest(request);
    const { id } = await params;
    const body = await request.json();
    const name = (body.name as string | null)?.trim();
    if (!name) return errorResponse("Nama wajib diisi", 400);

    const account = await resolveAccount(userId, id, body.accountId);
    const adapter = new GoogleDriveAdapter(account);
    const res = await adapter.renameFile(id, name);
    await prisma.cloudFile.updateMany({ where: { remoteFileId: id }, data: { name: res.name ?? name } });
    return successResponse(res, "Berhasil rename");
  } catch (error) {
    console.error("PATCH /api/drive/files/[id]/rename error:", error);
    return errorResponse(error instanceof Error ? error.message : "Gagal rename file", 500);
  }
}
