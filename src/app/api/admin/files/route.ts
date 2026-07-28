import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get("x-user-role");
    if (userRole !== "admin") return errorResponse("Unauthorized", 403);

    const files = await prisma.sharedFile.findMany({
      include: { user: { select: { id: true, name: true, email: true, university: true } } },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(files);
  } catch (error) {
    console.error("GET /api/admin/files error:", error);
    return errorResponse("Terjadi kesalahan", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userRole = request.headers.get("x-user-role");
    if (userRole !== "admin") return errorResponse("Unauthorized", 403);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return errorResponse("ID tidak ditemukan", 400);

    await prisma.sharedFile.delete({ where: { id } });
    return successResponse(null, "File berhasil dihapus");
  } catch (error) {
    console.error("DELETE /api/admin/files error:", error);
    return errorResponse("Terjadi kesalahan", 500);
  }
}
