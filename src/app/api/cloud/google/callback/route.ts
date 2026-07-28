import { NextRequest, NextResponse } from "next/server";
import { completeGoogleAccountLink } from "@/lib/cloud/google-drive";

export const runtime = "nodejs";

function redirectBase() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");
  const base = redirectBase();

  if (oauthError) {
    console.error("[drive-callback] oauth error:", oauthError);
    return NextResponse.redirect(`${base}/drive?status=error&reason=${encodeURIComponent(oauthError)}`);
  }
  if (!code || !state) {
    return NextResponse.redirect(`${base}/drive?status=error&reason=missing_params`);
  }

  try {
    await completeGoogleAccountLink({ code, state });
    return NextResponse.redirect(`${base}/drive?status=connected`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "oauth_failed";
    console.error("[drive-callback] error:", msg, err);
    return NextResponse.redirect(`${base}/drive?status=error&reason=${encodeURIComponent(msg)}`);
  }
}
