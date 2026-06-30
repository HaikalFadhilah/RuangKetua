import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowEnd = new Date(todayStart);
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 2);

    const [overdueTasks, upcomingTasks, pendingReminders, recentAnnouncements] = await Promise.all([
      // Overdue tasks
      prisma.task.findMany({
        where: {
          userId,
          status: { not: "COMPLETED" },
          deadline: { lt: now },
        },
        select: { id: true, title: true, deadline: true, priority: true },
        orderBy: { deadline: "desc" },
        take: 10,
      }),

      // Tasks due today/tomorrow
      prisma.task.findMany({
        where: {
          userId,
          status: { not: "COMPLETED" },
          deadline: { gte: todayStart, lt: tomorrowEnd },
        },
        select: { id: true, title: true, deadline: true, priority: true },
        orderBy: { deadline: "asc" },
        take: 10,
      }),

      // Pending reminders (not sent, remind time <= now or upcoming today)
      prisma.reminder.findMany({
        where: {
          userId,
          sent: false,
          remindAt: { lte: tomorrowEnd },
        },
        select: { id: true, title: true, remindAt: true, type: true },
        orderBy: { remindAt: "asc" },
        take: 10,
      }),

      // Recent announcements (last 7 days)
      prisma.announcement.findMany({
        where: {
          userId,
          createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
        },
        select: { id: true, title: true, category: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    // Build notification items
    const notifications = [
      ...overdueTasks.map((t) => ({
        id: `task-overdue-${t.id}`,
        type: "overdue" as const,
        title: t.title,
        description: `Lewat deadline${t.deadline ? ": " + new Date(t.deadline).toLocaleDateString("id-ID") : ""}`,
        priority: t.priority,
        entityId: t.id,
        entityType: "task" as const,
        time: t.deadline?.toISOString() || now.toISOString(),
      })),
      ...upcomingTasks.map((t) => ({
        id: `task-upcoming-${t.id}`,
        type: "deadline" as const,
        title: t.title,
        description: t.deadline
          ? new Date(t.deadline).toDateString() === todayStart.toDateString()
            ? "Deadline hari ini"
            : "Deadline besok"
          : "Deadline segera",
        priority: t.priority,
        entityId: t.id,
        entityType: "task" as const,
        time: t.deadline?.toISOString() || now.toISOString(),
      })),
      ...pendingReminders.map((r) => ({
        id: `reminder-${r.id}`,
        type: "reminder" as const,
        title: r.title,
        description: `Reminder ${r.type.toLowerCase()}`,
        priority: null,
        entityId: r.id,
        entityType: "reminder" as const,
        time: r.remindAt.toISOString(),
      })),
      ...recentAnnouncements.map((a) => ({
        id: `announcement-${a.id}`,
        type: "info" as const,
        title: a.title,
        description: `Pengumuman ${a.category}`,
        priority: null,
        entityId: a.id,
        entityType: "announcement" as const,
        time: a.createdAt.toISOString(),
      })),
    ];

    const count = overdueTasks.length + upcomingTasks.length + pendingReminders.length;

    return successResponse({ notifications, count });
  } catch (error) {
    console.error("Notifications GET error:", error);
    return errorResponse("Gagal mengambil notifikasi", 500);
  }
}
