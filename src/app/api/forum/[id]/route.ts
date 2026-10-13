import { NextRequest } from "next/server";
import fs from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

function parseAttachments(raw: string | null): { url: string }[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

async function cleanupFiles(attachments: { url: string }[]) {
  for (const att of attachments) {
    try {
      const filePath = path.join(process.cwd(), "public", att.url);
      await fs.unlink(filePath);
    } catch { /* file may not exist */ }
  }
}

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

    // Cleanup attachment files from post + all comments
    const postWithComments = await prisma.forumPost.findUnique({
      where: { id },
      include: { comments: { select: { attachments: true } } },
    });
    if (postWithComments) {
      await cleanupFiles(parseAttachments(postWithComments.attachments));
      for (const comment of postWithComments.comments) {
        await cleanupFiles(parseAttachments(comment.attachments));
      }
    }

    await prisma.forumPost.delete({ where: { id } });

    return successResponse(null, "Postingan berhasil dihapus");
  } catch (error) {
    console.error("DELETE /api/forum/[id] error:", error);
    return errorResponse("Terjadi kesalahan", 500);
  }
}
