import axios from "axios";

const ESPN_BASE = "http://site.api.espn.com/apis/site/v2/sports";

export interface ESPNEvent {
  id: string;
  name: string;
  shortName: string;
  date: string;
  status: {
    type: {
      name: string; // STATUS_SCHEDULED, STATUS_IN_PROGRESS, STATUS_FINAL
      shortDetail: string;
    };
    displayClock?: string;
    period?: number;
  };
  competitions: Array<{
    competitors: Array<{
      id: string;
      homeAway: "home" | "away";
      team: { displayName: string; abbreviation: string };
      score?: string;
    }>;
    venue?: { fullName: string; address?: { city: string; state?: string } };
  }>;
}

export async function fetchNFLScores(): Promise<ESPNEvent[]> {
  try {
    const response = await axios.get(
      `${ESPN_BASE}/football/nfl/scoreboard`,
      { timeout: 10000 }
    );
    return response.data.events || [];
  } catch (error) {
    console.error("ESPN NFL fetch failed:", error);
    return [];
  }
}

export async function fetchNBAScores(): Promise<ESPNEvent[]> {
  try {
    const response = await axios.get(
      `${ESPN_BASE}/basketball/nba/scoreboard`,
      { timeout: 10000 }
    );
    return response.data.events || [];
  } catch (error) {
    console.error("ESPN NBA fetch failed:", error);
    return [];
  }
}

export async function fetchSoccerScores(league = "ger.1"): Promise<ESPNEvent[]> {
  try {
    const response = await axios.get(
      `${ESPN_BASE}/soccer/${league}/scoreboard`,
      { timeout: 10000 }
    );
    return response.data.events || [];
  } catch (error) {
    console.error(`ESPN Soccer ${league} fetch failed:`, error);
    return [];
  }
}

export function mapESPNStatusToLocal(statusName: string): string {
  switch (statusName) {
    case "STATUS_SCHEDULED":
      return "scheduled";
    case "STATUS_IN_PROGRESS":
      return "live";
    case "STATUS_FINAL":
    case "STATUS_FULL_TIME":
      return "finished";
    default:
      return "scheduled";
  }
}
