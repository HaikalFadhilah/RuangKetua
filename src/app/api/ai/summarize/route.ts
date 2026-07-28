import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";
import { callAI, PROMPTS } from "@/lib/ai/prompts";

export async function POST(request: NextRequest) {
  try {
    getUserIdFromRequest(request);
    const body = await request.json();
    const { text, topic } = body;

    if (!text) {
      return errorResponse("Teks materi tidak boleh kosong", 400);
    }

    try {
      const result = await callAI({
        systemPrompt: PROMPTS.summarize,
        userMessage: `${topic ? `Topik: ${topic}\n\n` : ""}Rangkum materi berikut:\n\n${text}`,
        maxTokens: 2000,
      });

      return successResponse({ summary: result });
    } catch {
      return successResponse({
        summary: "⚠️ AI tidak tersedia saat ini. Silakan konfigurasi API Key AI di file .env",
      });
    }
  } catch (error) {
    console.error("AI Summarize error:", error);
    return errorResponse("Gagal merangkum materi", 500);
  }
}
