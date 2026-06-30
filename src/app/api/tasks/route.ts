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
    const status = searchParams.get("status") || "";
    const priority = searchParams.get("priority") || "";
    const courseId = searchParams.get("courseId") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

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
          course: { select: { id: true, name: true, code: true } },
          dosen: { select: { id: true, name: true } },
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

    const { title, description, courseId, dosenId, deadline, priority, subtasks } = body;

    if (!title) {
      return errorResponse("Judul tugas wajib diisi", 400);
    }

    const task = await prisma.task.create({
      data: {
        userId,
        title,
        description: description || null,
        courseId: courseId || null,
        dosenId: dosenId || null,
        deadline: deadline ? new Date(deadline) : null,
        priority: priority || "MEDIUM",
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
        course: { select: { id: true, name: true, code: true } },
        dosen: { select: { id: true, name: true } },
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
