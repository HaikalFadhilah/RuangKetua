import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { callAIWithHistory, PROMPTS } from "@/lib/ai/prompts";

const SYSTEM_PROMPT = PROMPTS.chatAssistant;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history } = body;

    if (!message) {
      return errorResponse("Pesan tidak boleh kosong", 400);
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === "your-groq-api-key") {
      // Fallback response when API key not configured
      const fallbackResponses: Record<string, string> = {
        pengumuman: `📢 *PENGUMUMAN KELAS*\n\n━━━━━━━━━━━━━━━━━━━━━\n\nAssalamu'alaikum Wr. Wb.\n\nDiberitahukan kepada seluruh mahasiswa/i,\n\n[Isi pengumuman sesuai konteks]\n\nMohon untuk diperhatikan dan dilaksanakan.\n\nTerima kasih atas perhatiannya.\n\nWassalamu'alaikum Wr. Wb.\n\n━━━━━━━━━━━━━━━━━━━━━\n📌 Ketua Kelas`,
        dosen: `Assalamu'alaikum Wr. Wb.\n\nYth. Bapak/Ibu Dosen,\n\nDengan hormat, perkenalkan saya [Nama], Ketua Kelas [Kelas].\n\nMelalui pesan ini, saya ingin [tujuan pesan].\n\nBesar harapan kami atas perhatian dan arahan Bapak/Ibu.\n\nTerima kasih banyak atas waktu dan perhatian yang diberikan.\n\nWassalamu'alaikum Wr. Wb.\n\nHormat saya,\n[Nama]\nKetua Kelas [Kelas]`,
        reminder: `⏰ *REMINDER*\n\n━━━━━━━━━━━━━━━━━━━━━\n\n📚 Mata Kuliah: [Nama MK]\n📝 Tugas: [Judul Tugas]\n📅 Deadline: [Tanggal]\n⏳ Sisa Waktu: [X hari lagi]\n\n💡 Pastikan tugas sudah dikumpulkan sebelum batas waktu!\n\n━━━━━━━━━━━━━━━━━━━━━`,
      };

      const lowerMsg = message.toLowerCase();
      let reply = "Halo! Saya AI Assistant Ketua Kelas. 🎓\n\nSaya bisa membantu Anda:\n• Membuat pengumuman kelas\n• Menulis pesan ke dosen\n• Membuat reminder tugas\n• Merangkum materi\n\n⚠️ Untuk fitur AI penuh, silakan konfigurasi GROQ_API_KEY di file .env\n\nAmbil API key gratis di: https://console.groq.com/keys";

      if (lowerMsg.includes("pengumuman")) reply = fallbackResponses.pengumuman;
      else if (lowerMsg.includes("dosen") || lowerMsg.includes("pesan")) reply = fallbackResponses.dosen;
      else if (lowerMsg.includes("reminder") || lowerMsg.includes("ingatkan")) reply = fallbackResponses.reminder;

      return successResponse({ reply });
    }

    // Call Groq API with history
    const reply = await callAIWithHistory(
      SYSTEM_PROMPT,
      history || [],
      message
    );

    return successResponse({ reply });
  } catch (error) {
    console.error("AI Chat error:", error);
    return errorResponse("Terjadi kesalahan pada AI", 500);
  }
}
