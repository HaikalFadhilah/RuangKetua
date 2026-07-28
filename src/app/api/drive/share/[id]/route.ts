import { NextRequest } from "next/server";
import { Readable } from "stream";
import prisma from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/api-response";
import { GoogleDriveAdapter } from "@/lib/cloud/google-drive";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const accountIdParam = request.nextUrl.searchParams.get("accountId");
    const download = request.nextUrl.searchParams.get("download") === "true";
    const inline = request.nextUrl.searchParams.get("inline") === "true";

    // 1. Try by shareToken
    let cloudFile = await prisma.cloudFile.findUnique({
      where: { shareToken: id },
      include: { account: { include: { user: true } } },
    });

    let account = cloudFile?.account;

    // 2. Fallback to remoteFileId + accountId
    if (!cloudFile && accountIdParam) {
      cloudFile = await prisma.cloudFile.findFirst({
        where: { remoteFileId: id, accountId: accountIdParam },
        include: { account: { include: { user: true } } },
      });
      account = cloudFile?.account;
    }

    if (!account && accountIdParam) {
      account = await prisma.cloudAccount.findUnique({
        where: { id: accountIdParam },
        include: { user: true },
      }) as any;
    }

    if (!account || account.provider !== "google_drive") {
      return errorResponse("Akun atau file tidak ditemukan", 404);
    }

    const adapter = new GoogleDriveAdapter(account);
    const targetFileId = cloudFile ? cloudFile.remoteFileId : id;

    if (download) {
      const nodeStream = await adapter.getDownloadStream(targetFileId);
      const name = cloudFile?.name || "download";
      const webStream = Readable.toWeb(nodeStream as any) as ReadableStream;
      const disposition = inline ? "inline" : "attachment";

      const headers: Record<string, string> = {
        "Content-Type": cloudFile?.mimeType || "application/octet-stream",
        "Content-Disposition": `${disposition}; filename="${name.replace(/"/g, "")}"; filename*=UTF-8''${encodeURIComponent(name)}`,
      };
      if (cloudFile?.size) headers["Content-Length"] = String(cloudFile.size);

      return new Response(webStream, { headers });
    }

    let fileDetails = {
      id: targetFileId,
      name: cloudFile?.name || "Unknown File",
      fileType: cloudFile?.mimeType || "application/octet-stream",
      fileSize: cloudFile?.size ? Number(cloudFile.size) : 0,
      createdAt: cloudFile?.remoteCreatedTime?.toISOString() || cloudFile?.createdAt?.toISOString() || new Date().toISOString(),
      thumbnailLink: cloudFile?.thumbnailLink || null,
      webViewLink: cloudFile?.webViewLink || null,
    };

    if (!cloudFile) {
      const details = await adapter.getFileDetails(targetFileId);
      fileDetails = {
        id: details.id,
        name: details.name,
        fileType: details.mimeType,
        fileSize: details.size,
        createdAt: details.createdTime || new Date().toISOString(),
        thumbnailLink: details.thumbnailLink,
        webViewLink: details.webViewLink,
      };
    }

    const accountIdQuery = accountIdParam ? `&accountId=${accountIdParam}` : "";

    return successResponse({
      id: fileDetails.id,
      name: fileDetails.name,
      fileType: fileDetails.fileType,
      fileSize: fileDetails.fileSize,
      fileUrl: fileDetails.fileType.startsWith("image/")
        ? `/api/drive/share/${id}?download=true&inline=true${accountIdQuery}`
        : fileDetails.webViewLink || `/api/drive/share/${id}?download=true${accountIdQuery}`,
      sharedBy: account.user?.name || account.email || "User",
      createdAt: fileDetails.createdAt,
    });
  } catch (error) {
    console.error("GET /api/drive/share/[id] error:", error);
    return errorResponse(error instanceof Error ? error.message : "Gagal memuat file", 500);
  }
}
