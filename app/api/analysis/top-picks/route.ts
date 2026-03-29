import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addDays, startOfDay, endOfDay } from "date-fns";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const sport = searchParams.get("sport") || undefined;
  const minOdds = parseFloat(searchParams.get("minOdds") || "1.4");
  const minConfidence = parseInt(searchParams.get("minConfidence") || "2");
  const limit = parseInt(searchParams.get("limit") || "20");
  const daysAhead = parseInt(searchParams.get("days") || "7");

  const now = new Date();
  const rangeEnd = endOfDay(addDays(startOfDay(now), daysAhead));

  const analyses = await prisma.analysis.findMany({
    where: {
      confidenceScore: { gte: minConfidence },
      match: {
        kickoff: { gte: now, lte: rangeEnd },
        status: { in: ["scheduled", "live"] },
        ...(sport && sport !== "all" ? { sport } : {}),
        odds: {
          some: {
            OR: [
              { homeOdds: { gte: minOdds } },
              { awayOdds: { gte: minOdds } },
            ],
          },
        },
      },
    },
    include: {
      match: { include: { odds: true } },
    },
    orderBy: [
      { isValueBet: "desc" },
      { confidenceScore: "desc" },
      { match: { kickoff: "asc" } },
    ],
    take: limit,
  });

  // Enrich each analysis with "bestTipp" — the most probable outcome + best odds
  const enriched = analyses.map((a) => {
    const odds = a.match.odds;
    const bestHome = odds.length > 0 ? Math.max(...odds.map((o) => o.homeOdds)) : 0;
    const bestAway = odds.length > 0 ? Math.max(...odds.map((o) => o.awayOdds)) : 0;
    const drawOddsArr = odds.filter((o) => o.drawOdds).map((o) => o.drawOdds as number);
    const bestDraw = drawOddsArr.length > 0 ? Math.max(...drawOddsArr) : 0;

    const candidates = [
      { key: "home" as const, prob: a.homeWinProb, odds: bestHome, label: `${a.match.homeTeam} gewinnt` },
      { key: "draw" as const, prob: a.drawProb ?? 0, odds: bestDraw, label: "Unentschieden" },
      { key: "away" as const, prob: a.awayWinProb, odds: bestAway, label: `${a.match.awayTeam} gewinnt` },
    ].filter((c) => c.odds >= minOdds && c.prob > 10);

    // Best tipp = highest probability among realistic options, biased toward value bets
    let bestTipp = candidates.length > 0
      ? candidates.reduce((b, c) => c.prob > b.prob ? c : b, candidates[0])
      : null;

    // If analysis detected a value bet, prefer that over raw probability
    if (a.valueBet && a.isValueBet) {
      const valueTipp = candidates.find((c) => c.key === a.valueBet);
      if (valueTipp) bestTipp = valueTipp;
    }

    // "Gut-Wert-Score": punish very low probability, reward confidence + value
    const gutWertScore = bestTipp
      ? (bestTipp.prob / 100) * a.confidenceScore * (a.isValueBet ? 1.5 : 1.0)
      : 0;

    return {
      ...a,
      bestTipp,
      gutWertScore,
      bestOdds: { home: bestHome || null, draw: bestDraw || null, away: bestAway || null },
    };
  });

  // Sort by gut-wert-score descending
  enriched.sort((a, b) => b.gutWertScore - a.gutWertScore);

  const valueBets = enriched.filter((a) => a.isValueBet && a.bestTipp);
  const regularPicks = enriched.filter((a) => !a.isValueBet && a.bestTipp);

  return NextResponse.json({
    valueBets,
    regularPicks,
    total: enriched.length,
  });
}
