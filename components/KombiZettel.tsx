"use client";

import { useState } from "react";
import Link from "next/link";
import { useKombi } from "@/lib/kombi-context";

export default function KombiZettel() {
  const { selections, removeSelection, totalOdds, clearAll } = useKombi();
  const [isOpen, setIsOpen] = useState(false);
  const [stake, setStake] = useState(10);

  if (selections.length === 0) return null;

  const payout = totalOdds * stake;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {/* Expanded panel */}
      {isOpen && (
        <div className="w-80 bg-gray-800 border border-orange-600 rounded-xl shadow-2xl overflow-hidden">
          {/* Panel header */}
          <div className="bg-orange-700 px-4 py-3 flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">
              🎯 Kombi-Wette ({selections.length} Spiele)
            </h3>
            <button
              onClick={clearAll}
              className="text-xs text-orange-200 hover:text-white underline"
            >
              Alle löschen
            </button>
          </div>

          {/* Selections list */}
          <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
            {selections.map((sel) => (
              <div
                key={sel.matchId}
                className="bg-gray-700 rounded-lg p-3 flex items-start gap-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-400 truncate">
                    {sel.homeTeam} – {sel.awayTeam}
                  </div>
                  <div className="text-sm text-white font-medium mt-0.5">
                    {sel.label}
                  </div>
                  <div className="text-green-400 font-bold text-base mt-0.5">
                    {sel.odds.toFixed(2)}
                  </div>
                </div>
                <button
                  onClick={() => removeSelection(sel.matchId)}
                  className="text-gray-500 hover:text-red-400 text-xl leading-none mt-0.5 flex-shrink-0"
                  aria-label="Entfernen"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Calculation */}
          <div className="border-t border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">Gesamtquote:</span>
              <span className="text-white font-extrabold text-lg">
                {totalOdds.toFixed(2)}
              </span>
            </div>

            {/* Stake input */}
            <div className="flex items-center gap-2 mb-3">
              <label className="text-xs text-gray-400 flex-shrink-0">Einsatz (€):</label>
              <input
                type="number"
                min={1}
                max={10000}
                value={stake}
                onChange={(e) => setStake(Math.max(1, Number(e.target.value)))}
                className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm text-right focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-400">Möglicher Gewinn:</span>
              <span className="text-green-400 font-extrabold text-lg">
                {payout.toFixed(2)}€
              </span>
            </div>

            <Link
              href="/kombi"
              className="block w-full text-center bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 rounded-lg transition-colors text-sm"
            >
              Kombi Details ansehen →
            </Link>

            <p className="text-center text-xs text-gray-500 mt-2">
              ⚠️ Nur Analyse. Kein Wettangebot. 18+
            </p>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="bg-orange-600 hover:bg-orange-500 text-white rounded-full px-5 py-3 font-bold shadow-xl flex items-center gap-2 transition-colors text-sm"
      >
        🎯
        <span>Kombi ({selections.length})</span>
        <span className="bg-orange-800 rounded px-1.5 py-0.5 text-xs font-mono">
          {totalOdds.toFixed(2)}
        </span>
      </button>
    </div>
  );
}
