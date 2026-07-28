import Link from "next/link";
import {
  ArrowLeft, Target, ListTodo, Megaphone, Send, Bot,
  HeartHandshake, Zap, Sparkles,
} from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export const metadata = {
  title: "Tentang Kami - Ruang Ketua",
  description: "Mengenal Ruang Ketua, platform manajemen kelas digital untuk Ketua Kelas Mahasiswa Indonesia.",
};

const FEATURES = [
  { icon: ListTodo, color: "text-orange-500", bg: "bg-orange-500/10", title: "Manajemen Tugas & Deadline", desc: "Satu tampilan untuk seluruh tugas kelas dengan pengingat otomatis ke WhatsApp." },
  { icon: Megaphone, color: "text-purple-500", bg: "bg-purple-500/10", title: "Pusat Pengumuman", desc: "Buat pengumuman resmi kelas lengkap dengan bantuan penyusunan dari AI." },
  { icon: Send, color: "text-green-500", bg: "bg-green-500/10", title: "Broadcast WhatsApp", desc: "Kirim pesan ke banyak grup sekaligus tanpa salin-tempel berulang." },
  { icon: Bot, color: "text-pink-500", bg: "bg-pink-500/10", title: "Asisten AI Akademik", desc: "Rangkum materi, susun draf pesan dosen, dan bantu jawab pertanyaan umum." },
];

const VALUES = [
  { icon: HeartHandshake, title: "Empati", desc: "Kami memahami duduknya Ketua Kelas karena pernah berada di posisi yang sama." },
  { icon: Zap, title: "Sederhana", desc: "Alat yang rumit tidak membantu. Setiap fitur dirancang agar mudah dipakai." },
  { icon: Sparkles, title: "Berdampak", desc: "Tujuannya satu: kelas terelola, Ketua Kelas bisa fokus memimpin." },
];

export default function TentangKamiPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border pt-28 pb-16">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="pointer-events-none absolute -top-24 -left-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Beranda
          </Link>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">Tentang Kami</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Ruang Ketua lahir dari masalah nyata Ketua Kelas
          </h1>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            Terlalu banyak grup chat, catatan tersebar, dan tugas yang mudah terlupakan. Kami
            membangun satu dashboard yang merangkum seluruh urusan kelas dalam satu tempat—bukan
            sekadar aplikasi catatan, melainkan asisten digital untuk Ketua Kelas.
          </p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-14 sm:px-6">
        {/* Mission */}
        <div className="mb-14 rounded-2xl border border-border bg-card p-8 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Target className="h-6 w-6" />
          </span>
          <h2 className="text-xl font-semibold text-foreground">Misi Kami</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Memberdayakan Ketua Kelas mahasiswa Indonesia dengan alat digital yang sederhana
            namun andal, sehingga mereka bisa fokus memimpin—bukan sekadar mengingatkan.
          </p>
        </div>

        {/* Features */}
        <section className="mb-14">
          <h2 className="mb-6 text-lg font-semibold text-foreground">Apa yang Kami Bangun</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-md">
                <span className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${f.bg} ${f.color}`}>
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Values */}
        <section className="mb-14">
          <h2 className="mb-6 text-lg font-semibold text-foreground">Nilai yang Kami Pegang</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-2xl border border-border bg-background p-6">
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <v.icon className="h-5 w-5" />
                </span>
                <h3 className="text-sm font-semibold text-foreground">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
          <h2 className="text-xl font-semibold text-foreground">Siap membuat kelas lebih teratur?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Buat akun Ruang Ketua dan rasakan perbedaannya dalam mengelola kelas.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Daftar
            </Link>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/60"
            >
              Baca Blog
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
