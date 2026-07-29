import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";
import path from "path";
import { uploadFileWithFallback } from "@/lib/cloud/upload";

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

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Upload file ke Google Drive pakai alokasi strategi user (auto=true)
    const driveResult = await uploadFileWithFallback({
      userId,
      fileName: file.name,
      mimeType: file.type || ext.replace(".", ""),
      buffer,
      auto: true,
    });

    if (!driveResult || !driveResult.id) {
      throw new Error("Gagal mengupload ke Google Drive");
    }

    // Ambil webViewLink dari CloudFile yang baru dibuat
    const cloudFile = await prisma.cloudFile.findUnique({
      where: { id: driveResult.id },
    });

    const fileUrl = cloudFile?.webViewLink || "#";

    const savedFile = await prisma.sharedFile.create({
      data: {
        userId,
        courseId: courseId || null,
        name: file.name,
        fileUrl, // Pakai link Google Drive
        fileType: file.type || ext.replace(".", ""),
        fileSize: file.size,
      },
    });

    // Karena tidak ada kolom remoteFileId di SharedFile, kita simpan ID Drive-nya 
    // ke dalam shareToken agar bisa digunakan sebagai penanda sinkronisasi hapus 
    // (daripada merombak schema prisma yang bisa bikin app crash di production)
    await prisma.sharedFile.update({
      where: { id: savedFile.id },
      data: { shareToken: `sync_${driveResult.id}` }
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: "CREATE",
        entity: "file",
        entityId: savedFile.id,
        description: `Mengupload file (GDrive): ${file.name}`,
      },
    });

    return successResponse(savedFile, "File berhasil diupload ke Google Drive", 201);
  } catch (error) {
    console.error("Files POST error:", error);
    return errorResponse(error instanceof Error ? error.message : "Gagal mengupload file", 500);
  }
}
