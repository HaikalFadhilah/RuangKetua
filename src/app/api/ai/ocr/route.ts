import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";
import { callAI, PROMPTS } from "@/lib/ai/prompts";

export async function POST(request: NextRequest) {
  try {
    getUserIdFromRequest(request);
    const body = await request.json();
    const { text, image } = body;

    // Accept either text or base64 image
    // Note: Gemini free supports image analysis too, but for simplicity
    // we handle the text extraction flow here
    const inputText = text || (image ? "Gambar dikirim - mohon konfigurasi vision model untuk OCR gambar." : "");

    if (!inputText && !image) {
      return errorResponse("Teks atau gambar tidak boleh kosong", 400);
    }

    try {
      const result = await callAI({
        systemPrompt: PROMPTS.ocr,
        userMessage: `Ekstrak informasi tugas dari teks berikut:\n\n${inputText}`,
        temperature: 0.1,
      });

      // Parse JSON result
      const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);

      return successResponse(parsed);
    } catch {
      return successResponse({
        mataKuliah: null,
        judul: null,
        deskripsi: inputText || "AI tidak tersedia. Silakan isi data secara manual.",
        deadline: null,
        waktu: null,
        dosen: null,
        catatan: "AI tidak tersedia atau gagal parsing, teks asli disertakan.",
        rawText: inputText,
      });
    }
  } catch (error) {
    console.error("AI OCR error:", error);
    return errorResponse("Gagal memproses teks", 500);
  }
}
