import { prisma } from "@/lib/prisma";
import { fetchAllSportsOdds, OddsGame } from "@/lib/apis/odds-api";
import { fetchSportsNews } from "@/lib/apis/news-api";
import { fetchNFLScores, fetchSoccerScores, mapESPNStatusToLocal } from "@/lib/apis/espn-api";
import { fetchUpcomingBundesliga, fetchUpcomingHBL, fetchLiveBundesliga, estimateHBLOdds, OpenLigaMatch } from "@/lib/apis/openligadb-api";
import { analyzeAllMatches } from "@/lib/analysis/match-analyzer";

const SPORT_MAP: Record<string, string> = {
  soccer_germany_bundesliga: "football",
  soccer_uefa_champs_league: "football",
  soccer_epl: "football",
  handball_germany_hbl: "handball",
  basketball_euroleague: "basketball",
  basketball_germany_bbl: "basketball",
  basketball_nbl: "basketball",
  basketball_nba: "basketball",
  americanfootball_nfl: "nfl",
};

export async function syncOddsAndMatches(): Promise<void> {
  console.log("[DataSync] Fetching odds from all sports...");

  try {
    // 0. Alte Mock-Daten aus DB entfernen (verhindert falsche Paarungen auf Tipico)
    const deleted = await prisma.match.deleteMany({
      where: { externalId: { startsWith: "mock-" } },
    });
    if (deleted.count > 0) {
      console.log(`[DataSync] Removed ${deleted.count} mock matches from DB`);
    }

    // 1. Odds API for football/basketball/nfl (echte Quoten)
    const allOdds = await fetchAllSportsOdds();
    console.log(`[DataSync] Received ${allOdds.length} games from odds API`);
    for (const game of allOdds) {
      await upsertMatchFromOdds(game);
    }

    // 2. OpenLigaDB für Bundesliga (vollständiger Spielplan)
    await syncOpenLigaBundesliga();

    // 3. OpenLigaDB für HBL (einzige kostenfreie Quelle mit echten HBL-Spielen)
    await syncOpenLigaHBL();

    await analyzeAllMatches();
    console.log("[DataSync] Odds sync complete");
  } catch (error) {
    console.error("[DataSync] Odds sync failed:", error);
  }
}

async function upsertMatchFromOdds(game: OddsGame): Promise<void> {
  const sport = SPORT_MAP[game.sport_key] || "football";
  const kickoff = new Date(game.commence_time);

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

  for (const bookmaker of game.bookmakers) {
    const market = bookmaker.markets.find((m) => m.key === "h2h");
    if (!market) continue;

    const homeOutcome = market.outcomes.find((o) => o.name === game.home_team);
    const awayOutcome = market.outcomes.find((o) => o.name === game.away_team);
    const drawOutcome = market.outcomes.find((o) => o.name === "Draw");

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

async function syncOpenLigaBundesliga(): Promise<void> {
  try {
    const matches = await fetchUpcomingBundesliga();
    console.log(`[DataSync] OpenLigaDB Bundesliga: ${matches.length} Spiele gefunden`);
    if (matches.length > 0) {
      console.log(`[DataSync] BL1 Spiele: ${matches.slice(0, 3).map(m => `${m.team1.shortName}-${m.team2.shortName}`).join(", ")}...`);
    }
    for (const m of matches) {
      await upsertOpenLigaMatch(m, "football", "1. Bundesliga");
    }
  } catch (error) {
    console.error("[DataSync] OpenLigaDB Bundesliga sync failed:", error);
  }
}

async function syncOpenLigaHBL(): Promise<void> {
  try {
    const matches = await fetchUpcomingHBL();
    console.log(`[DataSync] OpenLigaDB HBL: ${matches.length} Spiele gefunden`);
    if (matches.length > 0) {
      console.log(`[DataSync] HBL Spiele: ${matches.slice(0, 3).map(m => `${m.team1.shortName || m.team1.teamName}-${m.team2.shortName || m.team2.teamName}`).join(", ")}...`);
    }
    for (const m of matches) {
      await upsertOpenLigaMatch(m, "handball", "Handball Bundesliga (HBL)");
    }
  } catch (error) {
    console.error("[DataSync] OpenLigaDB HBL sync failed:", error);
  }
}

async function upsertOpenLigaMatch(
  m: OpenLigaMatch,
  sport: string,
  competition: string
): Promise<void> {
  const externalId = `openliga-${m.matchID}`;
  const kickoff = new Date(m.matchDateTime);
  const isFinished = m.matchIsFinished;
  const status = isFinished ? "finished" : kickoff <= new Date() ? "live" : "scheduled";

  // Final score from matchResults (resultTypeID=2 is final result)
  const finalResult = m.matchResults.find((r) => r.resultTypeID === 2);

  const match = await prisma.match.upsert({
    where: { externalId },
    create: {
      externalId,
      homeTeam: m.team1.teamName,
      awayTeam: m.team2.teamName,
      sport,
      competition: m.leagueName || competition,
      kickoff,
      status,
      homeScore: finalResult?.pointsTeam1 ?? null,
      awayScore: finalResult?.pointsTeam2 ?? null,
    },
    update: {
      status,
      homeScore: finalResult?.pointsTeam1 ?? undefined,
      awayScore: finalResult?.pointsTeam2 ?? undefined,
      kickoff,
    },
  });

  // For HBL: create estimated odds so the match can be analyzed
  if (sport === "handball" && !isFinished) {
    const estimated = estimateHBLOdds(m.team1.teamName, m.team2.teamName);
    await prisma.odds.upsert({
      where: { matchId_bookmaker: { matchId: match.id, bookmaker: "estimate" } },
      create: {
        matchId: match.id,
        bookmaker: "estimate",
        homeOdds: estimated.homeOdds,
        drawOdds: estimated.drawOdds,
        awayOdds: estimated.awayOdds,
      },
      update: {
        homeOdds: estimated.homeOdds,
        drawOdds: estimated.drawOdds,
        awayOdds: estimated.awayOdds,
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

          // Extract injury reports from articles
          if (article.hasInjuryInfo && article.injuryPlayers.length > 0) {
            await extractAndSaveInjuries({
              ...article,
              description: article.description ?? undefined,
            });
          }
        } catch (error) {
          console.error(`[DataSync] Failed to upsert article ${article.url}:`, error);
        }
      }
    }
    console.log("[DataSync] News sync complete");
  } catch (error) {
    console.error("[DataSync] News sync failed:", error);
  }
}

interface NewsArticleData {
  title: string;
  description?: string;
  source: string;
  injuryPlayers: string[];
  hasInjuryInfo: boolean;
}

async function extractAndSaveInjuries(article: NewsArticleData): Promise<void> {
  const text = `${article.title} ${article.description ?? ""}`.toLowerCase();

  // Determine sport
  let sport = "football";
  if (text.includes("handball") || text.includes("hbl")) sport = "handball";
  else if (text.includes("basketball") || text.includes("bbl")) sport = "basketball";
  else if (text.includes("nfl") || text.includes("american football")) sport = "nfl";

  // Determine injury status from text
  let status = "fraglich";
  if (text.includes("fällt aus") || text.includes("verletzt aus") || text.includes("nicht dabei") || text.includes(" out ")) {
    status = "aus";
  } else if (text.includes("im training") || text.includes("wieder dabei") || text.includes("kehrt zurück")) {
    status = "training";
  }

  // Extract team from known clubs in title
  const knownTeams = [
    "FC Bayern", "Borussia Dortmund", "Bayer Leverkusen", "RB Leipzig",
    "Eintracht Frankfurt", "VfB Stuttgart", "SC Freiburg", "Union Berlin",
    "THW Kiel", "Flensburg", "SC Magdeburg", "Rhein-Neckar Löwen", "MT Melsungen",
    "Hannover-Burgdorf", "Füchse Berlin", "HSG Wetzlar",
    "Alba Berlin", "Bayern Basketball", "FC Bayern Basketball",
  ];

  let teamName = "Unbekannt";
  for (const t of knownTeams) {
    if (article.title.includes(t) || (article.description ?? "").includes(t)) {
      teamName = t;
      break;
    }
  }

  if (teamName === "Unbekannt") return;

  // Save each injured player
  for (const playerName of article.injuryPlayers.slice(0, 5)) {
    if (playerName.length < 3) continue;
    try {
      await prisma.injuryReport.upsert({
        where: { teamName_playerName: { teamName, playerName } },
        create: {
          teamName,
          playerName,
          injury: "Verletzung (Details in Nachrichten)",
          status,
          sport,
          source: article.source,
        },
        update: {
          status,
          source: article.source,
        },
      });
    } catch {
      // Ignore duplicate/constraint errors
    }
  }
}

export async function syncLiveScores(): Promise<void> {
  try {
    // Fetch live Bundesliga scores from OpenLigaDB (more reliable)
    const bundesligaLive = await fetchLiveBundesliga();
    for (const event of bundesligaLive) {
      const liveResult = event.matchResults.find((r) => r.resultTypeID === 1);
      if (!liveResult) continue;
      await prisma.match.updateMany({
        where: {
          homeTeam: { contains: event.team1.teamName.substring(0, 6) },
          awayTeam: { contains: event.team2.teamName.substring(0, 6) },
          status: { in: ["scheduled", "live"] },
        },
        data: {
          status: "live",
          homeScore: liveResult.pointsTeam1,
          awayScore: liveResult.pointsTeam2,
        },
      });
    }

    // ESPN live scores for soccer (Bundesliga)
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
  // Also clean up stale injury reports older than 14 days
  const injuryCutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  await prisma.injuryReport.deleteMany({
    where: { updatedAt: { lt: injuryCutoff } },
  });
}
