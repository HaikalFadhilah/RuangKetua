import { successResponse, errorResponse } from "@/lib/api-response";
import whatsappService from "@/lib/whatsapp/service";

export async function POST() {
  try {
    await whatsappService.disconnect();
    return successResponse(null, "WhatsApp berhasil diputus");
  } catch (error) {
    console.error("WA Disconnect error:", error);
    return errorResponse("Gagal memutus WhatsApp", 500);
  }
}
