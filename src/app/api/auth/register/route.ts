import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, className, semester, university } = body;

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
    
    // Set expiry to past date -> expired instantly!
    const pastLocker = new Date();
    pastLocker.setMonth(pastLocker.getMonth() - 1); 

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        className: className || null,
        semester: semester || null,
        university: university || null,
        subscriptionPlan: "none",
        subscriptionEnd: pastLocker,
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

    return successResponse(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      "Registrasi berhasil"
    );
  } catch (error) {
    console.error("Register error:", error);
    const message = error instanceof Error ? error.message : "Terjadi kesalahan saat registrasi";
    return errorResponse(message, 500);
  }
}
