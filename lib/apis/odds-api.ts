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

// Map sport names to The Odds API sport keys
const SPORT_KEYS: Record<string, string[]> = {
  football: ["soccer_germany_bundesliga", "soccer_uefa_champs_league", "soccer_epl"],
  handball: ["handball_germany_hbl"],
  basketball: ["basketball_euroleague", "basketball_nbl"],
  nfl: ["americanfootball_nfl"],
};

export async function fetchOdds(sport: string): Promise<OddsGame[]> {
  if (!API_KEY || API_KEY === "your_key_here") {
    return getMockOdds(sport);
  }

  const sportKeys = SPORT_KEYS[sport] || SPORT_KEYS.football;
  const results: OddsGame[] = [];

  for (const sportKey of sportKeys) {
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
    } catch (error) {
      console.error(`Failed to fetch odds for ${sportKey}:`, error);
    }
  }

  return results;
}

export async function fetchAllSportsOdds(): Promise<OddsGame[]> {
  const sports = Object.keys(SPORT_KEYS);
  const allOdds: OddsGame[] = [];

  for (const sport of sports) {
    const odds = await fetchOdds(sport);
    allOdds.push(...odds);
  }

  return allOdds;
}

// Mock data for development/when API key is not set
function getMockOdds(sport: string): OddsGame[] {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const dayAfter = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const mockGames: Record<string, OddsGame[]> = {
    football: [
      createMockGame("mock-fb-1", "soccer_germany_bundesliga", "Fußball - Bundesliga",
        "FC Bayern München", "Borussia Dortmund", tomorrow.toISOString(),
        [{ bookmaker: "tipico", home: 1.65, draw: 4.20, away: 5.50 },
         { bookmaker: "bet365", home: 1.68, draw: 4.00, away: 5.25 },
         { bookmaker: "bwin", home: 1.62, draw: 4.10, away: 5.40 }]),
      createMockGame("mock-fb-2", "soccer_germany_bundesliga", "Fußball - Bundesliga",
        "Bayer Leverkusen", "RB Leipzig", tomorrow.toISOString(),
        [{ bookmaker: "tipico", home: 2.10, draw: 3.40, away: 3.60 },
         { bookmaker: "bet365", home: 2.15, draw: 3.30, away: 3.50 },
         { bookmaker: "bwin", home: 2.05, draw: 3.45, away: 3.70 }]),
      createMockGame("mock-fb-3", "soccer_uefa_champs_league", "Fußball - Champions League",
        "Real Madrid", "Manchester City", dayAfter.toISOString(),
        [{ bookmaker: "tipico", home: 2.30, draw: 3.20, away: 3.10 },
         { bookmaker: "bet365", home: 2.25, draw: 3.25, away: 3.15 },
         { bookmaker: "bwin", home: 2.35, draw: 3.10, away: 3.05 }]),
    ],
    handball: [
      createMockGame("mock-hb-1", "handball_germany_hbl", "Handball - HBL",
        "THW Kiel", "SG Flensburg-Handewitt", tomorrow.toISOString(),
        [{ bookmaker: "tipico", home: 1.75, draw: 6.00, away: 4.20 },
         { bookmaker: "bet365", home: 1.80, draw: 5.50, away: 4.00 }]),
    ],
    basketball: [
      createMockGame("mock-bb-1", "basketball_euroleague", "Basketball - EuroLeague",
        "Alba Berlin", "FC Bayern Basketball", tomorrow.toISOString(),
        [{ bookmaker: "tipico", home: 1.95, draw: undefined, away: 1.85 },
         { bookmaker: "bet365", home: 2.00, draw: undefined, away: 1.80 }]),
    ],
    nfl: [
      createMockGame("mock-nfl-1", "americanfootball_nfl", "NFL",
        "Kansas City Chiefs", "San Francisco 49ers", dayAfter.toISOString(),
        [{ bookmaker: "tipico", home: 1.70, draw: undefined, away: 2.20 },
         { bookmaker: "bet365", home: 1.72, draw: undefined, away: 2.15 }]),
    ],
  };

  return mockGames[sport] || mockGames.football;
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
