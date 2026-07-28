import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, plan } = body;

    if (!code || !plan) {
      return NextResponse.json({ success: false, error: "Kode voucher dan plan diperlukan" }, { status: 400 });
    }

    // userId wajib ada (proxy sudah memastikan token valid)
    let userId = "";
    try {
      userId = getUserIdFromRequest(request);
    } catch {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const voucher = await prisma.voucher.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!voucher) {
      return NextResponse.json({ success: false, error: "Voucher tidak ditemukan" }, { status: 404 });
    }

    if (!voucher.isActive) {
      return NextResponse.json({ success: false, error: "Voucher sudah tidak aktif" }, { status: 400 });
    }

    // ── Batas per ORANG: satu user hanya boleh pakai sekali ──
    const alreadyUsed = await prisma.voucherRedemption.findUnique({
      where: { voucherId_userId: { voucherId: voucher.id, userId } },
      select: { id: true },
    });
    if (alreadyUsed) {
      return NextResponse.json({ success: false, error: "Anda sudah menggunakan voucher ini sebelumnya" }, { status: 400 });
    }

    const now = new Date();
    if (voucher.validFrom > now) {
      return NextResponse.json({ success: false, error: "Voucher belum dapat digunakan" }, { status: 400 });
    }

    if (voucher.validUntil && voucher.validUntil < now) {
      return NextResponse.json({ success: false, error: "Voucher sudah kedaluwarsa" }, { status: 400 });
    }

    if (voucher.maxUses !== null && voucher.usedCount >= voucher.maxUses) {
      return NextResponse.json({ success: false, error: "Batas penggunaan voucher sudah habis" }, { status: 400 });
    }

    if (voucher.applicablePlan && voucher.applicablePlan !== plan) {
      return NextResponse.json({ success: false, error: `Voucher ini hanya berlaku untuk paket ${voucher.applicablePlan}` }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        code: voucher.code,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        description: voucher.description
      }
    });

  } catch (error) {
    console.error("POST /api/payment/voucher error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan sistem" }, { status: 500 });
  }
}
