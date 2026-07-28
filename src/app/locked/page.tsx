"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { LockKeyhole, CreditCard, Check, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RuangKetuaLogo } from "@/components/ui/ruang-ketua-logo";

const PLANS = [
  { key: "monthly", name: "Bulanan", tagline: "Fleksibel, bayar per bulan", defaultPrice: 29000, period: "per bulan", highlight: false },
  { key: "halfyear", name: "6 Bulan", tagline: "Hemat lebih banyak, tenang lebih lama", defaultPrice: 149000, period: "per 6 bulan", highlight: true },
  { key: "yearly", name: "Tahunan", tagline: "Nilai terbaik untuk satu tahun penuh", defaultPrice: 269000, period: "per tahun", highlight: false },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 12 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] } },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

export default function LockedPage() {
  const [prices, setPrices] = useState<{ priceMonthly: number; priceHalfYear: number; priceYearly: number } | null>(null);
  const [adminWa, setAdminWa] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/public/pricing")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          setPrices({
            priceMonthly: d.data.priceMonthly,
            priceHalfYear: d.data.priceHalfYear,
            priceYearly: d.data.priceYearly,
          });
        }
      })
      .catch(() => {});

    fetch("/api/public/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data?.adminWhatsapp) setAdminWa(d.data.adminWhatsapp);
      })
      .catch(() => {});
  }, []);

  const priceFor = (key: string) => {
    if (!prices) return null;
    if (key === "monthly") return prices.priceMonthly;
    if (key === "halfyear") return prices.priceHalfYear;
    return prices.priceYearly;
  };

  return (
    <div className="relative isolate min-h-screen flex flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Decorative mesh background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.08] via-background to-background" />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[760px] h-[480px] rounded-full bg-primary/25 blur-[140px]" />
        <div className="absolute bottom-[8%] -right-24 w-[460px] h-[460px] rounded-full bg-violet-500/20 blur-[140px]" />
        <div className="absolute top-[38%] -left-24 w-[420px] h-[420px] rounded-full bg-fuchsia-500/15 blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse 90% 70% at 50% 30%, black, transparent)",
            WebkitMaskImage: "radial-gradient(ellipse 90% 70% at 50% 30%, black, transparent)",
          }}
        />
      </div>

      <motion.div
        initial="hidden"
        animate="show"
        variants={stagger}
        className="w-full max-w-4xl"
      >
        {/* Brand */}
        <motion.div variants={fadeUp} className="flex items-center justify-center gap-2 mb-10">
            <RuangKetuaLogo size={44} />
          <span className="text-lg font-bold tracking-tight">Ruang Ketua</span>
        </motion.div>

        {/* Header */}
        <motion.div variants={stagger} className="text-center mb-10">
          <motion.div
            variants={fadeUp}
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"
          >
            <LockKeyhole className="h-8 w-8" />
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-3xl font-bold tracking-tight text-foreground">
            Langganan Diperlukan
          </motion.h1>
          <motion.p variants={fadeUp} className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Aktifkan langganan Ruang Ketua untuk membuka kembali seluruh fitur kelas Anda.
            Pilih paket yang paling sesuai di bawah ini.
          </motion.p>
        </motion.div>

        {/* Plans */}
        <motion.div variants={stagger} className="grid gap-5 sm:grid-cols-3">
          {PLANS.map((plan) => {
            const live = priceFor(plan.key);
            const price = live ?? plan.defaultPrice;
            return (
              <motion.div key={plan.key} variants={scaleIn}>
                <Card
                  className={`relative flex flex-col overflow-hidden h-full ${
                    plan.highlight ? "border-primary ring-1 ring-primary shadow-xl shadow-primary/10" : ""
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute right-4 top-4">
                      <Badge variant="default" className="gap-1">
                        <Sparkles className="h-3 w-3" />
                        Paling Hemat
                      </Badge>
                    </div>
                  )}

                  <CardContent className="flex flex-1 flex-col p-6">
                    <h3 className="text-base font-semibold text-foreground">{plan.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{plan.tagline}</p>

                    <div className="mt-5 flex items-end gap-1">
                      <span className="text-xs text-muted-foreground">Rp</span>
                      {prices === null ? (
                        <span className="inline-block h-8 w-28 animate-pulse rounded-md bg-muted" />
                      ) : (
                        <span className="text-3xl font-extrabold tracking-tight text-foreground">
                          {price.toLocaleString("id-ID")}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{plan.period}</p>

                    <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      Akses penuh semua fitur
                    </div>

                    <Button
                      asChild
                      variant={plan.highlight ? "default" : "outline"}
                      className="mt-6 w-full"
                    >
                      <Link href={`/payment?plan=${plan.key}`}>
                        <CreditCard className="h-4 w-4" />
                        Pilih Paket
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.p variants={fadeUp} className="mt-8 text-center text-xs text-muted-foreground">
          {adminWa ? (
            <>
              Butuh bantuan? Hubungi{" "}
              <a
                href={`https://wa.me/${adminWa}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                Admin Ruang Ketua
              </a>{" "}
              via WhatsApp.
            </>
          ) : (
            "Butuh bantuan? Hubungi admin Ruang Ketua."
          )}
        </motion.p>
      </motion.div>
    </div>
  );
}
