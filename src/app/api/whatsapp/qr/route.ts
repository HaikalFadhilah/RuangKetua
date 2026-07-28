import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";
import { getWhatsAppService } from "@/lib/whatsapp/service";

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const waService = getWhatsAppService(userId);
    await waService.connect();

    await new Promise((resolve) => setTimeout(resolve, 3000));

    const status = waService.getStatus();
    return successResponse(status, "Silakan scan QR code");
  } catch (error) {
    console.error("WA QR error:", error);
    return errorResponse("Gagal generate QR code", 500);
  }
}
