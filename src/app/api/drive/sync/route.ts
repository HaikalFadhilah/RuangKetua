import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";
import { runFullSync } from "@/lib/cloud/sync";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const result = await runFullSync(userId);
    return successResponse(result, "Sinkronisasi selesai");
  } catch (error) {
    console.error("POST /api/drive/sync error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Gagal sinkronisasi",
      500
    );
  }
}
