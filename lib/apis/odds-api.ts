import axios from "axios";

const BASE_URL = "https://api.the-odds-api.com/v4";
const API_KEY = process.env.THE_ODDS_API_KEY;

export interface OddsGame {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
}

interface Bookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: Market[];
}

interface Market {
  key: string;
  last_update: string;
  outcomes: Outcome[];
}

interface Outcome {
  name: string;
  price: number;
}

// Map sport names to The Odds API sport keys (only confirmed free-tier keys)
const SPORT_KEYS: Record<string, string[]> = {
  football: ["soccer_germany_bundesliga", "soccer_uefa_champs_league", "soccer_epl"],
  handball: [], // Not available in The Odds API free tier - uses OpenLigaDB instead
  basketball: ["basketball_nba"],
  nfl: ["americanfootball_nfl"],
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchOdds(sport: string): Promise<OddsGame[]> {
  if (!API_KEY || API_KEY === "your_key_here") {
    return getMockOdds(sport);
  }

  const sportKeys = SPORT_KEYS[sport] || [];
  if (sportKeys.length === 0) return getMockOdds(sport);

  const results: OddsGame[] = [];

  for (let i = 0; i < sportKeys.length; i++) {
    const sportKey = sportKeys[i];
    if (i > 0) await sleep(7000);
    try {
      const response = await axios.get(`${BASE_URL}/sports/${sportKey}/odds`, {
        params: {
          apiKey: API_KEY,
          regions: "eu",
          markets: "h2h",
          oddsFormat: "decimal",
          bookmakers: "tipico,bet365,bwin,betway,unibet",
        },
        timeout: 10000,
      });
      results.push(...response.data);
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        (error as { response?: { status?: number } }).response?.status === 429
      ) {
        console.warn(`[OddsAPI] Rate limited on ${sportKey}, skipping.`);
      } else {
        console.error(`[OddsAPI] Failed to fetch odds for ${sportKey}:`, error);
      }
    }
  }

  return results;
}

export async function fetchAllSportsOdds(): Promise<OddsGame[]> {
  const sports = Object.keys(SPORT_KEYS).filter((s) => SPORT_KEYS[s].length > 0);
  const allOdds: OddsGame[] = [];

  for (let i = 0; i < sports.length; i++) {
    if (i > 0) await sleep(8000);
    const odds = await fetchOdds(sports[i]);
    allOdds.push(...odds);
  }

  // Handball + BBL kommen ausschließlich von OpenLigaDB (echte Daten)
  // Kein Mock-Handball/BBL mehr — falsche Paarungen würden auf Tipico nicht existieren

  return allOdds;
}

// Helpers for distributing mock games across the current week
function daysFromNow(d: number, hour = 18, minute = 0): string {
  const dt = new Date();
  dt.setDate(dt.getDate() + d);
  dt.setHours(hour, minute, 0, 0);
  return dt.toISOString();
}

function getMockOdds(sport: string): OddsGame[] {
  // Handball und BBL: kein Mock — nur OpenLigaDB (echte Spielpläne)
  if (sport === "handball" || sport === "bbl" || sport === "basketball") return [];

  const mockGames: Record<string, OddsGame[]> = {
    football: [
      createMockGame("mock-fb-1", "soccer_germany_bundesliga", "1. Bundesliga",
        "FC Bayern München", "Borussia Dortmund", daysFromNow(0, 20, 30),
        [{ bookmaker: "tipico", home: 1.65, draw: 4.20, away: 5.50 },
         { bookmaker: "bet365", home: 1.68, draw: 4.00, away: 5.25 },
         { bookmaker: "bwin",   home: 1.62, draw: 4.10, away: 5.40 }]),
      createMockGame("mock-fb-2", "soccer_germany_bundesliga", "1. Bundesliga",
        "Bayer Leverkusen", "RB Leipzig", daysFromNow(0, 15, 30),
        [{ bookmaker: "tipico", home: 2.10, draw: 3.40, away: 3.60 },
         { bookmaker: "bet365", home: 2.15, draw: 3.30, away: 3.50 }]),
      createMockGame("mock-fb-3", "soccer_germany_bundesliga", "1. Bundesliga",
        "Eintracht Frankfurt", "VfB Stuttgart", daysFromNow(0, 15, 30),
        [{ bookmaker: "tipico", home: 2.40, draw: 3.20, away: 3.00 },
         { bookmaker: "bwin",   home: 2.35, draw: 3.25, away: 3.10 }]),
      createMockGame("mock-fb-4", "soccer_germany_bundesliga", "1. Bundesliga",
        "SC Freiburg", "Union Berlin", daysFromNow(1, 15, 30),
        [{ bookmaker: "tipico", home: 1.90, draw: 3.40, away: 4.20 },
         { bookmaker: "bet365", home: 1.95, draw: 3.30, away: 4.00 }]),
      createMockGame("mock-fb-5", "soccer_germany_bundesliga", "1. Bundesliga",
        "Borussia Mönchengladbach", "TSG Hoffenheim", daysFromNow(1, 17, 30),
        [{ bookmaker: "tipico", home: 2.20, draw: 3.30, away: 3.40 },
         { bookmaker: "bwin",   home: 2.15, draw: 3.35, away: 3.50 }]),
      createMockGame("mock-fb-6", "soccer_germany_bundesliga", "1. Bundesliga",
        "VfL Wolfsburg", "FC Augsburg", daysFromNow(2, 15, 30),
        [{ bookmaker: "tipico", home: 1.80, draw: 3.60, away: 4.50 },
         { bookmaker: "bet365", home: 1.85, draw: 3.50, away: 4.20 }]),
      createMockGame("mock-cl-1", "soccer_uefa_champs_league", "UEFA Champions League",
        "Real Madrid", "Manchester City", daysFromNow(2, 21, 0),
        [{ bookmaker: "tipico", home: 2.30, draw: 3.20, away: 3.10 },
         { bookmaker: "bet365", home: 2.25, draw: 3.25, away: 3.15 },
         { bookmaker: "bwin",   home: 2.35, draw: 3.10, away: 3.05 }]),
      createMockGame("mock-cl-2", "soccer_uefa_champs_league", "UEFA Champions League",
        "FC Bayern München", "PSG", daysFromNow(3, 21, 0),
        [{ bookmaker: "tipico", home: 2.00, draw: 3.50, away: 3.80 },
         { bookmaker: "bet365", home: 1.95, draw: 3.60, away: 3.90 }]),
      createMockGame("mock-cl-3", "soccer_uefa_champs_league", "UEFA Champions League",
        "Arsenal", "Inter Mailand", daysFromNow(3, 21, 0),
        [{ bookmaker: "tipico", home: 2.10, draw: 3.40, away: 3.50 },
         { bookmaker: "bwin",   home: 2.05, draw: 3.45, away: 3.60 }]),
    ],

    handball: [
      createMockGame("mock-hb-1", "handball_germany_hbl", "Handball Bundesliga (HBL)",
        "THW Kiel", "SG Flensburg-Handewitt", daysFromNow(0, 19, 5),
        [{ bookmaker: "tipico", home: 1.75, draw: 18.0, away: 4.20 },
         { bookmaker: "bet365", home: 1.80, draw: 17.0, away: 4.00 }]),
      createMockGame("mock-hb-2", "handball_germany_hbl", "Handball Bundesliga (HBL)",
        "SC Magdeburg", "Rhein-Neckar Löwen", daysFromNow(0, 19, 5),
        [{ bookmaker: "tipico", home: 1.65, draw: 20.0, away: 4.80 },
         { bookmaker: "bwin",   home: 1.70, draw: 19.0, away: 4.50 }]),
      createMockGame("mock-hb-3", "handball_germany_hbl", "Handball Bundesliga (HBL)",
        "MT Melsungen", "Füchse Berlin", daysFromNow(1, 19, 5),
        [{ bookmaker: "tipico", home: 1.90, draw: 22.0, away: 3.80 },
         { bookmaker: "bet365", home: 1.95, draw: 20.0, away: 3.60 }]),
      createMockGame("mock-hb-4", "handball_germany_hbl", "Handball Bundesliga (HBL)",
        "TSV Hannover-Burgdorf", "HSG Wetzlar", daysFromNow(1, 16, 0),
        [{ bookmaker: "tipico", home: 1.85, draw: 21.0, away: 4.00 }]),
      createMockGame("mock-hb-5", "handball_germany_hbl", "Handball Bundesliga (HBL)",
        "VfL Gummersbach", "TBV Lemgo Lippe", daysFromNow(2, 19, 5),
        [{ bookmaker: "tipico", home: 2.10, draw: 19.0, away: 3.20 }]),
      createMockGame("mock-hb-6", "handball_germany_hbl", "Handball Bundesliga (HBL)",
        "Bergischer HC", "HC Erlangen", daysFromNow(2, 19, 5),
        [{ bookmaker: "bwin",   home: 2.30, draw: 20.0, away: 2.90 }]),
      createMockGame("mock-hb-7", "handball_germany_hbl", "Handball Bundesliga (HBL)",
        "Frisch Auf Göppingen", "TVB Stuttgart", daysFromNow(3, 19, 5),
        [{ bookmaker: "tipico", home: 1.70, draw: 22.0, away: 4.60 }]),
      createMockGame("mock-hb-8", "handball_germany_hbl", "Handball Bundesliga (HBL)",
        "SC DHfK Leipzig", "GWD Minden", daysFromNow(4, 19, 5),
        [{ bookmaker: "tipico", home: 1.60, draw: 23.0, away: 5.20 },
         { bookmaker: "bet365", home: 1.65, draw: 22.0, away: 5.00 }]),
    ],

    bbl: [
      createMockGame("mock-bbl-1", "basketball_germany_bbl", "Basketball Bundesliga (BBL)",
        "Alba Berlin", "FC Bayern Basketball", daysFromNow(0, 20, 0),
        [{ bookmaker: "tipico", home: 2.20, draw: undefined, away: 1.70 },
         { bookmaker: "bet365", home: 2.15, draw: undefined, away: 1.72 }]),
      createMockGame("mock-bbl-2", "basketball_germany_bbl", "Basketball Bundesliga (BBL)",
        "MHP Riesen Ludwigsburg", "Ratiopharm Ulm", daysFromNow(1, 18, 0),
        [{ bookmaker: "tipico", home: 1.85, draw: undefined, away: 1.95 }]),
      createMockGame("mock-bbl-3", "basketball_germany_bbl", "Basketball Bundesliga (BBL)",
        "Brose Bamberg", "EWE Baskets Oldenburg", daysFromNow(1, 20, 0),
        [{ bookmaker: "bwin",   home: 1.75, draw: undefined, away: 2.10 }]),
      createMockGame("mock-bbl-4", "basketball_germany_bbl", "Basketball Bundesliga (BBL)",
        "FRAPORT SKYLINERS Frankfurt", "Syntainics MBC", daysFromNow(2, 18, 30),
        [{ bookmaker: "tipico", home: 1.55, draw: undefined, away: 2.50 }]),
    ],

    basketball: [
      createMockGame("mock-el-1", "basketball_euroleague", "EuroLeague",
        "Real Madrid Basketball", "Olympiacos Piräus", daysFromNow(1, 20, 45),
        [{ bookmaker: "tipico", home: 1.60, draw: undefined, away: 2.40 }]),
      createMockGame("mock-el-2", "basketball_euroleague", "EuroLeague",
        "FC Barcelona Basketball", "ALBA Berlin", daysFromNow(2, 20, 45),
        [{ bookmaker: "tipico", home: 1.45, draw: undefined, away: 2.75 }]),
    ],

    nfl: [], // Off-season (Super Bowl Feb 2026, neue Saison ab Sep 2026)
  };

  return mockGames[sport] ?? [];
}

function createMockGame(
  id: string,
  sportKey: string,
  sportTitle: string,
  homeTeam: string,
  awayTeam: string,
  commenceTime: string,
  bookmakerOdds: Array<{ bookmaker: string; home: number; draw?: number; away: number }>
): OddsGame {
  return {
    id,
    sport_key: sportKey,
    sport_title: sportTitle,
    commence_time: commenceTime,
    home_team: homeTeam,
    away_team: awayTeam,
    bookmakers: bookmakerOdds.map(({ bookmaker, home, draw, away }) => ({
      key: bookmaker,
      title: bookmaker.charAt(0).toUpperCase() + bookmaker.slice(1),
      last_update: new Date().toISOString(),
      markets: [{
        key: "h2h",
        last_update: new Date().toISOString(),
        outcomes: [
          { name: homeTeam, price: home },
          ...(draw ? [{ name: "Draw", price: draw }] : []),
          { name: awayTeam, price: away },
        ],
      }],
    })),
  };
}
