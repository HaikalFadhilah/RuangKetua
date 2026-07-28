import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    let settings = await prisma.systemSettings.findFirst();
    if (!settings) {
      settings = await prisma.systemSettings.create({ data: {} });
    }

    return NextResponse.json({
      success: true,
      data: {
        priceMonthly:   settings.priceMonthly,
        priceHalfYear:  settings.priceHalfYear,
        priceYearly:    settings.priceYearly,
        pricingEnabled: settings.pricingEnabled,
        pakasirEnabled: settings.pakasirEnabled,
      },
    });
  } catch (error) {
    console.error("GET /api/public/pricing error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
