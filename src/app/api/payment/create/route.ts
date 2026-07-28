import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const userIdCookie = request.cookies.get("token") || request.cookies.get("admin_token");
    if (!userIdCookie) {
      return NextResponse.json({ success: false, error: "Silakan login terlebih dahulu" }, { status: 401 });
    }

    const { verifyToken } = await import("@/lib/auth");
    const payload = await verifyToken(userIdCookie.value);
    const userId = payload?.userId;
    if (!userId) {
       return NextResponse.json({ success: false, error: "Silakan login terlebih dahulu" }, { status: 401 });
    }

    const body = await request.json();
    const { plan } = body; // "monthly" | "halfyear" | "yearly"

    if (!["monthly", "halfyear", "yearly"].includes(plan)) {
      return NextResponse.json({ success: false, error: "Plan tidak valid" }, { status: 400 });
    }

    // Ambil settings dari DB
    const settings = await prisma.systemSettings.findFirst();
    if (!settings) {
      return NextResponse.json({ success: false, error: "Konfigurasi sistem belum ada" }, { status: 500 });
    }
    if (!settings.pakasirEnabled) {
      return NextResponse.json({ success: false, error: "Payment gateway belum aktif" }, { status: 503 });
    }
    if (!settings.pakasirSlug) {
      return NextResponse.json({ success: false, error: "Konfigurasi Pakasir belum lengkap (slug proyek belum diisi)" }, { status: 500 });
    }

    // Tentukan harga & label berdasarkan plan
    const PLAN_MAP: Record<string, { amount: number; label: string; durationMonths: number }> = {
      monthly:  { amount: settings.priceMonthly,  label: "Ruang Ketua - Paket Bulanan",  durationMonths: 1  },
      halfyear: { amount: settings.priceHalfYear,  label: "Ruang Ketua - Paket 6 Bulan", durationMonths: 6  },
      yearly:   { amount: settings.priceYearly,    label: "Ruang Ketua - Paket Tahunan", durationMonths: 12 },
    };
    const planInfo = PLAN_MAP[plan];

    // Ambil data user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });
    if (!user) {
      return NextResponse.json({ success: false, error: "User tidak ditemukan" }, { status: 404 });
    }

    // Generate basic order ID (akan diperbarui jika apply voucher)
    const orderId = `RK-${plan.toUpperCase()}-${userId.slice(0, 8)}-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://yourdomain.com";
    
    // Alih-alih melempar langsung ke URL Pakasir, kita arahkan ke halaman internal `/payment`
    // dimana voucher dan QR dibaca.
    const paymentUrl = `${appUrl}/payment?plan=${plan}&amount=${planInfo.amount}&order=${orderId}`;

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        paymentUrl,   // redirect user ke URL ini
        amount: planInfo.amount,
        plan,
        label: planInfo.label,
        durationMonths: planInfo.durationMonths,
      },
    });
  } catch (error) {
    console.error("POST /api/payment/create error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

