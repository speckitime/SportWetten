import { prisma } from "@/lib/prisma";
import { fetchAllSportsOdds, OddsGame } from "@/lib/apis/odds-api";
import { fetchSportsNews } from "@/lib/apis/news-api";
import { fetchNFLScores, fetchSoccerScores, mapESPNStatusToLocal } from "@/lib/apis/espn-api";
import { analyzeAllMatches } from "@/lib/analysis/match-analyzer";

const SPORT_MAP: Record<string, string> = {
  soccer_germany_bundesliga: "football",
  soccer_uefa_champs_league: "football",
  soccer_epl: "football",
  handball_germany_hbl: "handball",
  basketball_euroleague: "basketball",
  basketball_nbl: "basketball",
  americanfootball_nfl: "nfl",
};

export async function syncOddsAndMatches(): Promise<void> {
  console.log("[DataSync] Fetching odds from all sports...");

  try {
    const allOdds = await fetchAllSportsOdds();
    console.log(`[DataSync] Received ${allOdds.length} games from odds API`);

    for (const game of allOdds) {
      await upsertMatchFromOdds(game);
    }

    await analyzeAllMatches();
    console.log("[DataSync] Odds sync complete");
  } catch (error) {
    console.error("[DataSync] Odds sync failed:", error);
  }
}

async function upsertMatchFromOdds(game: OddsGame): Promise<void> {
  const sport = SPORT_MAP[game.sport_key] || "football";
  const kickoff = new Date(game.commence_time);

  // Upsert match
  const match = await prisma.match.upsert({
    where: { externalId: game.id },
    create: {
      externalId: game.id,
      homeTeam: game.home_team,
      awayTeam: game.away_team,
      sport,
      competition: game.sport_title,
      kickoff,
      status: kickoff > new Date() ? "scheduled" : "live",
    },
    update: {
      kickoff,
      competition: game.sport_title,
    },
  });

  // Upsert odds for each bookmaker
  for (const bookmaker of game.bookmakers) {
    const market = bookmaker.markets.find((m) => m.key === "h2h");
    if (!market) continue;

    const homeOutcome = market.outcomes.find(
      (o) => o.name === game.home_team
    );
    const awayOutcome = market.outcomes.find(
      (o) => o.name === game.away_team
    );
    const drawOutcome = market.outcomes.find(
      (o) => o.name === "Draw"
    );

    if (!homeOutcome || !awayOutcome) continue;

    await prisma.odds.upsert({
      where: { matchId_bookmaker: { matchId: match.id, bookmaker: bookmaker.key } },
      create: {
        matchId: match.id,
        bookmaker: bookmaker.key,
        homeOdds: homeOutcome.price,
        drawOdds: drawOutcome?.price ?? null,
        awayOdds: awayOutcome.price,
      },
      update: {
        homeOdds: homeOutcome.price,
        drawOdds: drawOutcome?.price ?? null,
        awayOdds: awayOutcome.price,
      },
    });
  }
}

export async function syncNewsAndInjuries(): Promise<void> {
  console.log("[DataSync] Fetching news...");

  try {
    const queries = [
      "Bundesliga Verletzung",
      "Champions League Aufstellung",
      "HBL Handball Verletzung",
      "BBL Basketball",
      "NFL Injury",
    ];

    for (const query of queries) {
      const articles = await fetchSportsNews(query);

      for (const article of articles) {
        try {
          await prisma.newsArticle.upsert({
            where: { externalId: article.url },
            create: {
              externalId: article.url,
              title: article.title,
              description: article.description,
              url: article.url,
              source: article.source,
              publishedAt: new Date(article.publishedAt),
              hasInjuryInfo: article.hasInjuryInfo,
              injuryPlayers: article.injuryPlayers.length > 0
                ? JSON.stringify(article.injuryPlayers)
                : null,
            },
            update: {
              hasInjuryInfo: article.hasInjuryInfo,
              injuryPlayers: article.injuryPlayers.length > 0
                ? JSON.stringify(article.injuryPlayers)
                : null,
            },
          });
        } catch {
          // Skip duplicate articles
        }
      }
    }
    console.log("[DataSync] News sync complete");
  } catch (error) {
    console.error("[DataSync] News sync failed:", error);
  }
}

export async function syncLiveScores(): Promise<void> {
  try {
    // Fetch live soccer scores from ESPN
    const soccerEvents = await fetchSoccerScores("ger.1");

    for (const event of soccerEvents) {
      if (event.status.type.name !== "STATUS_IN_PROGRESS") continue;

      const competition = event.competitions[0];
      if (!competition) continue;

      const homeComp = competition.competitors.find((c) => c.homeAway === "home");
      const awayComp = competition.competitors.find((c) => c.homeAway === "away");

      if (!homeComp || !awayComp) continue;

      await prisma.match.updateMany({
        where: {
          homeTeam: { contains: homeComp.team.displayName },
          awayTeam: { contains: awayComp.team.displayName },
          status: { in: ["scheduled", "live"] },
        },
        data: {
          status: "live",
          homeScore: parseInt(homeComp.score || "0"),
          awayScore: parseInt(awayComp.score || "0"),
        },
      });
    }

    // NFL
    const nflEvents = await fetchNFLScores();
    for (const event of nflEvents) {
      const status = mapESPNStatusToLocal(event.status.type.name);
      const competition = event.competitions[0];
      if (!competition) continue;

      const homeComp = competition.competitors.find((c) => c.homeAway === "home");
      const awayComp = competition.competitors.find((c) => c.homeAway === "away");
      if (!homeComp || !awayComp) continue;

      await prisma.match.updateMany({
        where: {
          homeTeam: { contains: homeComp.team.displayName },
          sport: "nfl",
          status: { in: ["scheduled", "live"] },
        },
        data: {
          status,
          homeScore: status !== "scheduled" ? parseInt(homeComp.score || "0") : undefined,
          awayScore: status !== "scheduled" ? parseInt(awayComp.score || "0") : undefined,
        },
      });
    }
  } catch (error) {
    console.error("[DataSync] Live scores sync failed:", error);
  }
}

// Clean up old finished matches (older than 7 days)
export async function cleanupOldMatches(): Promise<void> {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  await prisma.match.deleteMany({
    where: {
      status: "finished",
      kickoff: { lt: cutoff },
    },
  });
}
