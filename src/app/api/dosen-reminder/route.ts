import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";

// GET - Ambil semua dosen reminder milik user
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);

    const reminders = await prisma.dosenReminder.findMany({
      where: { userId },
      include: {
        course: {
          select: { id: true, name: true, dosenName: true, dosenWa: true, scheduleDay: true, scheduleStart: true, scheduleEnd: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(reminders);
  } catch (error) {
    console.error("DosenReminder GET error:", error);
    return errorResponse("Gagal mengambil data reminder dosen", 500);
  }
}

// POST - Buat / update reminder untuk sebuah course
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const body = await request.json();
    const { courseId, enabled, reminderTime, messageTemplate } = body;

    if (!courseId) return errorResponse("courseId wajib diisi", 400);

    // Pastikan course milik user
    const course = await prisma.course.findFirst({ where: { id: courseId, userId } });
    if (!course) return errorResponse("Mata kuliah tidak ditemukan", 404);

    // Validasi: dosen harus punya nomor WA
    if (!course.dosenWa) return errorResponse("Nomor WhatsApp dosen belum diisi di mata kuliah ini", 400);

    // Validasi: jadwal harus terstruktur (scheduleDay wajib ada)
    if (!course.scheduleDay) return errorResponse("Hari jadwal matkul belum diisi (gunakan dropdown hari)", 400);

    // Upsert (1 reminder per course per user)
    const reminder = await prisma.dosenReminder.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: {
        userId,
        courseId,
        enabled: enabled ?? true,
        reminderTime: reminderTime || "20:00",
        messageTemplate: messageTemplate || null,
      },
      update: {
        enabled: enabled ?? true,
        reminderTime: reminderTime || "20:00",
        messageTemplate: messageTemplate || null,
      },
    });

    return successResponse(reminder, "Reminder dosen berhasil disimpan");
  } catch (error) {
    console.error("DosenReminder POST error:", error);
    return errorResponse("Gagal menyimpan reminder dosen", 500);
  }
}

// DELETE - Hapus reminder
export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return errorResponse("id wajib diisi", 400);

    const existing = await prisma.dosenReminder.findFirst({ where: { id, userId } });
    if (!existing) return errorResponse("Reminder tidak ditemukan", 404);

    await prisma.dosenReminder.delete({ where: { id } });

    return successResponse(null, "Reminder dosen berhasil dihapus");
  } catch (error) {
    console.error("DosenReminder DELETE error:", error);
    return errorResponse("Gagal menghapus reminder dosen", 500);
  }
}
