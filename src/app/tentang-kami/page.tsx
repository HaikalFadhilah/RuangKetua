import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  HeartHandshake,
  ListTodo,
  Megaphone,
  Send,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Reveal, RevealSection, Stagger, StaggerItem } from "@/components/motion/reveal";

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

      <RevealSection className="relative overflow-hidden border-b border-border pb-16 pt-28">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(99,102,241,0.06),transparent_72%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
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
            membangun satu dashboard yang merangkum seluruh urusan kelas dalam satu tempat, bukan
            sekadar aplikasi catatan, melainkan asisten digital untuk Ketua Kelas.
          </p>
        </div>
      </RevealSection>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-14 sm:px-6">
        <Reveal className="mb-14 rounded-lg border border-border bg-card p-8 text-center shadow-sm">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Target className="h-6 w-6" />
          </span>
          <h2 className="text-xl font-semibold text-foreground">Misi Kami</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Memberdayakan Ketua Kelas mahasiswa Indonesia dengan alat digital yang sederhana
            namun andal, sehingga mereka bisa fokus memimpin, bukan sekadar mengingatkan.
          </p>
        </Reveal>

        <RevealSection className="mb-14">
          <h2 className="mb-6 text-lg font-semibold text-foreground">Apa yang Kami Bangun</h2>
          <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <StaggerItem
                key={feature.title}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="rounded-lg border border-border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <span className={`mb-4 flex h-11 w-11 items-center justify-center rounded-lg ${feature.bg} ${feature.color}`}>
                  <feature.icon className="h-5 w-5" />
                </span>
                <h3 className="text-sm font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.desc}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </RevealSection>

        <RevealSection className="mb-14">
          <h2 className="mb-6 text-lg font-semibold text-foreground">Nilai yang Kami Pegang</h2>
          <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {VALUES.map((value) => (
              <StaggerItem
                key={value.title}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="rounded-lg border border-border bg-background p-6"
              >
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <value.icon className="h-5 w-5" />
                </span>
                <h3 className="text-sm font-semibold text-foreground">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{value.desc}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </RevealSection>

        <RevealSection className="rounded-lg border border-primary/20 bg-primary/5 p-8 text-center">
          <h2 className="text-xl font-semibold text-foreground">Siap membuat kelas lebih teratur?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Buat akun Ruang Ketua dan rasakan perbedaannya dalam mengelola kelas.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Daftar
            </Link>
          </div>
        </RevealSection>
      </main>

      <SiteFooter />
    </div>
  );
}
