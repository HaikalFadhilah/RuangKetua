import { successResponse, errorResponse } from "@/lib/api-response";
import whatsappService from "@/lib/whatsapp/service";

export async function POST() {
  try {
    await whatsappService.connect();

    // Wait a bit for QR to generate
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const status = whatsappService.getStatus();
    return successResponse(status, "Silakan scan QR code");
  } catch (error) {
    console.error("WA QR error:", error);
    return errorResponse("Gagal generate QR code", 500);
  }
}
