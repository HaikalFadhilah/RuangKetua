import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { isRateLimited, RATE_LIMIT } from "@/lib/rate-limit";

const MAX_VERIFY_ATTEMPTS = 10;

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

function getAppOrigin(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://ruangketua.com").replace(/\/$/, "");
}

function redirectToLogin(reason: string): NextResponse {
  return NextResponse.redirect(`${getAppOrigin()}/login?magic=${reason}`);
}

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase() || "";
    const token = request.nextUrl.searchParams.get("token")?.trim() || "";

    if (!email || !token) {
      return redirectToLogin( "invalid");
    }

    if (isRateLimited(`mlv:ip:${ip}`, MAX_VERIFY_ATTEMPTS, RATE_LIMIT.resetEmail.windowMs)) {
      return redirectToLogin( "limited");
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.magicToken || !user.magicTokenExpiry) {
      return redirectToLogin( "invalid");
    }

    if (user.isSuspended) {
      return redirectToLogin( "suspended");
    }

    // Timing-safe comparison terhadap hash
    const providedHash = Buffer.from(hashToken(token), "hex");
    const storedHash = Buffer.from(user.magicToken, "hex");
    if (!safeEqual(providedHash, storedHash)) {
      return redirectToLogin( "invalid");
    }

    if (new Date() > user.magicTokenExpiry) {
      await prisma.user.update({
        where: { id: user.id },
        data: { magicToken: null, magicTokenExpiry: null },
      });
      return redirectToLogin( "expired");
    }

    // Valid -> single-use token, buat sesi JWT
    await prisma.user.update({
      where: { id: user.id },
      data: { magicToken: null, magicTokenExpiry: null },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "MAGIC_LINK_LOGIN",
        entity: "user",
        entityId: user.id,
        description: "Login berhasil via magic link",
      },
    });

    const jwt = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const target = user.role === "admin" ? "/rk-dashboard" : "/dashboard";
    const response = NextResponse.redirect(`${getAppOrigin()}${target}`);

    response.cookies.set("token", jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    if (isAdminRole(user.role)) {
      response.cookies.set("admin_token", jwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 8,
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Magic link verify error:", error);
    return redirectToLogin( "invalid");
  }
}

function isAdminRole(role: string): boolean {
  return role === "admin" || role === "super_admin";
}