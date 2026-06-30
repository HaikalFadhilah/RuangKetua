import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return errorResponse("Unauthorized", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        className: true,
        semester: true,
        avatar: true,
      },
    });

    if (!user) {
      return errorResponse("User tidak ditemukan", 404);
    }

    return successResponse({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      className: user.className,
      semester: user.semester,
      avatar: user.avatar,
    });
  } catch {
    return errorResponse("Terjadi kesalahan", 500);
  }
}
