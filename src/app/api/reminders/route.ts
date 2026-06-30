import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse, paginatedResponse, getPaginationParams } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(searchParams);

    const [reminders, total] = await Promise.all([
      prisma.reminder.findMany({
        where: { userId },
        orderBy: { remindAt: "asc" },
        skip,
        take: limit,
      }),
      prisma.reminder.count({ where: { userId } }),
    ]);

    return paginatedResponse(reminders, total, page, limit);
  } catch (error) {
    console.error("Reminders GET error:", error);
    return errorResponse("Gagal mengambil reminder", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const body = await request.json();

    if (!body.title || !body.remindAt) {
      return errorResponse("Judul dan waktu reminder wajib diisi", 400);
    }

    const reminder = await prisma.reminder.create({
      data: {
        userId,
        title: body.title,
        description: body.description || null,
        remindAt: new Date(body.remindAt),
        type: body.type || "GENERAL",
        target: body.target || "group",
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: "CREATE",
        entity: "reminder",
        entityId: reminder.id,
        description: `Membuat reminder: ${reminder.title}`,
      },
    });

    return successResponse(reminder, "Reminder berhasil dibuat", 201);
  } catch (error) {
    console.error("Reminders POST error:", error);
    return errorResponse("Gagal membuat reminder", 500);
  }
}
