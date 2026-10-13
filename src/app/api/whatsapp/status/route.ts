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
    let defaultGroupId: string | null = null;
    let defaultGroupName: string | null = null;

    // Sinkronkan status in-memory ke DB agar Admin WA Monitor akurat
    const dbStatus = status.connected
      ? "connected"
      : status.connecting
        ? "connecting"
        : "disconnected";
    try {
      const session = await prisma.whatsAppSession.upsert({
        where: { userId },
        create: { userId, status: dbStatus, updatedAt: new Date() },
        update: { status: dbStatus, updatedAt: new Date() },
      });
      defaultGroupId = session.groupId;
      defaultGroupName = session.groupName;
    } catch (e) {
      console.error("WA Status persist error:", e);
    }

    return successResponse({ ...status, defaultGroupId, defaultGroupName });
  } catch (error) {
    console.error("WA Status error:", error);
    return errorResponse("Gagal mengambil status WhatsApp", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const body = await request.json();
    const groupId = typeof body.groupId === "string" ? body.groupId : null;
    const waService = getWhatsAppService(userId);
    const status = waService.getStatus();

    if (!status.connected) {
      return errorResponse("WhatsApp tidak terhubung", 400);
    }

    const group = status.groups.find((item) => item.id === groupId);
    if (!group) {
      return errorResponse("Grup WhatsApp tidak ditemukan", 404);
    }

    await prisma.whatsAppSession.upsert({
      where: { userId },
      create: {
        userId,
        status: "connected",
        groupId: group.id,
        groupName: group.subject,
      },
      update: {
        groupId: group.id,
        groupName: group.subject,
      },
    });

    return successResponse(
      { defaultGroupId: group.id, defaultGroupName: group.subject },
      "Grup utama berhasil disimpan"
    );
  } catch (error) {
    console.error("WA default group error:", error);
    return errorResponse("Gagal menyimpan grup utama", 500);
  }
}
