import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "application/x-zip-compressed",
  "application/x-rar-compressed",
  "video/mp4",
  "video/webm",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "text/plain",
  "text/csv",
];

const ALLOWED_EXTENSIONS = [
  ".pdf", ".docx", ".doc", ".pptx", ".ppt", ".xlsx", ".xls",
  ".zip", ".rar", ".mp4", ".webm", ".png", ".jpg", ".jpeg",
  ".gif", ".webp", ".txt", ".csv",
];

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    const where: Record<string, unknown> = { userId };
    if (courseId) where.courseId = courseId;

    const files = await prisma.sharedFile.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return successResponse(files);
  } catch (error) {
    console.error("Files GET error:", error);
    return errorResponse("Gagal mengambil file", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const courseId = formData.get("courseId") as string | null;

    if (!file) {
      return errorResponse("File wajib diupload", 400);
    }

    // Validate file size
    const maxSize = parseInt(process.env.MAX_FILE_SIZE || "10485760");
    if (file.size > maxSize) {
      return errorResponse("Ukuran file melebihi batas (10MB)", 400);
    }

    // Validate file type
    const ext = path.extname(file.name).toLowerCase();
    const isAllowedType = ALLOWED_TYPES.includes(file.type);
    const isAllowedExt = ALLOWED_EXTENSIONS.includes(ext);
    if (!isAllowedType && !isAllowedExt) {
      return errorResponse(`Tipe file ${ext || file.type} tidak diizinkan. Gunakan: PDF, DOCX, PPTX, ZIP, gambar, atau video.`, 400);
    }

    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = path.join(UPLOAD_DIR, uniqueName);

    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const savedFile = await prisma.sharedFile.create({
      data: {
        userId,
        courseId: courseId || null,
        name: file.name,
        fileUrl: `/uploads/${uniqueName}`,
        fileType: file.type || ext.replace(".", ""),
        fileSize: file.size,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: "CREATE",
        entity: "file",
        entityId: savedFile.id,
        description: `Mengupload file: ${file.name}`,
      },
    });

    return successResponse(savedFile, "File berhasil diupload", 201);
  } catch (error) {
    console.error("Files POST error:", error);
    return errorResponse("Gagal mengupload file", 500);
  }
}
