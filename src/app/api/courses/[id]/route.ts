import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = getUserIdFromRequest(request);
    const body = await request.json();
    const { name, sks, semester, schedule, dosenName, dosenWa } = body;

    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return errorResponse("Mata kuliah tidak ditemukan", 404);
    }

    const course = await prisma.course.update({
      where: { id },
      data: {
        name,
        sks: sks ? (isNaN(parseInt(sks)) ? null : parseInt(sks)) : null,
        semester: semester || null,
        schedule: schedule || null,
        dosenName: dosenName || null,
        dosenWa: dosenWa || null,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: "UPDATE",
        entity: "course",
        entityId: course.id,
        description: `Mengupdate mata kuliah: ${name}`,
      },
    });

    return successResponse(course, "Mata kuliah berhasil diupdate");
  } catch (error) {
    console.error("Course PUT error:", error);
    return errorResponse("Gagal mengupdate mata kuliah", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = getUserIdFromRequest(request);

    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return errorResponse("Mata kuliah tidak ditemukan", 404);
    }

    await prisma.course.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        userId,
        action: "DELETE",
        entity: "course",
        entityId: id,
        description: `Menghapus mata kuliah: ${existing.name}`,
      },
    });

    return successResponse(null, "Mata kuliah berhasil dihapus");
  } catch (error) {
    console.error("Course DELETE error:", error);
    return errorResponse("Gagal menghapus mata kuliah", 500);
  }
}
