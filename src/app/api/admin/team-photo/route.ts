import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { invalidateSystemSettingsCache } from "@/lib/system-settings";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "team");
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MEMBER_FIELDS = ["teamPhoto1", "teamPhoto2", "teamPhoto3"] as const;

export async function POST(request: NextRequest) {
  try {
    const userRole = request.headers.get("x-user-role");
    if (userRole !== "admin") return errorResponse("Unauthorized", 403);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const memberIndex = Number(formData.get("memberIndex"));

    if (!file) return errorResponse("File wajib diupload", 400);
    if (!memberIndex || memberIndex < 1 || memberIndex > 3)
      return errorResponse("memberIndex harus 1, 2, atau 3", 400);
    if (file.size > MAX_FILE_SIZE)
      return errorResponse("File melebihi batas 5MB", 400);
    if (!ALLOWED_TYPES.includes(file.type))
      return errorResponse("Hanya JPEG, PNG, atau WebP yang didukung", 400);

    await mkdir(UPLOAD_DIR, { recursive: true });

    const ext = path.extname(file.name) || ".jpg";
    const safeName = `member-${memberIndex}-${Date.now()}${ext}`;
    const filePath = path.join(UPLOAD_DIR, safeName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const url = `/uploads/team/${safeName}`;
    const field = MEMBER_FIELDS[memberIndex - 1];

    let settings = await prisma.systemSettings.findFirst();
    if (!settings) {
      settings = await prisma.systemSettings.create({ data: {} });
    }

    const updated = await prisma.systemSettings.update({
      where: { id: settings.id },
      data: { [field]: url },
    });

    invalidateSystemSettingsCache();

    return successResponse(
      { url, memberIndex },
      "Foto berhasil diupload",
      201
    );
  } catch (error) {
    console.error("POST /api/admin/team-photo error:", error);
    return errorResponse("Gagal mengupload foto", 500);
  }
}
