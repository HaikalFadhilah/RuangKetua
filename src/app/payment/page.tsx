"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CreditCard, CheckCircle2, Ticket, QrCode, ArrowLeft, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import QRCode from "qrcode";
import toast from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RuangKetuaLogo } from "@/components/ui/ruang-ketua-logo";

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const plan = searchParams.get("plan");
  const basicOrderId = searchParams.get("order");

  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<{ plan: string, name: string, amount: number } | null>(null);

  // Voucher
  const [voucherCode, setVoucherCode] = useState("");
  const [activeVoucher, setActiveVoucher] = useState<{ code: string, type: string, value: number } | null>(null);
  const [checkingVoucher, setCheckingVoucher] = useState(false);

  // Data QRIS dari Pakasir (string QRIS mentah + metadata)
  const [qrData, setQrData] = useState<{ qrString: string; amount: number; totalPayment?: number; expiredAt: string | null; orderId: string } | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [role, setRole] = useState<string>("user");
  const [generating, setGenerating] = useState(false);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    if (!plan) {
      router.replace("/");
      return;
    }

    fetch(`/api/payment/detail?plan=${plan}`)
      .then(res => res.json())
      .then(d => {
        if (d.success) {
          setDetails(d.data);
        } else {
          toast.error(d.error || "Gagal mengambil data paket");
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
      const res = await fetch("/api/payment/voucher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: voucherCode, plan }),
      });
      const d = await res.json();
      if (d.success) {
        toast.success("Voucher berhasil digunakan!");
        setActiveVoucher({ code: d.data.code, type: d.data.discountType, value: d.data.discountValue });
      } else {
        toast.error(d.error || "Voucher tidak valid");
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
  };

  // Kalkulasi Harga
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

  // Aktifkan langganan gratis (voucher membuat total Rp 0 -> tidak butuh QRIS)
  const activateFree = async () => {
    if (!details || paid) return;
    setActivating(true);
    try {
      const res = await fetch("/api/payment/free", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, voucherCode: activeVoucher?.code }),
      });
      const d = await res.json();
      if (d.success) {
        setPaid(true);
        setTimeout(() => router.push(d.data?.redirect || "/dashboard?payment=success"), 1500);
      } else {
        toast.error(d.error || "Gagal mengaktifkan langganan gratis");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setActivating(false);
    }
  };

  // Generate QR/Qris
  const generatePayment = async () => {
    if (!details || paid || finalAmount <= 0) return;
    setGenerating(true);
    try {
      const currentOrderId = basicOrderId || `RK-${plan?.toUpperCase()}-${Date.now().toString(36)}`;
      const finalOrderId = activeVoucher ? `${currentOrderId}-V` : currentOrderId;

      const res = await fetch("/api/payment/qris", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: finalOrderId, amount: finalAmount, plan, voucherCode: activeVoucher?.code }),
      });
      const d = await res.json();
      if (d.success) {
        setQrData(d.data);
      } else {
        toast.error(d.error || "Gagal menghubungkan ke gateway pembayaran");
      }
    } catch (err) {
      toast.error("Server tidak dapat dihubungi. Silakan coba lagi nanti.");
    } finally {
      setGenerating(false);
    }
  };

  // Tampilkan QRIS otomatis saat pesanan siap, dan perbarui otomatis
  // setiap kali voucher diubah agar total diskon langsung tercermin.
  useEffect(() => {
    if (details && !paid) generatePayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [details, paid]);

  useEffect(() => {
    if (qrData?.qrString) {
      QRCode.toDataURL(qrData.qrString, { width: 320, margin: 2, errorCorrectionLevel: "M" })
        .then(setQrImage)
        .catch(() => setQrImage(null));
    } else {
      setQrImage(null);
    }
  }, [qrData]);

  // Polling status pembayaran ke Pakasir setelah QR muncul
  useEffect(() => {
    if (!qrData?.orderId) return;
    let active = true;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/payment/status?order_id=${encodeURIComponent(qrData.orderId)}&amount=${qrData.amount}`
        );
        const d = await res.json();
        if (active && d.success && d.data?.status === "completed") {
          setPaid(true);
          if (d.data?.role) setRole(d.data.role);
          clearInterval(interval);

          // Aktifkan langganan secara langsung (terverifikasi ke Pakasir)
          // agar tidak bergantung pada webhook yang mungkin tidak menghitung
          // server kita. Tanpa ini, user akan dikembalikan ke /locked.
          try {
            const actRes = await fetch("/api/payment/activate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ plan, orderId: qrData.orderId, amount: qrData.amount, voucherCode: activeVoucher?.code }),
            });
            const actData = await actRes.json();
            if (actData.success && actData.data?.redirect) {
              setTimeout(() => router.push(actData.data.redirect), 2500);
              return;
            }
          } catch {
            /* fallback ke redirect default di bawah */
          }

          const dest = d.data?.role === "admin" ? "/rk-dashboard?payment=success" : "/dashboard?payment=success";
          setTimeout(() => router.push(dest), 2500);
        }
      } catch {
        /* ignore network blip */
      }
    }, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [qrData, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-background to-muted/40 text-muted-foreground">
        <RuangKetuaLogo size={44} />
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm">Menyiapkan pesanan Anda...</p>
      </div>
    );
  }

  if (!details) return null;

  const displayTotal = Number(qrData?.totalPayment ?? qrData?.amount ?? finalAmount);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali
          </button>
          <div className="flex items-center gap-2">
            <RuangKetuaLogo size={24} />
            <span className="text-sm font-bold tracking-tight">Ruang Ketua</span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 p-4 pb-12 pt-8 md:p-8 grid gap-6 md:grid-cols-5 md:items-start">
        {/* Sisi Kiri: Detail Pesanan */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 md:col-span-2">
          <Card>
            <CardContent className="p-7">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold leading-tight tracking-tight">Ringkasan Pesanan</h2>
                  <p className="text-sm text-muted-foreground">Paket Premium Ruang Ketua</p>
                </div>
              </div>

              <div className="space-y-3.5 border-b border-border pb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Pilihan Paket</span>
                  <span className="font-semibold">{details.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Harga Dasar</span>
                  <span className="font-medium">Rp {details.amount.toLocaleString("id-ID")}</span>
                </div>
                {activeVoucher && (
                  <div className="flex items-center justify-between text-sm text-emerald-600">
                    <span>Diskon ({activeVoucher.code})</span>
                    <span>- Rp {discountAmount.toLocaleString("id-ID")}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between rounded-xl bg-primary/5 px-4 py-4 mt-6">
                <span className="font-semibold">Total Pembayaran</span>
                <span className="text-2xl font-extrabold tracking-tight text-primary">Rp {finalAmount.toLocaleString("id-ID")}</span>
              </div>

              {/* Bagian Voucher */}
              <div className="pt-6">
                <label className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <Ticket className="h-4 w-4 text-orange-500" />
                  Punya Kode Voucher?
                </label>
                {activeVoucher ? (
                  <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm font-semibold">Voucher <b>{activeVoucher.code}</b> aktif</span>
                    </div>
                    <button onClick={removeVoucher} className="text-xs font-bold hover:underline">
                      Hapus
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Masukkan kode promo"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                      className="h-11"
                    />
                    <Button
                      onClick={applyVoucher}
                      disabled={checkingVoucher || !voucherCode.trim()}
                      variant="secondary"
                      className="h-11 px-6"
                    >
                      {checkingVoucher ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gunakan"}
                    </Button>
                  </div>
                )}
              </div>

              {activeVoucher && isFree ? (
                <div className="mt-6 border-t border-border pt-6">
                  <Button onClick={activateFree} size="lg" className="w-full" disabled={activating}>
                    {activating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Aktifkan Langsung (Gratis)
                  </Button>
                  <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
                    Voucher membuat total Rp 0. Klik untuk mengaktifkan langganan secara langsung tanpa pembayaran.
                  </p>
                </div>
              ) : activeVoucher && (
                <div className="mt-6 border-t border-border pt-6">
                  <Button onClick={generatePayment} size="lg" className="w-full">
                    Lanjutkan Pembayaran
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
                    Klik untuk memperbarui kode QRIS dengan total setelah diskon voucher.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-700">
            <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Pembayaran Anda diproses melalui sistem yang terenkripsi dan telah memenuhi standar keamanan industri. Mendukung metode QRIS untuk kenyamanan Anda.
            </p>
          </div>
        </motion.div>

        {/* Sisi Kanan: QR / Pembayaran */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="md:col-span-3">
          <Card className="overflow-hidden shadow-lg">
            <CardContent className="flex min-h-[480px] flex-col items-center justify-center p-8">
              {isFree ? (
                <div className="space-y-6 text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500/10">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="mb-2 text-2xl font-bold tracking-tight">Langganan Gratis!</h3>
                    <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
                      Voucher Anda membuat total pembayaran <b>Rp 0</b>. Tidak perlu scan QRIS — klik <b>Aktifkan Langsung</b> di samping untuk menikmati seluruh fitur Ruang Ketua.
                    </p>
                  </div>
                </div>
              ) : !qrData ? (
                <div className="space-y-7 text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  </div>
                  <div>
                    <h3 className="mb-2 text-2xl font-bold tracking-tight">Menyiapkan QRIS...</h3>
                    <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
                      Kode pembayaran sedang dibuat secara otomatis. Voucher yang Anda gunakan akan langsung tercermin pada total.
                    </p>
                  </div>
                </div>
              ) : paid ? (
                <div className="space-y-5 text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500/10">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight">Pembayaran Berhasil!</h3>
                  <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
                    Terima kasih. Langganan Anda telah aktif dan kami mengarahkan Anda ke dashboard.
                  </p>
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="flex w-full max-w-sm flex-col items-center space-y-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <QrCode className="h-4 w-4 text-primary" />
                    Scan QRIS untuk membayar
                  </div>

                  <div className="relative rounded-3xl border border-border bg-white p-5 shadow-sm">
                    <div className="absolute -left-1.5 -top-1.5 h-4 w-4 rounded-tl-2xl border-l-2 border-t-2 border-primary/40" />
                    <div className="absolute -right-1.5 -top-1.5 h-4 w-4 rounded-tr-2xl border-r-2 border-t-2 border-primary/40" />
                    <div className="absolute -bottom-1.5 -left-1.5 h-4 w-4 rounded-bl-2xl border-b-2 border-l-2 border-primary/40" />
                    <div className="absolute -bottom-1.5 -right-1.5 h-4 w-4 rounded-br-2xl border-b-2 border-r-2 border-primary/40" />
                    {qrImage ? (
                      <img src={qrImage} alt="QRIS" className="h-56 w-56" />
                    ) : (
                      <div className="flex h-56 w-56 items-center justify-center rounded-xl bg-muted">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="rounded-full bg-primary/10 px-5 py-2 text-lg font-bold text-primary">
                    Rp {displayTotal.toLocaleString("id-ID")}
                  </div>

                  <p className="text-center text-xs leading-relaxed text-muted-foreground">
                    Buka aplikasi e-wallet (GoPay, OVO, DANA, dll) atau mBanking, lalu scan QR di atas.
                    Halaman akan otomatis memperbarui setelah pembayaran terkonfirmasi.
                  </p>

                  <Button variant="ghost" size="sm" onClick={() => setQrData(null)}>
                    Batal
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
      <PaymentContent />
    </Suspense>
  );
}
