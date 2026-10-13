import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";
import { getWhatsAppService } from "@/lib/whatsapp/service";
import {
  getBroadcastStopMessage,
  WA_BROADCAST_WARNING_GROUP_THRESHOLD,
} from "@/lib/whatsapp/safety";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const body = await request.json();
    const { groupIds, message, confirmLargeBroadcast } = body;

    if (!message) {
      return errorResponse("Pesan tidak boleh kosong", 400);
    }

    if (!groupIds || !Array.isArray(groupIds) || groupIds.length === 0) {
      return errorResponse("Pilih minimal satu grup", 400);
    }

    if (groupIds.length >= WA_BROADCAST_WARNING_GROUP_THRESHOLD && confirmLargeBroadcast !== true) {
      return errorResponse(
        `Broadcast ke ${groupIds.length} grup perlu dikonfirmasi terlebih dahulu`,
        409
      );
    }

    const waService = getWhatsAppService(userId);
    if (!(await waService.ensureConnected())) {
      return errorResponse("WhatsApp tidak terhubung", 400);
    }

    const result = await waService.broadcastToMultipleGroups(groupIds, message);

    const firstSuccessfulGroup = waService
      .getStatus()
      .groups.find((group) => group.id === result.success[0]);
    if (firstSuccessfulGroup) {
      await prisma.whatsAppSession.upsert({
        where: { userId },
        create: {
          userId,
          status: "connected",
          groupId: firstSuccessfulGroup.id,
          groupName: firstSuccessfulGroup.subject,
        },
        update: {
          status: "connected",
          groupId: firstSuccessfulGroup.id,
          groupName: firstSuccessfulGroup.subject,
        },
      });
    }

    await prisma.activityLog.create({
      data: {
        userId,
        action: "BROADCAST",
        entity: "whatsapp",
        description: `Broadcast ke ${result.success.length} grup berhasil, ${result.failed.length} gagal, ${result.skipped.length} dihentikan`,
        metadata: JSON.stringify(result),
      },
    });

    const stopMessage = getBroadcastStopMessage(result.stoppedReason);
    const messageResult = result.stopped
      ? `Broadcast dihentikan otomatis. ${result.success.length} berhasil, ${result.failed.length} gagal, ${result.skipped.length} belum dikirim. ${stopMessage ?? ""}`.trim()
      : `Broadcast selesai: ${result.success.length} berhasil, ${result.failed.length} gagal`;

    return successResponse(result, messageResult);
  } catch (error) {
    console.error("Broadcast error:", error);
    return errorResponse("Gagal mengirim broadcast", 500);
  }
}
