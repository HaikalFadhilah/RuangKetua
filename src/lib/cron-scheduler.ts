/**
 * Built-in cron scheduler for Ruang Ketua.
 *
 * Calls the cron API endpoints every 60 seconds from within the server process,
 * eliminating the need for an external crontab / VPS curl job.
 *
 * Requires CRON_SECRET in .env to authenticate requests.
 */

const CRON_INTERVAL_MS = 60_000; // 1 minute

const globalCron = globalThis as unknown as {
  _cronStarted?: boolean;
  _cronTimer?: ReturnType<typeof setInterval>;
};

async function runCronJobs() {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    // CRON_SECRET not configured — skip silently
    return;
  }

  // Next.js sets __NEXT_PRIVATE_STANDALONE_CONFIG or we check common env vars
  const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || "3000";
  const baseUrl = `http://localhost:${port}`;

  const endpoints = [
    "/api/cron/auto-reminder",
    "/api/cron/dosen-reminder",
  ];

  for (const endpoint of endpoints) {
    try {
      const url = `${baseUrl}${endpoint}?secret=${encodeURIComponent(secret)}`;
      const res = await fetch(url, {
        method: "GET",
        signal: AbortSignal.timeout(30_000), // 30s timeout per endpoint
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error(`[Cron] ${endpoint} responded ${res.status}: ${body.substring(0, 200)}`);
      }
    } catch (error) {
      // Network error / timeout — log but don't crash
      const msg = error instanceof Error ? error.message : String(error);
      // Don't log connection refused (server might not be ready yet on first tick)
      if (!msg.includes("ECONNREFUSED")) {
        console.error(`[Cron] ${endpoint} failed: ${msg}`);
      }
    }
  }
}

export function startCronScheduler() {
  if (globalCron._cronStarted) return;
  globalCron._cronStarted = true;

  console.log("[Cron] Built-in scheduler started (interval: 60s)");

  // Wait 15 seconds for server to fully boot before first tick
  setTimeout(() => {
    void runCronJobs();
    globalCron._cronTimer = setInterval(() => {
      void runCronJobs();
    }, CRON_INTERVAL_MS);
  }, 15_000);
}
