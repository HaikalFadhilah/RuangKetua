import Link from "next/link";
import { ArrowLeft, Mail, Briefcase, UserRound, MessageCircle, AtSign, PlayCircle, Clock } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ContactForm } from "@/components/contact/contact-form";

export const metadata = {
  title: "Kontak - Ruang Ketua",
  description: "Hubungi tim Ruang Ketua untuk pertanyaan, bantuan, atau kerja sama.",
};

const CONTACTS = [
  { icon: Mail, label: "Dukungan Umum", value: "halo@ruangketua.id", color: "text-blue-500", bg: "bg-blue-500/10" },
  { icon: Briefcase, label: "Kerja Sama", value: "partnership@ruangketua.id", color: "text-violet-500", bg: "bg-violet-500/10" },
  { icon: UserRound, label: "Karir", value: "karir@ruangketua.id", color: "text-green-500", bg: "bg-green-500/10" },
];

const SOCIALS = [
  { icon: AtSign, label: "Instagram", handle: "@ruangketua" },
  { icon: PlayCircle, label: "YouTube", handle: "Ruang Ketua" },
  { icon: MessageCircle, label: "WhatsApp", handle: "Broadcast Grup" },
];

export default function KontakPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border pt-28 pb-14">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Beranda
          </Link>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">Kontak</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Hubungi Tim Ruang Ketua
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Punya pertanyaan, masukan, atau ingin bekerja sama? Tim kami siap membantu Anda.
          </p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left: contacts + social */}
          <div className="space-y-8">
            <div className="space-y-3">
              {CONTACTS.map((c) => (
                <a
                  key={c.value}
                  href={`mailto:${c.value}`}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${c.bg} ${c.color}`}>
                    <c.icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                    <p className="truncate text-sm font-medium text-foreground">{c.value}</p>
                  </div>
                </a>
              ))}
            </div>

            <div className="rounded-2xl border border-border bg-background p-6">
              <h2 className="text-sm font-semibold text-foreground">Media Sosial</h2>
              <div className="mt-4 space-y-2">
                {SOCIALS.map((s) => (
                  <div key={s.label} className="flex items-center gap-3 text-sm">
                    <s.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{s.label}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{s.handle}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-border bg-primary/5 p-5">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Waktu Respons</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Kami berusaha merespons setiap pesan dalam waktu maksimal dua hari kerja.
                </p>
              </div>
            </div>
          </div>

          {/* Right: form */}
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-foreground">Kirim Pesan</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Isi form berikut dan kami akan menerima pesan langsung di email kami.
            </p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
