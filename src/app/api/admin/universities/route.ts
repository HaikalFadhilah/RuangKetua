import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get("x-user-role");
    if (userRole !== "admin") return errorResponse("Unauthorized", 403);

    const universities = await prisma.university.findMany({
      orderBy: { name: "asc" },
    });

    return successResponse(universities);
  } catch (error) {
    console.error("GET /api/admin/universities error:", error);
    return errorResponse("Terjadi kesalahan", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userRole = request.headers.get("x-user-role");
    if (userRole !== "admin") return errorResponse("Unauthorized", 403);

    const { name, shortName, city } = await request.json();
    if (!name) return errorResponse("Nama universitas wajib diisi", 400);

    const existing = await prisma.university.findUnique({ where: { name } });
    if (existing) return errorResponse("Universitas sudah terdaftar", 409);

    const university = await prisma.university.create({
      data: { name, shortName: shortName || null, city: city || null },
    });

    return successResponse(university, "Universitas berhasil ditambahkan", 201);
  } catch (error) {
    console.error("POST /api/admin/universities error:", error);
    return errorResponse("Terjadi kesalahan", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userRole = request.headers.get("x-user-role");
    if (userRole !== "admin") return errorResponse("Unauthorized", 403);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return errorResponse("ID tidak ditemukan", 400);

    await prisma.university.delete({ where: { id } });
    return successResponse(null, "Universitas berhasil dihapus");
  } catch (error) {
    console.error("DELETE /api/admin/universities error:", error);
    return errorResponse("Terjadi kesalahan", 500);
  }
}
