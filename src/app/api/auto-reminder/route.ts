import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";
import { logActivity } from "@/lib/activity";

const VALID_TYPES = ["elearning", "task_deadline", "daily_schedule", "absen", "exam", "weekly_report"] as const;

// GET — ambil semua auto reminder milik user
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);

    const reminders = await prisma.autoReminder.findMany({
      where: { userId },
      orderBy: { type: "asc" },
    });

    return successResponse(reminders);
  } catch (error) {
    console.error("AutoReminder GET error:", error);
    return errorResponse("Gagal mengambil data auto reminder", 500);
  }
}

// POST — upsert (create/update) auto reminder per type
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const body = await request.json();
    const { type, enabled, reminderDays, reminderTime, target, messageTemplate } = body;

    if (!type || !VALID_TYPES.includes(type)) {
      return errorResponse(`Tipe reminder tidak valid. Gunakan: ${VALID_TYPES.join(", ")}`, 400);
    }

    const reminder = await prisma.autoReminder.upsert({
      where: { userId_type: { userId, type } },
      create: {
        userId,
        type,
        enabled: enabled ?? true,
        reminderDays: reminderDays || "H-7,H-3,H-1",
        reminderTime: reminderTime || "07:00",
        target: target || "group",
        messageTemplate: messageTemplate || null,
      },
      update: {
        enabled: enabled ?? true,
        reminderDays: reminderDays !== undefined ? reminderDays : undefined,
        reminderTime: reminderTime !== undefined ? reminderTime : undefined,
        target: target !== undefined ? target : undefined,
        messageTemplate: messageTemplate !== undefined ? messageTemplate : undefined,
      },
    });

    await logActivity({
      userId,
      action: "UPDATE",
      entity: "auto_reminder",
      entityId: reminder.id,
      description: `${reminder.enabled ? "Mengaktifkan" : "Menonaktifkan"} auto reminder: ${reminder.type}`,
    });

    return successResponse(reminder, "Auto reminder berhasil disimpan");
  } catch (error) {
    console.error("AutoReminder POST error:", error);
    return errorResponse("Gagal menyimpan auto reminder", 500);
  }
}

// DELETE — hapus auto reminder
export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return errorResponse("id wajib diisi", 400);

    const existing = await prisma.autoReminder.findFirst({ where: { id, userId } });
    if (!existing) return errorResponse("Reminder tidak ditemukan", 404);

    await prisma.autoReminder.delete({ where: { id } });

    await logActivity({
      userId,
      action: "DELETE",
      entity: "auto_reminder",
      entityId: id,
      description: `Menghapus auto reminder: ${existing.type}`,
    });

    return successResponse(null, "Auto reminder berhasil dihapus");
  } catch (error) {
    console.error("AutoReminder DELETE error:", error);
    return errorResponse("Gagal menghapus auto reminder", 500);
  }
}
