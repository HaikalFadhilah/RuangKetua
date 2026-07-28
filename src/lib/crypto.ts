import crypto from "crypto";

// ── AES-256-GCM: simpan object sebagai satu blob terenkripsi ──
function getGcmKey(): Buffer {
  const secret = process.env.DRIVE_TOKEN_SECRET || process.env.JWT_SECRET || "dev-insecure-fallback-secret";
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptJson(payload: unknown): string {
  const key = getGcmKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decryptJson<T = any>(value: string): T {
  const raw = Buffer.from(value, "base64");
  const iv = raw.subarray(0, 12);
  const authTag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const key = getGcmKey();
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return JSON.parse(decrypted.toString("utf8"));
}

