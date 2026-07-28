import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";
import { uploadFileWithFallback } from "@/lib/cloud/upload";

export const runtime = "nodejs";

const MAX_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const accountId = (formData.get("accountId") as string | null) || null;
    const auto = formData.get("auto") === "true";
    const folderId = (formData.get("folderId") as string | null) || undefined;

    if (!file) return errorResponse("File wajib diupload", 400);
    if (file.size > MAX_SIZE) return errorResponse("Ukuran file melebihi batas (10MB)", 400);

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadFileWithFallback({
      userId,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      buffer,
      folderId,
      accountId,
      auto,
    });

    return successResponse(result, "Berhasil diupload ke Google Drive", 201);
  } catch (error) {
    console.error("POST /api/drive/upload error:", error);
    return errorResponse(error instanceof Error ? error.message : "Gagal upload ke Google Drive", 500);
  }
}
