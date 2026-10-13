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
        appName:       settings.appName,
        adminWhatsapp: settings.adminWhatsapp,
        teamPhoto1:    settings.teamPhoto1,
        teamPhoto2:    settings.teamPhoto2,
        teamPhoto3:    settings.teamPhoto3,
      },
    });
  } catch (error) {
    console.error("GET /api/public/settings error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
