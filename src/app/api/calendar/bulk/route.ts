import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const body = await request.json();
    const { events } = body;

    if (!events || !Array.isArray(events) || events.length === 0) {
      return errorResponse("Data events tidak boleh kosong", 400);
    }

    // Validate and prepare all events
    const validEvents = [];
    const errors: string[] = [];

    for (let i = 0; i < events.length; i++) {
      const ev = events[i];

      if (!ev.title || !ev.startDate) {
        errors.push(`Event #${i + 1}: judul dan tanggal mulai wajib diisi`);
        continue;
      }

      const startDate = new Date(ev.startDate);
      if (isNaN(startDate.getTime())) {
        errors.push(`Event #${i + 1} "${ev.title}": tanggal mulai tidak valid`);
        continue;
      }

      let endDate = null;
      if (ev.endDate) {
        endDate = new Date(ev.endDate);
        if (isNaN(endDate.getTime())) {
          endDate = null;
        }
      }

      // Map type to valid CalendarType enum
      const validTypes = [
        "KULIAH",
        "PRAKTIKUM",
        "SEMINAR",
        "PRESENTASI",
        "UTS",
        "UAS",
        "HOLIDAY",
        "DEADLINE",
        "ELEARNING",
        "OTHER",
      ];
      const type = validTypes.includes(ev.type?.toUpperCase())
        ? ev.type.toUpperCase()
        : "OTHER";

      validEvents.push({
        userId,
        title: ev.title,
        description: ev.description || null,
        startDate,
        endDate,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type: type as any,
        color: ev.color || null,
        allDay: ev.allDay ?? true,
      });
    }

    if (validEvents.length === 0) {
      return errorResponse(
        `Tidak ada event valid untuk disimpan. Errors: ${errors.join("; ")}`,
        400
      );
    }

    // Bulk create with createMany
    const result = await prisma.calendarEvent.createMany({
      data: validEvents,
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: "BULK_CREATE",
        entity: "calendar_event",
        description: `Menambahkan ${result.count} event dari OCR Kalender Akademik`,
      },
    });

    return successResponse(
      {
        created: result.count,
        errors: errors.length > 0 ? errors : undefined,
      },
      `${result.count} event berhasil ditambahkan ke kalender`,
      201
    );
  } catch (error) {
    console.error("Calendar bulk POST error:", error);
    return errorResponse("Gagal menyimpan events", 500);
  }
}
