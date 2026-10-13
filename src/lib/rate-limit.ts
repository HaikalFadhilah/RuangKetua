const limits = new Map<
  string,
  { timestamps: number[] }
>();

function hit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;

  let entry = limits.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    limits.set(key, entry);
  }

  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);
  entry.timestamps.push(now);

  return entry.timestamps.length > limit;
}

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  return hit(key, limit, windowMs);
}

export function getRateBudget(key: string, limit: number, windowMs: number): number {
  const now = Date.now();
  const entry = limits.get(key);
  if (!entry) return limit;
  const active = entry.timestamps.filter((ts) => ts > now - windowMs).length;
  return Math.max(0, limit - active);
}

export const RATE_LIMIT = {
  forgotEmail: { limit: 5, windowMs: 15 * 60 * 1000 }, // 5 request / 15 menit per (ip|email)
  resetEmail: { limit: 5, windowMs: 15 * 60 * 1000 },
  resetIp: { limit: 20, windowMs: 15 * 60 * 1000 },    // 20 percobaan per IP
  forgotIp: { limit: 10, windowMs: 15 * 60 * 1000 },
} as const;