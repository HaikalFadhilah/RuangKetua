import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse, paginatedResponse, getPaginationParams } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(searchParams);
    const action = searchParams.get("action") || "";
    const entity = searchParams.get("entity") || "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { userId };
    if (action) where.action = action;
    if (entity) where.entity = entity;

    const [activities, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ]);

    return paginatedResponse(activities, total, page, limit);
  } catch (error) {
    console.error("Activity GET error:", error);
    return errorResponse("Gagal mengambil activity log", 500);
  }
}
