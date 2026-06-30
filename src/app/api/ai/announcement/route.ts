import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { callAI, PROMPTS } from "@/lib/ai/prompts";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, subject, details, content, className, deadline } = body;

    // Support both broadcast page (content) and announcement page (subject/details)
    const mainContent = content || subject;

    if (!mainContent) {
      return errorResponse("Subjek/konten pengumuman wajib diisi", 400);
    }

    const userMessage = `Buat pengumuman kelas dengan detail:
- Tipe: ${type || "Umum"}
- Subjek: ${mainContent}
- Detail: ${details || "-"}
- Kelas: ${className || "-"}
- Deadline: ${deadline || "-"}`;

    try {
      const result = await callAI({
        systemPrompt: PROMPTS.announcement,
        userMessage,
      });
      return successResponse(result);
    } catch {
      // Fallback template
      const template = `📢 *PENGUMUMAN KELAS* 📢

━━━━━━━━━━━━━━━━━━━━━

Assalamu'alaikum Wr. Wb.

Diberitahukan kepada seluruh mahasiswa/i ${className || ""},

📌 *${mainContent}*

${details || "Mohon diperhatikan informasi berikut."}

${deadline ? `⏰ *Deadline:* ${deadline}` : ""}

Mohon untuk diperhatikan dan dilaksanakan.

Terima kasih atas perhatiannya.

Wassalamu'alaikum Wr. Wb.

━━━━━━━━━━━━━━━━━━━━━
📌 _Ketua Kelas_`;

      return successResponse(template);
    }
  } catch (error) {
    console.error("AI Announcement error:", error);
    return errorResponse("Gagal membuat pengumuman", 500);
  }
}
