import { successResponse } from "@/lib/api-response";

export async function POST() {
  const res = successResponse(null, "Logout berhasil");
  res.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return res;
}
