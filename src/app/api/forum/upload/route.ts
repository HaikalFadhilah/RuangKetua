import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { successResponse, errorResponse } from "@/lib/api-response";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "forum");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf",
  "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain", "application/zip", "application/x-rar-compressed",
];

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return errorResponse("Unauthorized", 401);

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return errorResponse("Tidak ada file yang diupload", 400);
    }

    if (files.length > 5) {
      return errorResponse("Maksimal 5 file per upload", 400);
    }

    // Ensure upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true });

    const uploaded: { name: string; url: string; type: string; size: number }[] = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return errorResponse(`File ${file.name} melebihi batas 10MB`, 400);
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        return errorResponse(`Tipe file ${file.name} tidak didukung`, 400);
      }

      const ext = path.extname(file.name) || "";
      const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
      const filePath = path.join(UPLOAD_DIR, safeName);

      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, buffer);

      uploaded.push({
        name: file.name,
        url: `/uploads/forum/${safeName}`,
        type: file.type,
        size: file.size,
      });
    }

    return successResponse(uploaded, "File berhasil diupload", 201);
  } catch (error) {
    console.error("Forum upload error:", error);
    return errorResponse("Gagal mengupload file", 500);
  }
}
