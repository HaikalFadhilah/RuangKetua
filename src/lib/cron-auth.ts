import { NextRequest } from "next/server";
import { errorResponse } from "@/lib/api-response";

export function authorizeCronRequest(request: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET?.trim();

  if (!expectedSecret) {
    return errorResponse("CRON_SECRET belum dikonfigurasi", 500);
  }

  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret")?.trim();

  if (!secret || secret !== expectedSecret) {
    return errorResponse("Unauthorized", 401);
  }

  return null;
}
