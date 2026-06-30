import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dosen = await prisma.dosen.findUnique({
      where: { id },
      include: { courses: { select: { id: true, name: true, code: true } } },
    });
    if (!dosen) return errorResponse("Dosen tidak ditemukan", 404);
    return successResponse(dosen);
  } catch (error) {
    console.error("Dosen GET error:", error);
    return errorResponse("Gagal mengambil data dosen", 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, whatsapp, email, consultHours, courseIds } = body;

    const dosen = await prisma.dosen.update({
      where: { id },
      data: {
        name: name || undefined,
        whatsapp: whatsapp !== undefined ? whatsapp || null : undefined,
        email: email !== undefined ? email || null : undefined,
        consultHours: consultHours !== undefined ? consultHours || null : undefined,
        courses: courseIds
          ? { set: courseIds.map((cid: string) => ({ id: cid })) }
          : undefined,
      },
      include: { courses: { select: { id: true, name: true, code: true } } },
    });

    return successResponse(dosen, "Dosen berhasil diupdate");
  } catch (error) {
    console.error("Dosen PUT error:", error);
    return errorResponse("Gagal mengupdate dosen", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.dosen.delete({ where: { id } });
    return successResponse(null, "Dosen berhasil dihapus");
  } catch (error) {
    console.error("Dosen DELETE error:", error);
    return errorResponse("Gagal menghapus dosen", 500);
  }
}
