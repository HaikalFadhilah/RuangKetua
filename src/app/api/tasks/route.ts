export const dynamic = "force-dynamic"; // Memaksa Next.js untuk selalu ambil data terbaru (bypass cache)

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse, paginatedResponse, getPaginationParams } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(searchParams);

    const search = searchParams.get("search") || "";
    // Paksa jadi Uppercase agar cocok dengan Enum Prisma
    const status = searchParams.get("status")?.toUpperCase(); 
    const priority = searchParams.get("priority")?.toUpperCase();
    const courseId = searchParams.get("courseId") || "";
    const ALLOWED_SORT = ["createdAt", "deadline", "priority", "status", "title", "updatedAt"];
    const rawSortBy = searchParams.get("sortBy") || "createdAt";
    const sortBy = ALLOWED_SORT.includes(rawSortBy) ? rawSortBy : "createdAt";
    const rawSortOrder = searchParams.get("sortOrder") || "desc";
    const sortOrder = rawSortOrder === "asc" ? "asc" : "desc";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { userId };

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }
    
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (courseId) where.courseId = courseId;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
        course: { select: { id: true, name: true, sks: true } },
        subtasks: true,
        _count: { select: { subtasks: true } },
      },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    return paginatedResponse(tasks, total, page, limit);
  } catch (error) {
    console.error("Tasks GET error:", error);
    return errorResponse("Gagal mengambil data tugas", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const body = await request.json();

    // Pastikan 'status' ikut diekstrak dari body
    const { title, description, courseId, deadline, priority, status, subtasks } = body;

    if (!title) {
      return errorResponse("Judul tugas wajib diisi", 400);
    }

    // === PENYESUAIAN DATA SEBELUM MASUK PRISMA ===

    // 1. Pastikan Priority & Status huruf besar atau fallback ke default
    const validPriority = priority ? priority.toUpperCase() : "MEDIUM";
    const validStatus = status ? status.toUpperCase() : "PENDING";
    
    // 2. Mencegah empty string ("") masuk ke Foreign Key
    const validCourseId = courseId && courseId.trim() !== "" ? courseId : null;
    
    // 3. Pastikan deadline bukan Invalid Date
    let validDeadline = null;
    if (deadline) {
      const parsedDate = new Date(deadline);
      if (!isNaN(parsedDate.getTime())) {
        validDeadline = parsedDate;
      }
    }

    const task = await prisma.task.create({
      data: {
        userId,
        title,
        description: description || null,
        courseId: validCourseId,
        deadline: validDeadline,
        priority: validPriority,
        status: validStatus, // Status sekarang masuk dengan format yang benar
        subtasks: subtasks?.length
          ? {
              create: subtasks.map((s: { title: string }) => ({
                title: s.title,
                completed: false,
              })),
            }
          : undefined,
      },
      include: {
        course: { select: { id: true, name: true, sks: true } },
        subtasks: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: "CREATE",
        entity: "task",
        entityId: task.id,
        description: `Membuat tugas baru: ${task.title}`,
      },
    });

    return successResponse(task, "Tugas berhasil dibuat", 201);
  } catch (error) {
    console.error("Tasks POST error:", error);
    return errorResponse("Gagal membuat tugas", 500);
  }
}