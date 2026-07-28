import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get("x-user-role");
    if (userRole !== "admin") return errorResponse("Forbidden", 403);

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalForums,
      totalChats,
      totalTasks,
      totalAnnouncements,
      totalActivities,
      newUsersThisWeek,
      newUsersThisMonth,
      tasksPending,
      tasksInProgress,
      tasksCompleted,
      tasksOverdue,
      recentUsers,
      recentActivity,
      forumByCategory,
      chatByCategory,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.forumPost.count(),
      prisma.chatMessage.count(),
      prisma.task.count(),
      prisma.announcement.count(),
      prisma.activityLog.count(),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
      prisma.task.count({ where: { status: "PENDING" } }),
      prisma.task.count({ where: { status: "IN_PROGRESS" } }),
      prisma.task.count({ where: { status: "COMPLETED" } }),
      prisma.task.count({ where: { status: "OVERDUE" } }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, email: true, university: true, role: true, createdAt: true },
      }),
      prisma.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { user: { select: { name: true } } },
      }),
      prisma.forumPost.groupBy({ by: ["category"], _count: { id: true } }),
      prisma.chatMessage.groupBy({ by: ["category"], _count: { id: true } }),
    ]);

    return successResponse({
      totalUsers,
      totalForums,
      totalChats,
      totalTasks,
      totalAnnouncements,
      totalActivities,
      newUsersThisWeek,
      newUsersThisMonth,
      tasks: { pending: tasksPending, inProgress: tasksInProgress, completed: tasksCompleted, overdue: tasksOverdue },
      recentUsers,
      recentActivity,
      forumByCategory,
      chatByCategory,
    });
  } catch (error) {
    console.error("GET /api/admin/stats error:", error);
    return errorResponse("Terjadi kesalahan", 500);
  }
}
