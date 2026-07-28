import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";

export const runtime = "nodejs";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    const { id } = await params;
    const account = await prisma.cloudAccount.findFirst({ where: { id, userId, provider: "google_drive" } });
    if (!account) return errorResponse("Akun tidak ditemukan", 404);
    // Hapus mirror file milik akun ini dulu (cascade juga menangani, tapi eksplisit lebih aman)
    await prisma.cloudFile.deleteMany({ where: { accountId: id } });
    await prisma.cloudAccount.delete({ where: { id } });
    return successResponse(null, "Akun Drive diputus");
  } catch (error) {
    console.error("DELETE /api/drive/accounts/[id] error:", error);
    return errorResponse("Gagal memutus akun Drive", 500);
  }
}
