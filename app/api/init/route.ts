import { NextResponse } from "next/server";

let initialized = false;

export async function GET() {
  if (!initialized && process.env.NODE_ENV === "production") {
    initialized = true;
    // Lazy import to avoid issues during build
    const { initScheduler } = await import("@/lib/scheduler");
    initScheduler();
  }
  return NextResponse.json({ initialized });
}
