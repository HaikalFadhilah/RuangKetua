import { successResponse, errorResponse } from "@/lib/api-response";
import whatsappService from "@/lib/whatsapp/service";

export async function GET() {
  try {
    const status = whatsappService.getStatus();
    return successResponse(status);
  } catch (error) {
    console.error("WA Status error:", error);
    return errorResponse("Gagal mengambil status WhatsApp", 500);
  }
}
