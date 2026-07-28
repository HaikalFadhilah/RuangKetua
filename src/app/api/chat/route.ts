import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return errorResponse("Unauthorized", 401);

    const userRole = request.headers.get("x-user-role");
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as "PUBLIC" | "INTERNAL_CAMPUS" | null;

    let whereClause: Record<string, unknown> = {};

    if (category === "INTERNAL_CAMPUS") {
      // Admin bisa lihat semua INTERNAL_CAMPUS
      if (userRole === "admin") {
        whereClause = { category: "INTERNAL_CAMPUS" };
      } else {
        const currentUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { university: true },
        });
        if (!currentUser?.university) {
          return errorResponse("Universitas belum diatur. Update profil terlebih dahulu.", 400);
        }
        whereClause = { category: "INTERNAL_CAMPUS", university: currentUser.university };
      }
    } else {
      whereClause = { category: "PUBLIC" };
    }

    const messages = await prisma.chatMessage.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, avatar: true, className: true, university: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return successResponse(messages);
  } catch (error) {
    console.error("GET /api/chat error:", error);
    return errorResponse("Terjadi kesalahan", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return errorResponse("Unauthorized", 401);

    const userRole = request.headers.get("x-user-role");
    const body = await request.json();
    const { content, category } = body;

    if (!content?.trim()) return errorResponse("Pesan wajib diisi", 400);
    if (!category || !["PUBLIC", "INTERNAL_CAMPUS"].includes(category)) {
      return errorResponse("Kategori tidak valid", 400);
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { university: true },
    });

    // Admin boleh kirim ke INTERNAL_CAMPUS tanpa universitas
    if (category === "INTERNAL_CAMPUS" && !currentUser?.university && userRole !== "admin") {
      return errorResponse("Universitas belum diatur. Update profil terlebih dahulu.", 400);
    }

    const message = await prisma.chatMessage.create({
      data: {
        userId,
        content: content.trim(),
        category,
        university: category === "INTERNAL_CAMPUS" ? (currentUser?.university ?? null) : null,
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true, className: true, university: true, role: true },
        },
      },
    });

    return successResponse(message, "Pesan terkirim", 201);
  } catch (error) {
    console.error("POST /api/chat error:", error);
    return errorResponse("Terjadi kesalahan", 500);
  }
}
