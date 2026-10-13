import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { isRateLimited, RATE_LIMIT } from "@/lib/rate-limit";

const MAX_TOKEN_ATTEMPTS = 5;

function getClientIp(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function safeEqual(a: Buffer | Uint8Array, b: Buffer | Uint8Array): boolean {
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function isValidPassword(pw: string): { ok: boolean; message?: string } {
  if (pw.length < 8) {
    return { ok: false, message: "Password minimal 8 karakter" };
  }
  if (!/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) {
    return { ok: false, message: "Password harus mengandung huruf dan angka" };
  }
  return { ok: true };
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const body = await request.json();
    const emailRaw =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const tokenRaw = typeof body?.token === "string" ? body.token.trim() : "";
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

    if (!emailRaw || !tokenRaw || !newPassword) {
      return errorResponse("Email, kode, dan password baru wajib diisi", 400);
    }

    const pwCheck = isValidPassword(newPassword);
    if (!pwCheck.ok) {
      return errorResponse(pwCheck.message!, 400);
    }

    // Rate limit: per IP dan per email
    if (isRateLimited(`rp:ip:${ip}`, RATE_LIMIT.resetIp.limit, RATE_LIMIT.resetIp.windowMs)) {
      return errorResponse("Terlalu banyak percobaan. Coba lagi nanti.", 429);
    }
    if (isRateLimited(`rp:em:${emailRaw}`, RATE_LIMIT.resetEmail.limit, RATE_LIMIT.resetEmail.windowMs)) {
      return errorResponse("Terlalu banyak percobaan untuk email ini. Coba lagi nanti.", 429);
    }

    const user = await prisma.user.findUnique({ where: { email: emailRaw } });

    // Pesan generik untuk semua kegagalan (anti-enumerasi & anti-tekon-tekan)
    const genericFail = () => errorResponse("Kode reset tidak valid atau telah kedaluwarsa.", 400);

    if (!user) {
      return genericFail();
    }

    if (user.isSuspended) {
      return errorResponse("Akun Anda telah ditangguhkan.", 403);
    }

    if (!user.resetToken || !user.resetTokenExpiry) {
      return genericFail();
    }

    // Batas percobaan salah -> token langsung di-invalidasi
    if ((user.resetAttempts ?? 0) >= MAX_TOKEN_ATTEMPTS) {
      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: null, resetTokenExpiry: null, resetAttempts: 0 },
      });
      return genericFail();
    }

    // Timing-safe comparison terhadap hash token
    const providedHash = Buffer.from(hashToken(tokenRaw), "hex");
    const storedHash = Buffer.from(user.resetToken, "hex");
    if (!safeEqual(providedHash, storedHash)) {
      await prisma.user.update({
        where: { id: user.id },
        data: { resetAttempts: (user.resetAttempts ?? 0) + 1 },
      });
      return genericFail();
    }

    if (new Date() > user.resetTokenExpiry) {
      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: null, resetTokenExpiry: null, resetAttempts: 0 },
      });
      return genericFail();
    }

    // Valid -> reset password, hapus token, balikin counter
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        resetAttempts: 0,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "RESET_PASSWORD",
        entity: "user",
        entityId: user.id,
        description: "Password berhasil direset via forgot password",
      },
    });

    return successResponse(null, "Password berhasil direset. Silakan login.");
  } catch (error) {
    console.error("Reset password error:", error);
    return errorResponse("Terjadi kesalahan", 500);
  }
}