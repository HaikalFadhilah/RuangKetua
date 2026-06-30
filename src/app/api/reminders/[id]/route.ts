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

    const existing = await prisma.reminder.findFirst({ where: { id, userId } });
    if (!existing) return errorResponse("Reminder tidak ditemukan", 404);

    const reminder = await prisma.reminder.update({
      where: { id },
      data: {
        title: body.title || undefined,
        description: body.description !== undefined ? body.description : undefined,
        remindAt: body.remindAt ? new Date(body.remindAt) : undefined,
        type: body.type || undefined,
        target: body.target || undefined,
        sent: body.sent !== undefined ? body.sent : undefined,
      },
    });

    return successResponse(reminder, "Reminder berhasil diupdate");
  } catch (error) {
    console.error("Reminder PUT error:", error);
    return errorResponse("Gagal mengupdate reminder", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    const { id } = await params;

    const existing = await prisma.reminder.findFirst({ where: { id, userId } });
    if (!existing) return errorResponse("Reminder tidak ditemukan", 404);

    await prisma.reminder.delete({ where: { id } });
    return successResponse(null, "Reminder berhasil dihapus");
  } catch (error) {
    console.error("Reminder DELETE error:", error);
    return errorResponse("Gagal menghapus reminder", 500);
  }
}
