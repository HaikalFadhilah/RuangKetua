import prisma from "@/lib/prisma";
import { GoogleDriveAdapter } from "@/lib/cloud/google-drive";

const FOLDER_MIME = "application/vnd.google-apps.folder";

export interface DriveFileView {
  id: string; // remoteFileId
  dbId: string;
  name: string;
  mimeType: string;
  size: number;
  isFolder: boolean;
  starred: number;
  isShared: boolean;
  parentId: string | null;
  thumbnailLink?: string | null;
  webViewLink?: string | null;
  modifiedTime: string;
  createdTime: string | null;
  accountId: string;
  accountEmail: string | null;
}

function isAuthError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /401|invalid_grant|invalid_client|refresh token|unauthorized|auth/i.test(msg);
}

function norm(f: any) {
  const isFolder = f.mimeType === FOLDER_MIME;
  return {
    remoteFileId: f.id,
    name: f.name || "(untitled)",
    mimeType: f.mimeType || "application/octet-stream",
    size: f.size ? parseInt(f.size, 10) : 0,
    isFolder,
    isStarred: !!f.starred,
    isShared: !!f.shared,
    parentId: f.parents && f.parents[0] ? f.parents[0] : null,
    thumbnailLink: f.thumbnailLink || null,
    webViewLink: f.webViewLink || null,
    remoteCreatedTime: f.createdTime ? new Date(f.createdTime) : null,
    remoteModifiedTime: f.modifiedTime ? new Date(f.modifiedTime) : null,
    virtualPath: f.virtualPath || "/",
  };
}

function toDriveFile(r: any): DriveFileView {
  return {
    id: r.remoteFileId,
    dbId: r.id,
    name: r.name,
    mimeType: r.mimeType,
    size: r.size,
    isFolder: r.isFolder,
    starred: r.isStarred ? 1 : 0,
    isShared: r.isShared,
    parentId: r.parentId,
    thumbnailLink: r.thumbnailLink,
    webViewLink: r.webViewLink,
    modifiedTime: r.remoteModifiedTime
      ? r.remoteModifiedTime.toISOString()
      : new Date(r.updatedAt).toISOString(),
    createdTime: r.remoteCreatedTime ? r.remoteCreatedTime.toISOString() : null,
    accountId: r.accountId,
    accountEmail: r.account?.email ?? null,
  };
}

export async function replaceFilesForAccount(
  userId: string,
  accountId: string,
  rawFiles: any[]
) {
  const data = rawFiles.map((f) => ({ userId, accountId, ...norm(f) }));
  await prisma.cloudFile.deleteMany({ where: { accountId } });
  if (data.length) {
    await prisma.cloudFile.createMany({ data });
  }
}

export async function upsertFile(
  userId: string,
  accountId: string,
  rawFile: any
) {
  const n = norm(rawFile);
  const existing = await prisma.cloudFile.findFirst({
    where: { remoteFileId: n.remoteFileId },
  });
  if (existing) {
    await prisma.cloudFile.update({
      where: { id: existing.id },
      data: { ...n, accountId, userId },
    });
  } else {
    await prisma.cloudFile.create({ data: { userId, accountId, ...n } });
  }
}

export async function deleteCloudFile(remoteFileId: string) {
  await prisma.cloudFile.deleteMany({ where: { remoteFileId } });
}

export async function updateAccountStorage(
  accountId: string,
  total: number,
  used: number
) {
  await prisma.cloudAccount.update({
    where: { id: accountId },
    data: {
      quotaTotal: String(total),
      quotaUsed: String(used),
      lastSyncedAt: new Date(),
    },
  });
}

export async function markAccountInvalid(accountId: string) {
  await prisma.cloudAccount.update({
    where: { id: accountId },
    data: { status: "invalid_token" },
  });
}

export async function syncAccount(userId: string, accountId: string) {
  const account = await prisma.cloudAccount.findFirst({
    where: { id: accountId, userId, provider: "google_drive" },
  });
  if (!account) throw new Error("Akun tidak ditemukan");
  const adapter = new GoogleDriveAdapter(account);
  const [files, summary] = await Promise.all([
    adapter.listAllFiles(),
    adapter.getStorageSummary(),
  ]);
  await replaceFilesForAccount(userId, accountId, files);
  await updateAccountStorage(accountId, summary.totalSpace, summary.usedSpace);
  return { synced: files.length };
}

export async function runFullSync(userId: string) {
  const accounts = await prisma.cloudAccount.findMany({
    where: { userId, provider: "google_drive", status: { not: "invalid_token" } },
    select: { id: true },
  });
  const results: any[] = [];
  for (const a of accounts) {
    try {
      results.push(await syncAccount(userId, a.id));
    } catch (e) {
      if (isAuthError(e)) await markAccountInvalid(a.id);
      throw e;
    }
  }
  return results;
}

export interface GetCloudFilesOpts {
  view?: "list" | "recent" | "starred" | "shared" | "search";
  accountId?: string | null;
  folderId?: string | null;
  q?: string | null;
  limit?: number;
}

export async function getCloudFiles(
  userId: string,
  opts: GetCloudFilesOpts = {}
): Promise<DriveFileView[]> {
  const { view = "list", accountId, folderId, q, limit } = opts;
  const where: any = { userId };
  if (accountId) where.accountId = accountId;
  if (view === "starred") where.isStarred = true;
  if (view === "shared") where.isShared = true;
  if (view === "list")
    where.parentId = folderId && folderId !== "root" ? folderId : null;
  if (view === "search" && q) where.name = { contains: q };

  const orderBy =
    view === "recent"
      ? [{ remoteModifiedTime: "desc" as const }]
      : [{ isFolder: "desc" as const }, { name: "asc" as const }];
  const take = limit && view !== "list" ? limit : undefined;

  const rows = await prisma.cloudFile.findMany({
    where,
    orderBy,
    take,
    include: { account: { select: { id: true, email: true } } },
  });
  return rows.map(toDriveFile);
}

export async function getStorageForAccount(
  userId: string,
  accountId: string
): Promise<{ totalSpace: number; usedSpace: number } | null> {
  const acc = await prisma.cloudAccount.findFirst({
    where: { id: accountId, userId, provider: "google_drive" },
    select: { quotaTotal: true, quotaUsed: true },
  });
  if (!acc) return null;
  return {
    totalSpace: Number(acc.quotaTotal || 0),
    usedSpace: Number(acc.quotaUsed || 0),
  };
}
