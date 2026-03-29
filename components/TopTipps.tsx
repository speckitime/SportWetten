"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { SPORT_LABELS } from "@/lib/types";
import { useKombi } from "@/lib/kombi-context";

interface BestTipp {
  key: "home" | "draw" | "away";
  prob: number;
  odds: number;
  label: string;
}

interface TopPick {
  id: string;
  confidenceScore: number;
  isValueBet: boolean;
  homeWinProb: number;
  drawProb: number | null;
  awayWinProb: number;
  valueBet: string | null;
  gutWertScore: number;
  bestTipp: BestTipp | null;
  bestOdds: { home: number | null; draw: number | null; away: number | null };
  match: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    sport: string;
    competition: string;
    kickoff: string;
    status: string;
    odds: { homeOdds: number; drawOdds: number | null; awayOdds: number }[];
  };
}

function TippCard({ pick }: { pick: TopPick }) {
  const { addSelection, removeSelection, selections } = useKombi();
  const alreadyInKombi = selections.some((s) => s.matchId === pick.match.id);
  const tipp = pick.bestTipp;

  if (!tipp) return null;

  const isValue = pick.isValueBet;
  const conf = pick.confidenceScore;

  const cardStyle = isValue
    ? "border-green-500 bg-gradient-to-br from-green-950/60 to-gray-800"
    : conf >= 4
    ? "border-blue-500 bg-gradient-to-br from-blue-950/50 to-gray-800"
    : "border-gray-600 bg-gray-800";

  const accentColor = isValue ? "text-green-400" : conf >= 4 ? "text-blue-400" : "text-yellow-400";
  const badgeBg = isValue ? "bg-green-700" : conf >= 4 ? "bg-blue-700" : "bg-gray-600";

  const handleKombi = (e: React.MouseEvent) => {
    e.preventDefault();
    if (alreadyInKombi) {
      removeSelection(pick.match.id);
    } else {
      addSelection({
        matchId: pick.match.id,
        homeTeam: pick.match.homeTeam,
        awayTeam: pick.match.awayTeam,
        competition: pick.match.competition,
        selection: tipp.key,
        odds: tipp.odds,
        label: tipp.label,
      });
    }
  };

  return (
    <div className={`rounded-xl border-2 p-4 flex flex-col gap-3 ${cardStyle}`}>
      {/* Top badges */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-xs font-bold text-white px-2 py-0.5 rounded-full ${badgeBg}`}>
            {isValue ? "🎯 Value Bet" : "📊 Tipp"}
          </span>
          <span className="text-xs text-gray-400">
            {SPORT_LABELS[pick.match.sport] || pick.match.sport}
          </span>
        </div>
        {/* Stars */}
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <span key={s} className={s <= conf ? "text-yellow-400 text-xs" : "text-gray-700 text-xs"}>★</span>
          ))}
        </div>
      </div>

      {/* Match */}
      <Link href={`/match/${pick.match.id}`} className="block">
        <div className="text-white font-semibold text-sm leading-tight">
          {pick.match.homeTeam}
          <span className="text-gray-400 mx-1 font-normal">vs</span>
          {pick.match.awayTeam}
        </div>
        <div className="text-xs text-gray-400 mt-0.5">
          {pick.match.competition} · {format(new Date(pick.match.kickoff), "EEE dd.MM. HH:mm", { locale: de })} Uhr
        </div>
      </Link>

      {/* Recommended outcome — large and clear */}
      <div className="bg-gray-900/60 rounded-lg px-3 py-2.5 flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-400 mb-0.5">Empfehlung</div>
          <div className={`text-base font-extrabold ${accentColor}`}>
            {tipp.key === "home" ? "1 " : tipp.key === "draw" ? "X " : "2 "}
            <span className="text-white font-semibold text-sm">{tipp.label}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">Quote</div>
          <div className={`text-2xl font-extrabold ${accentColor}`}>
            {tipp.odds.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Probability bar */}
      <div className="flex gap-2 text-center">
        {[
          { label: "1", prob: pick.homeWinProb, active: tipp.key === "home" },
          { label: "X", prob: pick.drawProb ?? 0, active: tipp.key === "draw" },
          { label: "2", prob: pick.awayWinProb, active: tipp.key === "away" },
        ].filter((p) => p.prob > 0).map((p) => (
          <div key={p.label} className={`flex-1 rounded p-1.5 ${p.active ? "bg-gray-600" : "bg-gray-700/50"}`}>
            <div className="text-xs text-gray-400">{p.label}</div>
            <div className={`text-sm font-bold ${p.active ? accentColor : "text-gray-400"}`}>
              {p.prob.toFixed(0)}%
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link
          href={`/match/${pick.match.id}`}
          className="flex-1 text-center py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-medium transition-colors"
        >
          Analyse →
        </Link>
        <button
          onClick={handleKombi}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            alreadyInKombi
              ? "bg-orange-700 text-white"
              : "bg-orange-600 hover:bg-orange-500 text-white"
          }`}
        >
          {alreadyInKombi ? "✓ Im Kombi" : "+ Kombi"}
        </button>
      </div>
    </div>
  );
}

export default function TopTipps() {
  const [valueBets, setValueBets] = useState<TopPick[]>([]);
  const [regularPicks, setRegularPicks] = useState<TopPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetch("/api/analysis/top-picks?days=7&limit=20&minConfidence=2")
      .then((r) => r.json())
      .then((data) => {
        setValueBets(data.valueBets ?? []);
        setRegularPicks(data.regularPicks ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const allPicks = [...valueBets, ...regularPicks];
  const displayed = showAll ? allPicks : allPicks.slice(0, 6);

  if (loading) {
    return (
      <div className="mb-8">
        <div className="h-6 bg-gray-700 rounded w-48 mb-4 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-xl h-52 animate-pulse border border-gray-700" />
          ))}
        </div>
      </div>
    );
  }

  if (allPicks.length === 0) return null;

  return (
    <div className="mb-8">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-white">🔥 Top Tipps der Woche</h2>
          {valueBets.length > 0 && (
            <span className="text-xs bg-green-800 text-green-300 px-2 py-0.5 rounded-full font-medium">
              {valueBets.length} Value Bet{valueBets.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <Link href="/analysis" className="text-xs text-blue-400 hover:underline">
          Alle ansehen →
        </Link>
      </div>

      {/* Tip cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayed.map((pick) => (
          <TippCard key={pick.id} pick={pick} />
        ))}
      </div>

      {allPicks.length > 6 && (
        <button
          onClick={() => setShowAll((s) => !s)}
          className="mt-4 w-full py-2 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700"
        >
          {showAll ? "Weniger anzeigen ↑" : `Alle ${allPicks.length} Tipps anzeigen ↓`}
        </button>
      )}
    </div>
  );
}
