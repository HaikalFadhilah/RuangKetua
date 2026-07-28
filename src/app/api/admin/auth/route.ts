import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";
import { errorResponse } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return errorResponse("Email dan password wajib diisi", 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.role !== "admin") {
      return errorResponse("Akses ditolak. Bukan akun admin.", 403);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return errorResponse("Password salah", 401);
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    // Buat response langsung via NextResponse agar bisa set cookie dengan benar
    const res = NextResponse.json({
      success: true,
      data: { name: user.name, email: user.email, role: user.role },
      message: "Login admin berhasil",
    });

    res.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 jam
      path: "/",
    });

    return res;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Admin login error:", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}


