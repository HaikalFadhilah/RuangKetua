import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const [
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      announcements,
      coursesCount, // Dosen diganti jadi mata kuliah count atau apapun penggantinya
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
      prisma.course.count({ where: { userId } }),
      prisma.eLearning.count({ where: { course: { userId } } }),
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
      Promise.all([
        prisma.reminder.count({
          where: {
            userId,
            sent: false,
            remindAt: { gte: todayStart, lt: tomorrowStart },
          },
        }),
        prisma.task.count({
          where: {
            userId,
            status: { not: "COMPLETED" },
            deadline: { gte: todayStart, lt: tomorrowStart },
          },
        }),
        prisma.eLearning.count({
          where: {
            course: { userId },
            isActive: true,
            endDate: { gte: todayStart, lt: tomorrowStart },
          },
        }),
        prisma.calendarEvent.count({
          where: {
            userId,
            startDate: { gte: todayStart, lt: tomorrowStart },
          },
        }),
      ]).then((counts) => counts.reduce((total, count) => total + count, 0)),
      prisma.task.findMany({
        where: {
          userId,
          status: { not: "COMPLETED" },
          deadline: { gte: new Date() },
        },
        include: {
          course: { select: { id: true, name: true, sks: true } },
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
      courses: coursesCount,
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
