export type Sport = "football" | "handball" | "basketball" | "nfl";
export type MatchStatus = "scheduled" | "live" | "finished";

export interface MatchWithOdds {
  id: string;
  externalId: string | null;
  homeTeam: string;
  awayTeam: string;
  sport: string;
  competition: string;
  kickoff: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  venue: string | null;
  odds: OddsRecord[];
  analysis: AnalysisRecord | null;
}

export interface OddsRecord {
  id: string;
  matchId: string;
  bookmaker: string;
  homeOdds: number;
  drawOdds: number | null;
  awayOdds: number;
  updatedAt: string;
}

export interface AnalysisRecord {
  id: string;
  matchId: string;
  homeWinProb: number;
  drawProb: number | null;
  awayWinProb: number;
  valueBet: string | null;
  confidenceScore: number;
  summary: string;
  isValueBet: boolean;
  kellyHome: number | null;
  kellyAway: number | null;
}

export interface NewsArticleRecord {
  id: string;
  title: string;
  description: string | null;
  url: string;
  source: string;
  publishedAt: string;
  hasInjuryInfo: boolean;
  injuryPlayers: string | null;
}

export const SPORT_LABELS: Record<string, string> = {
  football: "⚽ Fußball",
  handball: "🤾 Handball",
  basketball: "🏀 Basketball",
  nfl: "🏈 NFL",
};

export const BOOKMAKER_LABELS: Record<string, string> = {
  tipico: "Tipico",
  bet365: "Bet365",
  bwin: "Bwin",
  betway: "Betway",
  unibet: "Unibet",
};
