import { NextRequest } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { isRateLimited, RATE_LIMIT } from "@/lib/rate-limit";
import { sendMagicLinkEmail } from "@/lib/mailer";

const MAGIC_TOKEN_TTL = 10 * 60 * 1000; // 10 menit

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
    if (isRateLimited(`mlq:ip:${ip}`, RATE_LIMIT.forgotIp.limit, RATE_LIMIT.forgotIp.windowMs)) {
      return errorResponse("Terlalu banyak permintaan. Coba lagi nanti.", 429);
    }
    if (isRateLimited(`mlq:em:${emailRaw}`, RATE_LIMIT.forgotEmail.limit, RATE_LIMIT.forgotEmail.windowMs)) {
      return errorResponse("Terlalu banyak permintaan untuk email ini. Coba lagi nanti.", 429);
    }

    const user = await prisma.user.findUnique({ where: { email: emailRaw } });

    let devLink: string | null = null;

    if (user && !user.isSuspended) {
      const token = crypto.randomBytes(32).toString("base64url");
      const magicTokenHash = hashToken(token);
      const magicTokenExpiry = new Date(Date.now() + MAGIC_TOKEN_TTL);

      await prisma.user.update({
        where: { id: user.id },
        data: { magicToken: magicTokenHash, magicTokenExpiry },
      });

      const origin =
        process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://ruangketua.com";
      const link = `${origin}/api/auth/magic-link/verify?email=${encodeURIComponent(
        user.email
      )}&token=${encodeURIComponent(token)}`;

      await sendMagicLinkEmail(user.email, link);

      if (process.env.NODE_ENV !== "production") {
        devLink = link;
      }
    }

    // Anti-enumerasi: response identik untuk semua kasus
    return successResponse(
      {
        sent: true,
        ...(devLink
          ? {
              _devLink: devLink,
              _devHint: "Mode development - link ditampilkan karena email tidak terkirim.",
            }
          : {}),
      },
      "Jika email terdaftar, link login telah dikirim. Link berlaku 10 menit dan hanya sekali pakai."
    );
  } catch (error) {
    console.error("Magic link request error:", error);
    return errorResponse("Terjadi kesalahan", 500);
  }
}