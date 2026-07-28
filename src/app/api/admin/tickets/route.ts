import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get("x-user-role");
    if (userRole !== "admin") return errorResponse("Unauthorized", 403);

    const tickets = await prisma.helpTicket.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, university: true } },
        replies: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(tickets);
  } catch (error) {
    console.error("GET /api/admin/tickets error:", error);
    return errorResponse("Terjadi kesalahan", 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userRole = request.headers.get("x-user-role");
    const adminId = request.headers.get("x-user-id");
    if (userRole !== "admin") return errorResponse("Unauthorized", 403);

    const body = await request.json();
    const { ticketId, status, replyMessage } = body;

    if (!ticketId) return errorResponse("Ticket ID wajib diisi", 400);

    if (status) {
      await prisma.helpTicket.update({
        where: { id: ticketId },
        data: { status },
      });
    }

    if (replyMessage && adminId) {
      await prisma.ticketReply.create({
        data: {
          ticketId,
          userId: adminId,
          message: replyMessage,
          isAdmin: true,
        },
      });
    }

    return successResponse(null, "Tiket berhasil diupdate");
  } catch (error) {
    console.error("PUT /api/admin/tickets error:", error);
    return errorResponse("Terjadi kesalahan", 500);
  }
}
