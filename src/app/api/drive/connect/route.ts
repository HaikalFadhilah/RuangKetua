import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/api-utils";
import { createGoogleAuthRequest } from "@/lib/cloud/google-drive";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { url, state } = await createGoogleAuthRequest(userId);
    const res = NextResponse.redirect(url);
    res.cookies.set("gd_oauth_state", state, { httpOnly: true, sameSite: "lax", maxAge: 600, path: "/" });
    return res;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "oauth_init_failed";
    console.error("[drive-connect] error:", msg, err);
    const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(`${base}/drive?status=error&reason=${encodeURIComponent(msg)}`);
  }
}
