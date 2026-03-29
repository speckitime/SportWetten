"use client";

import { useKombi } from "@/lib/kombi-context";
import TipicoButton from "@/components/TipicoButton";

interface TippEmpfehlungProps {
  matchId: string;
  sport: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  analysis: {
    homeWinProb: number;
    drawProb: number | null;
    awayWinProb: number;
    valueBet: string | null;
    confidenceScore: number;
    isValueBet: boolean;
    kellyHome: number | null;
    kellyAway: number | null;
  };
  bestOdds: {
    home: number | null;
    draw: number | null;
    away: number | null;
  };
}

export default function TippEmpfehlung({
  matchId,
  sport,
  competition,
  homeTeam,
  awayTeam,
  analysis,
  bestOdds,
}: TippEmpfehlungProps) {
  const { addSelection, selections } = useKombi();

  // Determine primary recommendation: highest probability outcome
  const probs = [
    { key: "home" as const, prob: analysis.homeWinProb, label: `${homeTeam} gewinnt`, odds: bestOdds.home },
    { key: "draw" as const, prob: analysis.drawProb ?? 0, label: "Unentschieden", odds: bestOdds.draw },
    { key: "away" as const, prob: analysis.awayWinProb, label: `${awayTeam} gewinnt`, odds: bestOdds.away },
  ].filter((p) => p.prob > 0);

  const recommended = probs.reduce((best, p) => (p.prob > best.prob ? p : best), probs[0]);

  if (!recommended) return null;

  const isValueBet = analysis.isValueBet && analysis.valueBet === recommended.key;
  const alreadyInKombi = selections.some((s) => s.matchId === matchId);

  // Color scheme by confidence
  const confidence = analysis.confidenceScore;
  const colorScheme =
    isValueBet
      ? { outer: "border-green-500 bg-green-950/40", badge: "bg-green-600", label: "text-green-300", accent: "text-green-400" }
      : confidence >= 4
      ? { outer: "border-blue-500 bg-blue-950/40", badge: "bg-blue-600", label: "text-blue-300", accent: "text-blue-400" }
      : confidence >= 3
      ? { outer: "border-yellow-600 bg-yellow-950/30", badge: "bg-yellow-600", label: "text-yellow-300", accent: "text-yellow-400" }
      : { outer: "border-gray-600 bg-gray-800", badge: "bg-gray-600", label: "text-gray-300", accent: "text-gray-400" };

  const handleAddToKombi = () => {
    if (!recommended.odds) return;
    addSelection({
      matchId,
      homeTeam,
      awayTeam,
      competition: "",
      selection: recommended.key,
      odds: recommended.odds,
      label: recommended.label,
    });
  };

  return (
    <div className={`rounded-xl border-2 p-5 mb-6 ${colorScheme.outer}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-3 py-1 rounded-full text-white uppercase tracking-wide ${colorScheme.badge}`}>
            {isValueBet ? "🎯 Value Bet" : "📊 Unser Tipp"}
          </span>
          {isValueBet && (
            <span className="text-xs text-green-400 font-medium">
              Statistischer Mehrwert erkannt
            </span>
          )}
        </div>
        {/* Confidence stars */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <span key={s} className={s <= confidence ? "text-yellow-400 text-lg" : "text-gray-600 text-lg"}>
              ★
            </span>
          ))}
        </div>
      </div>

      {/* Main recommendation */}
      <div className="text-center py-4">
        <div className="text-xs text-gray-400 uppercase tracking-widest mb-2">
          Empfohlenes Ergebnis
        </div>
        <div className="text-3xl font-extrabold text-white mb-1">
          {recommended.key === "home" ? "1" : recommended.key === "draw" ? "X" : "2"}
        </div>
        <div className={`text-xl font-bold mb-3 ${colorScheme.accent}`}>
          {recommended.label}
        </div>

        {/* Probability bar */}
        <div className="flex justify-center gap-6 mb-4">
          {probs.map((p) => (
            <div key={p.key} className="text-center">
              <div
                className={`text-lg font-bold ${p.key === recommended.key ? colorScheme.accent : "text-gray-400"}`}
              >
                {p.prob.toFixed(0)}%
              </div>
              <div className="text-xs text-gray-500">
                {p.key === "home" ? "Heim" : p.key === "draw" ? "X" : "Auswärts"}
              </div>
            </div>
          ))}
        </div>

        {/* Best odds for recommendation */}
        {recommended.odds && (
          <div className="inline-flex items-center gap-3 bg-gray-700/60 rounded-lg px-4 py-2 mb-4">
            <div className="text-xs text-gray-400">Beste verfügbare Quote</div>
            <div className={`text-2xl font-extrabold ${colorScheme.accent}`}>
              {recommended.odds.toFixed(2)}
            </div>
            {recommended.odds > 0 && (
              <div className="text-xs text-gray-400">
                = {(recommended.odds * 10).toFixed(2)}€ pro 10€
              </div>
            )}
          </div>
        )}

        {/* Kelly fraction */}
        {(analysis.kellyHome !== null || analysis.kellyAway !== null) && (
          <div className="text-xs text-gray-400 mb-4">
            Kelly-Empfehlung:{" "}
            <span className="text-white font-medium">
              {(
                (recommended.key === "home"
                  ? analysis.kellyHome
                  : analysis.kellyAway) ?? 0
              * 100).toFixed(1)}
              % des Budgets einsetzen
            </span>
          </div>
        )}
      </div>

      {/* Actions: Kombi + Tipico */}
      {recommended.odds && (
        <div className="border-t border-gray-700 pt-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handleAddToKombi}
              className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
                alreadyInKombi
                  ? "bg-gray-600 text-gray-400 cursor-default"
                  : "bg-orange-600 hover:bg-orange-500 text-white"
              }`}
              disabled={alreadyInKombi}
            >
              {alreadyInKombi ? "✓ Im Kombi" : "+ Zum Kombi"}
            </button>

            <TipicoButton
              sport={sport}
              competition={competition}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              tipp={{
                selection: recommended.key,
                label: recommended.label,
                odds: recommended.odds,
              }}
            />
          </div>
          <p className="text-xs text-gray-500">
            ⚠️ Analyse auf Basis statistischer Daten. Kein Tipp-Versprechen. 18+
          </p>
        </div>
      )}
    </div>
  );
}
