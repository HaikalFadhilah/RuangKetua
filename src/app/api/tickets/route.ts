import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);

    const tickets = await prisma.helpTicket.findMany({
      where: { userId },
      include: {
        replies: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(tickets);
  } catch (error) {
    console.error("GET /api/tickets error:", error);
    return errorResponse("Terjadi kesalahan", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { subject, message, category } = await request.json();

    if (!subject || !message) return errorResponse("Subjek dan pesan wajib diisi", 400);

    const ticket = await prisma.helpTicket.create({
      data: {
        userId,
        subject,
        message,
        category: category || "BUG",
      },
    });

    return successResponse(ticket, "Tiket berhasil dikirim", 201);
  } catch (error) {
    console.error("POST /api/tickets error:", error);
    return errorResponse("Terjadi kesalahan", 500);
  }
}
