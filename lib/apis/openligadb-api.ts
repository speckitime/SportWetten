import axios from "axios";

const BASE_URL = "https://api.openligadb.de";

export interface OpenLigaMatch {
  matchID: number;
  matchDateTime: string; // "2025-08-22T18:30:00"
  leagueName: string;
  leagueShortcut: string;
  leagueSeason: string;
  group: { groupName: string; groupOrderID: number };
  team1: { teamId: number; teamName: string; shortName: string };
  team2: { teamId: number; teamName: string; shortName: string };
  matchIsFinished: boolean;
  matchResults: Array<{
    resultOrderID: number;
    resultTypeID: number;
    pointsTeam1: number;
    pointsTeam2: number;
  }>;
}

// Fetch current matchday matches for a league
async function fetchCurrentRound(leagueShortcut: string): Promise<OpenLigaMatch[]> {
  try {
    const response = await axios.get(`${BASE_URL}/getmatchdata/${leagueShortcut}`, {
      timeout: 10000,
    });
    return response.data as OpenLigaMatch[];
  } catch (error) {
    console.error(`[OpenLigaDB] Failed to fetch ${leagueShortcut}:`, error);
    return [];
  }
}

// Next 2 matchdays (current + next)
async function fetchNextRound(leagueShortcut: string, season: string): Promise<OpenLigaMatch[]> {
  try {
    // Get current round number first
    const roundRes = await axios.get(`${BASE_URL}/getcurrentround/${leagueShortcut}`, {
      timeout: 10000,
    });
    const roundId: number = (roundRes.data as { groupOrderID: number }).groupOrderID;

    const nextRoundRes = await axios.get(
      `${BASE_URL}/getmatchdata/${leagueShortcut}/${season}/${roundId + 1}`,
      { timeout: 10000 }
    );
    return nextRoundRes.data as OpenLigaMatch[];
  } catch {
    return [];
  }
}

export async function fetchUpcomingBundesliga(): Promise<OpenLigaMatch[]> {
  const season = getCurrentSeason();
  const [current, next] = await Promise.all([
    fetchCurrentRound("bl1"),
    fetchNextRound("bl1", season),
  ]);
  const all = [...current, ...next];
  // Return only upcoming (not yet finished)
  return all.filter((m) => !m.matchIsFinished);
}

export async function fetchUpcomingHBL(): Promise<OpenLigaMatch[]> {
  const season = getCurrentSeason();
  const [current, next] = await Promise.all([
    fetchCurrentRound("hbl"),
    fetchNextRound("hbl", season),
  ]);
  const all = [...current, ...next];
  return all.filter((m) => !m.matchIsFinished);
}

export async function fetchLiveBundesliga(): Promise<OpenLigaMatch[]> {
  const matches = await fetchCurrentRound("bl1");
  const now = new Date();
  return matches.filter((m) => {
    const kick = new Date(m.matchDateTime);
    const diff = (now.getTime() - kick.getTime()) / 60000; // minutes
    return !m.matchIsFinished && diff >= 0 && diff < 120;
  });
}

// Current season: 2025 for the 2025/26 season (we're in March 2026)
function getCurrentSeason(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  // Season starts in summer: after July → current year is season start
  return month >= 7 ? String(year) : String(year - 1);
}

// Generate deterministic estimated odds for HBL matches (no real odds source in free tier)
// Based on team strength tiers known for HBL
const HBL_TEAM_STRENGTH: Record<string, number> = {
  "THW Kiel": 90,
  "SG Flensburg-Handewitt": 88,
  "SC Magdeburg": 87,
  "Rhein-Neckar Löwen": 82,
  "MT Melsungen": 80,
  "TSV Hannover-Burgdorf": 75,
  "Füchse Berlin": 77,
  "HSG Wetzlar": 72,
  "TBV Lemgo Lippe": 70,
  "VfL Gummersbach": 68,
  "TSV GWD Minden": 65,
  "HC Erlangen": 68,
  "HBW Balingen-Weilstetten": 63,
  "Bergischer HC": 66,
  "TV Emsdetten": 60,
};

function getTeamStrength(name: string): number {
  // Exact match first
  if (HBL_TEAM_STRENGTH[name]) return HBL_TEAM_STRENGTH[name];
  // Partial match
  for (const [key, val] of Object.entries(HBL_TEAM_STRENGTH)) {
    if (name.includes(key) || key.includes(name)) return val;
  }
  return 70; // Default
}

export function estimateHBLOdds(
  homeTeam: string,
  awayTeam: string
): { homeOdds: number; drawOdds: number; awayOdds: number } {
  const homeStr = getTeamStrength(homeTeam);
  const awayStr = getTeamStrength(awayTeam);

  // Home advantage bonus in handball
  const homeAdj = homeStr + 8;
  const total = homeAdj + awayStr;

  // True probabilities
  const homeProb = homeAdj / total;
  const awayProb = awayStr / total;
  // Draws are rare in handball (~5%)
  const drawProb = 0.05;
  const adjHomeProb = homeProb * 0.95;
  const adjAwayProb = awayProb * 0.95;

  // Convert to odds with ~10% vig
  const vig = 1.10;
  const homeOdds = Math.round((1 / (adjHomeProb / vig)) * 100) / 100;
  const awayOdds = Math.round((1 / (adjAwayProb / vig)) * 100) / 100;
  const drawOdds = Math.round((1 / (drawProb / vig)) * 100) / 100;

  // Clamp to realistic ranges
  return {
    homeOdds: Math.min(Math.max(homeOdds, 1.25), 4.5),
    drawOdds: Math.min(Math.max(drawOdds, 14.0), 30.0),
    awayOdds: Math.min(Math.max(awayOdds, 1.25), 5.5),
  };
}
