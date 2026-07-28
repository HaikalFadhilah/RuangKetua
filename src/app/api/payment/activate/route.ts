import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/api-utils";

const PAKASIR_BASE = "https://app.pakasir.com";

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const body = await request.json();
    const { plan, orderId, amount, voucherCode } = body;

    if (!plan || !orderId) {
      return NextResponse.json({ success: false, error: "Data pesanan tidak lengkap" }, { status: 400 });
    }

    const settings = await prisma.systemSettings.findFirst();
    if (!settings?.pakasirApiKey || !settings?.pakasirSlug) {
      return NextResponse.json({ success: false, error: "Konfigurasi Pakasir belum lengkap" }, { status: 500 });
    }

    // Verifikasi ke Pakasir bahwa transaksi ini benar-benar lunas.
    // Ini mencegah aktivasi gratis oleh panggilan palsu dari klien.
    const verifyUrl =
      `${PAKASIR_BASE}/api/transactiondetail` +
      `?project=${encodeURIComponent(settings.pakasirSlug)}` +
      `&amount=${encodeURIComponent(String(amount ?? ""))}` +
      `&order_id=${encodeURIComponent(orderId)}` +
      `&api_key=${encodeURIComponent(settings.pakasirApiKey)}`;

    const verifyRes = await fetch(verifyUrl);
    const verifyData = await verifyRes.json().catch(() => null);
    const txn = verifyData?.transaction;

    if (!txn || txn.status !== "completed") {
      return NextResponse.json(
        { success: false, error: "Pembayaran belum terkonfirmasi oleh gateway" },
        { status: 400 }
      );
    }

    const DURATION_MAP: Record<string, number> = { monthly: 1, halfyear: 6, yearly: 12 };
    const planKey = String(plan).toLowerCase();
    const durationMonths = DURATION_MAP[planKey] ?? 1;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, subscriptionPlan: true, subscriptionEnd: true },
    });
    if (!user) {
      return NextResponse.json({ success: false, error: "User tidak ditemukan" }, { status: 404 });
    }

    // Idempoten: jangan perpanjang dua kali untuk order yang sama.
    const existing = await prisma.activityLog.findFirst({
      where: { entityId: orderId, action: "PAYMENT_SUCCESS" },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({
        success: true,
        data: { redirect: user.role === "admin" ? "/rk-dashboard?payment=success" : "/dashboard?payment=success" },
      });
    }

    // Catat pemakaian voucher (batas per-orang & counter total) — idempoten.
    if (voucherCode) {
      const voucher = await prisma.voucher.findUnique({ where: { code: String(voucherCode).toUpperCase() } });
      if (voucher) {
        const alreadyRedeemed = await prisma.voucherRedemption.findUnique({
          where: { voucherId_userId: { voucherId: voucher.id, userId } },
          select: { id: true },
        });
        if (!alreadyRedeemed) {
          await prisma.voucherRedemption.create({ data: { voucherId: voucher.id, userId } });
          await prisma.voucher.update({
            where: { id: voucher.id },
            data: { usedCount: { increment: 1 } },
          });
        }
      }
    }

    const now = new Date();
    const startDate = user.subscriptionEnd && user.subscriptionEnd > now ? new Date(user.subscriptionEnd) : now;
    const expiresAt = new Date(startDate);
    expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

    await prisma.user.update({
      where: { id: user.id },
      data: { subscriptionPlan: planKey, subscriptionEnd: expiresAt },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "PAYMENT_SUCCESS",
        entity: "subscription",
        entityId: orderId,
        description: `Pembayaran berhasil via Pakasir: Paket ${planKey} (${durationMonths} bulan). Berlaku hingga ${expiresAt.toLocaleDateString("id-ID")}. Order: ${orderId}`,
        metadata: JSON.stringify({ order_id: orderId, plan: planKey, amount, durationMonths, expiresAt, payment_method: txn.payment_method }),
      },
    });

    return NextResponse.json({
      success: true,
      data: { redirect: user.role === "admin" ? "/rk-dashboard?payment=success" : "/dashboard?payment=success" },
    });
  } catch (error) {
    console.error("POST /api/payment/activate error:", error);
    return NextResponse.json({ success: false, error: "Gagal mengaktifkan langganan" }, { status: 500 });
  }
}
