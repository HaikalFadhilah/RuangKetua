import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";
import { logActivity } from "@/lib/activity";

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");
    const type = searchParams.get("type");
    const search = searchParams.get("search");


    const where: any = { userId };

    if (mode !== "all") {
      const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
      const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      where.startDate = { gte: startDate, lte: endDate };
    }

    if (type) where.type = type.toUpperCase();
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // 1. Ambil Event Kalender biasa
    const events = await prisma.calendarEvent.findMany({
      where,
      orderBy: { startDate: "asc" },
    });

    // 2. Ambil Task dari Task Manager (yang belum selesai / completed bisa di-exclude atau include tergantung filter)
    const taskWhere: any = { userId, deadline: { not: null } };

    if (mode !== "all") {
      const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
      const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      taskWhere.deadline = { gte: startDate, lte: endDate };
    }

    if (search) {
      taskWhere.title = { contains: search };
    }

    // Kalau ada filter type dan bukan DEADLINE, abaikan tasks
    let taskEvents: any[] = [];
    if (!type || type.toUpperCase() === "DEADLINE") {
      const tasks = await prisma.task.findMany({
        where: taskWhere,
        orderBy: { deadline: "asc" }
      });

      // Petakan Task agar wujudnya mirip dengan CalendarEvent
      taskEvents = tasks.map(t => ({
        id: `task_${t.id}`, // Prefix beda biar nggak bentrok
        title: `(Tugas) ${t.title}`,
        description: t.description,
        startDate: t.deadline?.toISOString() || new Date().toISOString(),
        endDate: t.deadline?.toISOString() || new Date().toISOString(),
        type: "DEADLINE",
        color: "#ef4444", // Merah khas Deadline
      }));
    }

    // Gabungkan Event Kalender dan Task, lalu urutkan
    const mergedEvents = [...events, ...taskEvents].sort((a, b) => {
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });

    return successResponse(mergedEvents);
  } catch (error) {
    console.error("Calendar GET error:", error);
    return errorResponse("Gagal mengambil event", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const body = await request.json();
    const { title, description, startDate, endDate, type, color, allDay } = body;

    if (!title || !startDate) {
      return errorResponse("Judul dan tanggal mulai wajib diisi", 400);
    }

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
        userId,
        title,
        description: description || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        type: mappedType as any,
        color: color || null,
        allDay: allDay || false,
      },
    });

    await logActivity({
      userId,
      action: "CREATE",
      entity: "calendar",
      entityId: event.id,
      description: `Membuat event kalender: ${event.title}`,
    });

    return successResponse(event, "Event berhasil dibuat", 201);
  } catch (error) {
    console.error("Calendar POST error:", error);
    return errorResponse("Gagal membuat event", 500);
  }
}
