import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse, paginatedResponse, getPaginationParams } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(searchParams);

    const [elearnings, total] = await Promise.all([
      prisma.eLearning.findMany({
        where: { course: { userId } },
        include: { course: { select: { id: true, name: true, sks: true } } },
        orderBy: { endDate: "asc" },
        skip,
        take: limit,
      }),
      prisma.eLearning.count({ where: { course: { userId } } }),
    ]);

    return paginatedResponse(elearnings, total, page, limit);
  } catch (error) {
    console.error("ELearning GET error:", error);
    return errorResponse("Gagal mengambil data e-learning", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const body = await request.json();
    const { courseId, title, description, startDate, endDate, frequency, reminders } = body;

    if (!courseId || !title || !startDate || !endDate) {
      return errorResponse("Data tidak lengkap", 400);
    }

    // Pastikan course milik user ini
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.userId !== userId) {
      return errorResponse("Mata kuliah tidak ditemukan", 404);
    }

    const elearning = await prisma.eLearning.create({
      data: {
        courseId,
        title,
        description: description || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        frequency: frequency || "2_weeks",
        reminders: reminders || "H-7,H-3,H-1,H-0",
      },
      include: { course: { select: { id: true, name: true, sks: true } } },
    });

    return successResponse(elearning, "E-Learning berhasil ditambahkan", 201);
  } catch (error) {
    console.error("ELearning POST error:", error);
    return errorResponse("Gagal menambahkan e-learning", 500);
  }
}
