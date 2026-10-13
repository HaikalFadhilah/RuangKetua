import { NextRequest } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { isRateLimited, RATE_LIMIT } from "@/lib/rate-limit";
import { sendPasswordResetEmail } from "@/lib/mailer";

function getClientIp(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const body = await request.json();
    const emailRaw =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!emailRaw || !isValidEmail(emailRaw)) {
      return errorResponse("Email tidak valid", 400);
    }

    // Rate limit: per IP dan per email
    if (isRateLimited(`fq:ip:${ip}`, RATE_LIMIT.forgotIp.limit, RATE_LIMIT.forgotIp.windowMs)) {
      return errorResponse("Terlalu banyak permintaan. Coba lagi nanti.", 429);
    }
    if (isRateLimited(`fq:em:${emailRaw}`, RATE_LIMIT.forgotEmail.limit, RATE_LIMIT.forgotEmail.windowMs)) {
      return errorResponse("Terlalu banyak permintaan untuk email ini. Coba lagi nanti.", 429);
    }

    const user = await prisma.user.findUnique({ where: { email: emailRaw } });

    let devToken: string | null = null;

    if (user && !user.isSuspended) {
      const token = crypto.randomInt(100000, 999999).toString();
      const resetTokenHash = hashToken(token);
      const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: resetTokenHash,
          resetTokenExpiry,
          resetAttempts: 0,
        },
      });

      await sendPasswordResetEmail(user.email, token);

      // Token HANYA di-return di development agar alur tes bisa jalan.
      // Di production token sudah dikirim via email / tercatat di console log server.
      if (process.env.NODE_ENV !== "production") {
        devToken = token;
      }
    }

    // Anti-enumerasi: response identik baik email terdaftar / tersuspend / tidak ada
    return successResponse(
      {
        sent: true,
        ...(devToken
          ? {
              _devToken: devToken,
              _devHint: "Mode development - token ditampilkan karena email tidak terkirim.",
            }
          : {}),
      },
      "Jika email terdaftar, kode reset telah dikirim."
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return errorResponse("Terjadi kesalahan", 500);
  }
}