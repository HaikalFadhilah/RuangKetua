import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { callAIWithHistory, PROMPTS } from "@/lib/ai/prompts";
import prisma from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/api-utils";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

const SYSTEM_PROMPT_BASE = PROMPTS.chatAssistant;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history } = body;
    const userId = getUserIdFromRequest(request);

    if (!message) {
      return errorResponse("Pesan tidak boleh kosong", 400);
    }

    // ── Ambil konteks data dari berbagai fitur milik user ──
    const contextParts: string[] = [];
    if (userId) {
      try {
        const now = new Date();

        // 1. Tasks (belum selesai, deadline terdekat)
        const pendingTasks = await prisma.task.findMany({
          where: { userId, status: { not: "COMPLETED" } },
          include: { course: true },
          orderBy: { deadline: "asc" },
          take: 10,
        });
        if (pendingTasks.length > 0) {
          let s = "[KONTEKS DATA - TUGAS] Daftar tugas belum selesai milik user:\n";
          pendingTasks.forEach((t, i) => {
            const courseName = t.course ? t.course.name : "Umum";
            const dateStr = t.deadline
              ? format(new Date(t.deadline), "dd MMMM yyyy HH:mm", { locale: idLocale })
              : "tanpa deadline";
            s += `${i + 1}. [${courseName}] ${t.title} | Deadline: ${dateStr} | Prioritas: ${t.priority}\n`;
          });
          contextParts.push(s);
        }

        // 2. Kalender event mendatang
        const upcomingEvents = await prisma.calendarEvent.findMany({
          where: { userId, startDate: { gte: now } },
          orderBy: { startDate: "asc" },
          take: 5,
        });
        if (upcomingEvents.length > 0) {
          let s = "[KONTEKS DATA - KALENDER] Jadwal mendatang milik user:\n";
          upcomingEvents.forEach((e, i) => {
            s += `${i + 1}. ${e.title} (${e.type}) | ${format(new Date(e.startDate), "dd MMMM yyyy", { locale: idLocale })}\n`;
          });
          contextParts.push(s);
        }

        // 3. Pengumuman terbaru
        const announcements = await prisma.announcement.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 5,
        });
        if (announcements.length > 0) {
          let s = "[KONTEKS DATA - PENGUMUMAN] Pengumuman terbaru milik user:\n";
          announcements.forEach((a, i) => {
            s += `${i + 1}. ${a.title} (${a.broadcast ? "sudah di-broadcast" : "draft/internal"})\n`;
          });
          contextParts.push(s);
        }

        // 4. Forum yang dibuat user
        const forumPosts = await prisma.forumPost.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 5,
        });
        if (forumPosts.length > 0) {
          let s = "[KONTEKS DATA - FORUM] Diskusi terbaru milik user:\n";
          forumPosts.forEach((f, i) => {
            s += `${i + 1}. ${f.title} (${f.category})\n`;
          });
          contextParts.push(s);
        }

        // 5. E-Learning aktif yang akan berakhir
        const elearnings = await prisma.eLearning.findMany({
          where: { isActive: true, endDate: { gte: now }, course: { userId } },
          include: { course: true },
          orderBy: { endDate: "asc" },
          take: 5,
        });
        if (elearnings.length > 0) {
          let s = "[KONTEKS DATA - E-LEARNING] E-Learning aktif milik user:\n";
          elearnings.forEach((e, i) => {
            const courseName = e.course ? e.course.name : "Umum";
            s += `${i + 1}. [${courseName}] ${e.title} | Berakhir: ${format(new Date(e.endDate), "dd MMMM yyyy", { locale: idLocale })}\n`;
          });
          contextParts.push(s);
        }

        // 6. Ringkasan file & repository
        const [fileCount, materialCount, courseCount] = await Promise.all([
          prisma.sharedFile.count({ where: { userId } }),
          prisma.material.count({ where: { course: { userId } } }),
          prisma.course.count({ where: { userId } }),
        ]);
        contextParts.push(
          `[KONTEKS DATA - RINGKASAN] Milik user: ${courseCount} mata kuliah, ${fileCount} file dibagikan, ${materialCount} materi di repository.`
        );

        // 7. Google Drive Context
        const cloudAccounts = await prisma.cloudAccount.findMany({
          where: { userId },
        });
        if (cloudAccounts.length > 0) {
          let s = "[KONTEKS DATA - GOOGLE DRIVE] Daftar akun drive yang terhubung:\n";
          cloudAccounts.forEach((acc, i) => {
            const usedMB = acc.quotaUsed != null ? (Number(acc.quotaUsed) / (1024 * 1024)).toFixed(2) : "0";
            const totalMB = acc.quotaTotal != null ? (Number(acc.quotaTotal) / (1024 * 1024)).toFixed(2) : "Unknown";
            s += `${i + 1}. ${acc.email} | Terpakai: ${usedMB} MB / ${totalMB} MB\n`;
          });
          contextParts.push(s);
        }

        const cloudFiles = await prisma.cloudFile.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 5,
        });
        if (cloudFiles.length > 0) {
          let s = "[KONTEKS DATA - FILE DRIVE TERBARU] File terbaru yang diupload via Ruang Ketua:\n";
          cloudFiles.forEach((f, i) => {
            const sizeKB = (f.size / 1024).toFixed(2);
            s += `${i + 1}. ${f.name} (${sizeKB} KB) | Link: ${f.webViewLink || "Link tidak tersedia"}\n`;
          });
          contextParts.push(s);
        }
      } catch {
        // Abaikan jika gagal mengambil konteks
      }
    }

    const appContext = contextParts.length
      ? `\n\n[KONTEKS DATA APLIKASI MILIK USER - gunakan untuk menjawab, JANGAN tampilkan label ini ke user]\n` +
        contextParts.join("\n")
      : "";

    const FINAL_SYSTEM_PROMPT = SYSTEM_PROMPT_BASE + appContext;

    // 1. Ambil API Key asli dari konfigurasi System Settings di database
    const sysSettings = await prisma.systemSettings.findFirst();
    const apiKey = sysSettings?.groqApiKey || process.env.GROQ_API_KEY;

    if (!apiKey || apiKey === "your-groq-api-key") {
      // Fallback response when API key not configured
      const fallbackResponses: Record<string, string> = {
        pengumuman: `📢 *PENGUMUMAN KELAS*\n\n━━━━━━━━━━━━━━━━━━━━━\n\nAssalamu'alaikum Wr. Wb.\n\nDiberitahukan kepada seluruh mahasiswa/i,\n\n[Isi pengumuman sesuai konteks]\n\nMohon untuk diperhatikan dan dilaksanakan.\n\nTerima kasih atas perhatiannya.\n\nWassalamu'alaikum Wr. Wb.\n\n━━━━━━━━━━━━━━━━━━━━━\n📌 Ketua Kelas`,
        dosen: `Assalamu'alaikum Wr. Wb.\n\nYth. Bapak/Ibu Dosen,\n\nDengan hormat, perkenalkan saya [Nama], Ketua Kelas [Kelas].\n\nMelalui pesan ini, saya ingin [tujuan pesan].\n\nBesar harapan kami atas perhatian dan arahan Bapak/Ibu.\n\nTerima kasih banyak atas waktu dan perhatian yang diberikan.\n\nWassalamu'alaikum Wr. Wb.\n\nHormat saya,\n[Nama]\nKetua Kelas [Kelas]`,
        reminder: `⏰ *REMINDER*\n\n━━━━━━━━━━━━━━━━━━━━━\n\n📚 Mata Kuliah: [Nama MK]\n📝 Tugas: [Judul Tugas]\n📅 Deadline: [Tanggal]\n⏳ Sisa Waktu: [X hari lagi]\n\n💡 Pastikan tugas sudah dikumpulkan sebelum batas waktu!\n\n━━━━━━━━━━━━━━━━━━━━━`,
        deadline: `📅 *INFO DEADLINE TERDEKAT*\n\nBerikut adalah tugas dengan deadline paling dekat:\n\n1. 📚 [Nama Mata Kuliah 1]\n   📝 Tugas: [Judul Tugas]\n   ⏳ Tersisa: 2 Hari lagi\n\n2. 📚 [Nama Mata Kuliah 2]\n   📝 Tugas: [Judul Tugas 2]\n   ⏳ Tersisa: 4 Hari lagi\n\n💡 _Disarankan untuk segera menyelesaikan tugas di atas sebelum batas waktu habis!_`,
      };

      const lowerMsg = message.toLowerCase();
      let reply = "Halo! Saya Ruang Ketua AI. 🎓\n\nSaya memahami semua fitur Ruang Ketua dan bisa membantu Anda:\n• Menjelaskan cara pakai tiap fitur (Broadcast, Forum, OCR, Kalender, dll)\n• Membuat pengumuman kelas\n• Menulis pesan ke dosen\n• Membuat reminder tugas\n• Merangkum materi\n• Mencari deadline tugas\n\n⚠️ Untuk pengalaman Chat AI asli (dengan ingatan & konteks data Anda), silakan konfigurasi API Key AI di pengaturan admin.";

      if (lowerMsg.includes("pengumuman")) reply = fallbackResponses.pengumuman;
      else if (lowerMsg.includes("dosen") || lowerMsg.includes("pesan")) reply = fallbackResponses.dosen;
      else if (lowerMsg.includes("reminder") || lowerMsg.includes("ingatkan")) reply = fallbackResponses.reminder;
      else if (lowerMsg.includes("deadline") || lowerMsg.includes("tugas terdekat")) reply = fallbackResponses.deadline;

      return successResponse({ reply });
    }

    // Call Groq API with history and context-aware prompt
    const reply = await callAIWithHistory(
      FINAL_SYSTEM_PROMPT,
      history || [],
      message
    );

    return successResponse({ reply });
  } catch (error) {
    console.error("AI Chat error:", error);
    return errorResponse("Terjadi kesalahan pada AI", 500);
  }
}
