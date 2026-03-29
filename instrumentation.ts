export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Run database migrations automatically on startup
    try {
      const { execSync } = await import("child_process");
      execSync("npx prisma migrate deploy", { stdio: "inherit" });
    } catch (error) {
      console.error("[Startup] Migration failed:", error);
    }

    const { initScheduler } = await import("./lib/scheduler");
    initScheduler();
  }
}
