import axios from "axios";

const BASE_URL = "https://api.openligadb.de";

export interface OpenLigaMatch {
  matchID: number;
  matchDateTime: string;
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

const axiosOpts = { timeout: 15000, headers: { Accept: "application/json" } };

async function get<T>(url: string): Promise<T | null> {
  try {
    const res = await axios.get(url, axiosOpts);
    return res.data as T;
  } catch (err) {
    console.error(`[OpenLigaDB] GET ${url} failed:`, (err as Error).message);
    return null;
  }
}

async function fetchRoundByNumber(
  shortcut: string,
  season: string,
  round: number
): Promise<OpenLigaMatch[]> {
  const data = await get<OpenLigaMatch[]>(
    `${BASE_URL}/getmatchdata/${shortcut}/${season}/${round}`
  );
  return data ?? [];
}

async function getCurrentRound(shortcut: string): Promise<{ matches: OpenLigaMatch[]; roundId: number | null }> {
  const matches = await get<OpenLigaMatch[]>(`${BASE_URL}/getmatchdata/${shortcut}`);
  const roundData = await get<{ groupOrderID: number }>(`${BASE_URL}/getcurrentround/${shortcut}`);
  return {
    matches: matches ?? [],
    roundId: roundData?.groupOrderID ?? null,
  };
}

/** Fetch current + next N matchdays, return all non-finished future matches */
async function fetchUpcoming(shortcut: string, extraRounds = 2): Promise<OpenLigaMatch[]> {
  const season = getCurrentSeason();
  const { matches: current, roundId } = await getCurrentRound(shortcut);

  const futures: OpenLigaMatch[][] = [current];

  if (roundId !== null) {
    const fetches = Array.from({ length: extraRounds }, (_, i) =>
      fetchRoundByNumber(shortcut, season, roundId + i + 1)
    );
    const results = await Promise.all(fetches);
    futures.push(...results);
  }

  // Flatten + deduplicate
  const seen = new Set<number>();
  const all: OpenLigaMatch[] = [];
  for (const batch of futures) {
    for (const m of batch) {
      if (!seen.has(m.matchID)) {
        seen.add(m.matchID);
        all.push(m);
      }
    }
  }

  console.log(`[OpenLigaDB] ${shortcut}: ${all.length} total, ${all.filter(m => !m.matchIsFinished).length} upcoming`);

  // Keep scheduled/live matches; also keep recently finished (within 2h) for live scores
  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000);
  return all.filter(
    (m) => !m.matchIsFinished || new Date(m.matchDateTime) >= cutoff
  );
}

async function tryShortcuts(shortcuts: string[], extraRounds = 2): Promise<OpenLigaMatch[]> {
  for (const s of shortcuts) {
    const result = await fetchUpcoming(s, extraRounds);
    if (result.length > 0) return result;
    console.log(`[OpenLigaDB] ${s} returned 0, trying next shortcut...`);
  }
  return [];
}

export async function fetchUpcomingBundesliga(): Promise<OpenLigaMatch[]> {
  return tryShortcuts(["bl1"]);
}

export async function fetchUpcomingHBL(): Promise<OpenLigaMatch[]> {
  return tryShortcuts(["hbl", "hbl1", "hblm"]);
}

export async function fetchUpcomingBBL(): Promise<OpenLigaMatch[]> {
  return tryShortcuts(["bbl", "bbl1", "bbl2024"]);
}

export async function fetchLiveBundesliga(): Promise<OpenLigaMatch[]> {
  const data = await get<OpenLigaMatch[]>(`${BASE_URL}/getmatchdata/bl1`);
  if (!data) return [];
  const now = new Date();
  return data.filter((m) => {
    const kick = new Date(m.matchDateTime);
    const diff = (now.getTime() - kick.getTime()) / 60000;
    return !m.matchIsFinished && diff >= 0 && diff < 120;
  });
}

function getCurrentSeason(): string {
  const now = new Date();
  return now.getMonth() + 1 >= 7 ? String(now.getFullYear()) : String(now.getFullYear() - 1);
}

// ─── BBL Estimated odds ──────────────────────────────────────────────────────

const BBL_STRENGTH: Record<string, number> = {
  "FC Bayern München Basketball": 92, "Bayern Basketball": 92,
  "Alba Berlin": 88,
  "MHP Riesen Ludwigsburg": 82,
  "Ratiopharm Ulm": 80,
  "Brose Bamberg": 78,
  "EWE Baskets Oldenburg": 76,
  "Telekom Baskets Bonn": 75,
  "Löwen Braunschweig": 74,
  "Hamburg Towers": 73,
  "FRAPORT SKYLINERS Frankfurt": 72, "Skyliners Frankfurt": 72,
  "SYNTAINICS MBC": 70, "Syntainics MBC": 70,
  "BG Göttingen": 69,
  "Niners Chemnitz": 68,
  "Hakro Merlins Crailsheim": 67,
  "Walter Tigers Tübingen": 65,
  "Kirchheim Knights": 60,
};

function bblStrength(name: string): number {
  if (BBL_STRENGTH[name]) return BBL_STRENGTH[name];
  for (const [key, val] of Object.entries(BBL_STRENGTH)) {
    const word = key.split(" ").find((w) => w.length > 4);
    if (word && name.includes(word)) return val;
  }
  return 70;
}

export function estimateBBLOdds(home: string, away: string): { homeOdds: number; awayOdds: number } {
  const hs = bblStrength(home) + 5;
  const as_ = bblStrength(away);
  const total = hs + as_;
  const vig = 1.08;
  return {
    homeOdds: +Math.min(Math.max((1 / ((hs / total) / vig)), 1.15), 4.5).toFixed(2),
    awayOdds: +Math.min(Math.max((1 / ((as_ / total) / vig)), 1.15), 5.0).toFixed(2),
  };
}

// ─── HBL Estimated odds ──────────────────────────────────────────────────────

const HBL_STRENGTH: Record<string, number> = {
  "THW Kiel": 90, "SG Flensburg-Handewitt": 88, "SC Magdeburg": 87,
  "Rhein-Neckar Löwen": 82, "MT Melsungen": 80, "Füchse Berlin": 77,
  "TSV Hannover-Burgdorf": 75, "HSG Wetzlar": 72, "SC DHfK Leipzig": 72,
  "TBV Lemgo Lippe": 70, "VfL Gummersbach": 68, "HC Erlangen": 68,
  "FA Göppingen": 67, "Frisch Auf Göppingen": 67, "TVB Stuttgart": 66,
  "Bergischer HC": 66, "HBW Balingen-Weilstetten": 63, "TSV GWD Minden": 65,
  "SG BBM Bietigheim": 65, "Tusem Essen": 63, "HSC 2000 Coburg": 61,
  "TSV Eisenach": 62, "VfL Lübeck-Schwartau": 60, "HC Oppenau/Backnang": 60,
  "TV Großwallstadt": 59,
};

function hblStrength(name: string): number {
  if (HBL_STRENGTH[name]) return HBL_STRENGTH[name];
  for (const [key, val] of Object.entries(HBL_STRENGTH)) {
    const word = key.split(" ").find((w) => w.length > 4);
    if (word && name.includes(word)) return val;
  }
  return 68;
}

export function estimateHBLOdds(home: string, away: string): { homeOdds: number; drawOdds: number; awayOdds: number } {
  const hs = hblStrength(home) + 8;
  const as_ = hblStrength(away);
  const total = hs + as_;
  const homeProb = (hs / total) * 0.95;
  const awayProb = (as_ / total) * 0.95;
  const vig = 1.10;
  return {
    homeOdds: +Math.min(Math.max(1 / (homeProb / vig), 1.20), 5.0).toFixed(2),
    drawOdds: +Math.min(Math.max(1 / (0.05 / vig), 14.0), 30.0).toFixed(2),
    awayOdds: +Math.min(Math.max(1 / (awayProb / vig), 1.20), 6.0).toFixed(2),
  };
}
