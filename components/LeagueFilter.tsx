"use client";

import { useEffect, useState } from "react";

interface CompetitionItem {
  competition: string;
  flag: string;
  country: string;
  count: number;
}

interface LeagueFilterProps {
  selectedSport: string;
  selectedCompetition: string;
  onChange: (competition: string) => void;
}

const SPORT_ORDER = ["football", "handball", "basketball", "nfl"];
const SPORT_LABELS: Record<string, string> = {
  football: "⚽ Fußball",
  handball: "🤾 Handball",
  basketball: "🏀 Basketball",
  nfl: "🏈 NFL",
};

export default function LeagueFilter({ selectedSport, selectedCompetition, onChange }: LeagueFilterProps) {
  const [competitions, setCompetitions] = useState<Record<string, CompetitionItem[]>>({});

  useEffect(() => {
    fetch("/api/competitions")
      .then((r) => r.json())
      .then((data) => setCompetitions(data.competitions ?? {}))
      .catch(() => {});
  }, []);

  // Which sports to show competitions for
  const sportsToShow = selectedSport === "all"
    ? SPORT_ORDER.filter((s) => competitions[s]?.length > 0)
    : [selectedSport].filter((s) => competitions[s]?.length > 0);

  if (sportsToShow.every((s) => !competitions[s]?.length)) return null;

  return (
    <div className="mb-4">
      <div className="flex flex-wrap gap-2">
        {/* "Alle Ligen" button */}
        <button
          onClick={() => onChange("")}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            selectedCompetition === ""
              ? "bg-blue-600 text-white"
              : "bg-gray-700/60 text-gray-300 hover:bg-gray-600"
          }`}
        >
          🌐 Alle Ligen
        </button>

        {sportsToShow.map((sport) => {
          const items = competitions[sport] ?? [];
          if (items.length === 0) return null;

          return (
            <div key={sport} className="flex items-center gap-1.5 flex-wrap">
              {/* Sport separator label */}
              <span className="text-xs text-gray-500 px-1">
                {SPORT_LABELS[sport]}
              </span>

              {items.map((item) => {
                const isSelected = selectedCompetition === item.competition;
                return (
                  <button
                    key={item.competition}
                    onClick={() => onChange(isSelected ? "" : item.competition)}
                    className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      isSelected
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-700/60 text-gray-300 hover:bg-gray-600"
                    }`}
                    title={item.country}
                  >
                    <span>{item.flag}</span>
                    <span>{item.competition}</span>
                    <span className={`ml-0.5 ${isSelected ? "text-indigo-200" : "text-gray-500"}`}>
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
