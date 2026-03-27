import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addDays, startOfDay } from "date-fns";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const sport = searchParams.get("sport") || undefined;
  const minOdds = parseFloat(searchParams.get("minOdds") || "1.5");
  const minConfidence = parseInt(searchParams.get("minConfidence") || "3");
  const limit = parseInt(searchParams.get("limit") || "10");

  const now = new Date();
  const tomorrow = addDays(startOfDay(now), 2);

  const analyses = await prisma.analysis.findMany({
    where: {
      confidenceScore: { gte: minConfidence },
      match: {
        kickoff: { gte: now, lte: tomorrow },
        status: "scheduled",
        ...(sport ? { sport } : {}),
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
      match: {
        include: { odds: true },
      },
    },
    orderBy: [
      { confidenceScore: "desc" },
      { match: { kickoff: "asc" } },
    ],
    take: limit,
  });

  // Separate value bets from regular picks
  const valueBets = analyses.filter((a) => a.isValueBet);
  const regularPicks = analyses.filter((a) => !a.isValueBet);

  return NextResponse.json({
    valueBets,
    regularPicks,
    total: analyses.length,
  });
}
