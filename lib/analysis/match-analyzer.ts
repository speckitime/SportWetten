import { prisma } from "@/lib/prisma";
import {
  averageProbabilities,
  calculateConfidenceScore,
  findValueBets,
  formToScore,
  generateSummary,
  kellyFraction,
  OddsSet,
} from "./probability";

export async function analyzeMatch(matchId: string): Promise<void> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { odds: true, news: { include: { article: true } } },
  });

  if (!match || match.odds.length === 0) return;

  // Build odds sets for probability calculation
  const oddsArray: OddsSet[] = match.odds.map((o) => ({
    homeOdds: o.homeOdds,
    drawOdds: o.drawOdds ?? undefined,
    awayOdds: o.awayOdds,
  }));

  const trueProbabilities = averageProbabilities(oddsArray);

  // Check for injury news
  const hasInjuries = match.news.some((n) => n.article.hasInjuryInfo);

  // Get team stats for form calculation
  const homeStats = await prisma.teamStats.findUnique({
    where: { teamId: match.homeTeam.toLowerCase().replace(/\s+/g, "-") },
  });
  const awayStats = await prisma.teamStats.findUnique({
    where: { teamId: match.awayTeam.toLowerCase().replace(/\s+/g, "-") },
  });

  const homeFormScore = homeStats ? formToScore(homeStats.form) : 5;
  const awayFormScore = awayStats ? formToScore(awayStats.form) : 5;
  const formScore = homeFormScore - awayFormScore + 5; // normalize to 0-10

  // Home advantage factor
  let homeAdvantage = 50;
  if (homeStats) {
    const homeTotal = homeStats.homeWins + homeStats.homeLosses + homeStats.homeDraws;
    if (homeTotal > 0) {
      homeAdvantage = (homeStats.homeWins / homeTotal) * 100;
    }
  }

  // Find value bets using best available odds (Tipico if available)
  const tipicoOdds = match.odds.find((o) => o.bookmaker === "tipico");
  const bestOdds = tipicoOdds || match.odds[0];
  const bestOddsSet: OddsSet = {
    homeOdds: bestOdds.homeOdds,
    drawOdds: bestOdds.drawOdds ?? undefined,
    awayOdds: bestOdds.awayOdds,
  };

  const valueAnalysis = findValueBets(trueProbabilities, bestOddsSet, 5.0);

  const confidenceScore = calculateConfidenceScore({
    homeAdvantage,
    formScore,
    hasInjuries,
  });

  const summary = generateSummary({
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    probabilities: trueProbabilities,
    valueBet: valueAnalysis.bestValueOutcome,
    confidenceScore,
    homeForm: homeStats?.form,
    awayForm: awayStats?.form,
    hasInjuries,
  });

  // Kelly fractions for display
  const kellyHome = kellyFraction(trueProbabilities.home, bestOdds.homeOdds);
  const kellyAway = kellyFraction(trueProbabilities.away, bestOdds.awayOdds);

  await prisma.analysis.upsert({
    where: { matchId },
    create: {
      matchId,
      homeWinProb: trueProbabilities.home,
      drawProb: trueProbabilities.draw,
      awayWinProb: trueProbabilities.away,
      valueBet: valueAnalysis.bestValueOutcome,
      confidenceScore,
      summary,
      isValueBet: valueAnalysis.bestValueOutcome !== null,
      kellyHome,
      kellyAway,
    },
    update: {
      homeWinProb: trueProbabilities.home,
      drawProb: trueProbabilities.draw,
      awayWinProb: trueProbabilities.away,
      valueBet: valueAnalysis.bestValueOutcome,
      confidenceScore,
      summary,
      isValueBet: valueAnalysis.bestValueOutcome !== null,
      kellyHome,
      kellyAway,
    },
  });
}

export async function analyzeAllMatches(): Promise<void> {
  const matches = await prisma.match.findMany({
    where: {
      status: { in: ["scheduled", "live"] },
      kickoff: { gte: new Date() },
    },
    select: { id: true },
  });

  for (const match of matches) {
    try {
      await analyzeMatch(match.id);
    } catch (error) {
      console.error(`Failed to analyze match ${match.id}:`, error);
    }
  }
}
