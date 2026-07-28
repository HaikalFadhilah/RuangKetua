import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

export const runtime = "nodejs";

const ALLOCATION_STRATEGIES = [
  "round_robin",
  "weighted_round_robin",
  "least_used",
  "most_free",
  "custom",
] as const;

type Strategy = (typeof ALLOCATION_STRATEGIES)[number];

function getUserId(request: NextRequest): string {
  const userId = request.headers.get("x-user-id");
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

async function ensureSettings(userId: string) {
  return prisma.userSettings.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const settings = await ensureSettings(userId);
    return successResponse({
      language: settings.language,
      allocationStrategy: settings.allocationStrategy,
      allocationOrder: settings.allocationOrder
        ? JSON.parse(settings.allocationOrder)
        : [],
      driveUploadMode: settings.driveUploadMode,
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Terjadi kesalahan", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const body = await request.json();
    await ensureSettings(userId);

    const data: Record<string, unknown> = {};

    if (typeof body.language === "string") {
      if (body.language !== "id" && body.language !== "en") {
        return errorResponse("Bahasa tidak didukung", 400);
      }
      data.language = body.language;
    }

    if (typeof body.allocationStrategy === "string") {
      if (!ALLOCATION_STRATEGIES.includes(body.allocationStrategy as Strategy)) {
        return errorResponse("Metode alokasi tidak valid", 400);
      }
      data.allocationStrategy = body.allocationStrategy;
    }

    if (body.allocationOrder !== undefined) {
      if (!Array.isArray(body.allocationOrder)) {
        return errorResponse("Urutan alokasi harus berupa array", 400);
      }
      data.allocationOrder = JSON.stringify(body.allocationOrder);
    }

    if (typeof body.driveUploadMode === "string") {
      if (body.driveUploadMode !== "manual" && body.driveUploadMode !== "auto") {
        return errorResponse("Mode unggah tidak valid", 400);
      }
      data.driveUploadMode = body.driveUploadMode;
    }

    const updated = await prisma.userSettings.update({
      where: { userId },
      data,
    });

    return successResponse({
      language: updated.language,
      allocationStrategy: updated.allocationStrategy,
      allocationOrder: updated.allocationOrder
        ? JSON.parse(updated.allocationOrder)
        : [],
      driveUploadMode: updated.driveUploadMode,
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Terjadi kesalahan", 500);
  }
}
