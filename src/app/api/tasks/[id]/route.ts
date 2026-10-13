import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    const { id } = await params;

    const task = await prisma.task.findFirst({
      where: { id, userId },
      include: {
        course: { select: { id: true, name: true, sks: true } },
        subtasks: true,
        history: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });

    if (!task) {
      return errorResponse("Tugas tidak ditemukan", 404);
    }

    return successResponse(task);
  } catch (error) {
    console.error("Task GET error:", error);
    return errorResponse("Gagal mengambil data tugas", 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.task.findFirst({ where: { id, userId } });
    if (!existing) {
      return errorResponse("Tugas tidak ditemukan", 404);
    }

    const { title, description, courseId, deadline, priority, status, subtasks } = body;

    // Track changes for history
    const changes: { field: string; oldValue: string | null; newValue: string | null }[] = [];
    if (title && title !== existing.title) changes.push({ field: "title", oldValue: existing.title, newValue: title });
    if (status && status !== existing.status) changes.push({ field: "status", oldValue: existing.status, newValue: status });
    if (priority && priority !== existing.priority) changes.push({ field: "priority", oldValue: existing.priority, newValue: priority });

    const task = await prisma.task.update({
      where: { id },
      data: {
        title: title || undefined,
        description: description !== undefined ? description : undefined,
        courseId: courseId !== undefined ? courseId || null : undefined,
        deadline: deadline !== undefined ? (deadline ? (() => {
          const dlStr = String(deadline);
          const withTz = dlStr.includes("+") || dlStr.includes("Z") ? dlStr : `${dlStr}+07:00`;
          return new Date(withTz);
        })() : null) : undefined,
        priority: priority || undefined,
        status: status || undefined,
      },
      include: {
        course: { select: { id: true, name: true, sks: true } },
        subtasks: true,
      },
    });

    // Save history
    if (changes.length > 0) {
      await prisma.taskHistory.createMany({
        data: changes.map((c) => ({
          taskId: id,
          ...c,
        })),
      });
    }

    // Handle subtasks update
    if (subtasks) {
      await prisma.subtask.deleteMany({ where: { taskId: id } });
      if (subtasks.length > 0) {
        await prisma.subtask.createMany({
          data: subtasks.map((s: { title: string; completed?: boolean }) => ({
            taskId: id,
            title: s.title,
            completed: s.completed || false,
          })),
        });
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: "UPDATE",
        entity: "task",
        entityId: task.id,
        description: `Mengupdate tugas: ${task.title}`,
      },
    });

    return successResponse(task, "Tugas berhasil diupdate");
  } catch (error) {
    console.error("Task PUT error:", error);
    return errorResponse("Gagal mengupdate tugas", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    const { id } = await params;

    const task = await prisma.task.findFirst({ where: { id, userId } });
    if (!task) {
      return errorResponse("Tugas tidak ditemukan", 404);
    }

    await prisma.task.delete({ where: { id } });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: "DELETE",
        entity: "task",
        entityId: id,
        description: `Menghapus tugas: ${task.title}`,
      },
    });

    return successResponse(null, "Tugas berhasil dihapus");
  } catch (error) {
    console.error("Task DELETE error:", error);
    return errorResponse("Gagal menghapus tugas", 500);
  }
}
