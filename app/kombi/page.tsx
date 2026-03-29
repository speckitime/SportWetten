"use client";

import { useState } from "react";
import Link from "next/link";
import { useKombi } from "@/lib/kombi-context";

const STAKE_PRESETS = [5, 10, 20, 50, 100];

export default function KombiPage() {
  const { selections, removeSelection, clearAll, totalOdds } = useKombi();
  const [stake, setStake] = useState(10);

  const payout = totalOdds * stake;
  const profit = payout - stake;

  const selectionLabel = (key: "home" | "draw" | "away", home: string, away: string) => {
    if (key === "home") return `1 – ${home}`;
    if (key === "draw") return "X – Unentschieden";
    return `2 – ${away}`;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-gray-400 hover:text-white text-sm">
          ← Zurück
        </Link>
        <h1 className="text-2xl font-bold text-white">🎯 Kombi-Wette</h1>
      </div>

      <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg px-4 py-3 mb-6 text-xs text-yellow-300">
        ⚠️ Diese Funktion dient ausschließlich der Analyse. Es handelt sich um keine
        Wettempfehlung. Kombiwetten haben ein erhöhtes Verlustrisiko. Spiele verantwortungsvoll. 18+
      </div>

      {selections.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🎯</div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Keine Spiele ausgewählt
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            Füge Spiele vom Dashboard oder den Spieldetails zum Kombi hinzu.
          </p>
          <Link
            href="/"
            className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
          >
            Zum Dashboard
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Selections list */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-white">
                Ausgewählte Spiele ({selections.length})
              </h2>
              <button
                onClick={clearAll}
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                Alle löschen
              </button>
            </div>

            <div className="space-y-3">
              {selections.map((sel, idx) => (
                <div
                  key={sel.matchId}
                  className="bg-gray-800 border border-gray-700 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {/* Number badge */}
                      <span className="flex-shrink-0 w-6 h-6 bg-orange-600 rounded-full text-white text-xs font-bold flex items-center justify-center mt-0.5">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="text-white font-semibold">
                          {sel.homeTeam} – {sel.awayTeam}
                        </div>
                        {sel.competition && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            {sel.competition}
                          </div>
                        )}
                        <div className="mt-2 inline-flex items-center gap-2 bg-gray-700 rounded-lg px-3 py-1.5">
                          <span className="text-xs text-gray-400">Tipp:</span>
                          <span className="text-sm font-semibold text-white">
                            {selectionLabel(sel.selection, sel.homeTeam, sel.awayTeam)}
                          </span>
                          <span className="text-green-400 font-bold text-base">
                            {sel.odds.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => removeSelection(sel.matchId)}
                        className="text-gray-500 hover:text-red-400 transition-colors text-xl leading-none"
                        aria-label="Entfernen"
                      >
                        ×
                      </button>
                      <Link
                        href={`/match/${sel.matchId}`}
                        className="text-xs text-blue-400 hover:underline"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Individual odds progression */}
            <div className="mt-4 bg-gray-800 border border-gray-700 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Quoten-Verlauf</h3>
              <div className="space-y-1">
                {selections.map((sel, idx) => {
                  const running = selections
                    .slice(0, idx + 1)
                    .reduce((acc, s) => acc * s.odds, 1);
                  return (
                    <div key={sel.matchId} className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 truncate max-w-48">
                        {idx + 1}. {sel.homeTeam} vs {sel.awayTeam}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">× {sel.odds.toFixed(2)}</span>
                        <span className="text-white font-mono font-bold w-12 text-right">
                          {running.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Summary panel */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 border border-orange-600/50 rounded-xl p-5 sticky top-20">
              <h3 className="text-base font-bold text-white mb-4 text-center">
                Kombi-Zusammenfassung
              </h3>

              <div className="text-center mb-4">
                <div className="text-xs text-gray-400 mb-1">Gesamtquote</div>
                <div className="text-4xl font-extrabold text-orange-400">
                  {totalOdds.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {selections.length} Spiele kombiniert
                </div>
              </div>

              {/* Stake selector */}
              <div className="mb-4">
                <div className="text-xs text-gray-400 mb-2 text-center">Einsatz (€)</div>
                <div className="flex flex-wrap gap-1 justify-center mb-2">
                  {STAKE_PRESETS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setStake(p)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        stake === p
                          ? "bg-orange-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      {p}€
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={stake}
                  onChange={(e) => setStake(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-center text-lg font-bold focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Einsatz:</span>
                  <span className="text-white">{stake.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Möglicher Gewinn:</span>
                  <span className="text-green-400 font-bold">{payout.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between text-sm border-t border-gray-700 pt-2">
                  <span className="text-gray-400">Netto-Gewinn:</span>
                  <span className={profit >= 0 ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                    +{profit.toFixed(2)}€
                  </span>
                </div>
              </div>

              {/* Risk indicator */}
              <div className="mb-4">
                <div className="text-xs text-gray-400 mb-1 text-center">Risikostufe</div>
                <div
                  className={`text-center text-sm font-bold py-1.5 rounded-lg ${
                    selections.length <= 2
                      ? "bg-green-900/50 text-green-300"
                      : selections.length <= 4
                      ? "bg-yellow-900/50 text-yellow-300"
                      : "bg-red-900/50 text-red-300"
                  }`}
                >
                  {selections.length <= 2
                    ? "Niedrig"
                    : selections.length <= 4
                    ? "Mittel"
                    : "Hoch"}
                </div>
                <p className="text-xs text-gray-500 text-center mt-1">
                  Alle {selections.length} Tipps müssen stimmen
                </p>
              </div>

              <p className="text-xs text-gray-500 text-center italic">
                ⚠️ Nur Analysetool. Kein echtes Wettangebot.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
