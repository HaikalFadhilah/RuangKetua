import { NextResponse } from "next/server";
import { successResponse } from "@/lib/api-response";

export async function POST() {
  const res = successResponse(null, "Logout admin berhasil");
  res.cookies.set("admin_token", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });
  return res;
}
