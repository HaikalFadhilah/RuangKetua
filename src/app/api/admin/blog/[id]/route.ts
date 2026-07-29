import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const role = request.headers.get("x-user-role");
    if (role !== "admin") return errorResponse("Unauthorized", 403);

    const { id } = await params;
    const post = await prisma.blogPost.findUnique({ where: { id } });
    if (!post) return errorResponse("Artikel tidak ditemukan", 404);
    return successResponse(post);
  } catch (error) {
    console.error("GET /api/admin/blog/[id] error:", error);
    return errorResponse("Gagal mengambil artikel", 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const role = request.headers.get("x-user-role");
    if (role !== "admin") return errorResponse("Unauthorized", 403);

    const { id } = await params;
    const body = await request.json();
    const { title, excerpt, content, category, coverEmoji, status, readingTime, slug } = body;

    const data: Prisma.BlogPostUpdateInput = {};
    if (title !== undefined) data.title = title;
    if (excerpt !== undefined) data.excerpt = excerpt;
    if (content !== undefined) data.content = content;
    if (category !== undefined) data.category = category;
    if (coverEmoji !== undefined) data.coverEmoji = coverEmoji;
    if (readingTime !== undefined) data.readingTime = readingTime;
    if (status !== undefined) data.status = status === "published" ? "published" : "draft";
    if (slug !== undefined) {
      const s = String(slug).toLowerCase().trim().replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80);
      if (s) {
        const clash = await prisma.blogPost.findFirst({ where: { slug: s, NOT: { id } } });
        if (!clash) data.slug = s;
      }
    }

    const updated = await prisma.blogPost.update({ where: { id }, data });
    return successResponse(updated, "Artikel berhasil diperbarui");
  } catch (error) {
    console.error("PUT /api/admin/blog/[id] error:", error);
    return errorResponse("Gagal memperbarui artikel", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const role = _request.headers.get("x-user-role");
    if (role !== "admin") return errorResponse("Unauthorized", 403);

    const { id } = await params;
    await prisma.blogPost.delete({ where: { id } });
    return successResponse(null, "Artikel berhasil dihapus");
  } catch (error) {
    console.error("DELETE /api/admin/blog/[id] error:", error);
    return errorResponse("Gagal menghapus artikel", 500);
  }
}
