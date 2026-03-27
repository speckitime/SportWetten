export interface OddsSet {
  homeOdds: number;
  drawOdds?: number;
  awayOdds: number;
}

export interface Probabilities {
  home: number;
  draw: number;
  away: number;
  margin: number; // bookmaker overround in %
}

export interface ValueAnalysis {
  homeValue: number; // positive = value bet
  drawValue: number;
  awayValue: number;
  bestValueOutcome: "home" | "draw" | "away" | null;
}

/**
 * Convert decimal odds to implied probability (raw, includes margin)
 */
export function oddsToImpliedProbability(odds: number): number {
  return 1 / odds;
}

/**
 * Calculate bookmaker margin (overround)
 * Returns margin as percentage (e.g. 5.2 means 5.2% margin)
 */
export function calculateMargin(odds: OddsSet): number {
  const impliedProbs =
    oddsToImpliedProbability(odds.homeOdds) +
    (odds.drawOdds ? oddsToImpliedProbability(odds.drawOdds) : 0) +
    oddsToImpliedProbability(odds.awayOdds);

  return (impliedProbs - 1) * 100;
}

/**
 * Remove bookmaker margin and get true probabilities
 * Formula: True Prob = (1/odds) / sum(1/all_odds)
 */
export function calculateTrueProbabilities(odds: OddsSet): Probabilities {
  const rawHome = oddsToImpliedProbability(odds.homeOdds);
  const rawDraw = odds.drawOdds ? oddsToImpliedProbability(odds.drawOdds) : 0;
  const rawAway = oddsToImpliedProbability(odds.awayOdds);
  const total = rawHome + rawDraw + rawAway;

  const margin = (total - 1) * 100;

  return {
    home: (rawHome / total) * 100,
    draw: (rawDraw / total) * 100,
    away: (rawAway / total) * 100,
    margin,
  };
}

/**
 * Average probabilities across multiple bookmakers
 */
export function averageProbabilities(oddsArray: OddsSet[]): Probabilities {
  if (oddsArray.length === 0) {
    return { home: 33.3, draw: 33.3, away: 33.3, margin: 0 };
  }

  const probs = oddsArray.map(calculateTrueProbabilities);
  const n = probs.length;

  return {
    home: probs.reduce((s, p) => s + p.home, 0) / n,
    draw: probs.reduce((s, p) => s + p.draw, 0) / n,
    away: probs.reduce((s, p) => s + p.away, 0) / n,
    margin: probs.reduce((s, p) => s + p.margin, 0) / n,
  };
}

/**
 * Find value bets: where true probability > implied probability by threshold
 * Returns positive number = value in that outcome (percentage edge)
 */
export function findValueBets(
  trueProbabilities: Probabilities,
  bookmakerOdds: OddsSet,
  threshold = 5.0
): ValueAnalysis {
  const impliedHome = oddsToImpliedProbability(bookmakerOdds.homeOdds) * 100;
  const impliedDraw = bookmakerOdds.drawOdds
    ? oddsToImpliedProbability(bookmakerOdds.drawOdds) * 100
    : 0;
  const impliedAway = oddsToImpliedProbability(bookmakerOdds.awayOdds) * 100;

  const homeValue = trueProbabilities.home - impliedHome;
  const drawValue = trueProbabilities.draw - impliedDraw;
  const awayValue = trueProbabilities.away - impliedAway;

  let bestValueOutcome: "home" | "draw" | "away" | null = null;
  const maxValue = Math.max(homeValue, drawValue, awayValue);

  if (maxValue >= threshold) {
    if (homeValue === maxValue) bestValueOutcome = "home";
    else if (drawValue === maxValue) bestValueOutcome = "draw";
    else bestValueOutcome = "away";
  }

  return {
    homeValue,
    drawValue,
    awayValue,
    bestValueOutcome,
  };
}

/**
 * Kelly Criterion for bet sizing (display only)
 * f = (bp - q) / b where b = odds-1, p = probability, q = 1-p
 * Returns recommended fraction of bankroll (0-1)
 */
export function kellyFraction(probability: number, decimalOdds: number): number {
  const b = decimalOdds - 1;
  const p = probability / 100;
  const q = 1 - p;
  const kelly = (b * p - q) / b;
  // Return 0 if kelly is negative (no bet), cap at 25% (quarter kelly for safety)
  return Math.max(0, Math.min(kelly * 0.25, 0.25));
}

/**
 * Calculate confidence score (1-5) based on multiple factors
 */
export function calculateConfidenceScore(factors: {
  homeAdvantage?: number; // 0-100 home win rate
  formScore?: number; // 0-10 form advantage
  h2hScore?: number; // 0-10 head-to-head advantage
  oddsConsistency?: number; // 0-1 how consistent odds are across bookmakers
  hasInjuries?: boolean;
}): number {
  let score = 3; // Base score

  if (factors.homeAdvantage !== undefined) {
    if (factors.homeAdvantage > 65) score += 0.5;
    else if (factors.homeAdvantage < 35) score -= 0.5;
  }

  if (factors.formScore !== undefined) {
    if (factors.formScore > 7) score += 0.5;
    else if (factors.formScore > 5) score += 0.25;
    else if (factors.formScore < 4) score -= 0.5;
  }

  if (factors.h2hScore !== undefined) {
    if (factors.h2hScore > 7) score += 0.5;
    else if (factors.h2hScore < 3) score -= 0.5;
  }

  if (factors.oddsConsistency !== undefined) {
    score += factors.oddsConsistency * 0.5;
  }

  if (factors.hasInjuries) {
    score -= 1;
  }

  return Math.max(1, Math.min(5, Math.round(score)));
}

/**
 * Convert form string (e.g. "WWDLW") to score 0-10
 */
export function formToScore(form: string): number {
  if (!form) return 5;
  const recent = form.slice(-5);
  let points = 0;
  for (const result of recent) {
    if (result === "W") points += 3;
    else if (result === "D") points += 1;
  }
  // Max 15 points (5 wins), normalize to 0-10
  return (points / 15) * 10;
}

/**
 * Generate analysis summary text (German)
 */
export function generateSummary(params: {
  homeTeam: string;
  awayTeam: string;
  probabilities: Probabilities;
  valueBet: "home" | "draw" | "away" | null;
  confidenceScore: number;
  homeForm?: string;
  awayForm?: string;
  hasInjuries?: boolean;
}): string {
  const { homeTeam, awayTeam, probabilities, valueBet, confidenceScore, homeForm, awayForm, hasInjuries } = params;

  const favorite =
    probabilities.home > probabilities.away
      ? `${homeTeam} (${probabilities.home.toFixed(0)}%)`
      : `${awayTeam} (${probabilities.away.toFixed(0)}%)`;

  let summary = `Analyse: ${favorite} ist statistischer Favorit. `;

  if (homeForm && awayForm) {
    summary += `Aktuelle Form: ${homeTeam} ${homeForm.slice(-5)}, ${awayTeam} ${awayForm.slice(-5)}. `;
  }

  if (valueBet === "home") {
    summary += `Value-Bet-Signal für ${homeTeam}. `;
  } else if (valueBet === "away") {
    summary += `Value-Bet-Signal für ${awayTeam}. `;
  } else if (valueBet === "draw") {
    summary += `Value-Bet-Signal für Unentschieden. `;
  }

  if (hasInjuries) {
    summary += `Achtung: Verletzungsausfälle könnten das Ergebnis beeinflussen. `;
  }

  if (confidenceScore >= 4) {
    summary += `Hohe Analysesicherheit (${confidenceScore}/5).`;
  } else if (confidenceScore <= 2) {
    summary += `Niedrige Analysesicherheit (${confidenceScore}/5) - Vorsicht empfohlen.`;
  } else {
    summary += `Mittlere Analysesicherheit (${confidenceScore}/5).`;
  }

  return summary;
}
