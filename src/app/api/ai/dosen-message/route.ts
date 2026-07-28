import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";
import { callAI, PROMPTS } from "@/lib/ai/prompts";

export async function POST(request: NextRequest) {
  try {
    getUserIdFromRequest(request);
    const body = await request.json();
    const { template, dosenName, subject, details, senderName, className } = body;

    if (!dosenName || !subject) {
      return errorResponse("Nama dosen dan subjek wajib diisi", 400);
    }

    const userMessage = `Buat pesan ke dosen dengan detail:
- Template: ${template || "Umum"}
- Nama Dosen: ${dosenName}
- Subjek: ${subject}
- Detail: ${details || "-"}
- Pengirim: ${senderName || "Ketua Kelas"}
- Kelas: ${className || "-"}`;

    try {
      const result = await callAI({
        systemPrompt: PROMPTS.dosenMessage,
        userMessage,
      });
      return successResponse({ message: result });
    } catch {
      // Fallback template
      const greeting = new Date().getHours() < 12 ? "Selamat pagi" : new Date().getHours() < 15 ? "Selamat siang" : "Selamat sore";

      const fallback = `Assalamu'alaikum Wr. Wb.

${greeting}, Bapak/Ibu ${dosenName}.

Dengan hormat, perkenalkan saya ${senderName || "Ketua Kelas"} dari kelas ${className || "[Kelas]"}.

Melalui pesan ini, saya ingin menyampaikan perihal *${subject}*.

${details || "Mohon kiranya Bapak/Ibu dapat memberikan informasi terkait hal tersebut."}

Besar harapan kami atas perhatian dan arahan Bapak/Ibu. Terima kasih banyak atas waktu yang diberikan.

Wassalamu'alaikum Wr. Wb.

Hormat saya,
${senderName || "Ketua Kelas"}
Kelas ${className || "[Kelas]"}`;

      return successResponse({ message: fallback });
    }
  } catch (error) {
    console.error("AI Dosen Message error:", error);
    return errorResponse("Gagal membuat pesan", 500);
  }
}
