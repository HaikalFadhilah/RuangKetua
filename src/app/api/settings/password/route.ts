import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";
import bcrypt from "bcryptjs";

export async function PUT(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { oldPassword, newPassword } = await request.json();

    if (!oldPassword || !newPassword) {
      return errorResponse("Password lama dan baru wajib diisi", 400);
    }

    if (newPassword.length < 6) {
      return errorResponse("Password baru minimal 6 karakter", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) {
      return errorResponse("User tidak ditemukan", 404);
    }

    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) {
      return errorResponse("Password lama salah", 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: "UPDATE",
        entity: "user",
        entityId: userId,
        description: "Mengubah password",
      },
    });

    return successResponse(null, "Password berhasil diubah");
  } catch (error) {
    console.error("Password PUT error:", error);
    return errorResponse("Gagal mengubah password", 500);
  }
}
