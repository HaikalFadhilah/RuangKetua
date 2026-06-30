import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse, paginatedResponse, getPaginationParams } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(searchParams);

    const [notes, total] = await Promise.all([
      prisma.stickyNote.findMany({
        where: { userId },
        orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.stickyNote.count({ where: { userId } }),
    ]);

    return paginatedResponse(notes, total, page, limit);
  } catch (error) {
    console.error("Notes GET error:", error);
    return errorResponse("Gagal mengambil catatan", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const body = await request.json();

    const note = await prisma.stickyNote.create({
      data: {
        userId,
        content: body.content || "",
        color: body.color || "yellow",
        pinned: body.pinned || false,
      },
    });

    return successResponse(note, "Catatan berhasil dibuat", 201);
  } catch (error) {
    console.error("Notes POST error:", error);
    return errorResponse("Gagal membuat catatan", 500);
  }
}
