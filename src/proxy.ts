import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

function isAdminRole(role?: string) {
  return role === "admin" || role === "super_admin";
}

const DASHBOARD_ROUTE_PREFIXES = [
  "/dashboard",
  "/tasks",
  "/courses",
  "/calendar",
  "/forum",
  "/chat",
  "/settings",
  "/elearning",
  "/broadcast",
  "/whatsapp",
  "/repository",
  "/announcements",
  "/statistics",
  "/ai-assistant",
  "/ocr",
  "/drive",
  "/files",
  "/spreadsheets",
  "/members",
  "/notes",
  "/activity",
  "/notifications",
  "/tickets",
  "/payment",
  "/reminders",
] as const;

function matchesRoutePrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function requestWithAuthHeaders(request: NextRequest, payload: Awaited<ReturnType<typeof verifyToken>>) {
  if (!payload) return {};

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", payload.userId);
  requestHeaders.set("x-user-name", payload.name);
  requestHeaders.set("x-user-role", payload.role);

  return { request: { headers: requestHeaders } };
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── ADMIN PANEL ROUTES ──────────────────────────────────────
  if (pathname.startsWith("/rk-dashboard")) {
    const adminToken = request.cookies.get("admin_token")?.value;
    const userToken = request.cookies.get("token")?.value;

    if (!adminToken) {
      // Jika user biasa login (ada token) nyoba buka rk-dashboard, kita cek dulu role-nya
      if (userToken) {
         const userPayload = await verifyToken(userToken);
         if (userPayload && isAdminRole(userPayload.role)) {
            // Beri izin masuk ke rk-superadmin buat set token admin
            return NextResponse.redirect(new URL("/rk-superadmin", request.url));
         }
         return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      return NextResponse.redirect(new URL("/rk-superadmin", request.url));
    }

    const payload = await verifyToken(adminToken);
    if (!payload || !isAdminRole(payload.role)) {
      const res = userToken 
         ? NextResponse.redirect(new URL("/dashboard", request.url)) 
         : NextResponse.redirect(new URL("/rk-superadmin", request.url));
      res.cookies.set("admin_token", "", { maxAge: 0, path: "/" });
      return res;
    }

    return NextResponse.next(requestWithAuthHeaders(request, payload));
  }

  // ── HIDE LOGIN ADMIN DARI USER BIASA YANG ISENG ──
  if (pathname === "/rk-superadmin") {
    const adminToken = request.cookies.get("admin_token")?.value;
    const userToken = request.cookies.get("token")?.value;

    // Redirect admin yang sudah login (via admin_token) ke dashboard admin
    if (adminToken) {
      const payload = await verifyToken(adminToken);
      if (isAdminRole(payload?.role)) {
        return NextResponse.redirect(new URL("/rk-dashboard", request.url));
      }
    }

    // Cek apakah token user biasa sebenarnya milik admin
    // (misalnya admin juga punya sesi user biasa)
    if (userToken) {
      const payload = await verifyToken(userToken);
      // Kalau user biasa (bukan admin), redirect ke /dashboard
      if (payload && !isAdminRole(payload.role)) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      // Kalau ternyata role admin via token user, biarkan akses halaman login admin
    }

    return NextResponse.next();
  }

  // ── USER DASHBOARD ROUTES ───────────────────────────────────
  if (DASHBOARD_ROUTE_PREFIXES.some((prefix) => matchesRoutePrefix(pathname, prefix))) {
    const token = request.cookies.get("token")?.value;
    const adminToken = request.cookies.get("admin_token")?.value;
    const baseToken = token || adminToken;

    if (!baseToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const payload = await verifyToken(baseToken);
    if (!payload) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next(requestWithAuthHeaders(request, payload));
  }

  // ── API ROUTES ──────────────────────────────────────────────
  if (pathname.startsWith("/api/") &&
      !pathname.startsWith("/api/auth/login") &&
      !pathname.startsWith("/api/auth/register") &&
      !pathname.startsWith("/api/auth/logout") &&
      !pathname.startsWith("/api/auth/forgot-password") &&
      !pathname.startsWith("/api/auth/reset-password") &&
      !pathname.startsWith("/api/auth/magic-link") &&
      !pathname.startsWith("/api/cron/") &&
      !pathname.startsWith("/api/admin/auth") &&
      !pathname.startsWith("/api/public/") &&
      !pathname.startsWith("/api/payment/callback") &&
      !pathname.startsWith("/api/cloud/google/callback")
  ) {
    // Admin API routes - pakai admin_token
    if (pathname.startsWith("/api/admin/")) {
      const adminToken = request.cookies.get("admin_token")?.value;
      const userToken = request.cookies.get("token")?.value;

      const tokenToVerify = adminToken || userToken;
      if (!tokenToVerify) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

      const payload = await verifyToken(tokenToVerify);
      if (!payload) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      if (!isAdminRole(payload.role)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

      return NextResponse.next(requestWithAuthHeaders(request, payload));
    }

    // Regular API - coba user token dulu, fallback ke admin_token
    const token = request.cookies.get("token")?.value;
    const adminToken = request.cookies.get("admin_token")?.value;
    const tokenToTry = token || adminToken;

    if (!tokenToTry) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const payload = await verifyToken(tokenToTry);
    if (!payload) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    return NextResponse.next(requestWithAuthHeaders(request, payload));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/tasks/:path*",
    "/courses/:path*",
    "/calendar/:path*",
    "/forum/:path*",
    "/chat/:path*",
    "/settings/:path*",
    "/elearning/:path*",
    "/broadcast/:path*",
    "/whatsapp/:path*",
    "/repository/:path*",
    "/announcements/:path*",
    "/statistics/:path*",
    "/ai-assistant/:path*",
    "/ocr/:path*",
    "/drive/:path*",
    "/files/:path*",
    "/spreadsheets/:path*",
    "/members/:path*",
    "/notes/:path*",
    "/reminders/:path*",
    "/activity/:path*",
    "/notifications/:path*",
    "/tickets/:path*",
    "/payment/:path*",
    "/locked/:path*",
    "/rk-superadmin",
    "/rk-dashboard/:path*",
    "/api/:path*",
  ],
};
