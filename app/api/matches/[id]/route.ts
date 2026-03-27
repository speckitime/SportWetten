import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      odds: { orderBy: { bookmaker: "asc" } },
      analysis: true,
      news: {
        include: { article: true },
        take: 10,
      },
    },
  });

  if (!match) {
    return NextResponse.json({ error: "Match nicht gefunden" }, { status: 404 });
  }

  // Get team stats
  const homeStats = await prisma.teamStats.findUnique({
    where: { teamId: match.homeTeam.toLowerCase().replace(/\s+/g, "-") },
  });
  const awayStats = await prisma.teamStats.findUnique({
    where: { teamId: match.awayTeam.toLowerCase().replace(/\s+/g, "-") },
  });

  return NextResponse.json({ match, homeStats, awayStats });
}
