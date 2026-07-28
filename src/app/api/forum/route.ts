import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return errorResponse("Unauthorized", 401);

    const userRole = request.headers.get("x-user-role");

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as "PUBLIC" | "INTERNAL_CAMPUS" | null;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    let whereClause: Record<string, unknown> = {};

    if (category === "INTERNAL_CAMPUS") {
      // Admin bisa lihat semua INTERNAL_CAMPUS tanpa filter universitas
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

    const [posts, total] = await Promise.all([
      prisma.forumPost.findMany({
        where: whereClause,
        include: {
          user: {
            select: { id: true, name: true, avatar: true, className: true, university: true, role: true },
          },
          _count: { select: { comments: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.forumPost.count({ where: whereClause }),
    ]);

    return paginatedResponse(posts, total, page, limit);
  } catch (error) {
    console.error("GET /api/forum error:", error);
    return errorResponse("Terjadi kesalahan", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return errorResponse("Unauthorized", 401);

    const userRole = request.headers.get("x-user-role");
    const body = await request.json();
    const { title, content, category } = body;

    if (!title?.trim()) return errorResponse("Judul wajib diisi", 400);
    if (!content?.trim()) return errorResponse("Konten wajib diisi", 400);
    if (!category || !["PUBLIC", "INTERNAL_CAMPUS"].includes(category)) {
      return errorResponse("Kategori tidak valid", 400);
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { university: true },
    });

    // Admin boleh posting INTERNAL_CAMPUS tanpa universitas
    if (category === "INTERNAL_CAMPUS" && !currentUser?.university && userRole !== "admin") {
      return errorResponse("Universitas belum diatur. Update profil terlebih dahulu.", 400);
    }

    const post = await prisma.forumPost.create({
      data: {
        userId,
        title: title.trim(),
        content: content.trim(),
        category,
        university: category === "INTERNAL_CAMPUS" ? (currentUser?.university ?? null) : null,
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true, className: true, university: true, role: true },
        },
        _count: { select: { comments: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: "CREATE",
        entity: "forum_post",
        entityId: post.id,
        description: `Membuat postingan forum: ${post.title}`,
      },
    });

    return successResponse(post, "Postingan berhasil dibuat", 201);
  } catch (error) {
    console.error("POST /api/forum error:", error);
    return errorResponse("Terjadi kesalahan", 500);
  }
}
