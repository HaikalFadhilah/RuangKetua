import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getWhatsAppService } from "@/lib/whatsapp/service";
import { authorizeCronRequest } from "@/lib/cron-auth";

// Mapping hari Indonesia → JS getDay() index
const DAY_MAP: Record<string, number> = {
  minggu: 0, senin: 1, selasa: 2, rabu: 3, kamis: 4, jumat: 5, sabtu: 6,
};
const DAY_LABELS: Record<string, string> = {
  minggu: "Minggu", senin: "Senin", selasa: "Selasa", rabu: "Rabu",
  kamis: "Kamis", jumat: "Jumat", sabtu: "Sabtu",
};

/**
 * CRON Endpoint: /api/cron/dosen-reminder
 * 
 * Dipanggil setiap menit oleh crontab di VPS:
 *   * * * * * curl -s http://localhost:3000/api/cron/dosen-reminder?secret=YOUR_SECRET
 * 
 * Logika:
 * 1. Ambil semua DosenReminder yang enabled
 * 2. Cek apakah SEKARANG = jam yang di-setting (HH:mm)
 * 3. Cek apakah BESOK = hari jadwal matkul (H-1)
 * 4. Cek apakah belum dikirim hari ini (lastSentDate != today)
 * 5. Kirim WA personal ke dosen
 * 6. Update lastSentDate
 */
export async function GET(request: NextRequest) {
  try {
    const unauthorized = authorizeCronRequest(request);
    if (unauthorized) return unauthorized;

    const now = new Date();
    // Gunakan timezone WIB (UTC+7) — Indonesia
    const wibOffset = 7 * 60; // menit
    const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
    const wibDate = new Date(utcMs + (wibOffset * 60000));

    const currentHour = String(wibDate.getHours()).padStart(2, "0");
    const currentMinute = String(wibDate.getMinutes()).padStart(2, "0");
    const currentTime = `${currentHour}:${currentMinute}`;
    
    // Hari besok (WIB)
    const tomorrow = new Date(wibDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDayIndex = tomorrow.getDay(); // 0=Minggu, 1=Senin, dst

    // Today string untuk cek duplikat
    const todayStr = `${wibDate.getFullYear()}-${String(wibDate.getMonth() + 1).padStart(2, "0")}-${String(wibDate.getDate()).padStart(2, "0")}`;

    // Ambil semua reminder yang enabled
    const reminders = await prisma.dosenReminder.findMany({
      where: { enabled: true },
      include: {
        course: {
          select: {
            name: true,
            dosenName: true,
            dosenWa: true,
            scheduleDay: true,
            scheduleStart: true,
            scheduleEnd: true,
          },
        },
        user: {
          select: { id: true, name: true, className: true },
        },
      },
    });

    let sent = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const reminder of reminders) {
      const { course, user } = reminder;

      // 1. Cek apakah jam sekarang = jam reminder
      if (reminder.reminderTime !== currentTime) {
        skipped++;
        continue;
      }

      // 2. Cek apakah sudah dikirim hari ini
      if (reminder.lastSentDate === todayStr) {
        skipped++;
        continue;
      }

      // 3. Cek apakah besok = hari jadwal
      const scheduleDay = course.scheduleDay?.toLowerCase();
      if (!scheduleDay || DAY_MAP[scheduleDay] === undefined) {
        skipped++;
        continue;
      }
      if (DAY_MAP[scheduleDay] !== tomorrowDayIndex) {
        skipped++;
        continue;
      }

      // 4. Cek dosen punya nomor WA
      if (!course.dosenWa) {
        skipped++;
        continue;
      }

      // 5. Cek apakah WhatsApp user connected
      const waService = getWhatsAppService(user.id);
      if (!(await waService.ensureConnected())) {
        errors.push(`WA not connected for user ${user.name}`);
        continue;
      }

      // 6. Compose pesan
      const dayLabel = DAY_LABELS[scheduleDay] || scheduleDay;
      const timeRange = course.scheduleStart
        ? `${course.scheduleStart}${course.scheduleEnd ? ` - ${course.scheduleEnd}` : ""}`
        : "";

      const defaultMessage =
        `Assalamualaikum ${course.dosenName},\n\n` +
        `Mohon maaf mengganggu waktunya. Saya ${user.name}` +
        `${user.className ? ` dari kelas ${user.className}` : ""}` +
        ` ingin mengingatkan bahwa besok hari ${dayLabel}` +
        `${timeRange ? ` pukul ${timeRange} WIB` : ""}` +
        ` terdapat jadwal mata kuliah *${course.name}*.\n\n` +
        `Apakah perkuliahan besok tetap berjalan seperti biasa?\n\n` +
        `Terima kasih atas konfirmasinya. 🙏`;

      // Jika ada custom template, replace placeholders
      let message = defaultMessage;
      if (reminder.messageTemplate) {
        message = reminder.messageTemplate
          .replace(/\{dosenName\}/g, course.dosenName || "Bapak/Ibu")
          .replace(/\{userName\}/g, user.name || "Ketua Kelas")
          .replace(/\{className\}/g, user.className || "")
          .replace(/\{courseName\}/g, course.name)
          .replace(/\{scheduleDay\}/g, dayLabel)
          .replace(/\{scheduleTime\}/g, timeRange)
          .replace(/\{scheduleStart\}/g, course.scheduleStart || "")
          .replace(/\{scheduleEnd\}/g, course.scheduleEnd || "");
      }

      // 7. Kirim WA
      try {
        await waService.sendPersonalMessage(course.dosenWa, message);

        // 8. Update lastSentDate
        await prisma.dosenReminder.update({
          where: { id: reminder.id },
          data: { lastSentDate: todayStr },
        });

        // Log activity
        await prisma.activityLog.create({
          data: {
            userId: user.id,
            action: "DOSEN_REMINDER",
            entity: "course",
            entityId: reminder.courseId,
            description: `Reminder otomatis ke ${course.dosenName} untuk matkul ${course.name} (${dayLabel})`,
          },
        });

        sent++;
      } catch (err) {
        errors.push(`Failed to send to ${course.dosenName}: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }

    return successResponse(
      { sent, skipped, errors, checkedAt: currentTime, todayStr, tomorrowDay: tomorrowDayIndex },
      `Cron selesai: ${sent} terkirim, ${skipped} dilewati, ${errors.length} error`
    );
  } catch (error) {
    console.error("Cron dosen-reminder error:", error);
    return errorResponse("Cron gagal", 500);
  }
}
