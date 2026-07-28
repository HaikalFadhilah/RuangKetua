import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

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
         if (userPayload && (userPayload.role === "admin" || userPayload.role === "super_admin")) {
            // Beri izin masuk ke rk-superadmin buat set token admin
            return NextResponse.redirect(new URL("/rk-superadmin", request.url));
         }
         return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      return NextResponse.redirect(new URL("/rk-superadmin", request.url));
    }

    const payload = await verifyToken(adminToken);
    if (!payload || (payload.role !== "admin" && payload.role !== "super_admin")) {
      const res = userToken 
         ? NextResponse.redirect(new URL("/dashboard", request.url)) 
         : NextResponse.redirect(new URL("/rk-superadmin", request.url));
      res.cookies.set("admin_token", "", { maxAge: 0, path: "/" });
      return res;
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", payload.userId);
    requestHeaders.set("x-user-name", payload.name);
    requestHeaders.set("x-user-role", payload.role);

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // ── HIDE LOGIN ADMIN DARI USER BIASA YANG ISENG ──
  if (pathname === "/rk-superadmin") {
    const adminToken = request.cookies.get("admin_token")?.value;
    const userToken = request.cookies.get("token")?.value;

    // Redirect admin yang sudah login (via admin_token) ke dashboard admin
    if (adminToken) {
      const payload = await verifyToken(adminToken);
      if (payload?.role === "admin") {
        return NextResponse.redirect(new URL("/rk-dashboard", request.url));
      }
    }

    // Cek apakah token user biasa sebenarnya milik admin
    // (misalnya admin juga punya sesi user biasa)
    if (userToken) {
      const payload = await verifyToken(userToken);
      // Kalau user biasa (bukan admin), redirect ke /dashboard
      if (payload && payload.role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      // Kalau ternyata role admin via token user, biarkan akses halaman login admin
    }

    return NextResponse.next();
  }

  // ── USER DASHBOARD ROUTES ───────────────────────────────────
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/tasks") ||
    pathname.startsWith("/courses") ||
    pathname.startsWith("/calendar") ||
    pathname.startsWith("/forum") ||
    pathname.startsWith("/chat") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/elearning") ||
    pathname.startsWith("/broadcast") ||
    pathname.startsWith("/whatsapp") ||
    pathname.startsWith("/repository") ||
    pathname.startsWith("/announcements") ||
    pathname.startsWith("/statistics") ||
    pathname.startsWith("/ai-assistant") ||
    pathname.startsWith("/ocr") ||
    pathname.startsWith("/files") ||
    pathname.startsWith("/notes") ||
    pathname.startsWith("/activity") ||
    pathname.startsWith("/notifications") ||
    pathname.startsWith("/payment")
  ) {
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

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", payload.userId);
    requestHeaders.set("x-user-role", payload.role);
    requestHeaders.set("x-user-name", payload.name);

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // ── API ROUTES ──────────────────────────────────────────────
  if (pathname.startsWith("/api/") &&
      !pathname.startsWith("/api/auth/login") &&
      !pathname.startsWith("/api/auth/register") &&
      !pathname.startsWith("/api/auth/logout") &&
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

      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-user-id", payload.userId);
      requestHeaders.set("x-user-role", payload.role);
      requestHeaders.set("x-user-name", payload.name);
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    // Regular API - coba user token dulu, fallback ke admin_token
    const token = request.cookies.get("token")?.value;
    const adminToken = request.cookies.get("admin_token")?.value;
    const tokenToTry = token || adminToken;

    if (!tokenToTry) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const payload = await verifyToken(tokenToTry);
    if (!payload) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", payload.userId);
    requestHeaders.set("x-user-role", payload.role);
    requestHeaders.set("x-user-name", payload.name);

    return NextResponse.next({ request: { headers: requestHeaders } });
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
    "/files/:path*",
    "/notes/:path*",
    "/activity/:path*",
    "/notifications/:path*",
    "/payment/:path*",
    "/locked/:path*",
    "/rk-superadmin",
    "/rk-dashboard/:path*",
    "/api/:path*",
  ],
};
