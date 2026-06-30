const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export interface AIRequestOptions {
  systemPrompt: string;
  userMessage: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export async function callAI(options: AIRequestOptions): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  const model = options.model || process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  if (!apiKey || apiKey === "your-groq-api-key") {
    throw new Error("GROQ_API_KEY belum dikonfigurasi. Ambil gratis di https://console.groq.com/keys");
  }

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: options.systemPrompt },
        { role: "user", content: options.userMessage },
      ],
      max_tokens: options.maxTokens || 1500,
      temperature: options.temperature ?? 0.7,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    const errMsg = data.error?.message || "Groq API error";
    console.error("[Groq Error]", errMsg);
    throw new Error(errMsg);
  }

  return data.choices?.[0]?.message?.content || "";
}

export async function callAIWithHistory(
  systemPrompt: string,
  history: { role: string; content: string }[],
  userMessage: string,
  model?: string
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  const modelName = model || process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  if (!apiKey || apiKey === "your-groq-api-key") {
    throw new Error("GROQ_API_KEY belum dikonfigurasi.");
  }

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.map((h) => ({
      role: h.role === "assistant" ? "assistant" : "user",
      content: h.content,
    })),
    { role: "user", content: userMessage },
  ];

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      messages,
      max_tokens: 1500,
      temperature: 0.7,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error?.message || "Groq API error");
  }

  return data.choices?.[0]?.message?.content || "";
}

// ============================================================
// PROMPT TEMPLATES
// ============================================================

export const PROMPTS = {
  announcement: `Kamu adalah AI pembuat pengumuman kelas. Buat pengumuman yang:
- Formal tapi ramah
- Ada salam pembuka dan penutup
- Menggunakan emoji yang sesuai
- Ada format yang rapi dengan separator
- Bahasa Indonesia yang baik
Format: gunakan bold (*text*) untuk emphasis di WhatsApp.`,

  dosenMessage: `Kamu adalah AI yang membantu Ketua Kelas menulis pesan ke dosen. Buat pesan yang:
- Sangat sopan dan formal
- Ada salam pembuka (Assalamu'alaikum / Selamat pagi/siang/sore)
- Jelas tujuannya
- Ada identitas pengirim (Ketua Kelas)
- Ada salam penutup
- Bahasa Indonesia baku`,

  summarize: `Kamu adalah AI perangkum materi kuliah. Rangkum materi berikut dengan:
- Poin-poin utama yang terstruktur
- Bahasa yang mudah dipahami
- Highlight istilah penting
- Buat dalam format bullet point
- Bahasa Indonesia`,

  ocr: `Kamu adalah AI yang mengekstrak informasi tugas dari teks screenshot WhatsApp.
Ekstrak informasi berikut dalam format JSON:
{
  "mataKuliah": "nama mata kuliah",
  "judul": "judul tugas",
  "deskripsi": "deskripsi/detail tugas",
  "deadline": "tanggal deadline (YYYY-MM-DD format jika ada)",
  "waktu": "jam deadline jika ada",
  "dosen": "nama dosen jika disebutkan",
  "catatan": "catatan tambahan"
}
Jika informasi tidak ada, isi dengan null. Hanya output JSON, tanpa penjelasan tambahan.`,

  chatAssistant: `Kamu adalah AI Assistant untuk Ketua Kelas bernama "Ruang Ketua AI". Kamu membantu:
1. Membuat pengumuman kelas yang formal dan jelas
2. Membuat pesan sopan kepada dosen
3. Merangkum materi kuliah
4. Membuat reminder untuk tugas dan e-learning
5. Mencari informasi deadline dan jadwal
6. Memberikan saran untuk mengelola kelas

Gunakan bahasa Indonesia yang baik dan benar.
Jika diminta membuat pengumuman, gunakan format rapi dengan emoji.
Jika diminta membuat pesan ke dosen, gunakan bahasa sopan dan formal.
Jawab dengan helpful dan friendly.`,

  reminderFromChat: `Kamu adalah AI yang mengubah chat/pesan menjadi reminder terstruktur.
Dari teks yang diberikan, ekstrak informasi reminder dalam format JSON:
{
  "title": "judul reminder",
  "description": "deskripsi",
  "remindAt": "ISO date string",
  "type": "GENERAL|TASK|ELEARNING|EXAM|ASSIGNMENT"
}
Hanya output JSON.`,

  announcementFromChat: `Kamu adalah AI yang mengubah chat/pesan informal menjadi pengumuman resmi.
Buat pengumuman formal dari pesan berikut. Format pengumuman:
- Salam pembuka
- Isi pengumuman yang jelas dan terstruktur
- Salam penutup
- Gunakan emoji yang sesuai
- Format WhatsApp (bold: *text*, italic: _text_)`,
} as const;
