import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return errorResponse("Unauthorized", 401);

    const userRole = request.headers.get("x-user-role");
    const { id } = await params;

    const post = await prisma.forumPost.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, avatar: true, className: true, university: true, role: true },
        },
        comments: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true, className: true, university: true, role: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { comments: true } },
      },
    });

    if (!post) return errorResponse("Postingan tidak ditemukan", 404);

    // For INTERNAL_CAMPUS, admin can see all; others need matching university
    if (post.category === "INTERNAL_CAMPUS" && userRole !== "admin") {
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { university: true },
      });
      if (currentUser?.university !== post.university) {
        return errorResponse("Akses ditolak", 403);
      }
    }

    return successResponse(post);
  } catch (error) {
    console.error("GET /api/forum/[id] error:", error);
    return errorResponse("Terjadi kesalahan", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return errorResponse("Unauthorized", 401);

    const userRole = request.headers.get("x-user-role");
    const { id } = await params;

    const post = await prisma.forumPost.findUnique({ where: { id } });
    if (!post) return errorResponse("Postingan tidak ditemukan", 404);

    // Admin bisa hapus post siapapun
    if (post.userId !== userId && userRole !== "admin") {
      return errorResponse("Akses ditolak", 403);
    }

    await prisma.forumPost.delete({ where: { id } });

    return successResponse(null, "Postingan berhasil dihapus");
  } catch (error) {
    console.error("DELETE /api/forum/[id] error:", error);
    return errorResponse("Terjadi kesalahan", 500);
  }
}
