import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return errorResponse("Unauthorized", 401);

    const announcement = await prisma.announcement.findFirst({
      where: { broadcast: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, content: true, createdAt: true },
    });

    return successResponse(announcement ?? null);
  } catch (error) {
    console.error("GET /api/system/broadcast error:", error);
    return errorResponse("Terjadi kesalahan", 500);
  }
}
