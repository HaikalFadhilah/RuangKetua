import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    const { id } = await params;

    const event = await prisma.calendarEvent.findUnique({
      where: { id },
    });

    if (!event) {
      return errorResponse("Event tidak ditemukan", 404);
    }

    await prisma.calendarEvent.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        userId,
        action: "DELETE",
        entity: "calendar",
        entityId: id,
        description: `Menghapus event kalender: ${event.title}`,
      },
    });

    return successResponse(null, "Event berhasil dihapus");
  } catch (error) {
    console.error("Calendar DELETE error:", error);
    return errorResponse("Gagal menghapus event", 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.calendarEvent.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse("Event tidak ditemukan", 404);
    }

    const event = await prisma.calendarEvent.update({
      where: { id },
      data: {
        title: body.title || undefined,
        description: body.description !== undefined ? body.description : undefined,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        type: body.type ? body.type.toUpperCase() : undefined,
        color: body.color || undefined,
      },
    });

    return successResponse(event, "Event berhasil diupdate");
  } catch (error) {
    console.error("Calendar PUT error:", error);
    return errorResponse("Gagal mengupdate event", 500);
  }
}
