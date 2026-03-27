"use client";

import { SPORT_LABELS } from "@/lib/types";

interface SportFilterProps {
  selected: string;
  onChange: (sport: string) => void;
}

const SPORTS = ["all", "football", "handball", "basketball", "nfl"];

export default function SportFilter({ selected, onChange }: SportFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <button
        onClick={() => onChange("all")}
        className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          selected === "all"
            ? "bg-blue-600 text-white"
            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
        }`}
      >
        Alle Sportarten
      </button>
      {SPORTS.slice(1).map((sport) => (
        <button
          key={sport}
          onClick={() => onChange(sport)}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selected === sport
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          {SPORT_LABELS[sport]}
        </button>
      ))}
    </div>
  );
}
