import axios from "axios";

const BASE_URL = "https://v3.football.api-sports.io";
const API_KEY = process.env.API_FOOTBALL_KEY;

export interface FootballMatch {
  fixture: {
    id: number;
    date: string;
    status: { short: string; long: string; elapsed?: number };
    venue: { name: string; city: string };
  };
  league: { id: number; name: string; country: string };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  goals: { home: number | null; away: number | null };
}

export interface TeamStatistics {
  teamId: number;
  teamName: string;
  form: string;
  fixtures: {
    played: { home: number; away: number; total: number };
    wins: { home: number; away: number; total: number };
    draws: { home: number; away: number; total: number };
    loses: { home: number; away: number; total: number };
  };
  goals: {
    for: { average: { home: string; away: string; total: string } };
    against: { average: { home: string; away: string; total: string } };
  };
}

const LEAGUE_IDS = {
  bundesliga: 78,
  champions_league: 2,
  premier_league: 39,
};

export async function fetchLiveMatches(): Promise<FootballMatch[]> {
  if (!API_KEY || API_KEY === "your_key_here") {
    return [];
  }

  try {
    const response = await axios.get(`${BASE_URL}/fixtures`, {
      headers: { "x-apisports-key": API_KEY },
      params: { live: "all" },
      timeout: 10000,
    });
    return response.data.response || [];
  } catch (error) {
    console.error("Failed to fetch live matches:", error);
    return [];
  }
}

export async function fetchUpcomingMatches(leagueId: number, next = 10): Promise<FootballMatch[]> {
  if (!API_KEY || API_KEY === "your_key_here") {
    return [];
  }

  try {
    const response = await axios.get(`${BASE_URL}/fixtures`, {
      headers: { "x-apisports-key": API_KEY },
      params: { league: leagueId, next, timezone: "Europe/Berlin" },
      timeout: 10000,
    });
    return response.data.response || [];
  } catch (error) {
    console.error("Failed to fetch upcoming matches:", error);
    return [];
  }
}

export async function fetchTeamStatistics(
  teamId: number,
  leagueId: number,
  season: number
): Promise<TeamStatistics | null> {
  if (!API_KEY || API_KEY === "your_key_here") {
    return null;
  }

  try {
    const response = await axios.get(`${BASE_URL}/teams/statistics`, {
      headers: { "x-apisports-key": API_KEY },
      params: { team: teamId, league: leagueId, season },
      timeout: 10000,
    });
    const data = response.data.response;
    if (!data) return null;

    return {
      teamId,
      teamName: data.team.name,
      form: data.form || "",
      fixtures: data.fixtures,
      goals: data.goals,
    };
  } catch (error) {
    console.error("Failed to fetch team statistics:", error);
    return null;
  }
}

export async function fetchAllUpcomingBundesliga(): Promise<FootballMatch[]> {
  return fetchUpcomingMatches(LEAGUE_IDS.bundesliga, 20);
}
