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

    // Pastikan elearning milik user ini via course
    const existing = await prisma.eLearning.findUnique({
      where: { id },
      include: { course: { select: { userId: true } } },
    });
    if (!existing || existing.course.userId !== userId) {
      return errorResponse("E-Learning tidak ditemukan", 404);
    }

    const elearning = await prisma.eLearning.update({
      where: { id },
      data: {
        title: body.title || undefined,
        description: body.description !== undefined ? body.description : undefined,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        frequency: body.frequency || undefined,
        reminders: body.reminders || undefined,
        isActive: body.isActive !== undefined ? body.isActive : undefined,
      },
      include: { course: { select: { id: true, name: true, sks: true } } },
    });

    return successResponse(elearning, "E-Learning berhasil diupdate");
  } catch (error) {
    console.error("ELearning PUT error:", error);
    return errorResponse("Gagal mengupdate e-learning", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    const { id } = await params;

    const existing = await prisma.eLearning.findUnique({
      where: { id },
      include: { course: { select: { userId: true } } },
    });
    if (!existing || existing.course.userId !== userId) {
      return errorResponse("E-Learning tidak ditemukan", 404);
    }

    await prisma.eLearning.delete({ where: { id } });
    return successResponse(null, "E-Learning berhasil dihapus");
  } catch (error) {
    console.error("ELearning DELETE error:", error);
    return errorResponse("Gagal menghapus e-learning", 500);
  }
}
