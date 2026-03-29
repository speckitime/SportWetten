"use client";

import { useState } from "react";

interface TipicoButtonProps {
  sport: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  tipp: {
    selection: "home" | "draw" | "away";
    label: string;
    odds: number | null;
  } | null;
}

// Sport-spezifische Tipico-Deeplinks (direkt zur richtigen Liga)
function getTipicoUrl(sport: string, competition: string): string {
  const comp = competition.toLowerCase();

  if (sport === "football") {
    if (comp.includes("bundesliga") && !comp.includes("2.")) {
      return "https://www.tipico.de/de/sport/fussball/deutschland/bundesliga/";
    }
    if (comp.includes("champions")) {
      return "https://www.tipico.de/de/sport/fussball/europaeische-wettbewerbe/champions-league/";
    }
    if (comp.includes("premier") || comp.includes("epl")) {
      return "https://www.tipico.de/de/sport/fussball/england/premier-league/";
    }
    if (comp.includes("europa league")) {
      return "https://www.tipico.de/de/sport/fussball/europaeische-wettbewerbe/europa-league/";
    }
    return "https://www.tipico.de/de/sport/fussball/";
  }

  if (sport === "handball") {
    if (comp.includes("hbl") || comp.includes("handball bundesliga")) {
      return "https://www.tipico.de/de/sport/handball/deutschland/handball-bundesliga/";
    }
    return "https://www.tipico.de/de/sport/handball/";
  }

  if (sport === "basketball") {
    if (comp.includes("euroleague")) {
      return "https://www.tipico.de/de/sport/basketball/europa/euroleague/";
    }
    return "https://www.tipico.de/de/sport/basketball/";
  }

  if (sport === "nfl") {
    return "https://www.tipico.de/de/sport/american-football/usa/nfl/";
  }

  return "https://www.tipico.de/de/sport/";
}

export default function TipicoButton({
  sport,
  competition,
  homeTeam,
  awayTeam,
  tipp,
}: TipicoButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const tipicoUrl = getTipicoUrl(sport, competition);

  const selectionText =
    tipp?.selection === "home"
      ? "1 (Heimsieg)"
      : tipp?.selection === "draw"
      ? "X (Unentschieden)"
      : "2 (Auswärtssieg)";

  const copyToClipboard = async () => {
    const text = [
      `Spiel: ${homeTeam} vs ${awayTeam}`,
      `Wettmarkt: 1X2 (Spielergebnis)`,
      `Tipp: ${selectionText}`,
      tipp?.odds ? `Quote: ${tipp.odds.toFixed(2)}` : "",
      `Anbieter: Tipico`,
      `Link: ${tipicoUrl}`,
    ]
      .filter(Boolean)
      .join("\n");

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Main button */}
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-2 bg-[#e60028] hover:bg-[#cc0022] text-white font-bold px-4 py-2.5 rounded-lg transition-colors text-sm shadow-lg"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
        Bei Tipico wetten →
      </button>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-gray-800 border border-gray-600 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-[#e60028] text-xl">T</span>
                Wette bei Tipico platzieren
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Bet details */}
            <div className="bg-gray-700/60 rounded-xl p-4 mb-5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 uppercase tracking-wide">Spiel</span>
                <span className="text-white font-medium text-sm text-right">
                  {homeTeam}
                  <span className="text-gray-400 mx-1">vs</span>
                  {awayTeam}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 uppercase tracking-wide">Markt</span>
                <span className="text-white text-sm">1X2 – Spielergebnis</span>
              </div>
              {tipp && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400 uppercase tracking-wide">Tipp</span>
                    <span className="text-green-400 font-bold text-base">{selectionText}</span>
                  </div>
                  {tipp.odds && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400 uppercase tracking-wide">Quote (ca.)</span>
                      <span className="text-yellow-400 font-bold text-lg">{tipp.odds.toFixed(2)}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Step-by-step guide */}
            <div className="mb-5">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">
                So platzierst du die Wette:
              </p>
              <ol className="space-y-2">
                {[
                  "Klicke auf \"Zu Tipico\" unten",
                  `Suche nach "${homeTeam}" im Suchfeld`,
                  `Wähle den Markt "1X2" beim Spiel`,
                  `Klicke auf "${selectionText}"`,
                  "Einsatz eingeben und bestätigen",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="flex-shrink-0 w-5 h-5 bg-[#e60028] rounded-full text-white text-xs flex items-center justify-center font-bold mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={copyToClipboard}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                  copied
                    ? "border-green-600 bg-green-900/40 text-green-300"
                    : "border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {copied ? "✓ Kopiert!" : "📋 Tipp kopieren"}
              </button>

              <a
                href={tipicoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 rounded-lg text-sm font-bold text-center bg-[#e60028] hover:bg-[#cc0022] text-white transition-colors"
                onClick={() => setShowModal(false)}
              >
                Zu Tipico →
              </a>
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-gray-500 text-center mt-3 italic">
              ⚠️ Nur Analyse. Tipico ist ein externer Anbieter. 18+ | Spiele verantwortungsvoll.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
