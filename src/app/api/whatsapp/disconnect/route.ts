import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";
import { getWhatsAppService } from "@/lib/whatsapp/service";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const waService = getWhatsAppService(userId);
    await waService.disconnect();
    await prisma.whatsAppSession.updateMany({
      where: { userId },
      data: { status: "disconnected", groupId: null, groupName: null },
    });
    return successResponse(null, "WhatsApp berhasil diputus");
  } catch (error) {
    console.error("WA Disconnect error:", error);
    return errorResponse("Gagal memutus WhatsApp", 500);
  }
}
