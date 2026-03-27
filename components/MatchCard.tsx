"use client";

import Link from "next/link";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { MatchWithOdds, SPORT_LABELS } from "@/lib/types";

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
    <Link href={`/match/${match.id}`}>
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <span className="text-xs text-gray-400">{match.competition}</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-500">
                {SPORT_LABELS[match.sport] || match.sport}
              </span>
            </div>
          </div>
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

        {/* Teams & Score */}
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

        {/* Analysis */}
        {match.analysis && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StarRating score={match.analysis.confidenceScore} />
              {match.analysis.isValueBet && (
                <span className="text-xs bg-green-800 text-green-300 px-2 py-0.5 rounded-full font-medium">
                  Value Bet
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400">
              {match.analysis.homeWinProb.toFixed(0)}% /{" "}
              {(match.analysis.drawProb ?? 0).toFixed(0)}% /{" "}
              {match.analysis.awayWinProb.toFixed(0)}%
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

export { FormBadge };
