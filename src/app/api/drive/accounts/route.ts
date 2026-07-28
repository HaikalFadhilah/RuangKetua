import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";
import { runFullSync } from "@/lib/cloud/sync";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const sync = searchParams.get("sync") === "true";

    if (sync) {
      try {
        await runFullSync(userId);
      } catch (e) {
        console.error("drive sync error:", e);
      }
    }

    const accounts = await prisma.cloudAccount.findMany({
      where: { userId, provider: "google_drive" },
      select: { id: true, email: true, provider: true, quotaTotal: true, quotaUsed: true, status: true, lastSyncedAt: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return successResponse(accounts);
  } catch (error) {
    console.error("GET /api/drive/accounts error:", error);
    return errorResponse("Gagal mengambil akun Drive", 500);
  }
}
