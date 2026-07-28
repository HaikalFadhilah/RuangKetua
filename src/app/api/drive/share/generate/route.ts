import { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-response";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await req.json();
    const { dbId } = body;

    if (!dbId) {
      return errorResponse("Missing dbId", 400);
    }

    const file = await prisma.cloudFile.findUnique({
      where: { id: dbId },
    });

    if (!file) {
      return errorResponse("File not found", 404);
    }

    if (file.userId !== userId) {
      return errorResponse("Forbidden", 403);
    }

    if (file.shareToken) {
      return successResponse({ token: file.shareToken });
    }

    // Generate random 6-character token
    const token = crypto.randomBytes(3).toString("hex");

    await prisma.cloudFile.update({
      where: { id: dbId },
      data: { shareToken: token, isShared: true },
    });

    return successResponse({ token });
  } catch (error) {
    console.error("POST /api/drive/share/generate error:", error);
    return errorResponse(error instanceof Error ? error.message : "Failed to generate share link", 500);
  }
}
