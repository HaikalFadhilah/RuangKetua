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

    // Load user notification preferences
    const settings = await prisma.userSettings.findUnique({
      where: { userId },
      select: {
        notifyOverdue: true,
        notifyDeadline: true,
        notifyReminder: true,
        notifyAnnouncement: true,
      },
    });

    // Defaults to all true if no settings found
    const prefs = {
      notifyOverdue: settings?.notifyOverdue ?? true,
      notifyDeadline: settings?.notifyDeadline ?? true,
      notifyReminder: settings?.notifyReminder ?? true,
      notifyAnnouncement: settings?.notifyAnnouncement ?? true,
    };

    // Only query enabled notification types
    const [
      overdueTasks,
      upcomingTasks,
      pendingReminders,
      recentAnnouncements,
      upcomingElearnings,
      upcomingCalendarEvents,
    ] = await Promise.all([
      prefs.notifyOverdue
        ? prisma.task.findMany({
            where: {
              userId,
              status: { not: "COMPLETED" },
              deadline: { lt: now },
            },
            select: { id: true, title: true, deadline: true, priority: true },
            orderBy: { deadline: "desc" },
            take: 10,
          })
        : [],

      prefs.notifyDeadline
        ? prisma.task.findMany({
            where: {
              userId,
              status: { not: "COMPLETED" },
              deadline: { gte: todayStart, lt: tomorrowEnd },
            },
            select: { id: true, title: true, deadline: true, priority: true },
            orderBy: { deadline: "asc" },
            take: 10,
          })
        : [],

      prefs.notifyReminder
        ? prisma.reminder.findMany({
            where: {
              userId,
              sent: false,
              remindAt: { lte: tomorrowEnd },
            },
            select: { id: true, title: true, remindAt: true, type: true },
            orderBy: { remindAt: "asc" },
            take: 10,
          })
        : [],

      prefs.notifyAnnouncement
        ? prisma.announcement.findMany({
            where: {
              userId,
              createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
            },
            select: { id: true, title: true, category: true, createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 5,
          })
        : [],

      prefs.notifyDeadline
        ? prisma.eLearning.findMany({
            where: {
              course: { userId },
              isActive: true,
              endDate: { gte: todayStart, lt: tomorrowEnd },
            },
            select: {
              id: true,
              title: true,
              endDate: true,
              course: { select: { name: true } },
            },
            orderBy: { endDate: "asc" },
            take: 10,
          })
        : [],

      prefs.notifyReminder
        ? prisma.calendarEvent.findMany({
            where: {
              userId,
              startDate: { gte: todayStart, lt: tomorrowEnd },
            },
            select: { id: true, title: true, startDate: true, type: true },
            orderBy: { startDate: "asc" },
            take: 10,
          })
        : [],
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
        href: `/tasks/${t.id}`,
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
        href: `/tasks/${t.id}`,
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
        href:
          r.type === "ELEARNING"
            ? "/elearning"
            : r.type === "EXAM"
              ? "/calendar"
              : "/reminders",
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
        href: "/announcements",
        time: a.createdAt.toISOString(),
      })),
      ...upcomingElearnings.map((e) => ({
        id: `elearning-${e.id}`,
        type: "deadline" as const,
        title: e.title,
        description: `E-Learning ${e.course.name}`,
        priority: null,
        entityId: e.id,
        entityType: "elearning" as const,
        href: "/elearning",
        time: e.endDate.toISOString(),
      })),
      ...upcomingCalendarEvents.map((event) => ({
        id: `calendar-${event.id}`,
        type: "reminder" as const,
        title: event.title,
        description: `Jadwal ${event.type.toLowerCase()}`,
        priority: null,
        entityId: event.id,
        entityType: "calendar" as const,
        href: "/calendar",
        time: event.startDate.toISOString(),
      })),
    ];

    const count =
      overdueTasks.length +
      upcomingTasks.length +
      pendingReminders.length +
      (Array.isArray(recentAnnouncements) ? recentAnnouncements.length : 0) +
      (Array.isArray(upcomingElearnings) ? upcomingElearnings.length : 0) +
      (Array.isArray(upcomingCalendarEvents) ? upcomingCalendarEvents.length : 0);

    return successResponse({ notifications, count, preferences: prefs });
  } catch (error) {
    console.error("Notifications GET error:", error);
    return errorResponse("Gagal mengambil notifikasi", 500);
  }
}
