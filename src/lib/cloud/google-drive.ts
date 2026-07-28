import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import { google } from "googleapis";
import { encryptJson, decryptJson } from "@/lib/crypto";
import { getSystemSettings } from "@/lib/system-settings";
import { Readable } from "stream";

const FOLDER_MIME = "application/vnd.google-apps.folder";

const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/drive.metadata",
  "https://www.googleapis.com/auth/spreadsheets", // Akses untuk Google Sheets API
];

// State store (dev single-process). Persist di globalThis agar survive HMR.
const stateStore: Map<string, { userId: string; createdAt: number }> =
  (globalThis as any).__gdriveStates || ((globalThis as any).__gdriveStates = new Map());

export interface DriveCredentials {
  provider: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken: string | null;
  accessToken: string | null;
  expiryDate: number | null;
  scope: string | null;
  tokenType: string | null;
}

export interface CloudConfig {
  clientId: string;
  clientSecret: string;
  tokenSecret: string;
  redirectUri: string;
}

export async function getCloudConfig(): Promise<CloudConfig> {
  const s = await getSystemSettings();
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return {
    clientId: (s.googleClientId || process.env.GOOGLE_CLIENT_ID || "").trim(),
    clientSecret: (s.googleClientSecret || process.env.GOOGLE_CLIENT_SECRET || "").trim(),
    tokenSecret: (s.driveTokenSecret || process.env.DRIVE_TOKEN_SECRET || process.env.JWT_SECRET || "dev-insecure-fallback-secret").trim(),
    redirectUri: (process.env.GOOGLE_REDIRECT_URI || `${base}/api/cloud/google/callback`).trim(),
  };
}

export async function createGoogleAuthRequest(userId: string): Promise<{ url: string; state: string }> {
  const cfg = await getCloudConfig();
  const oauth2Client = new google.auth.OAuth2(cfg.clientId, cfg.clientSecret, cfg.redirectUri);
  const state = randomUUID();
  stateStore.set(state, { userId, createdAt: Date.now() });
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state,
  });
  return { url, state };
}

export async function completeGoogleAccountLink({ code, state }: { code: string; state: string }) {
  const entry = stateStore.get(state);
  if (!entry) throw new Error("Invalid or expired Google OAuth state");
  stateStore.delete(state);

  const cfg = await getCloudConfig();
  const oauth2Client = new google.auth.OAuth2(cfg.clientId, cfg.clientSecret, cfg.redirectUri);
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const drive = google.drive({ version: "v3", auth: oauth2Client });
  const about = await drive.about.get({
    fields: "user(emailAddress,displayName),storageQuota(limit,usage)",
  });
  const user = about.data.user || {};
  const quota = about.data.storageQuota || {};

  if (!user.emailAddress) throw new Error("Tidak dapat membaca email akun Google");

  const credentials: DriveCredentials = {
    provider: "google_drive",
    clientId: cfg.clientId,
    clientSecret: cfg.clientSecret,
    redirectUri: cfg.redirectUri,
    refreshToken: tokens.refresh_token || null,
    accessToken: tokens.access_token || null,
    expiryDate: tokens.expiry_date || null,
    scope: tokens.scope || null,
    tokenType: tokens.token_type || null,
  };

  const encrypted = encryptJson(credentials);
  const email = user.emailAddress as string;
  const total = String(quota.limit || "0");
  const used = String(quota.usage || "0");

  const existing = await prisma.cloudAccount.findFirst({
    where: { userId: entry.userId, provider: "google_drive", email },
  });

  const account = existing
    ? await prisma.cloudAccount.update({
        where: { id: existing.id },
        data: { encryptedCredentials: encrypted, quotaTotal: total, quotaUsed: used, status: "active", updatedAt: new Date() },
      })
    : await prisma.cloudAccount.create({
        data: {
          userId: entry.userId,
          provider: "google_drive",
          email,
          encryptedCredentials: encrypted,
          quotaTotal: total,
          quotaUsed: used,
          status: "active",
        },
      });

  return { account, email, total, used };
}

export class GoogleDriveAdapter {
  constructor(private account: { encryptedCredentials: string; email?: string | null }) {}

  private createOAuthClient() {
    const creds = decryptJson<DriveCredentials>(this.account.encryptedCredentials);
    const client = new google.auth.OAuth2(creds.clientId, creds.clientSecret, creds.redirectUri);
    client.setCredentials({
      refresh_token: creds.refreshToken || undefined,
      access_token: creds.accessToken || undefined,
      expiry_date: creds.expiryDate || undefined,
      scope: creds.scope || undefined,
      token_type: creds.tokenType || undefined,
    });
    return client;
  }

  private async getDriveClient() {
    return google.drive({ version: "v3", auth: this.createOAuthClient() });
  }

  private async getSheetsClient() {
    return google.sheets({ version: "v4", auth: this.createOAuthClient() });
  }

  async getStorageSummary() {
    const drive = await this.getDriveClient();
    const res = await drive.about.get({ fields: "storageQuota(limit,usage)" });
    return {
      totalSpace: Number(res.data.storageQuota?.limit || 0),
      usedSpace: Number(res.data.storageQuota?.usage || 0),
    };
  }

  async listFiles(folderId?: string) {
    const drive = await this.getDriveClient();
    const parent = folderId && folderId !== "root" ? `'${folderId}' in parents` : "'root' in parents";
    const res = await drive.files.list({
      q: `${parent} and trashed = false`,
      fields: "files(id,name,mimeType,size,modifiedTime,webViewLink,thumbnailLink,parents,starred)",
      pageSize: 100,
      orderBy: "folder,name",
    });
    return (res.data.files || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      size: f.size ? parseInt(f.size, 10) : 0,
      modifiedTime: f.modifiedTime,
      webViewLink: f.webViewLink,
      thumbnailLink: f.thumbnailLink,
      isFolder: f.mimeType === FOLDER_MIME,
      starred: f.starred ? 1 : 0,
      parents: f.parents || [],
    }));
  }

  async upload({ fileName, mimeType, buffer, parentId }: { fileName: string; mimeType: string; buffer: Buffer; parentId?: string }) {
    const drive = await this.getDriveClient();
    const res = await drive.files.create({
      requestBody: { name: fileName, parents: parentId && parentId !== "root" ? [parentId] : undefined },
      media: { mimeType, body: Readable.from(buffer) },
      fields: "id,parents,size,mimeType,name,webViewLink",
    });
    return {
      id: res.data.id as string,
      name: res.data.name as string,
      size: Number(res.data.size || 0),
      mimeType: res.data.mimeType as string,
      webViewLink: res.data.webViewLink as string | undefined,
      parentId: (res.data.parents as string[] | undefined)?.[0] || null,
    };
  }

  /**
   * Membuat Resumable Upload Session URL untuk direct upload dari browser (Bypass VPS RAM)
   */
  async createResumableSession({ fileName, mimeType, fileSize, parentId }: { fileName: string; mimeType: string; fileSize: number; parentId?: string }) {
    const oauth2Client = this.createOAuthClient();
    const token = await oauth2Client.getAccessToken();
    if (!token.token) throw new Error("Gagal mendapatkan Access Token untuk Resumable Upload");

    const metadata = {
      name: fileName,
      parents: parentId && parentId !== "root" ? [parentId] : undefined,
    };

    const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.token}`,
        "Content-Type": "application/json",
        "X-Upload-Content-Type": mimeType || "application/octet-stream",
        "X-Upload-Content-Length": fileSize.toString(),
      },
      body: JSON.stringify(metadata),
    });

    if (!res.ok) throw new Error(`Gagal membuat upload session: ${res.statusText}`);

    const sessionUri = res.headers.get("Location");
    if (!sessionUri) throw new Error("Google tidak mengembalikan Session URL");

    return { sessionUri, accessToken: token.token };
  }

  async createFolder({ name, parentId }: { name: string; parentId?: string }) {
    const drive = await this.getDriveClient();
    const res = await drive.files.create({
      requestBody: { name, mimeType: FOLDER_MIME, parents: parentId && parentId !== "root" ? [parentId] : undefined },
      fields: "id,parents,name",
    });
    return { id: res.data.id as string, name: res.data.name as string, parentId: (res.data.parents as string[] | undefined)?.[0] || null };
  }

  async deleteFile(fileId: string) {
    const drive = await this.getDriveClient();
    await drive.files.delete({ fileId });
  }

  async getDownloadLink(fileId: string) {
    const drive = await this.getDriveClient();
    const res = await drive.files.get({ fileId, fields: "webContentLink,webViewLink" });
    return { webContentLink: res.data.webContentLink, webViewLink: res.data.webViewLink };
  }

  /** Stream the file bytes (for download/preview). Returns a Node readable stream. */
  async getDownloadStream(fileId: string): Promise<NodeJS.ReadableStream> {
    const drive = await this.getDriveClient();
    const res = await drive.files.get({ fileId, alt: "media" }, { responseType: "stream" });
    return res.data as unknown as NodeJS.ReadableStream;
  }

  async getFileDetails(fileId: string) {
    const drive = await this.getDriveClient();
    const res = await drive.files.get({
      fileId,
      fields: "id,name,mimeType,size,parents,starred,shared,thumbnailLink,webViewLink,createdTime,modifiedTime",
    });
    const f: any = res.data;
    return {
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      size: f.size ? parseInt(f.size, 10) : 0,
      parents: f.parents || [],
      starred: f.starred ? 1 : 0,
      shared: !!f.shared,
      thumbnailLink: f.thumbnailLink || null,
      webViewLink: f.webViewLink || null,
      createdTime: f.createdTime || null,
      modifiedTime: f.modifiedTime || null,
    };
  }

  async renameFile(fileId: string, name: string) {
    const drive = await this.getDriveClient();
    const res = await drive.files.update({ fileId, requestBody: { name } });
    return { id: res.data.id, name: res.data.name };
  }

  async setFileStarred(fileId: string, starred: boolean) {
    const drive = await this.getDriveClient();
    const res = await drive.files.update({ fileId, requestBody: { starred } });
    return { id: res.data.id, starred: res.data.starred ? 1 : 0 };
  }

  /** List ALL non-trashed files (paginated) for metadata sync. */
  async listAllFiles(): Promise<any[]> {
    const drive = await this.getDriveClient();
    const out: any[] = [];
    let pageToken: string | undefined;
    const fields = "nextPageToken, files(id,name,mimeType,size,parents,starred,shared,thumbnailLink,webViewLink,createdTime,modifiedTime,trashed)";
    do {
      const res: any = await drive.files.list({
        q: "trashed = false",
        fields,
        pageSize: 1000,
        pageToken,
        orderBy: "folder,name",
      });
      for (const f of res.data.files || []) out.push(f);
      pageToken = res.data.nextPageToken || undefined;
    } while (pageToken);
    return out;
  }

  /** List files shared with the user (shared-with-me). */
  async listSharedWithMe(): Promise<any[]> {
    const drive = await this.getDriveClient();
    const res: any = await drive.files.list({
      q: "sharedWithMe = true and trashed = false",
      fields: "files(id,name,mimeType,size,parents,starred,shared,thumbnailLink,webViewLink,createdTime,modifiedTime)",
      pageSize: 1000,
    });
    return (res.data.files || []) as any[];
  }

  // ── SPREADSHEET (SHEETS API) METHODS ────────────────────────

  /**
   * Buat file Google Sheets kosong
   */
  async createSpreadsheet(title: string, parentFolderId?: string) {
    const sheets = await this.getSheetsClient();
    
    // Buat spreadsheet
    const res = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title },
      }
    });
    const spreadsheetId = res.data.spreadsheetId;

    if (!spreadsheetId) throw new Error("Gagal membuat Spreadsheet");

    // Jika dikasih parentFolderId, kita pindahin filenya ke folder tersebut via Drive API
    if (parentFolderId) {
      const drive = await this.getDriveClient();
      // Ambil parents saat ini
      const fileRes = await drive.files.get({ fileId: spreadsheetId, fields: "parents" });
      const previousParents = (fileRes.data.parents || []).join(",");

      // Pindahkan file ke folder tujuan
      await drive.files.update({
        fileId: spreadsheetId,
        addParents: parentFolderId,
        removeParents: previousParents,
        fields: "id, parents"
      });
    }

    return spreadsheetId;
  }

  /**
   * Isi Spreadsheet dengan array 2D
   * contoh values: [["Nama", "Tagihan"], ["Aji", "Lunas"]]
   */
  async appendSpreadsheetValues(spreadsheetId: string, range: string, values: any[][]) {
    const sheets = await this.getSheetsClient();
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });
  }

  /**
   * Format header row (baris pertama) jadi tebal dan background color kuning halus
   */
  async formatSpreadsheetHeader(spreadsheetId: string, sheetId: number = 0, columnCount: number) {
    const sheets = await this.getSheetsClient();
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: sheetId,
                startRowIndex: 0,
                endRowIndex: 1, // Baris 1 aja
                startColumnIndex: 0,
                endColumnIndex: columnCount,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 1, green: 0.95, blue: 0.8 }, // Kuning halus
                  textFormat: { bold: true },
                },
              },
              fields: "userEnteredFormat(backgroundColor,textFormat)",
            },
          },
        ],
      },
    });
  }
}
