import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const plan = searchParams.get("plan");
    
    if (!plan) {
      return NextResponse.json({ success: false, error: "Plan tidak valid" }, { status: 400 });
    }

    const settings = await prisma.systemSettings.findFirst();
    if (!settings) throw new Error("Settings not found");

    const DEFAULT_PRICES: Record<string, number> = {
      monthly: 29000,
      halfyear: 149000,
      yearly: 269000,
    };

    const PLAN_MAP: Record<string, { amount: number; name: string }> = {
      monthly:  { amount: settings.priceMonthly || DEFAULT_PRICES.monthly,  name: "Bulanan" },
      halfyear: { amount: settings.priceHalfYear || DEFAULT_PRICES.halfyear, name: "6 Bulan" },
      yearly:   { amount: settings.priceYearly || DEFAULT_PRICES.yearly,   name: "Tahunan" },
    };

    if (!PLAN_MAP[plan]) {
        return NextResponse.json({ success: false, error: "Plan tidak ditemukan" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        plan,
        name: PLAN_MAP[plan].name,
        amount: PLAN_MAP[plan].amount
      }
    });

  } catch (error) {
    console.error("GET /api/payment/detail error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
