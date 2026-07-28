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
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const [forums, total] = await Promise.all([
      prisma.forumPost.findMany({
        include: {
          user: { select: { id: true, name: true, email: true } },
          _count: { select: { comments: true } }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.forumPost.count(),
    ]);

    return paginatedResponse(forums, total, page, limit);
  } catch (error) {
    console.error("GET /api/admin/forums error:", error);
    return errorResponse("Terjadi kesalahan", 500);
  }
}