import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, className, semester } = body;

    if (!name || !email || !password) {
      return errorResponse("Nama, email, dan password wajib diisi", 400);
    }

    if (password.length < 6) {
      return errorResponse("Password minimal 6 karakter", 400);
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return errorResponse("Email sudah terdaftar", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        className: className || null,
        semester: semester || null,
        settings: {
          create: {},
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "CREATE",
        entity: "user",
        entityId: user.id,
        description: `User ${user.name} telah mendaftar`,
      },
    });

    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = successResponse(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      "Registrasi berhasil"
    );

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return errorResponse("Terjadi kesalahan saat registrasi", 500);
  }
}
