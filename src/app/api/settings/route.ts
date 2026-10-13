import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);

    const [user, settings] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, className: true, semester: true, avatar: true, university: true },
      }),
      prisma.userSettings.findUnique({ where: { userId } }),
    ]);

    return successResponse({ user, settings });
  } catch (error) {
    console.error("Settings GET error:", error);
    return errorResponse("Gagal mengambil settings", 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const body = await request.json();
    const { name, className, semester, university, theme, reminderDefault, aiModel, language, notifyOverdue, notifyDeadline, notifyReminder, notifyAnnouncement } = body;

    // Update user profile
    if (name || className !== undefined || semester !== undefined || university !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          name: name || undefined,
          className: className !== undefined ? className : undefined,
          semester: semester !== undefined ? (semester != null ? String(semester) : null) : undefined,
          university: university !== undefined ? university : undefined,
        },
      });
    }

    // Update settings
    if (theme || reminderDefault || aiModel || language || notifyOverdue !== undefined || notifyDeadline !== undefined || notifyReminder !== undefined || notifyAnnouncement !== undefined) {
      const notifUpdate: Record<string, boolean> = {};
      if (notifyOverdue !== undefined) notifUpdate.notifyOverdue = notifyOverdue;
      if (notifyDeadline !== undefined) notifUpdate.notifyDeadline = notifyDeadline;
      if (notifyReminder !== undefined) notifUpdate.notifyReminder = notifyReminder;
      if (notifyAnnouncement !== undefined) notifUpdate.notifyAnnouncement = notifyAnnouncement;

      await prisma.userSettings.upsert({
        where: { userId },
        create: {
          userId,
          theme: theme || "dark",
          reminderDefault: reminderDefault || "H-3",
          aiModel: aiModel || "llama-3.3-70b-versatile",
          language: language || "id",
          ...notifUpdate,
        },
        update: {
          theme: theme || undefined,
          reminderDefault: reminderDefault || undefined,
          aiModel: aiModel || undefined,
          language: language || undefined,
          ...notifUpdate,
        },
      });
    }

    return successResponse(null, "Settings berhasil diupdate");
  } catch (error) {
    console.error("Settings PUT error:", error);
    return errorResponse("Gagal mengupdate settings", 500);
  }
}
