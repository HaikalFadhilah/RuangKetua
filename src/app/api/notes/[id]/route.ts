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

    const existing = await prisma.stickyNote.findFirst({ where: { id, userId } });
    if (!existing) return errorResponse("Catatan tidak ditemukan", 404);

    const note = await prisma.stickyNote.update({
      where: { id },
      data: {
        title: body.title !== undefined ? body.title : undefined,
        content: body.content !== undefined ? body.content : undefined,
        color: body.color || undefined,
        pinned: body.pinned !== undefined ? body.pinned : undefined,
      },
    });

    return successResponse(note, "Catatan berhasil diupdate");
  } catch (error) {
    console.error("Note PUT error:", error);
    return errorResponse("Gagal mengupdate catatan", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    const { id } = await params;

    const existing = await prisma.stickyNote.findFirst({ where: { id, userId } });
    if (!existing) return errorResponse("Catatan tidak ditemukan", 404);

    await prisma.stickyNote.delete({ where: { id } });
    return successResponse(null, "Catatan berhasil dihapus");
  } catch (error) {
    console.error("Note DELETE error:", error);
    return errorResponse("Gagal menghapus catatan", 500);
  }
}
