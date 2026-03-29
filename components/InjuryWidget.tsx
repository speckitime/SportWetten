"use client";

import { useEffect, useState } from "react";

interface InjuryReportItem {
  id: string;
  playerName: string;
  teamName: string;
  injury: string;
  status: string;
  returnDate: string | null;
  source: string | null;
}

interface InjuryWidgetProps {
  homeTeam: string;
  awayTeam: string;
  // Injuries already fetched server-side (optional)
  preloaded?: { home: InjuryReportItem[]; away: InjuryReportItem[] };
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; text: string; label: string }> = {
    aus: { bg: "bg-red-900/60", text: "text-red-300", label: "Ausfall" },
    fraglich: { bg: "bg-yellow-900/60", text: "text-yellow-300", label: "Fraglich" },
    training: { bg: "bg-green-900/60", text: "text-green-300", label: "Im Training" },
  };
  const c = cfg[status] ?? cfg.fraglich;
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

function TeamInjuryList({
  teamName,
  injuries,
}: {
  teamName: string;
  injuries: InjuryReportItem[];
}) {
  if (injuries.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-white mb-2">{teamName}</h3>
        <p className="text-xs text-gray-500 italic">Keine bekannten Verletzungen</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-white mb-2">
        {teamName}
        <span className="ml-2 text-xs font-normal text-red-400">
          ({injuries.length} verletzt)
        </span>
      </h3>
      <div className="space-y-2">
        {injuries.map((inj) => (
          <div key={inj.id} className="flex items-start justify-between gap-2">
            <div>
              <span className="text-sm text-white font-medium">{inj.playerName}</span>
              <span className="text-xs text-gray-400 ml-2">{inj.injury}</span>
              {inj.returnDate && (
                <div className="text-xs text-gray-500 mt-0.5">
                  Rückkehr: {inj.returnDate}
                </div>
              )}
            </div>
            <StatusBadge status={inj.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InjuryWidget({ homeTeam, awayTeam, preloaded }: InjuryWidgetProps) {
  const [homeInjuries, setHomeInjuries] = useState<InjuryReportItem[]>(
    preloaded?.home ?? []
  );
  const [awayInjuries, setAwayInjuries] = useState<InjuryReportItem[]>(
    preloaded?.away ?? []
  );
  const [loading, setLoading] = useState(!preloaded);

  useEffect(() => {
    if (preloaded) return;
    async function load() {
      try {
        const [homeRes, awayRes] = await Promise.all([
          fetch(`/api/injuries?team=${encodeURIComponent(homeTeam)}`),
          fetch(`/api/injuries?team=${encodeURIComponent(awayTeam)}`),
        ]);
        const homeData = await homeRes.json();
        const awayData = await awayRes.json();
        setHomeInjuries(homeData.injuries ?? []);
        setAwayInjuries(awayData.injuries ?? []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [homeTeam, awayTeam, preloaded]);

  const totalInjured = homeInjuries.length + awayInjuries.length;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-semibold text-white">Verletzungsreport</h2>
        {totalInjured > 0 && (
          <span className="text-xs bg-red-900/60 text-red-300 px-2 py-0.5 rounded-full font-medium">
            {totalInjured} verletzt/fraglich
          </span>
        )}
      </div>

      {loading ? (
        <div className="h-16 animate-pulse bg-gray-700 rounded" />
      ) : (
        <div className="grid grid-cols-2 gap-6">
          <TeamInjuryList teamName={homeTeam} injuries={homeInjuries} />
          <TeamInjuryList teamName={awayTeam} injuries={awayInjuries} />
        </div>
      )}

      {totalInjured > 0 && (
        <p className="text-xs text-gray-500 mt-3 italic">
          Verletzungsdaten aus Nachrichtenquellen. Bitte offizielle Kader vor dem Spiel prüfen.
        </p>
      )}
    </div>
  );
}
