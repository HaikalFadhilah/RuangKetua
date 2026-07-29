import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const role = request.headers.get("x-user-role");
    if (role !== "admin") return errorResponse("Unauthorized", 403);
    const posts = await prisma.blogPost.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        category: true,
        coverEmoji: true,
        status: true,
        readingTime: true,
        publishedAt: true,
        updatedAt: true,
        createdAt: true,
      },
    });
    return successResponse(posts);
  } catch (error) {
    console.error("GET /api/admin/blog error:", error);
    return errorResponse("Gagal mengambil daftar artikel", 500);
  }
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export async function POST(request: NextRequest) {
  try {
    const role = request.headers.get("x-user-role");
    if (role !== "admin") return errorResponse("Unauthorized", 403);

    const body = await request.json();
    const { title, excerpt, content, category, coverEmoji, status, readingTime } = body;

    if (!title || !content) {
      return errorResponse("Judul dan konten wajib diisi", 400);
    }

    let slug = slugify(body.slug || title);
    if (!slug) slug = "artikel-" + Date.now();
    // hindari duplikat slug
    const clash = await prisma.blogPost.findUnique({ where: { slug } });
    if (clash) slug = `${slug}-${Date.now().toString(36)}`;

    const post = await prisma.blogPost.create({
      data: {
        slug,
        title,
        excerpt: excerpt || null,
        content,
        category: category || "Umum",
        coverEmoji: coverEmoji || null,
        status: status === "published" ? "published" : "draft",
        readingTime: readingTime || null,
      },
    });

    return successResponse(post, "Artikel berhasil dibuat");
  } catch (error) {
    console.error("POST /api/admin/blog error:", error);
    return errorResponse("Gagal membuat artikel", 500);
  }
}
