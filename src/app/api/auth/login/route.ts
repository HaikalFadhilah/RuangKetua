import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse("Email dan password wajib diisi", 400);
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return errorResponse("Email atau password salah", 401);
    }

    if (user.isSuspended) {
      return errorResponse("Akun Anda telah ditangguhkan (Suspended) oleh Admin.", 403);
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return errorResponse("Email atau password salah", 401);
    }

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
      "Login berhasil"
    );

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    // ── Jika admin, juga set admin_token agar bisa akses /rk-dashboard ──
    if (user.role === "admin") {
      response.cookies.set("admin_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 8, // 8 jam
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Login error:", error);
    const message = error instanceof Error ? error.message : "Terjadi kesalahan saat login";
    return errorResponse(message, 500);
  }
}
