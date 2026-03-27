"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { AnalysisRecord, MatchWithOdds, SPORT_LABELS } from "@/lib/types";

interface AnalysisWithMatch extends AnalysisRecord {
  match: MatchWithOdds;
}

interface TopPicksResponse {
  valueBets: AnalysisWithMatch[];
  regularPicks: AnalysisWithMatch[];
  total: number;
}

function PickCard({ analysis }: { analysis: AnalysisWithMatch }) {
  const match = analysis.match;
  const kickoff = new Date(match.kickoff);
  const bestHomeOdds = match.odds.length > 0
    ? Math.max(...match.odds.map((o) => o.homeOdds))
    : null;
  const bestAwayOdds = match.odds.length > 0
    ? Math.max(...match.odds.map((o) => o.awayOdds))
    : null;

  return (
    <Link href={`/match/${match.id}`}>
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-blue-500 transition-colors cursor-pointer">
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          {analysis.isValueBet && (
            <span className="text-xs bg-green-800 text-green-300 px-2 py-0.5 rounded-full font-semibold">
              🎯 Value Bet
            </span>
          )}
          {analysis.confidenceScore >= 4 && (
            <span className="text-xs bg-blue-800 text-blue-300 px-2 py-0.5 rounded-full">
              🔥 Hohe Konfidenz
            </span>
          )}
          {analysis.valueBet && (
            <span className="text-xs bg-purple-800 text-purple-300 px-2 py-0.5 rounded-full">
              Signal:{" "}
              {analysis.valueBet === "home"
                ? match.homeTeam
                : analysis.valueBet === "away"
                ? match.awayTeam
                : "Unentschieden"}
            </span>
          )}
        </div>

        {/* Match info */}
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="text-white font-semibold">
              {match.homeTeam} vs {match.awayTeam}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {match.competition} · {SPORT_LABELS[match.sport]}
            </div>
          </div>
          <div className="text-right text-xs text-gray-400">
            {format(kickoff, "dd.MM. HH:mm", { locale: de })} Uhr
          </div>
        </div>

        {/* Probabilities */}
        <div className="flex gap-3 my-3">
          <div className="flex-1 bg-gray-700 rounded p-2 text-center">
            <div className="text-xs text-gray-400">Heimsieg</div>
            <div className="text-green-400 font-bold">
              {analysis.homeWinProb.toFixed(0)}%
            </div>
            {bestHomeOdds && (
              <div className="text-xs text-gray-500">{bestHomeOdds.toFixed(2)}</div>
            )}
          </div>
          {(analysis.drawProb ?? 0) > 0 && (
            <div className="flex-1 bg-gray-700 rounded p-2 text-center">
              <div className="text-xs text-gray-400">Remis</div>
              <div className="text-yellow-400 font-bold">
                {(analysis.drawProb ?? 0).toFixed(0)}%
              </div>
            </div>
          )}
          <div className="flex-1 bg-gray-700 rounded p-2 text-center">
            <div className="text-xs text-gray-400">Auswärtssieg</div>
            <div className="text-blue-400 font-bold">
              {analysis.awayWinProb.toFixed(0)}%
            </div>
            {bestAwayOdds && (
              <div className="text-xs text-gray-500">{bestAwayOdds.toFixed(2)}</div>
            )}
          </div>
        </div>

        {/* Summary */}
        <p className="text-gray-400 text-xs line-clamp-2">{analysis.summary}</p>

        {/* Stars */}
        <div className="flex items-center gap-0.5 mt-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <span
              key={s}
              className={s <= analysis.confidenceScore ? "text-yellow-400" : "text-gray-600"}
            >
              ★
            </span>
          ))}
          <span className="text-xs text-gray-500 ml-1">Analysesicherheit</span>
        </div>
      </div>
    </Link>
  );
}

export default function AnalysisPage() {
  const [data, setData] = useState<TopPicksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sport, setSport] = useState("all");
  const [minConfidence, setMinConfidence] = useState(3);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ minConfidence: minConfidence.toString() });
        if (sport !== "all") params.set("sport", sport);
        const res = await fetch(`/api/analysis/top-picks?${params}`);
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error("Failed to fetch analysis:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [sport, minConfidence]);

  const allPicks = data
    ? [...(data.valueBets || []), ...(data.regularPicks || [])]
    : [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Value Picks</h1>
        <p className="text-gray-400 text-sm mt-1">
          Automatisch analysierte Wetten mit dem höchsten Mehrwert
        </p>
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg px-4 py-3 mb-6 text-xs text-yellow-300">
        ⚠️ Value Bets sind statistische Analysen, keine Wettempfehlungen. Ergebnisse können
        abweichen. Nur 18+. Wette verantwortungsvoll.
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-2">
          {["all", "football", "handball", "basketball", "nfl"].map((s) => (
            <button
              key={s}
              onClick={() => setSport(s)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                sport === s
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {s === "all" ? "Alle" : SPORT_LABELS[s]}
            </button>
          ))}
        </div>
        <select
          value={minConfidence}
          onChange={(e) => setMinConfidence(Number(e.target.value))}
          className="bg-gray-700 text-gray-300 rounded px-3 py-1.5 text-sm border border-gray-600"
        >
          <option value={1}>Min. 1★</option>
          <option value={2}>Min. 2★★</option>
          <option value={3}>Min. 3★★★</option>
          <option value={4}>Min. 4★★★★</option>
          <option value={5}>Nur 5★★★★★</option>
        </select>
      </div>

      {/* Value Bets Highlight */}
      {data && data.valueBets.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-semibold text-white">
              🎯 Value Bets
            </h2>
            <span className="bg-green-800 text-green-300 text-xs px-2 py-0.5 rounded-full">
              {data.valueBets.length} gefunden
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.valueBets.map((a) => (
              <PickCard key={a.id} analysis={a} />
            ))}
          </div>
        </div>
      )}

      {/* Regular Picks */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-xl h-56 animate-pulse border border-gray-700" />
          ))}
        </div>
      ) : allPicks.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-gray-400">Keine Picks gefunden</p>
          <p className="text-gray-500 text-sm mt-1">
            Probiere einen niedrigeren Mindestwert oder gehe zurück zum Dashboard
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-blue-400 hover:underline text-sm"
          >
            Zum Dashboard
          </Link>
        </div>
      ) : (
        data && data.regularPicks.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">
              Weitere Picks ({data.regularPicks.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.regularPicks.map((a) => (
                <PickCard key={a.id} analysis={a} />
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}
