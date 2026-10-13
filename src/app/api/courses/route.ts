import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);

    const courses = await prisma.course.findMany({
      where: { userId },
      include: {
        _count: { select: { tasks: true, elearnings: true, materials: true } },
      },
      orderBy: { name: "asc" },
    });

    return successResponse(courses);
  } catch (error) {
    console.error("Courses GET error:", error);
    return errorResponse("Gagal mengambil data mata kuliah", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const body = await request.json();
    const { name, sks, semester, schedule, scheduleDay, scheduleStart, scheduleEnd, dosenName, dosenWa } = body;

    if (!name) {
      return errorResponse("Nama mata kuliah wajib diisi", 400);
    }

    const course = await prisma.course.create({
      data: {
        userId,
        name,
        sks: sks ? (isNaN(parseInt(sks)) ? null : parseInt(sks)) : null,
        semester: semester || null,
        schedule: schedule || null,
        scheduleDay: scheduleDay || null,
        scheduleStart: scheduleStart || null,
        scheduleEnd: scheduleEnd || null,
        dosenName: dosenName || null,
        dosenWa: dosenWa || null,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: "CREATE",
        entity: "course",
        entityId: course.id,
        description: `Menambahkan mata kuliah: ${name}`,
      },
    });

    return successResponse(course, "Mata kuliah berhasil ditambahkan", 201);
  } catch (error) {
    console.error("Courses POST error:", error);
    return errorResponse("Gagal menambahkan mata kuliah", 500);
  }
}
