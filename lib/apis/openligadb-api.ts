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
      timeout: 15000,
      headers: { Accept: "application/json" },
    });
    const data = response.data as OpenLigaMatch[];
    console.log(`[OpenLigaDB] ${leagueShortcut} current round: ${data.length} matches`);
    return data;
  } catch (error) {
    console.error(`[OpenLigaDB] Failed to fetch current round for ${leagueShortcut}:`, error);
    return [];
  }
}

// Fetch a specific round by number
async function fetchRound(leagueShortcut: string, season: string, round: number): Promise<OpenLigaMatch[]> {
  try {
    const response = await axios.get(
      `${BASE_URL}/getmatchdata/${leagueShortcut}/${season}/${round}`,
      { timeout: 15000, headers: { Accept: "application/json" } }
    );
    return response.data as OpenLigaMatch[];
  } catch {
    return [];
  }
}

// Get current round number
async function getCurrentRoundNumber(leagueShortcut: string): Promise<number | null> {
  try {
    const res = await axios.get(`${BASE_URL}/getcurrentround/${leagueShortcut}`, {
      timeout: 10000,
      headers: { Accept: "application/json" },
    });
    const roundId = (res.data as { groupOrderID: number }).groupOrderID;
    console.log(`[OpenLigaDB] ${leagueShortcut} current round: ${roundId}`);
    return roundId;
  } catch {
    return null;
  }
}

// Fetch current + next matchday for a league
async function fetchUpcomingMatches(leagueShortcut: string): Promise<OpenLigaMatch[]> {
  const season = getCurrentSeason();

  // Get current round matches
  const current = await fetchCurrentRound(leagueShortcut);

  // Also try to get next round
  const roundId = await getCurrentRoundNumber(leagueShortcut);
  let next: OpenLigaMatch[] = [];
  if (roundId !== null) {
    next = await fetchRound(leagueShortcut, season, roundId + 1);
  }

  const all = [...current, ...next];

  // Deduplicate by matchID
  const seen = new Set<number>();
  return all.filter((m) => {
    if (seen.has(m.matchID)) return false;
    seen.add(m.matchID);
    return true;
  });
}

export async function fetchUpcomingBundesliga(): Promise<OpenLigaMatch[]> {
  const matches = await fetchUpcomingMatches("bl1");
  // Include today's games (even if kickoff was recent) + scheduled
  const cutoff = new Date(Date.now() - 3 * 60 * 60 * 1000); // 3h back
  return matches.filter((m) => !m.matchIsFinished || new Date(m.matchDateTime) >= cutoff);
}

export async function fetchUpcomingHBL(): Promise<OpenLigaMatch[]> {
  // Try primary shortcut "hbl", fallback to "hbl1"
  let matches = await fetchUpcomingMatches("hbl");
  if (matches.length === 0) {
    console.log("[OpenLigaDB] HBL returned 0 matches, trying 'hbl1'...");
    matches = await fetchUpcomingMatches("hbl1");
  }
  const cutoff = new Date(Date.now() - 3 * 60 * 60 * 1000);
  return matches.filter((m) => !m.matchIsFinished || new Date(m.matchDateTime) >= cutoff);
}

export async function fetchUpcomingBBL(): Promise<OpenLigaMatch[]> {
  // Basketball Bundesliga: shortcut "bbl", fallback "bbl2024" or "bbl1"
  let matches = await fetchUpcomingMatches("bbl");
  if (matches.length === 0) {
    console.log("[OpenLigaDB] BBL returned 0 matches, trying 'bbl1'...");
    matches = await fetchUpcomingMatches("bbl1");
  }
  const cutoff = new Date(Date.now() - 3 * 60 * 60 * 1000);
  return matches.filter((m) => !m.matchIsFinished || new Date(m.matchDateTime) >= cutoff);
}

export async function fetchLiveBundesliga(): Promise<OpenLigaMatch[]> {
  const matches = await fetchCurrentRound("bl1");
  const now = new Date();
  return matches.filter((m) => {
    const kick = new Date(m.matchDateTime);
    const diff = (now.getTime() - kick.getTime()) / 60000;
    return !m.matchIsFinished && diff >= 0 && diff < 120;
  });
}

// Current season: 2025 for the 2025/26 season (we're in March 2026)
function getCurrentSeason(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 7 ? String(year) : String(year - 1);
}

// ─── BBL: Basketball Bundesliga ─────────────────────────────────────────────

const BBL_TEAM_STRENGTH: Record<string, number> = {
  "FC Bayern München Basketball": 92,
  "Bayern Basketball": 92,
  "Alba Berlin": 88,
  "MHP Riesen Ludwigsburg": 82,
  "Ratiopharm Ulm": 80,
  "Brose Bamberg": 78,
  "EWE Baskets Oldenburg": 76,
  "Telekom Baskets Bonn": 75,
  "SYNTAINICS MBC": 70,
  "Syntainics MBC": 70,
  "FRAPORT SKYLINERS Frankfurt": 72,
  "Skyliners Frankfurt": 72,
  "Löwen Braunschweig": 74,
  "Niners Chemnitz": 68,
  "Walter Tigers Tübingen": 65,
  "Hakro Merlins Crailsheim": 67,
  "Hamburg Towers": 73,
  "BG Göttingen": 69,
  "Kirchheim Knights": 60,
};

function getBBLTeamStrength(name: string): number {
  if (BBL_TEAM_STRENGTH[name]) return BBL_TEAM_STRENGTH[name];
  for (const [key, val] of Object.entries(BBL_TEAM_STRENGTH)) {
    const keyword = key.split(" ").find((w) => w.length > 4);
    if (keyword && name.includes(keyword)) return val;
  }
  return 70;
}

export function estimateBBLOdds(
  homeTeam: string,
  awayTeam: string
): { homeOdds: number; awayOdds: number } {
  const homeStr = getBBLTeamStrength(homeTeam) + 5; // Heimvorteil Basketball
  const awayStr = getBBLTeamStrength(awayTeam);
  const total = homeStr + awayStr;

  const homeProb = homeStr / total;
  const awayProb = awayStr / total;
  const vig = 1.08;

  const homeOdds = Math.round((1 / (homeProb / vig)) * 100) / 100;
  const awayOdds = Math.round((1 / (awayProb / vig)) * 100) / 100;

  return {
    homeOdds: Math.min(Math.max(homeOdds, 1.15), 4.5),
    awayOdds: Math.min(Math.max(awayOdds, 1.15), 5.0),
  };
}

// ─── HBL: Handball Bundesliga ────────────────────────────────────────────────

// Generate deterministic estimated odds for HBL matches (no real odds source in free tier)
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
  "FA Göppingen": 67,
  "Frisch Auf Göppingen": 67,
  "TVB Stuttgart": 66,
  "SC DHfK Leipzig": 72,
  "TSV Eisenach": 62,
  "HSC 2000 Coburg": 61,
  "VfL Lübeck-Schwartau": 60,
  "Tusem Essen": 63,
  "SG BBM Bietigheim": 65,
  "HC Oppenau/Backnang": 60,
  "TV Großwallstadt": 59,
};

function getTeamStrength(name: string): number {
  if (HBL_TEAM_STRENGTH[name]) return HBL_TEAM_STRENGTH[name];
  for (const [key, val] of Object.entries(HBL_TEAM_STRENGTH)) {
    if (name.includes(key.split(" ")[1] ?? key) || key.includes(name.split(" ")[0])) return val;
  }
  return 68;
}

export function estimateHBLOdds(
  homeTeam: string,
  awayTeam: string
): { homeOdds: number; drawOdds: number; awayOdds: number } {
  const homeStr = getTeamStrength(homeTeam) + 8; // Heimvorteil
  const awayStr = getTeamStrength(awayTeam);
  const total = homeStr + awayStr;

  const homeProb = (homeStr / total) * 0.95;
  const awayProb = (awayStr / total) * 0.95;
  const drawProb = 0.05;

  const vig = 1.10;
  const homeOdds = Math.round((1 / (homeProb / vig)) * 100) / 100;
  const awayOdds = Math.round((1 / (awayProb / vig)) * 100) / 100;
  const drawOdds = Math.round((1 / (drawProb / vig)) * 100) / 100;

  return {
    homeOdds: Math.min(Math.max(homeOdds, 1.20), 5.0),
    drawOdds: Math.min(Math.max(drawOdds, 14.0), 30.0),
    awayOdds: Math.min(Math.max(awayOdds, 1.20), 6.0),
  };
}
