import prisma from "@/lib/prisma";
import { GoogleDriveAdapter } from "@/lib/cloud/google-drive";
import { deleteCloudFile } from "@/lib/cloud/sync";

export async function deleteCloudFileForUser(
  userId: string,
  accountId: string,
  remoteFileId: string
) {
  const account = await prisma.cloudAccount.findFirst({
    where: { id: accountId, userId, provider: "google_drive" },
  });
  if (!account) return false;

  const mirror = await prisma.cloudFile.findFirst({
    where: { remoteFileId, userId, accountId },
  });

  try {
    const adapter = new GoogleDriveAdapter(account);
    await adapter.deleteFile(remoteFileId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/404|notFound|not found/i.test(message)) throw error;
  }

  if (mirror) {
    const used = Math.max(0, Number(account.quotaUsed || 0) - (mirror.size || 0));
    await prisma.cloudAccount.update({
      where: { id: accountId },
      data: { quotaUsed: String(used) },
    });

    await prisma.material.deleteMany({
      where: {
        OR: [
          { fileUrl: { contains: remoteFileId } },
          { fileUrl: mirror.webViewLink || "impossible-match" },
        ],
      },
    });
    await prisma.sharedFile.deleteMany({
      where: {
        userId,
        OR: [
          { fileUrl: { contains: remoteFileId } },
          { fileUrl: mirror.webViewLink || "impossible-match" },
          { shareToken: { contains: remoteFileId } },
        ],
      },
    });
  }

  await deleteCloudFile(remoteFileId);
  return true;
}
