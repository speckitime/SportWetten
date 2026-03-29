"use client";

import Link from "next/link";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { MatchWithOdds, SPORT_LABELS } from "@/lib/types";
import { useKombi } from "@/lib/kombi-context";

interface MatchCardProps {
  match: MatchWithOdds;
}

function StarRating({ score }: { score: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={s <= score ? "text-yellow-400" : "text-gray-600"}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function FormBadge({ result }: { result: string }) {
  const colors: Record<string, string> = {
    W: "bg-green-600 text-white",
    D: "bg-yellow-600 text-white",
    L: "bg-red-600 text-white",
  };
  return (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 rounded text-xs font-bold ${colors[result] || "bg-gray-600 text-white"}`}
    >
      {result}
    </span>
  );
}

function KombiButton({ match }: { match: MatchWithOdds }) {
  const { addSelection, removeSelection, selections } = useKombi();
  const existing = selections.find((s) => s.matchId === match.id);

  const bestOdds = match.odds.reduce(
    (best, o) => ({
      home: Math.max(best.home, o.homeOdds),
      draw: Math.max(best.draw, o.drawOdds ?? 0),
      away: Math.max(best.away, o.awayOdds),
    }),
    { home: 0, draw: 0, away: 0 }
  );

  // Recommended selection (highest probability from analysis, fallback home)
  const analysis = match.analysis;
  let recKey: "home" | "draw" | "away" = "home";
  let recOdds = bestOdds.home;
  let recLabel = `${match.homeTeam} gewinnt`;

  if (analysis) {
    const candidates = [
      { key: "home" as const, prob: analysis.homeWinProb, odds: bestOdds.home, label: `${match.homeTeam} gewinnt` },
      { key: "draw" as const, prob: analysis.drawProb ?? 0, odds: bestOdds.draw, label: "Unentschieden" },
      { key: "away" as const, prob: analysis.awayWinProb, odds: bestOdds.away, label: `${match.awayTeam} gewinnt` },
    ].filter((c) => c.odds > 0);
    if (candidates.length > 0) {
      const best = candidates.reduce((b, c) => (c.prob > b.prob ? c : b), candidates[0]);
      recKey = best.key;
      recOdds = best.odds;
      recLabel = best.label;
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (existing) {
      removeSelection(match.id);
    } else {
      addSelection({
        matchId: match.id,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        competition: match.competition,
        selection: recKey,
        odds: recOdds,
        label: recLabel,
      });
    }
  };

  if (match.odds.length === 0 || match.status === "finished") return null;

  return (
    <button
      onClick={handleClick}
      className={`text-xs px-2 py-1 rounded font-medium transition-colors ${
        existing
          ? "bg-orange-600 text-white"
          : "bg-gray-700 text-gray-300 hover:bg-orange-700 hover:text-white"
      }`}
      title={existing ? "Aus Kombi entfernen" : `${recLabel} (${recOdds.toFixed(2)}) zum Kombi hinzufügen`}
    >
      {existing ? "✓ Kombi" : "+ Kombi"}
    </button>
  );
}

export default function MatchCard({ match }: MatchCardProps) {
  const bestOdds = match.odds.reduce(
    (best, odds) => ({
      home: Math.max(best.home, odds.homeOdds),
      draw: Math.max(best.draw, odds.drawOdds ?? 0),
      away: Math.max(best.away, odds.awayOdds),
    }),
    { home: 0, draw: 0, away: 0 }
  );

  const kickoffDate = new Date(match.kickoff);
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <Link href={`/match/${match.id}`} className="flex-1 min-w-0">
          <span className="text-xs text-gray-400">{match.competition}</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-500">
              {SPORT_LABELS[match.sport] || match.sport}
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <KombiButton match={match} />
          <div className="text-right">
            {isLive ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
                LIVE
              </span>
            ) : isFinished ? (
              <span className="text-xs text-gray-500">Beendet</span>
            ) : (
              <span className="text-xs text-gray-400">
                {format(kickoffDate, "dd.MM. HH:mm", { locale: de })} Uhr
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Teams & Score */}
      <Link href={`/match/${match.id}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <div className="text-white font-semibold">{match.homeTeam}</div>
            <div className="text-gray-400 text-sm mt-1">{match.awayTeam}</div>
          </div>

          {(isLive || isFinished) && (
            <div className="text-center mx-4">
              <div className="text-2xl font-bold text-white">
                {match.homeScore ?? 0}
                <span className="text-gray-400 mx-1">:</span>
                {match.awayScore ?? 0}
              </div>
            </div>
          )}
        </div>

        {/* Odds comparison */}
        {match.odds.length > 0 && !isFinished && (
          <div className="flex gap-2 mb-3">
            {bestOdds.home > 0 && (
              <div className="flex-1 bg-gray-700 rounded p-2 text-center">
                <div className="text-xs text-gray-400 mb-1">1</div>
                <div className="text-green-400 font-bold text-sm">
                  {bestOdds.home.toFixed(2)}
                </div>
              </div>
            )}
            {bestOdds.draw > 0 && (
              <div className="flex-1 bg-gray-700 rounded p-2 text-center">
                <div className="text-xs text-gray-400 mb-1">X</div>
                <div className="text-yellow-400 font-bold text-sm">
                  {bestOdds.draw.toFixed(2)}
                </div>
              </div>
            )}
            {bestOdds.away > 0 && (
              <div className="flex-1 bg-gray-700 rounded p-2 text-center">
                <div className="text-xs text-gray-400 mb-1">2</div>
                <div className="text-blue-400 font-bold text-sm">
                  {bestOdds.away.toFixed(2)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tipp-Signal wenn Value Bet */}
        {match.analysis?.isValueBet && match.analysis.valueBet && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs bg-green-900/60 text-green-300 px-2 py-0.5 rounded-full font-medium">
              🎯 Value Bet
            </span>
            <span className="text-xs text-gray-400">
              Tipp:{" "}
              {match.analysis.valueBet === "home"
                ? match.homeTeam
                : match.analysis.valueBet === "away"
                ? match.awayTeam
                : "Unentschieden"}
            </span>
          </div>
        )}

        {/* Analysis */}
        {match.analysis && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StarRating score={match.analysis.confidenceScore} />
            </div>
            <div className="text-xs text-gray-400">
              {match.analysis.homeWinProb.toFixed(0)}% /{" "}
              {(match.analysis.drawProb ?? 0).toFixed(0)}% /{" "}
              {match.analysis.awayWinProb.toFixed(0)}%
            </div>
          </div>
        )}
      </Link>
    </div>
  );
}

export { FormBadge };
