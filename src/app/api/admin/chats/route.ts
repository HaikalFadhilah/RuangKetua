import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get("x-user-role");
    if (userRole !== "admin") {
      return errorResponse("Hanya admin yang dapat mengakses ini", 403);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "100");
    const skip = (page - 1) * limit;

    const [chats, total] = await Promise.all([
      prisma.chatMessage.findMany({
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.chatMessage.count(),
    ]);

    return paginatedResponse(chats, total, page, limit);
  } catch (error) {
    console.error("GET /api/admin/chats error:", error);
    return errorResponse("Terjadi kesalahan", 500);
  }
}