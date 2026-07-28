import prisma from "@/lib/prisma";

type Settings = NonNullable<Awaited<ReturnType<typeof prisma.systemSettings.findFirst>>>;

let cache: Settings | null = null;
let cacheTime = 0;
const TTL = 30_000; // 30s

export async function getSystemSettings(): Promise<Settings> {
  const now = Date.now();
  if (cache && now - cacheTime < TTL) return cache;
  let s = await prisma.systemSettings.findFirst();
  if (!s) s = await prisma.systemSettings.create({ data: {} });
  cache = s;
  cacheTime = now;
  return s;
}

/** Force next read to hit the DB (call after saving settings). */
export function invalidateSystemSettingsCache() {
  cache = null;
  cacheTime = 0;
}
