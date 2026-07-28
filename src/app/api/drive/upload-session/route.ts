import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";
import { selectBestAccount } from "@/lib/cloud/allocation";
import prisma from "@/lib/prisma";
import { GoogleDriveAdapter } from "@/lib/cloud/google-drive";
import { markAccountInvalid } from "@/lib/cloud/sync";

function isAuthError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /401|invalid_grant|invalid_client|refresh token|unauthorized|auth/i.test(msg);
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const body = await request.json();
    const { fileName, mimeType, fileSize, accountId, folderId, auto } = body;

    if (!fileName || !fileSize) {
      return errorResponse("Nama file dan ukuran file wajib disertakan", 400);
    }

    // 1. Tentukan akun mana yang akan digunakan untuk menampung file ini
    const alloc = await selectBestAccount(userId, fileSize);
    const targetAccountId = auto ? alloc.selected.id : accountId || alloc.selected.id;
    
    // Susun fallback chain agar kalau akun pertama gagal (misal token expired), dia coba yang lain
    const fallbackChain = alloc.fallbackChain.map((a) => a.id).filter((id) => id !== targetAccountId);
    const orderedIds = [targetAccountId, ...fallbackChain];

    let lastErr: unknown;

    // 2. Loop akun untuk mencari yang siap memberikan URL Session
    for (const accId of orderedIds) {
      const account = await prisma.cloudAccount.findFirst({
        where: { id: accId, userId, provider: "google_drive" },
      });
      if (!account || account.status === "invalid_token") continue;

      try {
        const adapter = new GoogleDriveAdapter(account);
        // Mintakan tiket/link khusus dari Google
        const { sessionUri, accessToken } = await adapter.createResumableSession({
          fileName,
          mimeType: mimeType || "application/octet-stream",
          fileSize,
          parentId: folderId,
        });

        // Kembalikan Link Upload ke React (Client) agar client bisa upload langsung
        return successResponse({
          sessionUri,
          accessToken, // Biasanya Resumable URL tidak butuh token lagi, tapi bisa jadi fallback
          accountId: accId,
        });

      } catch (e) {
        lastErr = e;
        if (isAuthError(e)) {
          await markAccountInvalid(accId); // Tandai rusak lalu lanjut ke akun Google Drive berikutnya
          continue;
        }
        throw e;
      }
    }

    throw lastErr || new Error("Gagal membuat sesi upload ke semua akun Google Drive yang tersedia.");

  } catch (error) {
    console.error("Upload Session API Error:", error);
    return errorResponse(error instanceof Error ? error.message : "Terjadi kesalahan sistem", 500);
  }
}
