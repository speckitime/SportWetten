import cron from "node-cron";
import { syncLiveScores, syncNewsAndInjuries, syncOddsAndMatches, cleanupOldMatches } from "./data-sync";

let isInitialized = false;

export function initScheduler(): void {
  if (isInitialized) return;
  isInitialized = true;

  console.log("[Scheduler] Starting cron jobs...");

  // Every minute: fetch live scores (Bundesliga + NFL)
  cron.schedule("* * * * *", async () => {
    await syncLiveScores();
  });

  // Every 15 minutes: fetch odds, Bundesliga + HBL from OpenLigaDB
  cron.schedule("*/15 * * * *", async () => {
    await syncOddsAndMatches();
  });

  // Every 2 hours: fetch news, extract injury reports
  cron.schedule("0 */2 * * *", async () => {
    await syncNewsAndInjuries();
  });

  // Every day at 6am: cleanup old matches + stale injuries
  cron.schedule("0 6 * * *", async () => {
    await cleanupOldMatches();
  });

  // Initial data fetch on startup (staggered to not overload)
  setTimeout(async () => {
    console.log("[Scheduler] Running initial data fetch...");
    await syncOddsAndMatches();
    await syncNewsAndInjuries();
  }, 2000);
}
