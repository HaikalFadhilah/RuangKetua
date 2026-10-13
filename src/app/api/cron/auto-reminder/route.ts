import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getWhatsAppService } from "@/lib/whatsapp/service";
import { authorizeCronRequest } from "@/lib/cron-auth";

/**
 * CRON Endpoint: /api/cron/auto-reminder
 * 
 * Dipanggil setiap menit oleh crontab di VPS:
 *   * * * * * curl -s http://localhost:3000/api/cron/auto-reminder?secret=YOUR_SECRET
 * 
 * Handles 6 reminder types:
 * 1. elearning      — H-x sebelum e-learning deadline, kirim ke grup
 * 2. task_deadline   — H-x sebelum deadline tugas, kirim ke grup
 * 3. daily_schedule  — Pagi hari kalau ada jadwal hari ini, kirim ke grup
 * 4. absen           — Setelah jam kuliah selesai, ingetin isi absen
 * 5. exam            — H-x sebelum UTS/UAS, kirim ke grup
 * 6. weekly_report   — Rekap aktivitas kelas mingguan (Minggu malam)
 */

// WIB helper
function getWIB() {
  const now = new Date();
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utcMs + (7 * 60 * 60000));
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 86400000;
  const aDay = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const bDay = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((bDay.getTime() - aDay.getTime()) / msPerDay);
}

const DAY_LABELS: Record<number, string> = {
  0: "Minggu", 1: "Senin", 2: "Selasa", 3: "Rabu",
  4: "Kamis", 5: "Jumat", 6: "Sabtu",
};

const DAY_MAP: Record<string, number> = {
  minggu: 0, senin: 1, selasa: 2, rabu: 3, kamis: 4, jumat: 5, sabtu: 6,
};

/**
 * Apply user's custom messageTemplate if set, otherwise return defaultMessage.
 * Placeholders: {items}, {date}, {day}, {count}
 */
function applyTemplate(
  template: string | null | undefined,
  defaultMessage: string,
  vars: Record<string, string>
): string {
  if (!template?.trim()) return defaultMessage;
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }
  return result;
}

async function sendToGroup(userId: string, message: string): Promise<boolean> {
  try {
    const waService = getWhatsAppService(userId);
    if (!(await waService.ensureConnected())) return false;

    const session = await prisma.whatsAppSession.findUnique({ where: { userId } });
    if (!session?.groupId) return false;

    return await waService.broadcastToGroup(session.groupId, message);
  } catch {
    return false;
  }
}

// ─── 1. E-LEARNING REMINDER ─────────────────────────────────
async function processElearningReminders(wib: Date, currentTime: string) {
  const results = { sent: 0, skipped: 0, errors: [] as string[] };

  const reminders = await prisma.autoReminder.findMany({
    where: { type: "elearning", enabled: true },
  });

  for (const reminder of reminders) {
    if (reminder.reminderTime !== currentTime) { results.skipped++; continue; }

    const hDays = (reminder.reminderDays || "H-7,H-3,H-1").split(",").map(s => {
      const match = s.trim().match(/H-(\d+)/);
      return match ? parseInt(match[1]) : null;
    }).filter((n): n is number => n !== null);

    // Cari semua e-learning yang aktif milik user's courses
    const courses = await prisma.course.findMany({
      where: { userId: reminder.userId },
      select: { id: true, name: true },
    });
    const courseIds = courses.map(c => c.id);
    const courseMap = Object.fromEntries(courses.map(c => [c.id, c.name]));

    const elearnings = await prisma.eLearning.findMany({
      where: {
        courseId: { in: courseIds },
        isActive: true,
        endDate: { gte: wib },
      },
    });

    const messages: string[] = [];
    for (const el of elearnings) {
      const daysLeft = daysBetween(wib, el.endDate);
      if (hDays.includes(daysLeft)) {
        const courseName = courseMap[el.courseId] || "Unknown";
        const deadlineStr = formatDate(el.endDate);
        messages.push(
          `📚 *E-Learning: ${el.title}*\n` +
          `Matkul: ${courseName}\n` +
          `Deadline: ${deadlineStr} (H-${daysLeft})\n` +
          `${el.description ? `Keterangan: ${el.description}` : ""}`
        );
      }
    }

    if (messages.length > 0) {
      const header = `⏰ *REMINDER E-LEARNING*\n${"─".repeat(25)}\n\n`;
      const footer = `\n${"─".repeat(25)}\nJangan lupa kerjakan ya! 💪`;
      const defaultMsg = header + messages.join("\n\n") + footer;
      const fullMsg = applyTemplate(reminder.messageTemplate, defaultMsg, {
        items: messages.join("\n\n"),
        count: String(messages.length),
        date: formatDate(wib),
      });

      if (await sendToGroup(reminder.userId, fullMsg)) {
        await prisma.autoReminder.update({
          where: { id: reminder.id },
          data: { lastTriggered: new Date(), triggerCount: { increment: 1 } },
        });
        results.sent++;
      } else {
        results.errors.push(`E-Learning: WA send failed for user ${reminder.userId}`);
      }
    } else {
      results.skipped++;
    }
  }

  return results;
}

// ─── 2. TASK DEADLINE REMINDER ───────────────────────────────
async function processTaskDeadlineReminders(wib: Date, currentTime: string) {
  const results = { sent: 0, skipped: 0, errors: [] as string[] };

  const reminders = await prisma.autoReminder.findMany({
    where: { type: "task_deadline", enabled: true },
  });

  for (const reminder of reminders) {
    if (reminder.reminderTime !== currentTime) { results.skipped++; continue; }

    const hDays = (reminder.reminderDays || "H-7,H-3,H-1").split(",").map(s => {
      const match = s.trim().match(/H-(\d+)/);
      return match ? parseInt(match[1]) : null;
    }).filter((n): n is number => n !== null);

    const tasks = await prisma.task.findMany({
      where: {
        userId: reminder.userId,
        status: { not: "COMPLETED" },
        deadline: { gte: wib },
      },
      include: { course: { select: { name: true } } },
    });

    const messages: string[] = [];
    for (const task of tasks) {
      if (!task.deadline) continue;
      const daysLeft = daysBetween(wib, task.deadline);
      if (hDays.includes(daysLeft)) {
        const priorityEmoji = task.priority === "URGENT" ? "🔴" : task.priority === "HIGH" ? "🟠" : task.priority === "MEDIUM" ? "🟡" : "🟢";
        messages.push(
          `${priorityEmoji} *${task.title}*\n` +
          `${task.course ? `Matkul: ${task.course.name}\n` : ""}` +
          `Deadline: ${formatDate(task.deadline)} (H-${daysLeft})\n` +
          `Prioritas: ${task.priority}`
        );
      }
    }

    if (messages.length > 0) {
      const header = `📋 *REMINDER DEADLINE TUGAS*\n${"─".repeat(25)}\n\n`;
      const footer = `\n${"─".repeat(25)}\nSegera kerjakan sebelum terlambat! ⏳`;
      const defaultMsg = header + messages.join("\n\n") + footer;
      const fullMsg = applyTemplate(reminder.messageTemplate, defaultMsg, {
        items: messages.join("\n\n"),
        count: String(messages.length),
        date: formatDate(wib),
      });

      if (await sendToGroup(reminder.userId, fullMsg)) {
        await prisma.autoReminder.update({
          where: { id: reminder.id },
          data: { lastTriggered: new Date(), triggerCount: { increment: 1 } },
        });
        results.sent++;
      } else {
        results.errors.push(`Task: WA send failed for user ${reminder.userId}`);
      }
    } else {
      results.skipped++;
    }
  }

  return results;
}

// ─── 3. DAILY SCHEDULE REMINDER ──────────────────────────────
async function processDailyScheduleReminders(wib: Date, currentTime: string) {
  const results = { sent: 0, skipped: 0, errors: [] as string[] };

  const reminders = await prisma.autoReminder.findMany({
    where: { type: "daily_schedule", enabled: true },
  });

  const todayDayIndex = wib.getDay();

  for (const reminder of reminders) {
    if (reminder.reminderTime !== currentTime) { results.skipped++; continue; }

    const courses = await prisma.course.findMany({
      where: { userId: reminder.userId },
    });

    const todaySchedules = courses.filter(c => {
      if (!c.scheduleDay) return false;
      return DAY_MAP[c.scheduleDay.toLowerCase()] === todayDayIndex;
    });

    if (todaySchedules.length === 0) { results.skipped++; continue; }

    const dayName = DAY_LABELS[todayDayIndex];
    const scheduleList = todaySchedules.map((c, i) => {
      const time = c.scheduleStart
        ? `${c.scheduleStart}${c.scheduleEnd ? ` - ${c.scheduleEnd}` : ""}`
        : "Belum diatur";
      const dosen = c.dosenName ? ` (${c.dosenName})` : "";
      return `${i + 1}. *${c.name}*${dosen}\n   ⏰ ${time}`;
    }).join("\n\n");

    const defaultMsg =
      `📅 *JADWAL KULIAH HARI INI*\n` +
      `${dayName}, ${formatDate(wib)}\n` +
      `${"─".repeat(25)}\n\n` +
      `${scheduleList}\n\n` +
      `${"─".repeat(25)}\n` +
      `Jangan telat ya! Semangat! 💪`;

    const msg = applyTemplate(reminder.messageTemplate, defaultMsg, {
      items: scheduleList,
      day: dayName,
      date: formatDate(wib),
      count: String(todaySchedules.length),
    });

    if (await sendToGroup(reminder.userId, msg)) {
      await prisma.autoReminder.update({
        where: { id: reminder.id },
        data: { lastTriggered: new Date(), triggerCount: { increment: 1 } },
      });
      results.sent++;
    } else {
      results.errors.push(`Schedule: WA send failed for user ${reminder.userId}`);
    }
  }

  return results;
}

// ─── 4. ABSEN REMINDER ──────────────────────────────────────
async function processAbsenReminders(wib: Date, currentTime: string) {
  const results = { sent: 0, skipped: 0, errors: [] as string[] };

  const reminders = await prisma.autoReminder.findMany({
    where: { type: "absen", enabled: true },
  });

  const todayDayIndex = wib.getDay();

  for (const reminder of reminders) {
    if (reminder.reminderTime !== currentTime) { results.skipped++; continue; }

    // Cari matkul yang jadwalnya hari ini
    const courses = await prisma.course.findMany({
      where: { userId: reminder.userId },
    });

    const todayCourses = courses.filter(c => {
      if (!c.scheduleDay) return false;
      return DAY_MAP[c.scheduleDay.toLowerCase()] === todayDayIndex;
    });

    if (todayCourses.length === 0) { results.skipped++; continue; }

    const courseList = todayCourses.map(c => `• ${c.name}`).join("\n");

    const defaultMsg =
      `📝 *REMINDER ABSEN / PRESENSI*\n` +
      `${"─".repeat(25)}\n\n` +
      `Jangan lupa isi absen untuk matkul hari ini:\n\n` +
      `${courseList}\n\n` +
      `${"─".repeat(25)}\n` +
      `Pastikan presensi sudah terisi ya! ✅`;

    const msg = applyTemplate(reminder.messageTemplate, defaultMsg, {
      items: courseList,
      date: formatDate(wib),
      count: String(todayCourses.length),
    });

    if (await sendToGroup(reminder.userId, msg)) {
      await prisma.autoReminder.update({
        where: { id: reminder.id },
        data: { lastTriggered: new Date(), triggerCount: { increment: 1 } },
      });
      results.sent++;
    } else {
      results.errors.push(`Absen: WA send failed for user ${reminder.userId}`);
    }
  }

  return results;
}

// ─── 5. EXAM REMINDER ────────────────────────────────────────
async function processExamReminders(wib: Date, currentTime: string) {
  const results = { sent: 0, skipped: 0, errors: [] as string[] };

  const reminders = await prisma.autoReminder.findMany({
    where: { type: "exam", enabled: true },
  });

  for (const reminder of reminders) {
    if (reminder.reminderTime !== currentTime) { results.skipped++; continue; }

    const hDays = (reminder.reminderDays || "H-7,H-3,H-1").split(",").map(s => {
      const match = s.trim().match(/H-(\d+)/);
      return match ? parseInt(match[1]) : null;
    }).filter((n): n is number => n !== null);

    // Cari CalendarEvent bertipe UTS/UAS
    const events = await prisma.calendarEvent.findMany({
      where: {
        userId: reminder.userId,
        type: { in: ["UTS", "UAS"] },
        startDate: { gte: wib },
      },
    });

    const messages: string[] = [];
    for (const event of events) {
      const daysLeft = daysBetween(wib, event.startDate);
      if (hDays.includes(daysLeft)) {
        const typeLabel = event.type === "UTS" ? "UTS" : "UAS";
        messages.push(
          `📝 *${typeLabel}: ${event.title}*\n` +
          `Tanggal: ${formatDate(event.startDate)} (H-${daysLeft})\n` +
          `${event.description ? `Keterangan: ${event.description}` : ""}`
        );
      }
    }

    if (messages.length > 0) {
      const header = `🎓 *REMINDER UJIAN*\n${"─".repeat(25)}\n\n`;
      const footer = `\n${"─".repeat(25)}\nPersiapkan diri dengan baik. Semangat! 📖`;
      const defaultMsg = header + messages.join("\n\n") + footer;
      const fullMsg = applyTemplate(reminder.messageTemplate, defaultMsg, {
        items: messages.join("\n\n"),
        count: String(messages.length),
        date: formatDate(wib),
      });

      if (await sendToGroup(reminder.userId, fullMsg)) {
        await prisma.autoReminder.update({
          where: { id: reminder.id },
          data: { lastTriggered: new Date(), triggerCount: { increment: 1 } },
        });
        results.sent++;
      } else {
        results.errors.push(`Exam: WA send failed for user ${reminder.userId}`);
      }
    } else {
      results.skipped++;
    }
  }

  return results;
}

// ─── 6. WEEKLY REPORT ────────────────────────────────────────
async function processWeeklyReportReminders(wib: Date, currentTime: string) {
  const results = { sent: 0, skipped: 0, errors: [] as string[] };

  // Weekly report hanya dikirim hari Minggu
  if (wib.getDay() !== 0) return results;

  const reminders = await prisma.autoReminder.findMany({
    where: { type: "weekly_report", enabled: true },
  });

  for (const reminder of reminders) {
    if (reminder.reminderTime !== currentTime) { results.skipped++; continue; }

    const weekAgo = new Date(wib);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Hitung statistik
    const [totalTasks, completedTasks, newTasks, elearningsActive, upcomingDeadlines] = await Promise.all([
      prisma.task.count({ where: { userId: reminder.userId } }),
      prisma.task.count({ where: { userId: reminder.userId, status: "COMPLETED", updatedAt: { gte: weekAgo } } }),
      prisma.task.count({ where: { userId: reminder.userId, createdAt: { gte: weekAgo } } }),
      prisma.eLearning.count({
        where: {
          course: { userId: reminder.userId },
          isActive: true,
          endDate: { gte: wib },
        },
      }),
      prisma.task.count({
        where: {
          userId: reminder.userId,
          status: { not: "COMPLETED" },
          deadline: {
            gte: wib,
            lte: new Date(wib.getTime() + 7 * 86400000),
          },
        },
      }),
    ]);

    const pendingTasks = await prisma.task.count({
      where: { userId: reminder.userId, status: { not: "COMPLETED" } },
    });

    const statsText =
      `📋 *Tugas:*\n` +
      `   • Total: ${totalTasks}\n` +
      `   • Baru minggu ini: ${newTasks}\n` +
      `   • Diselesaikan: ${completedTasks}\n` +
      `   • Belum selesai: ${pendingTasks}\n\n` +
      `📚 *E-Learning aktif:* ${elearningsActive}\n` +
      `⏳ *Deadline minggu depan:* ${upcomingDeadlines}`;

    const defaultMsg =
      `📊 *REKAP MINGGUAN KELAS*\n` +
      `Minggu ini: ${formatDate(weekAgo)} — ${formatDate(wib)}\n` +
      `${"─".repeat(25)}\n\n` +
      `${statsText}\n\n` +
      `${"─".repeat(25)}\n` +
      `Tetap semangat minggu depan! 💪🔥`;

    const msg = applyTemplate(reminder.messageTemplate, defaultMsg, {
      items: statsText,
      date: formatDate(wib),
      count: String(totalTasks),
    });

    if (await sendToGroup(reminder.userId, msg)) {
      await prisma.autoReminder.update({
        where: { id: reminder.id },
        data: { lastTriggered: new Date(), triggerCount: { increment: 1 } },
      });
      results.sent++;
    } else {
      results.errors.push(`WeeklyReport: WA send failed for user ${reminder.userId}`);
    }
  }

  return results;
}

// ─── 7. LEGACY REMINDER MODEL (auto-send when remindAt passes) ──
async function processLegacyReminders(wib: Date) {
  const results = { sent: 0, skipped: 0, errors: [] as string[] };

  // Find all unsent reminders where remindAt has passed
  const pendingReminders = await prisma.reminder.findMany({
    where: {
      sent: false,
      remindAt: { lte: wib },
    },
    include: {
      user: { select: { id: true, name: true } },
    },
    take: 50,
  });

  for (const reminder of pendingReminders) {
    // Only send via WA if target is "group"
    if (reminder.target === "group") {
      const typeLabel = reminder.type === "GENERAL" ? "Umum"
        : reminder.type === "ELEARNING" ? "E-Learning"
        : reminder.type === "EXAM" ? "Ujian"
        : reminder.type === "ASSIGNMENT" ? "Tugas"
        : reminder.type;

      const msg =
        `🔔 *REMINDER: ${reminder.title}*\n` +
        `${"─".repeat(25)}\n` +
        `Tipe: ${typeLabel}\n` +
        `${reminder.description ? `\n${reminder.description}\n` : ""}` +
        `${"─".repeat(25)}`;

      if (await sendToGroup(reminder.userId, msg)) {
        results.sent++;
      } else {
        results.errors.push(`Reminder: WA send failed for "${reminder.title}"`);
      }
    } else {
      results.skipped++;
    }

    // Mark as sent regardless (so it doesn't retry forever)
    await prisma.reminder.update({
      where: { id: reminder.id },
      data: { sent: true },
    });
  }

  return results;
}

// ─── MAIN CRON HANDLER ───────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const unauthorized = authorizeCronRequest(request);
    if (unauthorized) return unauthorized;

    const wib = getWIB();
    const currentHour = String(wib.getHours()).padStart(2, "0");
    const currentMinute = String(wib.getMinutes()).padStart(2, "0");
    const currentTime = `${currentHour}:${currentMinute}`;

    // Process all reminder types in parallel
    const [elearning, taskDeadline, dailySchedule, absen, exam, weeklyReport, legacyReminders] = await Promise.all([
      processElearningReminders(wib, currentTime),
      processTaskDeadlineReminders(wib, currentTime),
      processDailyScheduleReminders(wib, currentTime),
      processAbsenReminders(wib, currentTime),
      processExamReminders(wib, currentTime),
      processWeeklyReportReminders(wib, currentTime),
      processLegacyReminders(wib),
    ]);

    const totalSent = elearning.sent + taskDeadline.sent + dailySchedule.sent + absen.sent + exam.sent + weeklyReport.sent + legacyReminders.sent;
    const totalSkipped = elearning.skipped + taskDeadline.skipped + dailySchedule.skipped + absen.skipped + exam.skipped + weeklyReport.skipped + legacyReminders.skipped;
    const allErrors = [...elearning.errors, ...taskDeadline.errors, ...dailySchedule.errors, ...absen.errors, ...exam.errors, ...weeklyReport.errors, ...legacyReminders.errors];

    return successResponse(
      {
        checkedAt: currentTime,
        date: formatDate(wib),
        summary: { totalSent, totalSkipped, totalErrors: allErrors.length },
        details: { elearning, taskDeadline, dailySchedule, absen, exam, weeklyReport, legacyReminders },
        errors: allErrors,
      },
      `Cron selesai: ${totalSent} terkirim, ${totalSkipped} dilewati, ${allErrors.length} error`
    );
  } catch (error) {
    console.error("Cron auto-reminder error:", error);
    return errorResponse("Cron gagal", 500);
  }
}
