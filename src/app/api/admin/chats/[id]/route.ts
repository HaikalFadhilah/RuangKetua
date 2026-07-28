import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userRole = request.headers.get("x-user-role");
    if (userRole !== "admin") return errorResponse("Unauthorized", 403);

    const { id } = await params;
    await prisma.chatMessage.delete({ where: { id } });

    return successResponse(null, "Pesan chat berhasil dihapus");
  } catch (error) {
    console.error("DELETE /api/admin/chats/[id] error:", error);
    return errorResponse("Terjadi kesalahan", 500);
  }
}
