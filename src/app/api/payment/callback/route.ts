import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const PAKASIR_BASE = "https://app.pakasir.com";

// ── Webhook dari Pakasir (POST) ──────────────────────────────────────────────
// Pakasir mengirim body JSON: { amount, order_id, project, status, payment_method, completed_at }
// Tidak ada signature/HMAC — verifikasi dilakukan via Transaction Detail API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, status, amount } = body;

    if (!order_id || !status) {
      return NextResponse.json({ success: false, error: "Payload tidak valid" }, { status: 400 });
    }

    // Hanya proses jika status "completed"
    if (status !== "completed") {
      console.log(`Pakasir webhook: order ${order_id} status=${status}, diabaikan.`);
      return NextResponse.json({ success: true, message: "Acknowledged" });
    }

    // ── Ambil settings ──────────────────────────────────────────────────────
    const settings = await prisma.systemSettings.findFirst();
    if (!settings?.pakasirApiKey || !settings?.pakasirSlug) {
      console.warn("Pakasir webhook: konfigurasi belum lengkap");
      return NextResponse.json({ success: false, error: "Konfigurasi Pakasir belum lengkap" }, { status: 500 });
    }

    // ── Verifikasi transaki via Transaction Detail API ──────────────────────
    // Lebih aman daripada percaya payload mentah dari webhook
    const verifyUrl =
      `${PAKASIR_BASE}/api/transactiondetail` +
      `?project=${encodeURIComponent(settings.pakasirSlug)}` +
      `&amount=${amount}` +
      `&order_id=${encodeURIComponent(order_id)}` +
      `&api_key=${encodeURIComponent(settings.pakasirApiKey)}`;

    const verifyRes = await fetch(verifyUrl);
    if (!verifyRes.ok) {
      console.error("Pakasir verify: HTTP error", verifyRes.status);
      return NextResponse.json({ success: false, error: "Gagal verifikasi transaksi" }, { status: 502 });
    }

    const verifyData = await verifyRes.json();
    const txn = verifyData?.transaction;

    if (!txn || txn.status !== "completed") {
      console.warn(`Pakasir verify: transaksi ${order_id} tidak confirmed (status: ${txn?.status})`);
      return NextResponse.json({ success: false, error: "Transaksi belum selesai" }, { status: 400 });
    }

    // ── Parse order ID untuk dapatkan userId & plan ─────────────────────────
    // Format: RK-{PLAN}-{userId8}-{timestamp}-{hex}
    // Contoh: RK-MONTHLY-cm1abc12-1720000000000-A1B2C3
    const parts = order_id.split("-");
    // parts[0]=RK, parts[1]=PLAN, parts[2]=userId8, parts[3]=timestamp, parts[4]=hex
    if (parts.length < 5 || parts[0] !== "RK") {
      console.error("Pakasir webhook: format order_id tidak dikenali:", order_id);
      return NextResponse.json({ success: false, error: "Format order_id tidak valid" }, { status: 400 });
    }

    const planKey = parts[1].toLowerCase(); // "monthly" | "halfyear" | "yearly"
    const userIdPrefix = parts[2];           // 8 karakter pertama userId

    const DURATION_MAP: Record<string, number> = {
      monthly: 1, halfyear: 6, yearly: 12,
    };
    const durationMonths = DURATION_MAP[planKey] ?? 1;

    // Idempoten: jangan proses dua kali order yang sama (mis. webhook
    // terpicu berkali-kali atau aktivasi juga dilakukan dari sisi klien).
    const existing = await prisma.activityLog.findFirst({
      where: { entityId: order_id, action: "PAYMENT_SUCCESS" },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ success: true, message: "Order sudah diproses" });
    }

    // Cari user berdasarkan prefix ID (cuid dimulai dengan cm...)
    const user = await prisma.user.findFirst({
      where: { id: { startsWith: userIdPrefix } },
      select: { id: true, name: true, subscriptionEnd: true },
    });

    if (!user) {
      console.error("Pakasir webhook: user tidak ditemukan untuk prefix:", userIdPrefix);
      // Tetap balas 200 agar Pakasir tidak retry terus
      return NextResponse.json({ success: true, message: "User tidak ditemukan, log diabaikan" });
    }

    // ── Catat pemakaian voucher (jika order berakhiran -V) ──
    if (parts[parts.length - 1] === "V" && parts.length >= 6) {
      const code = parts[parts.length - 2];
      const voucher = await prisma.voucher.findUnique({ where: { code } });
      if (voucher) {
        const alreadyRedeemed = await prisma.voucherRedemption.findUnique({
          where: { voucherId_userId: { voucherId: voucher.id, userId: user.id } },
          select: { id: true },
        });
        if (!alreadyRedeemed) {
          await prisma.voucherRedemption.create({ data: { voucherId: voucher.id, userId: user.id } });
          await prisma.voucher.update({
            where: { id: voucher.id },
            data: { usedCount: { increment: 1 } },
          });
        }
      }
    }

    // Hitung expiry
    // ── Logika Penjumlahan Masa Aktif ──
    // Bila saat ini dia memiliki masa aktif (subscriptionEnd masih di masa depan), tambahkan dari tanggal tersebut!
    // Kalau sudah mati (expired) atau baru daftar, tambahkan dari tanggal HARI INI
    const now = new Date();
    const startDate = (user.subscriptionEnd && user.subscriptionEnd > now) ? new Date(user.subscriptionEnd) : now;
    
    // Karena kita tidak memberikan trial, plan baru akan ditambahkan
    const expiresAt = new Date(startDate);
    expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

    // Update profil user menaruh status plan tersebut
    await prisma.user.update({
       where: { id: user.id },
       data: {
          subscriptionPlan: planKey,
          subscriptionEnd: expiresAt,
       }
    });

    // Catat ke ActivityLog
    await prisma.activityLog.create({
      data: {
        userId:      user.id,
        action:      "PAYMENT_SUCCESS",
        entity:      "subscription",
        entityId:    order_id,
        description: `Pembayaran berhasil via Pakasir: Paket ${planKey} (${durationMonths} bulan). Berlaku hingga ${expiresAt.toLocaleDateString("id-ID")}. Order: ${order_id}`,
        metadata:    JSON.stringify({ order_id, plan: planKey, amount, durationMonths, expiresAt, payment_method: txn.payment_method }),
      },
    });

    console.log(`Pakasir webhook sukses: userId=${user.id}, plan=${planKey}, expiresAt=${expiresAt.toISOString()}`);
    return NextResponse.json({ success: true, message: "Pembayaran dicatat" });

  } catch (error) {
    console.error("POST /api/payment/callback error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// ── GET: redirect dari halaman Pakasir setelah user selesai bayar ────────────
// Pakasir akan redirect ke URL yang kita set di ?redirect=...
// Kita sudah set redirect ke /dashboard?payment=success&... langsung
// Tapi jaga-jaga jika ada yang hit endpoint ini lewat custom redirect
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const order_id = searchParams.get("order_id") || "";

  return NextResponse.redirect(
    new URL(`/dashboard?payment=success&order=${encodeURIComponent(order_id)}`, request.url)
  );
}
