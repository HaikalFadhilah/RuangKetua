import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userRole = request.headers.get("x-user-role");
    if (userRole !== "admin") return errorResponse("Unauthorized", 403);

    const { id } = await params;
    const { name, email, role, password, university, isSuspended } = await request.json();

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (email !== undefined) dataToUpdate.email = email;
    if (role !== undefined) dataToUpdate.role = role;
    if (university !== undefined) dataToUpdate.university = university;
    if (isSuspended !== undefined) dataToUpdate.isSuspended = isSuspended;
    if (password && password.length >= 6) {
      dataToUpdate.password = await bcrypt.hash(password, 12);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        university: true,
        className: true,
        semester: true,
        createdAt: true,
        isSuspended: true,
      }
    });

    return successResponse(updated, "Pengguna berhasil diupdate");
  } catch (error) {
    console.error("PUT /api/admin/users/[id] error:", error);
    return errorResponse("Terjadi kesalahan", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userRole = request.headers.get("x-user-role");
    if (userRole !== "admin") return errorResponse("Unauthorized", 403);

    const { id } = await params;
    await prisma.user.delete({ where: { id } });

    return successResponse(null, "Pengguna berhasil dihapus");
  } catch (error) {
    console.error("DELETE /api/admin/users/[id] error:", error);
    return errorResponse("Terjadi kesalahan", 500);
  }
}
