import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return errorResponse("Unauthorized", 401);

    const userRole = request.headers.get("x-user-role");
    const { id: postId } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content?.trim()) return errorResponse("Komentar tidak boleh kosong", 400);

    const post = await prisma.forumPost.findUnique({ where: { id: postId } });
    if (!post) return errorResponse("Postingan tidak ditemukan", 404);

    // Admin bisa komentar di INTERNAL_CAMPUS manapun tanpa cek universitas
    if (post.category === "INTERNAL_CAMPUS" && userRole !== "admin") {
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { university: true },
      });
      if (currentUser?.university !== post.university) {
        return errorResponse("Akses ditolak", 403);
      }
    }

    const comment = await prisma.forumComment.create({
      data: { postId, userId, content: content.trim() },
      include: {
        user: {
          select: { id: true, name: true, avatar: true, className: true, university: true, role: true },
        },
      },
    });

    return successResponse(comment, "Komentar berhasil dikirim", 201);
  } catch (error) {
    console.error("POST /api/forum/[id]/comments error:", error);
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
    const { id: postId } = await params;
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("commentId");

    if (!commentId) return errorResponse("commentId wajib diisi", 400);

    const comment = await prisma.forumComment.findUnique({ where: { id: commentId } });
    if (!comment) return errorResponse("Komentar tidak ditemukan", 404);
    if (comment.postId !== postId) return errorResponse("Data tidak sesuai", 400);

    // Admin bisa hapus komentar siapapun
    if (comment.userId !== userId && userRole !== "admin") {
      return errorResponse("Akses ditolak", 403);
    }

    await prisma.forumComment.delete({ where: { id: commentId } });

    return successResponse(null, "Komentar berhasil dihapus");
  } catch (error) {
    console.error("DELETE /api/forum/[id]/comments error:", error);
    return errorResponse("Terjadi kesalahan", 500);
  }
}
