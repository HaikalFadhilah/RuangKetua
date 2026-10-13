"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CreditCard,
  Headphones,
  LockKeyhole,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RuangKetuaLogo } from "@/components/ui/ruang-ketua-logo";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    key: "monthly",
    name: "Bulanan",
    tagline: "Cocok untuk mulai rapi tanpa komitmen panjang.",
    defaultPrice: 29000,
    period: "per bulan",
    highlight: false,
    benefits: ["Akses semua modul", "Reminder otomatis", "Dukungan WhatsApp"],
  },
  {
    key: "halfyear",
    name: "6 Bulan",
    tagline: "Lebih hemat untuk satu semester penuh.",
    defaultPrice: 149000,
    period: "per 6 bulan",
    highlight: true,
    benefits: ["Semua fitur aktif", "Prioritas update", "Nilai terbaik semester"],
  },
  {
    key: "yearly",
    name: "Tahunan",
    tagline: "Tenang dipakai sepanjang tahun akademik.",
    defaultPrice: 269000,
    period: "per tahun",
    highlight: false,
    benefits: ["Akses 12 bulan", "Cocok untuk organisasi", "Setup kelas lengkap"],
  },
];

const ACCESS_ITEMS = [
  { icon: ShieldCheck, label: "Data kelas tetap aman", value: "Tersimpan" },
  { icon: BadgeCheck, label: "Status akun", value: "Butuh aktivasi" },
  { icon: MessageCircle, label: "Bantuan admin", value: "Tersedia" },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] } },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};

function formatRupiah(value: number) {
  return value.toLocaleString("id-ID");
}

export default function LockedPage() {
  const [prices, setPrices] = useState<{ priceMonthly: number; priceHalfYear: number; priceYearly: number } | null>(null);
  const [adminWa, setAdminWa] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/public/pricing")
      .then((response) => response.json())
      .then((data) => {
        if (data.success && data.data) {
          setPrices({
            priceMonthly: data.data.priceMonthly,
            priceHalfYear: data.data.priceHalfYear,
            priceYearly: data.data.priceYearly,
          });
        }
      })
      .catch(() => {});

    fetch("/api/public/settings")
      .then((response) => response.json())
      .then((data) => {
        if (data.success && data.data?.adminWhatsapp) {
          setAdminWa(String(data.data.adminWhatsapp).replace(/\D/g, ""));
        }
      })
      .catch(() => {});
  }, []);

  const priceFor = (key: string, fallback: number) => {
    if (key === "monthly") return prices?.priceMonthly ?? fallback;
    if (key === "halfyear") return prices?.priceHalfYear ?? fallback;
    return prices?.priceYearly ?? fallback;
  };

  return (
    <main className="min-h-screen bg-[#08080c] text-white">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "linear-gradient(to bottom, black, transparent 78%)",
          WebkitMaskImage: "linear-gradient(to bottom, black, transparent 78%)",
        }}
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-5 sm:px-8 lg:px-10">
        <header className="flex h-14 items-center justify-between border-b border-white/[0.07]">
          <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Ruang Ketua">
            <RuangKetuaLogo size={32} />
            <span className="whitespace-nowrap text-sm font-bold leading-none text-white">Ruang Ketua</span>
          </Link>
          <Link href="/" className="text-sm font-medium text-white/45 transition-colors hover:text-white">
            Beranda
          </Link>
        </header>

        <motion.section
          initial="hidden"
          animate="show"
          variants={stagger}
          className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.03fr_0.97fr] lg:gap-16 lg:py-16"
        >
          <div>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/55">
              <LockKeyhole className="h-3.5 w-3.5 text-[#a8b0ff]" />
              Akses workspace sedang terkunci
            </motion.div>

            <motion.h1 variants={fadeUp} className="mt-7 max-w-2xl text-4xl font-semibold leading-[1.05] tracking-normal text-white sm:text-5xl lg:text-6xl">
              Aktifkan paket untuk lanjut mengelola kelas.
            </motion.h1>

            <motion.p variants={fadeUp} className="mt-5 max-w-xl text-base leading-8 text-white/50 sm:text-lg">
              Akun kamu sudah tersimpan. Pilih paket langganan untuk membuka kembali dashboard, tugas, kalender, file, AI, dan broadcast WhatsApp.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-11 rounded-md px-5">
                <a href="#paket">
                  Pilih paket
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              {adminWa ? (
                <Button asChild variant="outline" size="lg" className="h-11 rounded-md border-white/10 bg-white/[0.02] px-5 text-white hover:bg-white/[0.06] hover:text-white">
                  <a href={`https://wa.me/${adminWa}`} target="_blank" rel="noopener noreferrer">
                    <Headphones className="h-4 w-4" />
                    Hubungi admin
                  </a>
                </Button>
              ) : (
                <Button variant="outline" size="lg" className="h-11 rounded-md border-white/10 bg-white/[0.02] px-5 text-white hover:bg-white/[0.06] hover:text-white">
                  <Headphones className="h-4 w-4" />
                  Bantuan tersedia
                </Button>
              )}
            </motion.div>
          </div>

          <motion.div variants={fadeUp} className="rounded-lg border border-white/[0.08] bg-white/[0.035] p-5 shadow-2xl shadow-black/20 sm:p-6">
            <div className="flex items-start justify-between gap-5 border-b border-white/[0.07] pb-5">
              <div>
                <p className="text-sm font-semibold text-white">Ringkasan akses</p>
                <p className="mt-1 text-sm leading-6 text-white/42">Pembayaran akan mengaktifkan workspace secara otomatis setelah status berhasil.</p>
              </div>
              <Badge className="shrink-0 border-amber-400/20 bg-amber-400/10 text-amber-200">Pending</Badge>
            </div>

            <div className="mt-5 grid gap-3">
              {ACCESS_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center justify-between gap-4 rounded-md border border-white/[0.06] bg-[#0d0d13] px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-[#a8b0ff]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="truncate text-sm text-white/68">{item.label}</span>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-white/42">{item.value}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 rounded-md border border-emerald-400/15 bg-emerald-400/[0.055] px-4 py-3 text-sm leading-6 text-emerald-100/80">
              Setelah paket aktif, kamu bisa langsung kembali ke dashboard tanpa setup ulang.
            </div>
          </motion.div>
        </motion.section>

        <motion.section
          id="paket"
          initial="hidden"
          animate="show"
          variants={stagger}
          className="border-t border-white/[0.07] py-10"
        >
          <motion.div variants={fadeUp} className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-white">Paket langganan</p>
              <p className="mt-1 text-sm text-white/42">Pilih durasi yang paling pas untuk ritme kelas kamu.</p>
            </div>
            <p className="text-xs text-white/30">Harga mengikuti pengaturan terbaru admin.</p>
          </motion.div>

          <div className="grid gap-4 lg:grid-cols-3">
            {PLANS.map((plan) => {
              const price = priceFor(plan.key, plan.defaultPrice);
              return (
                <motion.article
                  key={plan.key}
                  variants={fadeUp}
                  className={cn(
                    "relative flex min-h-[376px] flex-col overflow-hidden rounded-lg border bg-[#0b0b10] transition-colors",
                    plan.highlight
                      ? "border-[#a8b0ff]/35 bg-[#0f0f17]"
                      : "border-white/[0.08] hover:border-white/[0.16]"
                  )}
                >
                  <div className="border-b border-white/[0.07] px-5 pb-5 pt-5">
                    <div className="flex min-h-7 items-start justify-between gap-4">
                      <h2 className="text-lg font-semibold text-white">{plan.name}</h2>
                      {plan.highlight && (
                        <Badge className="gap-1 rounded-md border-[#a8b0ff]/20 bg-[#a8b0ff]/10 text-[#d8dcff]">
                          <Sparkles className="h-3 w-3" />
                          Rekomendasi
                        </Badge>
                      )}
                    </div>
                    <p className="mt-3 max-w-[260px] text-sm leading-6 text-white/50">{plan.tagline}</p>
                  </div>

                  <div className="px-5 py-5">
                    <div className="flex items-end gap-1.5">
                      <span className="pb-1 text-sm font-medium text-white/42">Rp</span>
                      <span className="text-4xl font-semibold leading-none tracking-normal text-white">{formatRupiah(price)}</span>
                    </div>
                    <p className="mt-2 text-sm text-white/42">{plan.period}</p>
                  </div>

                  <div className="grid gap-3 px-5 pb-6">
                    {plan.benefits.map((benefit) => (
                      <div key={benefit} className="flex items-center gap-2.5 text-sm text-white/62">
                        <Check className="h-4 w-4 shrink-0 text-emerald-300" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto border-t border-white/[0.07] p-5">
                    <Button
                      asChild
                      variant={plan.highlight ? "default" : "outline"}
                      className={cn(
                        "h-11 w-full rounded-md",
                        plan.highlight
                          ? "bg-white text-[#08080c] hover:bg-[#d8d2ff]"
                          : "border-white/10 bg-transparent text-white hover:bg-white/[0.06] hover:text-white"
                      )}
                    >
                      <Link href={`/payment?plan=${plan.key}`}>
                        <CreditCard className="h-4 w-4" />
                        Lanjut bayar
                      </Link>
                    </Button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </motion.section>
      </div>
    </main>
  );
}
