import crypto from "crypto";

function getGcmKey(secretOverride?: string): Buffer {
  const secret =
    secretOverride?.trim() ||
    process.env.DRIVE_TOKEN_SECRET?.trim() ||
    process.env.JWT_SECRET?.trim();

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("DRIVE_TOKEN_SECRET atau JWT_SECRET wajib diisi untuk enkripsi token Drive");
    }
    return crypto.createHash("sha256").update("dev-insecure-fallback-secret").digest();
  }

  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptJson(payload: unknown, secretOverride?: string): string {
  const key = getGcmKey(secretOverride);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decryptJson<T = any>(value: string, secretOverride?: string): T {
  const raw = Buffer.from(value, "base64");
  const iv = raw.subarray(0, 12);
  const authTag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const key = getGcmKey(secretOverride);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return JSON.parse(decrypted.toString("utf8"));
}
