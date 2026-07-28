import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get("x-user-role");
    if (userRole !== "admin") return errorResponse("Unauthorized", 403);

    const sessions = await prisma.whatsAppSession.findMany({
      include: { user: { select: { id: true, name: true, email: true, university: true } } },
      orderBy: { updatedAt: "desc" },
    });

    const stats = {
      total: sessions.length,
      connected: sessions.filter(s => s.status === "connected").length,
      disconnected: sessions.filter(s => s.status === "disconnected").length,
      connecting: sessions.filter(s => s.status === "connecting").length,
    };

    return successResponse({ sessions, stats });
  } catch (error) {
    console.error("GET /api/admin/whatsapp-monitor error:", error);
    return errorResponse("Terjadi kesalahan", 500);
  }
}
