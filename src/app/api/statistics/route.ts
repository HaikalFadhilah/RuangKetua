import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);

    const [
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      announcements,
      dosenCount,
      elearningCount,
      filesCount,
      notesCount,
      activitiesCount,
      tasksByPriority,
      tasksByStatus,
      todayReminders,
      upcomingDeadlines,
      recentAnnouncements,
    ] = await Promise.all([
      prisma.task.count({ where: { userId } }),
      prisma.task.count({ where: { userId, status: "COMPLETED" } }),
      prisma.task.count({ where: { userId, status: { in: ["PENDING", "IN_PROGRESS"] } } }),
      prisma.task.count({
        where: { userId, status: { not: "COMPLETED" }, deadline: { lt: new Date() } },
      }),
      prisma.announcement.count({ where: { userId } }),
      prisma.dosen.count(),
      prisma.eLearning.count(),
      prisma.sharedFile.count({ where: { userId } }),
      prisma.stickyNote.count({ where: { userId } }),
      prisma.activityLog.count({ where: { userId } }),
      prisma.task.groupBy({
        by: ["priority"],
        where: { userId },
        _count: { priority: true },
      }),
      prisma.task.groupBy({
        by: ["status"],
        where: { userId },
        _count: { status: true },
      }),
      prisma.reminder.count({
        where: {
          userId,
          sent: false,
          remindAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      prisma.task.findMany({
        where: {
          userId,
          status: { not: "COMPLETED" },
          deadline: { gte: new Date() },
        },
        include: {
          course: { select: { id: true, name: true, code: true } },
          dosen: { select: { id: true, name: true } },
          subtasks: true,
        },
        orderBy: { deadline: "asc" },
        take: 5,
      }),
      prisma.announcement.findMany({
        where: { userId },
        select: { id: true, title: true, createdAt: true, category: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    // Tasks by course
    const tasksByCourseRaw = await prisma.task.findMany({
      where: { userId, courseId: { not: null } },
      select: { course: { select: { name: true } } },
    });

    const courseMap = new Map<string, number>();
    tasksByCourseRaw.forEach((t) => {
      const name = t.course?.name || "Lainnya";
      courseMap.set(name, (courseMap.get(name) || 0) + 1);
    });

    const tasksByCourse = Array.from(courseMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const semesterProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return successResponse({
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
        overdue: overdueTasks,
        byPriority: tasksByPriority.map((t) => ({
          priority: t.priority.toLowerCase(),
          _count: t._count.priority,
        })),
        byStatus: tasksByStatus.map((s) => ({
          status: s.status.toLowerCase(),
          _count: s._count.status,
        })),
        byCourse: tasksByCourse,
      },
      announcements,
      dosen: dosenCount,
      elearning: elearningCount,
      files: filesCount,
      notes: notesCount,
      activities: activitiesCount,
      // Dashboard compat
      totalTasks,
      activeTasks: pendingTasks,
      completedTasks,
      overdueTasks,
      todayReminders,
      upcomingDeadlines,
      recentAnnouncements,
      tasksByPriority: tasksByPriority.map((t) => ({
        priority: t.priority,
        count: t._count.priority,
      })),
      tasksByCourse,
      semesterProgress,
    });
  } catch (error) {
    console.error("Statistics error:", error);
    return errorResponse("Gagal mengambil statistik", 500);
  }
}
