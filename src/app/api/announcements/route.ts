import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse, paginatedResponse, getPaginationParams } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(searchParams);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { userId };
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ];
    }
    if (category) where.category = category;

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.announcement.count({ where }),
    ]);

    return paginatedResponse(announcements, total, page, limit);
  } catch (error) {
    console.error("Announcements GET error:", error);
    return errorResponse("Gagal mengambil pengumuman", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const userRole = request.headers.get("x-user-role") || "";
    const body = await request.json();
    const { title, content, category, pinned } = body;

    if (!title || !content) return errorResponse("Judul dan konten wajib diisi", 400);

    const announcement = await prisma.announcement.create({
      data: {
        userId,
        title,
        content,
        category: category || "general",
        pinned: pinned || false,
        broadcast: userRole === "admin" ? (body.broadcast || false) : false,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: "CREATE",
        entity: "announcement",
        entityId: announcement.id,
        description: `Membuat pengumuman: ${announcement.title}`,
      },
    });

    return successResponse(announcement, "Pengumuman berhasil dibuat", 201);
  } catch (error) {
    console.error("Announcements POST error:", error);
    return errorResponse("Gagal membuat pengumuman", 500);
  }
}
