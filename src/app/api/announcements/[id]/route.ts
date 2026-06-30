import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.announcement.findFirst({ where: { id, userId } });
    if (!existing) return errorResponse("Pengumuman tidak ditemukan", 404);

    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        title: body.title || undefined,
        content: body.content || undefined,
        category: body.category || undefined,
        pinned: body.pinned !== undefined ? body.pinned : undefined,
        broadcast: body.broadcast !== undefined ? body.broadcast : undefined,
      },
    });

    return successResponse(announcement, "Pengumuman berhasil diupdate");
  } catch (error) {
    console.error("Announcement PUT error:", error);
    return errorResponse("Gagal mengupdate pengumuman", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    const { id } = await params;

    const existing = await prisma.announcement.findFirst({ where: { id, userId } });
    if (!existing) return errorResponse("Pengumuman tidak ditemukan", 404);

    await prisma.announcement.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        userId,
        action: "DELETE",
        entity: "announcement",
        entityId: id,
        description: `Menghapus pengumuman: ${existing.title}`,
      },
    });

    return successResponse(null, "Pengumuman berhasil dihapus");
  } catch (error) {
    console.error("Announcement DELETE error:", error);
    return errorResponse("Gagal menghapus pengumuman", 500);
  }
}
