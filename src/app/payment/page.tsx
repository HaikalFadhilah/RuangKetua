"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Headphones,
  Loader2,
  QrCode,
  ReceiptText,
  ShieldCheck,
  Smartphone,
  Ticket,
  X,
} from "lucide-react";
import QRCode from "qrcode";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RuangKetuaLogo } from "@/components/ui/ruang-ketua-logo";
import { cn } from "@/lib/utils";

const CHECKOUT_STEPS = [
  "Scan QRIS dari aplikasi pembayaran.",
  "Selesaikan pembayaran sesuai nominal.",
  "Dashboard aktif otomatis setelah terverifikasi.",
];

function formatCurrency(value: number) {
  return value.toLocaleString("id-ID");
}

function formatExpiry(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const plan = searchParams.get("plan");
  const basicOrderId = searchParams.get("order");

  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<{ plan: string; name: string; amount: number } | null>(null);
  const [voucherCode, setVoucherCode] = useState("");
  const [activeVoucher, setActiveVoucher] = useState<{ code: string; type: string; value: number } | null>(null);
  const [checkingVoucher, setCheckingVoucher] = useState(false);
  const [qrData, setQrData] = useState<{ qrString: string; amount: number; totalPayment?: number; expiredAt: string | null; orderId: string } | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    if (!plan) {
      router.replace("/");
      return;
    }

    fetch(`/api/payment/detail?plan=${plan}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setDetails(data.data);
        } else {
          toast.error(data.error || "Gagal mengambil data paket");
          router.replace("/");
        }
      })
      .catch(() => toast.error("Koneksi gagal"))
      .finally(() => setLoading(false));
  }, [plan, router]);

  const applyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setCheckingVoucher(true);
    try {
      const response = await fetch("/api/payment/voucher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: voucherCode, plan }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Voucher berhasil digunakan!");
        setActiveVoucher({ code: data.data.code, type: data.data.discountType, value: data.data.discountValue });
        setQrData(null);
      } else {
        toast.error(data.error || "Voucher tidak valid");
        setActiveVoucher(null);
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setCheckingVoucher(false);
    }
  };

  const removeVoucher = () => {
    setActiveVoucher(null);
    setVoucherCode("");
    setQrData(null);
  };

  let finalAmount = details?.amount || 0;
  let discountAmount = 0;
  if (activeVoucher && details) {
    if (activeVoucher.type === "percent") {
      discountAmount = Math.floor((finalAmount * activeVoucher.value) / 100);
      finalAmount -= discountAmount;
    } else if (activeVoucher.type === "fixed") {
      discountAmount = activeVoucher.value;
      finalAmount -= activeVoucher.value;
      if (finalAmount < 0) finalAmount = 0;
    }
  }

  const isFree = finalAmount <= 0;

  const activateFree = async () => {
    if (!details || paid) return;
    setActivating(true);
    try {
      const response = await fetch("/api/payment/free", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, voucherCode: activeVoucher?.code }),
      });
      const data = await response.json();
      if (data.success) {
        setPaid(true);
        setTimeout(() => router.push(data.data?.redirect || "/dashboard?payment=success"), 1500);
      } else {
        toast.error(data.error || "Gagal mengaktifkan langganan gratis");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setActivating(false);
    }
  };

  const generatePayment = async () => {
    if (!details || paid || finalAmount <= 0) return;
    try {
      const currentOrderId = basicOrderId || `RK-${plan?.toUpperCase()}-${Date.now().toString(36)}`;
      const finalOrderId = activeVoucher ? `${currentOrderId}-V` : currentOrderId;

      const response = await fetch("/api/payment/qris", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: finalOrderId, amount: finalAmount, plan, voucherCode: activeVoucher?.code }),
      });
      const data = await response.json();
      if (data.success) {
        setQrData(data.data);
      } else {
        toast.error(data.error || "Gagal menghubungkan ke gateway pembayaran");
      }
    } catch {
      toast.error("Server tidak dapat dihubungi. Silakan coba lagi nanti.");
    }
  };

  useEffect(() => {
    if (details && !paid && !isFree) generatePayment();
  }, [details, paid, activeVoucher]);

  useEffect(() => {
    if (qrData?.qrString) {
      QRCode.toDataURL(qrData.qrString, { width: 320, margin: 2, errorCorrectionLevel: "M" })
        .then(setQrImage)
        .catch(() => setQrImage(null));
    } else {
      setQrImage(null);
    }
  }, [qrData]);

  useEffect(() => {
    if (!qrData?.orderId) return;
    let active = true;
    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/payment/status?order_id=${encodeURIComponent(qrData.orderId)}&amount=${qrData.amount}`
        );
        const data = await response.json();
        if (active && data.success && data.data?.status === "completed") {
          setPaid(true);
          clearInterval(interval);

          try {
            const activateResponse = await fetch("/api/payment/activate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ plan, orderId: qrData.orderId, amount: qrData.amount, voucherCode: activeVoucher?.code }),
            });
            const activateData = await activateResponse.json();
            if (activateData.success && activateData.data?.redirect) {
              setTimeout(() => router.push(activateData.data.redirect), 2500);
              return;
            }
          } catch {}

          const destination = data.data?.role === "admin" ? "/rk-dashboard?payment=success" : "/dashboard?payment=success";
          setTimeout(() => router.push(destination), 2500);
        }
      } catch {}
    }, 3000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [qrData, router, plan, activeVoucher?.code]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#08080c] text-white/55">
        <RuangKetuaLogo size={44} />
        <Loader2 className="h-6 w-6 animate-spin text-[#a8b0ff]" />
        <p className="text-sm">Menyiapkan pesanan kamu...</p>
      </div>
    );
  }

  if (!details) return null;

  const displayTotal = Number(qrData?.totalPayment ?? qrData?.amount ?? finalAmount);
  const expiryLabel = formatExpiry(qrData?.expiredAt);

  return (
    <main className="min-h-screen bg-[#08080c] text-white">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "linear-gradient(to bottom, black, transparent 82%)",
          WebkitMaskImage: "linear-gradient(to bottom, black, transparent 82%)",
        }}
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-5 sm:px-8 lg:px-10">
        <header className="flex h-14 items-center justify-between border-b border-white/[0.07]">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm font-medium text-white/45 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </button>
          <div className="flex min-w-0 items-center gap-3">
            <RuangKetuaLogo size={32} />
            <span className="whitespace-nowrap text-sm font-bold leading-none text-white">Ruang Ketua</span>
          </div>
        </header>

        <section className="grid flex-1 gap-6 py-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start lg:py-10">
          <motion.aside
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-white/[0.08] bg-white/[0.035] p-5 shadow-2xl shadow-black/20 sm:p-6"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] pb-5">
              <div>
                <div className="inline-flex items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.035] px-3 py-1.5 text-xs font-medium text-white/50">
                  <ReceiptText className="h-3.5 w-3.5 text-[#a8b0ff]" />
                  Checkout langganan
                </div>
                <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-normal text-white sm:text-4xl">
                  Selesaikan pembayaran.
                </h1>
                <p className="mt-3 text-sm leading-7 text-white/48">
                  Setelah pembayaran terkonfirmasi, akses dashboard Ruang Ketua akan aktif otomatis.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-md border border-white/[0.07] bg-[#0d0d13] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase text-white/32">Paket</p>
                    <p className="mt-1 text-lg font-semibold text-white">{details.name}</p>
                  </div>
                  <Badge className="border-[#a8b0ff]/20 bg-[#a8b0ff]/10 text-[#d8dcff]">Premium</Badge>
                </div>
              </div>

              <div className="space-y-3 rounded-md border border-white/[0.07] bg-[#0d0d13] p-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/42">Harga dasar</span>
                  <span className="font-medium text-white">Rp {formatCurrency(details.amount)}</span>
                </div>
                {activeVoucher && (
                  <div className="flex items-center justify-between gap-4 text-emerald-200">
                    <span>Diskon voucher</span>
                    <span>- Rp {formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="border-t border-white/[0.07] pt-3">
                  <div className="flex items-end justify-between gap-4">
                    <span className="pb-1 font-semibold text-white">Total</span>
                    <span className="text-3xl font-semibold leading-none tracking-normal text-white">
                      Rp {formatCurrency(finalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-white/[0.07] bg-[#0d0d13] p-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Ticket className="h-4 w-4 text-amber-300" />
                  Kode voucher
                </label>
                {activeVoucher ? (
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
                      <span className="truncate text-sm font-medium text-emerald-100">{activeVoucher.code} aktif</span>
                    </div>
                    <button
                      type="button"
                      onClick={removeVoucher}
                      aria-label="Hapus voucher"
                      title="Hapus voucher"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-emerald-100/70 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <Input
                      placeholder="Masukkan kode"
                      value={voucherCode}
                      onChange={(event) => setVoucherCode(event.target.value.toUpperCase())}
                      className="h-11 rounded-md border-white/10 bg-white/[0.03] text-white placeholder:text-white/28"
                    />
                    <Button
                      type="button"
                      onClick={applyVoucher}
                      disabled={checkingVoucher || !voucherCode.trim()}
                      variant="outline"
                      className="h-11 rounded-md border-white/10 bg-white/[0.03] px-4 text-white hover:bg-white/[0.07] hover:text-white"
                    >
                      {checkingVoucher ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gunakan"}
                    </Button>
                  </div>
                )}
              </div>

              {activeVoucher && isFree ? (
                <Button type="button" onClick={activateFree} size="lg" className="h-11 w-full rounded-md" disabled={activating}>
                  {activating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Aktifkan gratis
                </Button>
              ) : activeVoucher ? (
                <Button type="button" onClick={generatePayment} size="lg" className="h-11 w-full rounded-md">
                  Perbarui QRIS
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : null}

              <div className="grid gap-2 rounded-md border border-emerald-400/15 bg-emerald-400/[0.055] p-4 text-sm text-emerald-100/80">
                <div className="flex items-center gap-2 font-medium text-emerald-100">
                  <ShieldCheck className="h-4 w-4" />
                  Pembayaran aman
                </div>
                <p className="leading-6">Transaksi diproses melalui gateway pembayaran dan diverifikasi otomatis oleh sistem.</p>
              </div>
            </div>
          </motion.aside>

          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-lg border border-white/[0.08] bg-[#0b0b10] p-5 shadow-2xl shadow-black/20 sm:p-6"
          >
            <div className="flex flex-col gap-4 border-b border-white/[0.07] pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <QrCode className="h-4 w-4 text-[#a8b0ff]" />
                  Pembayaran QRIS
                </div>
                <p className="mt-2 max-w-lg text-sm leading-6 text-white/42">
                  Gunakan e-wallet atau mobile banking yang mendukung QRIS. Halaman ini akan mengecek status pembayaran secara berkala.
                </p>
              </div>
              <Badge
                className={cn(
                  "w-fit",
                  paid
                    ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                    : "border-amber-400/20 bg-amber-400/10 text-amber-200"
                )}
              >
                {paid ? "Berhasil" : isFree ? "Gratis" : "Menunggu"}
              </Badge>
            </div>

            <div className="grid min-h-[520px] items-center gap-8 py-8 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="flex flex-col items-center justify-center">
                {isFree ? (
                  <div className="text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-lg border border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-200">
                      <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <h2 className="mt-5 text-2xl font-semibold text-white">Total sudah Rp 0</h2>
                    <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-white/45">
                      Voucher kamu membuat paket ini gratis. Klik tombol aktivasi di ringkasan pesanan untuk membuka dashboard.
                    </p>
                  </div>
                ) : !qrData ? (
                  <div className="text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-[#a8b0ff]">
                      <Loader2 className="h-9 w-9 animate-spin" />
                    </div>
                    <h2 className="mt-5 text-2xl font-semibold text-white">Membuat QRIS</h2>
                    <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-white/45">
                      Sistem sedang menyiapkan kode pembayaran sesuai paket dan voucher yang dipilih.
                    </p>
                  </div>
                ) : paid ? (
                  <div className="text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-lg border border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-200">
                      <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <h2 className="mt-5 text-2xl font-semibold text-white">Pembayaran berhasil</h2>
                    <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-white/45">
                      Langganan aktif. Kamu akan diarahkan ke dashboard dalam beberapa detik.
                    </p>
                    <Loader2 className="mx-auto mt-5 h-5 w-5 animate-spin text-white/35" />
                  </div>
                ) : (
                  <div className="w-full max-w-[330px]">
                    <div className="rounded-lg border border-white/[0.08] bg-white p-4 shadow-sm">
                      {qrImage ? (
                        <img src={qrImage} alt="Kode QRIS pembayaran Ruang Ketua" className="aspect-square w-full rounded-md" />
                      ) : (
                        <div className="flex aspect-square w-full items-center justify-center rounded-md bg-slate-100">
                          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                        </div>
                      )}
                    </div>
                    <div className="mt-4 text-center">
                      <p className="text-xs uppercase text-white/30">Nominal transfer</p>
                      <p className="mt-1 text-3xl font-semibold text-white">Rp {formatCurrency(displayTotal)}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border border-white/[0.07] bg-[#0f0f15] p-4">
                  <div className="grid gap-3 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-white/42">Order ID</span>
                      <span className="truncate text-right font-mono text-xs text-white/70">{qrData?.orderId || basicOrderId || "-"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-white/42">Metode</span>
                      <span className="font-medium text-white">QRIS</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-white/42">Kedaluwarsa</span>
                      <span className="font-medium text-white">{expiryLabel || "Mengikuti gateway"}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-white/[0.07] bg-[#0f0f15] p-4">
                  <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                    <Smartphone className="h-4 w-4 text-[#a8b0ff]" />
                    Cara bayar
                  </div>
                  <div className="grid gap-3">
                    {CHECKOUT_STEPS.map((step, index) => (
                      <div key={step} className="flex gap-3 text-sm leading-6 text-white/55">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.035] text-xs font-semibold text-white/55">
                          {index + 1}
                        </span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-white/[0.07] bg-[#0f0f15] p-4">
                  <div className="flex items-start gap-3">
                    <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
                    <p className="text-sm leading-6 text-white/48">
                      Jangan tutup halaman ini sampai status berhasil. Kalau sudah bayar tapi belum aktif, tunggu beberapa detik atau hubungi admin.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/[0.07] pt-5 text-sm text-white/40 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Headphones className="h-4 w-4 text-white/35" />
                Butuh bantuan? Hubungi admin Ruang Ketua.
              </div>
              {!isFree && qrData && !paid && (
                <button type="button" onClick={() => setQrData(null)} className="text-left font-medium text-white/55 transition-colors hover:text-white sm:text-right">
                  Batalkan QR saat ini
                </button>
              )}
            </div>
          </motion.section>
        </section>
      </div>
    </main>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-[#08080c]">
          <Loader2 className="h-6 w-6 animate-spin text-white/45" />
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
