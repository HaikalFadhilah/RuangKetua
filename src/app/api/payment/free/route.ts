import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/api-utils";

const DEFAULT_PRICES: Record<string, number> = {
  monthly: 29000,
  halfyear: 149000,
  yearly: 269000,
};

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const body = await request.json();
    const { plan, voucherCode } = body;

    if (!plan) {
      return NextResponse.json({ success: false, error: "Plan diperlukan" }, { status: 400 });
    }

    const DURATION_MAP: Record<string, number> = { monthly: 1, halfyear: 6, yearly: 12 };
    const planKey = String(plan).toLowerCase();
    const durationMonths = DURATION_MAP[planKey] ?? 1;

    const settings = await prisma.systemSettings.findFirst();
    if (!settings) {
      return NextResponse.json({ success: false, error: "Konfigurasi belum lengkap" }, { status: 500 });
    }

    const priceField = planKey === "monthly" ? "priceMonthly" : planKey === "halfyear" ? "priceHalfYear" : "priceYearly";
    let finalAmount = ((settings as unknown as Record<string, number | null>)[priceField]) || DEFAULT_PRICES[planKey];

    // ── Wajib ada voucher yang benar-benar membuat pesanan GRATIS ──
    // Tanpa ini, endpoint ini bisa disalahgunakan untuk langganan gratis sembarangan.
    if (!voucherCode) {
      return NextResponse.json({ success: false, error: "Kode voucher diperlukan untuk aktivasi gratis" }, { status: 400 });
    }

    const voucher = await prisma.voucher.findUnique({ where: { code: String(voucherCode).toUpperCase() } });
    if (!voucher) {
      return NextResponse.json({ success: false, error: "Voucher tidak ditemukan" }, { status: 404 });
    }
    if (!voucher.isActive) {
      return NextResponse.json({ success: false, error: "Voucher tidak aktif" }, { status: 400 });
    }
    const now = new Date();
    if (voucher.validFrom > now) {
      return NextResponse.json({ success: false, error: "Voucher belum dapat digunakan" }, { status: 400 });
    }
    if (voucher.validUntil && voucher.validUntil < now) {
      return NextResponse.json({ success: false, error: "Voucher sudah kedaluwarsa" }, { status: 400 });
    }
    if (voucher.applicablePlan && voucher.applicablePlan !== planKey) {
      return NextResponse.json({ success: false, error: `Voucher hanya berlaku untuk paket ${voucher.applicablePlan}` }, { status: 400 });
    }
    if (voucher.maxUses !== null && voucher.usedCount >= voucher.maxUses) {
      return NextResponse.json({ success: false, error: "Batas penggunaan voucher sudah habis" }, { status: 400 });
    }

    if (voucher.discountType === "percent") {
      finalAmount -= Math.floor((finalAmount * voucher.discountValue) / 100);
    } else if (voucher.discountType === "fixed") {
      finalAmount -= voucher.discountValue;
    }
    if (finalAmount < 0) finalAmount = 0;

    if (finalAmount > 0) {
      return NextResponse.json({ success: false, error: "Voucher ini tidak membuat pesanan gratis" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, subscriptionPlan: true, subscriptionEnd: true },
    });
    if (!user) {
      return NextResponse.json({ success: false, error: "User tidak ditemukan" }, { status: 404 });
    }

    const orderId = `RK-${planKey.toUpperCase()}-FREE-${Date.now().toString(36)}`;

    // Idempoten: order atau voucher sudah pernah diproses.
    const existingLog = await prisma.activityLog.findFirst({
      where: { entityId: orderId, action: "PAYMENT_SUCCESS" },
      select: { id: true },
    });
    if (existingLog) {
      return NextResponse.json({
        success: true,
        data: { redirect: user.role === "admin" ? "/rk-dashboard?payment=success" : "/dashboard?payment=success" },
      });
    }

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
        description: `Langganan diaktifkan gratis via voucher: Paket ${planKey} (${durationMonths} bulan). Berlaku hingga ${expiresAt.toLocaleDateString("id-ID")}. Order: ${orderId}`,
        metadata: JSON.stringify({ order_id: orderId, plan: planKey, amount: 0, durationMonths, expiresAt, payment_method: "voucher_free" }),
      },
    });

    return NextResponse.json({
      success: true,
      data: { redirect: user.role === "admin" ? "/rk-dashboard?payment=success" : "/dashboard?payment=success" },
    });
  } catch (error) {
    console.error("POST /api/payment/free error:", error);
    return NextResponse.json({ success: false, error: "Gagal mengaktifkan langganan gratis" }, { status: 500 });
  }
}
