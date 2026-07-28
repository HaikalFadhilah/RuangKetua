import prisma from "@/lib/prisma";
import { GoogleDriveAdapter } from "./google-drive";
import { selectBestAccount } from "./allocation";
import { upsertFile, updateAccountStorage, markAccountInvalid } from "./sync";

export interface UploadInput {
  userId: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  folderId?: string;
  accountId?: string | null;
  auto?: boolean;
}

function isAuthError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /401|invalid_grant|invalid_client|refresh token|unauthorized|auth/i.test(msg);
}

export async function uploadFileWithFallback(input: UploadInput) {
  const { userId } = input;
  const alloc = await selectBestAccount(userId, input.buffer.length);
  const targetAccountId = input.auto
    ? alloc.selected.id
    : input.accountId || alloc.selected.id;
  const fallbackChain = alloc.fallbackChain
    .map((a) => a.id)
    .filter((id) => id !== targetAccountId);

  const orderedIds = [targetAccountId, ...fallbackChain];
  let lastErr: unknown;

  for (const accId of orderedIds) {
    const account = await prisma.cloudAccount.findFirst({
      where: { id: accId, userId, provider: "google_drive" },
    });
    if (!account) continue;
    if (account.status === "invalid_token") continue;

    try {
      const adapter = new GoogleDriveAdapter(account);
      const result = await adapter.upload({
        fileName: input.fileName,
        mimeType: input.mimeType,
        buffer: input.buffer,
        parentId: input.folderId,
      });

      const used = Number(account.quotaUsed || 0) + input.buffer.length;
      await updateAccountStorage(
        accId,
        Number(account.quotaTotal || 0),
        used
      );
      await upsertFile(userId, accId, {
        id: result.id,
        name: result.name,
        mimeType: result.mimeType,
        size: result.size,
        parents: result.parentId ? [result.parentId] : [],
        webViewLink: result.webViewLink ?? null,
        thumbnailLink: null,
        starred: false,
        shared: false,
        createdTime: new Date().toISOString(),
        modifiedTime: new Date().toISOString(),
      });
      await prisma.activityLog.create({
        data: {
          userId,
          action: "CREATE",
          entity: "cloud_file",
          entityId: result.id,
          description: `Upload file ke Google Drive: ${input.fileName}`,
        },
      });
      return { ...result, accountId: accId };
    } catch (e) {
      lastErr = e;
      if (isAuthError(e)) {
        await markAccountInvalid(accId);
        continue;
      }
      throw e;
    }
  }
  throw lastErr || new Error("Upload gagal ke Google Drive");
}
