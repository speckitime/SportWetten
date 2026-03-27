import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  // Return current live matches as JSON (SSE would require a streaming response)
  const liveMatches = await prisma.match.findMany({
    where: { status: "live" },
    include: { odds: { take: 1 } },
    orderBy: { kickoff: "asc" },
  });

  return NextResponse.json({ liveMatches, timestamp: new Date().toISOString() });
}
