import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateTrueProbabilities } from "@/lib/analysis/probability";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;

  const odds = await prisma.odds.findMany({
    where: { matchId },
    orderBy: { bookmaker: "asc" },
  });

  if (odds.length === 0) {
    return NextResponse.json({ error: "Keine Quoten gefunden" }, { status: 404 });
  }

  // Enrich each bookmaker's odds with probability and payout calculations
  const enrichedOdds = odds.map((o) => {
    const trueProbabilities = calculateTrueProbabilities({
      homeOdds: o.homeOdds,
      drawOdds: o.drawOdds ?? undefined,
      awayOdds: o.awayOdds,
    });

    return {
      ...o,
      trueProbabilities,
      payoutPer10: {
        home: (o.homeOdds * 10).toFixed(2),
        draw: o.drawOdds ? (o.drawOdds * 10).toFixed(2) : null,
        away: (o.awayOdds * 10).toFixed(2),
      },
    };
  });

  // Find best odds
  const bestHomeOdds = Math.max(...odds.map((o) => o.homeOdds));
  const bestAwayOdds = Math.max(...odds.map((o) => o.awayOdds));
  const bestDrawOdds = Math.max(
    ...odds.filter((o) => o.drawOdds).map((o) => o.drawOdds!)
  );

  return NextResponse.json({
    odds: enrichedOdds,
    bestOdds: {
      home: bestHomeOdds,
      draw: bestDrawOdds || null,
      away: bestAwayOdds,
    },
  });
}
