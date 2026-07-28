import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const userRole = request.headers.get("x-user-role");
    if (userRole !== "admin") return errorResponse("Forbidden", 403);

    const { name, email, password, role, university, className } = await request.json();
    if (!name || !email || !password) return errorResponse("Nama, email, dan password wajib diisi", 400);
    if (password.length < 6) return errorResponse("Password minimal 6 karakter", 400);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return errorResponse("Email sudah terdaftar", 409);

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: role || "ketua_kelas", university: university || null, className: className || null },
      select: { id: true, name: true, email: true, role: true, university: true, className: true, createdAt: true },
    });

    return successResponse(user, "Pengguna berhasil dibuat");
  } catch (error) {
    console.error("POST /api/admin/users error:", error);
    return errorResponse("Terjadi kesalahan", 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get("x-user-role");
    if (userRole !== "admin") {
      return errorResponse("Hanya admin yang dapat mengakses ini", 403);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") || "";

    const where = {
      OR: [
        { name: { contains: search } },
        { email: { contains: search } },
      ]
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: search ? where : undefined,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          className: true,
          semester: true,
          university: true,
          createdAt: true,
          isSuspended: true,
          subscriptionPlan: true,
          subscriptionEnd: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where: search ? where : undefined }),
    ]);

    return paginatedResponse(users, total, page, limit);
  } catch (error) {
    console.error("GET /api/admin/users error:", error);
    return errorResponse("Terjadi kesalahan", 500);
  }
}