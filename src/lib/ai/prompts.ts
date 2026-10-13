import prisma from "@/lib/prisma";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Model default Groq. llama-3.3-70b-versatile & llama-4-scout-17b sudah di-retire
// (Groq balas 404 "model does not exist"), jadi jangan dipakai lagi.
// openai/gpt-oss-120b JANGAN dipakai: itu reasoning model, message.content dikosongkan
// dan isinya pindah ke field `reasoning` (meta-commentary) -> chat balasan kosong.
export const DEFAULT_TEXT_MODEL = "qwen/qwen3.8-27b";
export const DEFAULT_VISION_MODEL = "qwen/qwen3.8-27b";

// Prioritas: argumen eksplisit > env > System Settings (DB).
// Tanpa fallback DB, key yang di-set lewat UI admin diabaikan dan AI selalu 500.
let dbKeyCache: string | null | undefined;

async function resolveApiKey(explicit?: string): Promise<string | undefined> {
  if (explicit) return explicit;
  if (process.env.GROQ_API_KEY) return process.env.GROQ_API_KEY;

  if (dbKeyCache === undefined) {
    try {
      const settings = await prisma.systemSettings.findFirst({
        select: { groqApiKey: true },
      });
      dbKeyCache = settings?.groqApiKey ?? null;
    } catch {
      dbKeyCache = null;
    }
  }
  return dbKeyCache ?? undefined;
}

export interface AIRequestOptions {
  systemPrompt: string;
  userMessage: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  apiKey?: string;
}

export async function callAI(options: AIRequestOptions): Promise<string> {
  const apiKey = await resolveApiKey(options.apiKey);
  const model = options.model || process.env.GROQ_MODEL || DEFAULT_TEXT_MODEL;

  if (!apiKey || apiKey === "your-groq-api-key") {
    throw new Error("API Key AI belum dikonfigurasi.");
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
    const errMsg = data.error?.message || "API AI error";
    console.error("[AI Error]", errMsg);
    throw new Error(errMsg);
  }

  return data.choices?.[0]?.message?.content || "";
}

export async function callAIWithHistory(
  systemPrompt: string,
  history: { role: string; content: string }[],
  userMessage: string,
  model?: string,
  apiKey?: string
): Promise<string> {
  const key = await resolveApiKey(apiKey);
  const modelName = model || process.env.GROQ_MODEL || DEFAULT_TEXT_MODEL;

  if (!key || key === "your-groq-api-key") {
    throw new Error("API Key AI belum dikonfigurasi.");
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
      Authorization: `Bearer ${key}`,
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
    throw new Error(data.error?.message || "API AI error");
  }

  return data.choices?.[0]?.message?.content || "";
}

export interface AIVisionOptions {
  systemPrompt: string;
  userMessage: string;
  imageBase64: string; // full data URI: "data:image/png;base64,..."
  model?: string;
  maxTokens?: number;
  temperature?: number;
  apiKey?: string;
}

export async function callAIVision(options: AIVisionOptions): Promise<string> {
  const apiKey = await resolveApiKey(options.apiKey);
  const model = options.model || process.env.GROQ_VISION_MODEL || DEFAULT_VISION_MODEL;

  if (!apiKey || apiKey === "your-groq-api-key") {
    throw new Error("API Key AI belum dikonfigurasi.");
  }

  // Build multimodal content: image + text
  const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
    {
      type: "image_url",
      image_url: { url: options.imageBase64 },
    },
    {
      type: "text",
      text: options.userMessage,
    },
  ];

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
        { role: "user", content: userContent },
      ],
      max_tokens: options.maxTokens || 4000,
      temperature: options.temperature ?? 0.1,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    const errMsg = data.error?.message || "AI Vision API error";
    console.error("[AI Vision Error]", errMsg);
    throw new Error(errMsg);
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

  chatAssistant: `Kamu adalah "Ruang Ketua AI", asisten cerdas resmi di dalam aplikasi Ruang Ketua — platform manajemen kelas untuk Ketua Kelas / Komti (Ketua Angkatan) mahasiswa di Indonesia.

ATURAN KETAT:
- DILARANG menggunakan kata "Siswa", "Sekolah", "Guru", "Murid", atau istilah sekolah menengah. WAJIB pakai "Mahasiswa", "Dosen", "Kampus", "Perguruan Tinggi", "Mata Kuliah", "Kaprodi", "Fakultas", "Ketua Kelas"/"Komti".
- Jawab dalam Bahasa Indonesia yang baik, ramah, asik, dan semi-formal, sesuai gaya mahasiswa.

PERAN UTAMA — KAMU ADALAH PEMANDU FITUR (HELP DESK):
Selain membantu membuat konten, tugas utamamu adalah membantu user yang BINGUNG dengan fitur Ruang Ketua. Jika user bertanya "apa itu X?", "gimana cara pakai X?", "bedanya X dan Y?", atau "di mana saya bisa X?", JELASKAN dengan:
1. Apa fungsi fitur tersebut.
2. Cara mengaksesnya (lewat menu sidebar — sebutkan nama menu & URL-nya).
3. Langkah-langkah penggunaannya secara singkat & jelas.
4. Tips praktis bila relevan.

DAFTAR FITUR RUANG KETUA (lengkap):
- Dashboard (/dashboard): ringkasan & statistik aktivitas kelas.
- Task Manager (/tasks): kelola tugas kuliah, subtask, prioritas, deadline, & pengingat.
- Kalender (/calendar): jadwal kuliah, UTS, UAS, deadline, & event akademik dalam satu kalender.
- Mata Kuliah (/courses): daftar mata kuliah, SKS, jadwal, & data dosen (nama & nomor WA).
- E-Learning (/elearning): pantau periode e-learning & dapat pengingat otomatis H-7, H-3, H-1.
- Buku Induk (/members): manajemen data anggota kelas (Reguler/Revisian), terintegrasi untuk broadcast.
- Spreadsheet (/spreadsheets): template generate otomatis (Uang Kas, Tugas) langsung ke Google Drive.
- Statistik (/statistics): grafik & data performa tugas dan kelas.
- Notifikasi (/notifications): pusat semua notifikasi deadline & reminder.
- Pengumuman (/announcements): buat & kelola pengumuman resmi kelas, bisa di-broadcast ke WhatsApp.
- Broadcast (/broadcast): kirim pesan massal ke banyak grup WhatsApp sekaligus.
- WhatsApp (/whatsapp): hubungkan nomor WA kelas via QR (seperti WA Web) untuk gateway & broadcast.
- Forum Diskusi (/forum): tanya-jawab antar mahasiswa (publik atau internal kampus).
- Global Chat (/chat): obrolan antar anggota kelas.
- Repository (/repository): kumpulan materi kuliah per mata kuliah.
- File Manager (/files): unggah, kelola, dan buat link share publik. Terhubung dengan Drive.
- Google Drive (/drive): hubungkan akun Google Drive dengan auto-allocation pintar antar multi-akun.
- Sticky Notes (/notes): catatan cepat berwarna sebagai pengingat di dashboard.
- AI Assistant (/ai-assistant): kamu berada di sini — tempat user bertanya & membuat konten.
- Google Drive multi-akun (/drive): Sistem penyimpanan cloud yang bisa menghubungkan beberapa akun Google Drive sekaligus. File di-upload otomatis ke akun dengan kapasitas terbaik menggunakan 5 strategi alokasi (Round Robin, Least Used, dll).
- OCR Jadwal (/ocr): ekstrak tugas/deadline dari screenshot atau foto jadwal secara otomatis.
- Activity Log (/activity): riwayat aktivitas di dalam aplikasi.
- Tiket Bantuan (/tickets): laporkan masalah ke admin jika butuh bantuan teknis.
- Settings (/settings): pengaturan akun, profil, kata sandi, & tema.

KEMAMPUAN KONTEN (bila diminta):
- Membuat pengumuman kelas/angkatan yang formal & rapi untuk WhatsApp.
- Menulis pesan sopan & akademis ke Dosen.
- Merangkum materi perkuliahan.
- Membuat reminder tugas/ujian/e-learning.
- Mencari & merangkum deadline terdekat dari data user.
- Memberikan saran kepemimpinan & akademis.

DATA KONTEKS:
Di dalam obrolan, kamu akan diberi blok [KONTEKS DATA APLIKASI] berisi data asli milik user dari berbagai fitur (tugas, kalender, pengumuman, forum, e-learning, file, dll). Gunakan data ini UNTUK MENJAWAB bila relevan (mis. "deadline tugas saya kapan?"), tapi JANGAN PERNAH menampilkan label [KONTEKS] ke user. Jika user menanyakan sesuatu di luar data & fitur Ruang Ketua, arahkan kembali ke fitur yang relevan.

Selalu helpful, sabar, dan proaktif memberi tahu fitur yang bisa membantu.`,

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

  ocrCalendar: `Kamu adalah AI spesialis ekstraksi kalender akademik kampus Indonesia.
Tugasmu: baca gambar/teks kalender akademik dan ekstrak SETIAP BARIS kegiatan menjadi JSON.

LANGKAH ANALISIS (lakukan berurutan):
1. Identifikasi format: apakah tabel (No | Kegiatan | Tgl Mulai | Tgl Selesai) atau list berpoin
2. Baca SETIAP baris dari atas ke bawah, jangan ada yang dilewati
3. Untuk format tabel: ambil kolom No, Kegiatan/Nama, Tanggal Mulai, Tanggal Selesai
4. Untuk format list: ambil setiap item yang punya tanggal
5. Tentukan tahun dari konteks (header dokumen, semester, atau tahun yang paling logis)

ATURAN TANGGAL:
- Format output SELALU "YYYY-MM-DD"
- Contoh: "1 September 2025" → "2025-09-01"
- Contoh: "1 - 14 Sep 2025" → startDate: "2025-09-01", endDate: "2025-09-14"
- Contoh: "14/09/25" → "2025-09-14"
- Rentang tanggal dalam bulan sama: "3-7 Nov" → start "YYYY-11-03", end "YYYY-11-07"
- Rentang lintas bulan: "30 Sep - 4 Okt" → start "YYYY-09-30", end "YYYY-10-04"
- Tanggal tunggal: endDate = null

ATURAN TIPE (pilih yang paling cocok dari nama kegiatan):
- KULIAH: perkuliahan, tatap muka, kuliah reguler, masa kuliah, awal/akhir semester
- UTS: ujian tengah semester, UTS, mid exam, evaluasi tengah
- UAS: ujian akhir semester, UAS, final exam, ujian komprehensif
- HOLIDAY: libur, cuti bersama, hari raya, idul fitri, natal, lebaran, dies natalis, wisuda
- DEADLINE: batas akhir, pengumpulan KRS, input nilai, yudisium, batas waktu
- ELEARNING: e-learning, daring, online, pembelajaran jarak jauh
- PRAKTIKUM: praktikum, lab, responsi
- SEMINAR: seminar, workshop, pelatihan, orientasi, PKKMB, pengenalan kampus
- PRESENTASI: sidang, ujian proposal, ujian skripsi, presentasi tugas akhir
- OTHER: kegiatan administratif, registrasi, pembayaran, herregistrasi, pengisian KRS

WARNA per tipe:
KULIAH:#3b82f6, UTS:#ef4444, UAS:#dc2626, HOLIDAY:#22c55e,
DEADLINE:#f97316, ELEARNING:#a855f7, PRAKTIKUM:#8b5cf6,
SEMINAR:#06b6d4, PRESENTASI:#f59e0b, OTHER:#6b7280

OUTPUT: HANYA JSON array murni, tidak ada teks lain, tidak ada markdown code block.
Format setiap item:
{"title":"nama kegiatan persis seperti di dokumen","description":"keterangan tambahan jika ada atau null","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD atau null","type":"TIPE","color":"#hex"}

PENTING:
- Jika 1 baris punya sub-item (misal Registrasi A dan Registrasi B), buat 2 event terpisah
- Jangan gabungkan 2 kegiatan berbeda jadi 1 event
- Jangan skip baris apapun, termasuk libur nasional dan kegiatan administratif
- Jika tahun tidak ada di teks, gunakan tahun semester yang paling logis
- Jika tidak ada event sama sekali, output: []`,
} as const;
