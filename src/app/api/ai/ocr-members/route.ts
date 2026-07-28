import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { callAI } from "@/lib/ai/prompts";

const OCR_MEMBERS_PROMPT = `
Kamu adalah sistem pemroses data akademik yang ahli membaca daftar absensi kelas.
Tugasmu adalah mengekstrak daftar nama dan NIM dari teks yang diberikan.

Output yang diharapkan adalah JSON array berformat:
[
  { "name": "Budi Santoso", "nim": "2021001", "memberType": "REGULER" },
  { "name": "Siti Nurhaliza", "nim": null, "memberType": "REGULER" }
]

Aturan:
1. Hanya kembalikan array JSON valid (tanpa markdown blok).
2. "memberType" selalu "REGULER".
3. "name" harus bersih dari angka urut (contoh: "1. Budi" -> "Budi").
4. "nim" isi jika ditemukan, jika tidak temukan gunakan null.
5. Bersihkan karakter aneh atau noise dari hasil OCR.
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text) {
      return errorResponse("Teks hasil scan tidak boleh kosong", 400);
    }

    try {
      const result = await callAI({
        systemPrompt: OCR_MEMBERS_PROMPT,
        userMessage: `Ekstrak daftar anggota kelas dari teks absensi berikut:\n\n${text}`,
        temperature: 0.1,
      });

      const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);

      return successResponse(parsed);
    } catch {
      return errorResponse("Gagal mem-parsing teks menjadi daftar nama", 500);
    }
  } catch (error) {
    console.error("AI OCR Members error:", error);
    return errorResponse("Gagal memproses teks", 500);
  }
}
