import { NextRequest } from "next/server";

export function getUserIdFromRequest(request: NextRequest): string {
  const userId = request.headers.get("x-user-id");
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

