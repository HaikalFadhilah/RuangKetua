import { NextRequest } from "next/server";
import { Readable } from "stream";
import prisma from "@/lib/prisma";
import { errorResponse } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";
import { GoogleDriveAdapter } from "@/lib/cloud/google-drive";

export const runtime = "nodejs";

async function resolveAccount(userId: string, remoteFileId: string, accountId?: string | null) {
  if (accountId) {
    const acc = await prisma.cloudAccount.findFirst({ where: { id: accountId, userId, provider: "google_drive" } });
    if (!acc) throw new Error("Akun tidak ditemukan");
    return acc;
  }
  const mirror = await prisma.cloudFile.findFirst({ where: { remoteFileId, userId } });
  if (!mirror) throw new Error("File tidak ditemukan");
  const acc = await prisma.cloudAccount.findFirst({ where: { id: mirror.accountId, userId, provider: "google_drive" } });
  if (!acc) throw new Error("Akun tidak ditemukan");
  return acc;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    const { id } = await params;
    const accountId = request.nextUrl.searchParams.get("accountId") || undefined;

    const account = await resolveAccount(userId, id, accountId);
    const adapter = new GoogleDriveAdapter(account);
    const nodeStream = await adapter.getDownloadStream(id);
    const mirror = await prisma.cloudFile.findFirst({ where: { remoteFileId: id, userId } });

    const webStream = Readable.toWeb(nodeStream as any) as ReadableStream;
    const headers: Record<string, string> = {
      "Content-Type": mirror?.mimeType || "application/octet-stream",
      "Content-Disposition": "inline",
    };
    if (mirror?.size) headers["Content-Length"] = String(mirror.size);

    return new Response(webStream, { headers });
  } catch (error) {
    console.error("GET /api/drive/files/[id]/preview error:", error);
    return errorResponse(error instanceof Error ? error.message : "Gagal memuat pratinjau", 500);
  }
}
