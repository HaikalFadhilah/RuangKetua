import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";
import { getWhatsAppService } from "@/lib/whatsapp/service";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const waService = getWhatsAppService(userId);
    const status = waService.getStatus();

    // Sinkronkan status in-memory ke DB agar Admin WA Monitor akurat
    const dbStatus = status.connected
      ? "connected"
      : status.connecting
        ? "connecting"
        : "disconnected";
    try {
      await prisma.whatsAppSession.upsert({
        where: { userId },
        create: { userId, status: dbStatus, updatedAt: new Date() },
        update: { status: dbStatus, updatedAt: new Date() },
      });
    } catch (e) {
      console.error("WA Status persist error:", e);
    }

    return successResponse(status);
  } catch (error) {
    console.error("WA Status error:", error);
    return errorResponse("Gagal mengambil status WhatsApp", 500);
  }
}
