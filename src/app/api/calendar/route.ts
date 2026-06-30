import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const events = await prisma.calendarEvent.findMany({
      where: {
        startDate: { gte: startDate, lte: endDate },
      },
      orderBy: { startDate: "asc" },
    });

    return successResponse(events);
  } catch (error) {
    console.error("Calendar GET error:", error);
    return errorResponse("Gagal mengambil event", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, startDate, endDate, type, color, allDay } = body;

    if (!title || !startDate) {
      return errorResponse("Judul dan tanggal mulai wajib diisi", 400);
    }

    // Map frontend type to CalendarType enum
    const typeMap: Record<string, string> = {
      academic: "KULIAH",
      deadline: "DEADLINE",
      elearning: "ELEARNING",
      reminder: "OTHER",
      personal: "OTHER",
    };
    const mappedType = typeMap[type?.toLowerCase()] || type?.toUpperCase() || "OTHER";

    const event = await prisma.calendarEvent.create({
      data: {
        title,
        description: description || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        type: mappedType as any,
        color: color || null,
        allDay: allDay || false,
      },
    });

    return successResponse(event, "Event berhasil dibuat", 201);
  } catch (error) {
    console.error("Calendar POST error:", error);
    return errorResponse("Gagal membuat event", 500);
  }
}
