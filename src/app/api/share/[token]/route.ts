import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import path from "path";
import { existsSync } from "fs";
import { readFile, stat } from "fs/promises";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const file = await prisma.sharedFile.findUnique({
      where: { shareToken: token },
      include: { user: { select: { name: true } } },
    });

    if (!file || !file.isPublic) {
      return NextResponse.json(
        { success: false, error: "File tidak ditemukan atau link sudah tidak aktif" },
        { status: 404 }
      );
    }

    const download = request.nextUrl.searchParams.get("download");

    // If download=true, serve the file directly
    if (download === "true") {
      const filePath = path.join(process.cwd(), "public", file.fileUrl);
      if (!existsSync(filePath)) {
        return NextResponse.json(
          { success: false, error: "File fisik tidak ditemukan" },
          { status: 404 }
        );
      }

      const fileStat = await stat(filePath);
      const fileBuffer = await readFile(filePath);

      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": file.fileType || "application/octet-stream",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(file.name)}"`,
          "Content-Length": fileStat.size.toString(),
        },
      });
    }

    // Otherwise return file info (for the public page)
    return NextResponse.json({
      success: true,
      data: {
        name: file.name,
        fileType: file.fileType,
        fileSize: file.fileSize,
        fileUrl: file.fileUrl,
        sharedBy: file.user.name,
        createdAt: file.createdAt,
      },
    });
  } catch (error) {
    console.error("Share GET error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil file" },
      { status: 500 }
    );
  }
}
