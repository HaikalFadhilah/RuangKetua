/**
 * Next.js Instrumentation — runs once on server startup.
 * Starts the built-in cron scheduler so auto-reminders and dosen-reminders
 * fire without needing an external crontab.
 */

export async function register() {
  // Only run on the Node.js server runtime (not edge, not client)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startCronScheduler } = await import("./lib/cron-scheduler");
    startCronScheduler();
  }
}
