import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";
import { callAI, callAIVision, PROMPTS } from "@/lib/ai/prompts";

const VALID_TYPES = [
  "KULIAH", "PRAKTIKUM", "SEMINAR", "PRESENTASI",
  "UTS", "UAS", "HOLIDAY", "DEADLINE", "ELEARNING", "OTHER",
];

const TYPE_COLORS: Record<string, string> = {
  KULIAH: "#3b82f6", UTS: "#ef4444", UAS: "#dc2626", HOLIDAY: "#22c55e",
  DEADLINE: "#f97316", ELEARNING: "#a855f7", PRAKTIKUM: "#8b5cf6",
  SEMINAR: "#06b6d4", PRESENTASI: "#f59e0b", OTHER: "#6b7280",
};

// Coba berbagai cara parsing JSON — handle output AI yang tidak sempurna
function tryParseJSON(raw: string): unknown[] | null {
  // 1. Bersihkan markdown code block
  let cleaned = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  // 2. Coba parse langsung
  try { const r = JSON.parse(cleaned); if (Array.isArray(r)) return r; } catch { /* lanjut */ }

  // 3. Ekstrak substring yang diawali '[' dan diakhiri ']'
  const arrMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrMatch) {
    try { const r = JSON.parse(arrMatch[0]); if (Array.isArray(r)) return r; } catch { /* lanjut */ }
  }

  // 4. Kadang AI nulis JSON objects satu per satu tanpa wrapper array — coba wrap
  if (cleaned.startsWith("{")) {
    try { const r = JSON.parse(`[${cleaned}]`); if (Array.isArray(r)) return r; } catch { /* lanjut */ }
  }

  // 5. Split by "},{" dan wrap masing-masing
  try {
    const objs = cleaned
      .replace(/^\[/, "").replace(/\]$/, "")
      .split(/\},\s*\{/)
      .map((s, i, arr) => {
        let chunk = s.trim();
        if (i > 0) chunk = "{" + chunk;
        if (i < arr.length - 1) chunk = chunk + "}";
        return JSON.parse(chunk);
      });
    if (objs.length > 0) return objs;
  } catch { /* buang */ }

  return null;
}

// Normalisasi tanggal ke YYYY-MM-DD — handle berbagai format AI
function normalizeDate(raw: string | null | undefined): string | null {
  if (!raw || raw === "null") return null;
  const s = String(raw).trim();
  // Sudah YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // DD/MM/YYYY atau DD-MM-YYYY
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2}|\d{4})$/);
  if (dmy) {
    const y = dmy[3].length === 2 ? "20" + dmy[3] : dmy[3];
    return `${y}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  }
  // Coba Date parse sebagai fallback
  try {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      return d.toISOString().substring(0, 10);
    }
  } catch { /* buang */ }
  return null;
}

function validateAndClean(raw: unknown[]) {
  const results = [];
  for (const ev of raw) {
    if (typeof ev !== "object" || ev === null) continue;
    const e = ev as Record<string, unknown>;

    const title = typeof e.title === "string" ? e.title.trim() : null;
    if (!title) continue;

    const startDate = normalizeDate(e.startDate as string);
    if (!startDate) continue; // wajib ada startDate valid

    const endDate = normalizeDate(e.endDate as string);

    const rawType = typeof e.type === "string" ? e.type.toUpperCase().trim() : "OTHER";
    const type = VALID_TYPES.includes(rawType) ? rawType : "OTHER";
    const color = TYPE_COLORS[type];

    results.push({
      title,
      description: typeof e.description === "string" && e.description !== "null"
        ? e.description.trim() || null
        : null,
      startDate,
      endDate,
      type,
      color,
    });
  }
  return results;
}

const IMAGE_USER_PROMPT = `Ini adalah gambar kalender akademik kampus.

Instruksi:
1. Baca SELURUH isi gambar dari atas ke bawah, kiri ke kanan
2. Identifikasi format: tabel (ada kolom No, Kegiatan, Tanggal) atau list
3. Ekstrak SETIAP baris kegiatan yang ada — jangan skip satu pun
4. Untuk tabel: baca kolom tanggal mulai dan tanggal selesai dengan teliti
5. Perhatikan nomor urut (1, 2, 3, ...) — pastikan jumlah event output = jumlah baris di tabel
6. Tahun bisa dilihat dari header dokumen atau konteks semester

Keluarkan hasil sebagai JSON array murni sesuai instruksi system prompt.`;

const TEXT_USER_PROMPT = `Berikut adalah teks kalender akademik kampus.

Instruksi:
1. Baca setiap baris dari atas ke bawah
2. Ekstrak SETIAP kegiatan yang memiliki tanggal — jangan ada yang dilewati
3. Perhatikan rentang tanggal (misal "1-14 Sep") dan konversi dengan tepat
4. Tahun diambil dari konteks dokumen atau yang paling logis sesuai semester

Teks kalender akademik:
`;

export async function POST(request: NextRequest) {
  try {
    getUserIdFromRequest(request);
    const body = await request.json();
    const { text, image } = body;

    if (!text && !image) {
      return errorResponse(
        "Teks atau gambar tidak boleh kosong.",
        400
      );
    }

    try {
      let rawResult: string;

      if (image && !text) {
        // Mode gambar → Llama 4 Scout Vision
        rawResult = await callAIVision({
          systemPrompt: PROMPTS.ocrCalendar,
          userMessage: IMAGE_USER_PROMPT,
          imageBase64: image,
          temperature: 0.05,
          maxTokens: 8000,
        });
      } else {
        // Mode teks → LLaMA 3.3 70B
        rawResult = await callAI({
          systemPrompt: PROMPTS.ocrCalendar,
          userMessage: `${TEXT_USER_PROMPT}${text}`,
          temperature: 0.05,
          maxTokens: 6000,
        });
      }

      console.log("[OCR Calendar] Raw AI output (first 500):", rawResult.substring(0, 500));

      const parsed = tryParseJSON(rawResult);

      if (!parsed) {
        console.error("[OCR Calendar] Gagal parse JSON. Raw:", rawResult.substring(0, 800));
        return successResponse({
          events: [],
          message: "AI berhasil membaca gambar tapi output tidak bisa diparsing. Coba crop gambar agar hanya berisi tabel kalender, atau paste teksnya manual.",
        });
      }

      const validEvents = validateAndClean(parsed);

      if (validEvents.length === 0) {
        return successResponse({
          events: [],
          message: `AI mengembalikan ${parsed.length} item tapi semua tidak valid (tanggal tidak terbaca). Pastikan gambar cukup jelas dan resolusi cukup tinggi.`,
        });
      }

      return successResponse({
        events: validEvents,
        total: validEvents.length,
      });

    } catch (aiError) {
      const msg = aiError instanceof Error ? aiError.message : String(aiError);
      console.error("[OCR Calendar] AI error:", msg);

      // Berikan pesan error yang informatif
      if (msg.includes("rate_limit")) {
        return successResponse({
          events: [],
          message: "Rate limit API AI tercapai. Tunggu beberapa detik lalu coba lagi.",
        });
      }
      if (msg.includes("context_length") || msg.includes("too long")) {
        return successResponse({
          events: [],
          message: "Gambar/teks terlalu panjang. Coba crop gambar menjadi bagian lebih kecil atau split teks per halaman.",
        });
      }

      return successResponse({
        events: [],
          message: "AI gagal memproses. Pastikan API Key AI sudah dikonfigurasi dan coba lagi.",
      });
    }
  } catch (error) {
    console.error("[OCR Calendar] Unexpected error:", error);
    return errorResponse("Gagal memproses kalender akademik", 500);
  }
}
