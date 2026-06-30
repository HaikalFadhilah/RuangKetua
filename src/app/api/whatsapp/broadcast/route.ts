import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";
import whatsappService from "@/lib/whatsapp/service";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const body = await request.json();
    const { groupIds, message } = body;

    if (!message) {
      return errorResponse("Pesan tidak boleh kosong", 400);
    }

    if (!groupIds || !Array.isArray(groupIds) || groupIds.length === 0) {
      return errorResponse("Pilih minimal satu grup", 400);
    }

    if (!whatsappService.isConnected()) {
      return errorResponse("WhatsApp tidak terhubung", 400);
    }

    const result = await whatsappService.broadcastToMultipleGroups(groupIds, message);

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: "BROADCAST",
        entity: "whatsapp",
        description: `Broadcast ke ${result.success.length} grup berhasil, ${result.failed.length} gagal`,
        metadata: JSON.stringify(result),
      },
    });

    return successResponse(result, `Broadcast selesai: ${result.success.length} berhasil, ${result.failed.length} gagal`);
  } catch (error) {
    console.error("Broadcast error:", error);
    return errorResponse("Gagal mengirim broadcast", 500);
  }
}
