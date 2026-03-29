"use client";

import { useEffect, useState, useCallback } from "react";
import MatchCard from "@/components/MatchCard";
import SportFilter from "@/components/SportFilter";
import DateSelector from "@/components/DateSelector";
import TopTipps from "@/components/TopTipps";
import { MatchWithOdds } from "@/lib/types";

export default function DashboardClient() {
  const [matches, setMatches] = useState<MatchWithOdds[]>([]);
  const [loading, setLoading] = useState(true);
  const [sport, setSport] = useState("all");
  const [date, setDate] = useState("week"); // Default: diese Woche
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  const fetchMatches = useCallback(async () => {
    try {
      const params = new URLSearchParams({ date });
      if (sport !== "all") params.set("sport", sport);
      const res = await fetch(`/api/matches?${params}`);
      const data = await res.json();
      setMatches(data.matches || []);
      setLastUpdate(new Date().toLocaleTimeString("de-DE"));
    } catch (error) {
      console.error("Failed to fetch matches:", error);
    } finally {
      setLoading(false);
    }
  }, [sport, date]);

  useEffect(() => {
    setLoading(true);
    fetchMatches();
  }, [fetchMatches]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch("/api/admin/refresh", { method: "POST" });
      await fetchMatches();
    } finally {
      setRefreshing(false);
    }
  };

  const groupedMatches = matches.reduce(
    (groups, match) => {
      const key = match.sport;
      if (!groups[key]) groups[key] = [];
      groups[key].push(match);
      return groups;
    },
    {} as Record<string, MatchWithOdds[]>
  );

  const sportOrder = ["football", "handball", "basketball", "nfl"];
  const sortedSports = Object.keys(groupedMatches).sort(
    (a, b) => sportOrder.indexOf(a) - sportOrder.indexOf(b)
  );

  const sportLabels: Record<string, string> = {
    football: "⚽ Fußball",
    handball: "🤾 Handball",
    basketball: "🏀 Basketball",
    nfl: "🏈 NFL",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Sport Analyse</h1>
          {lastUpdate && (
            <p className="text-xs text-gray-500 mt-0.5">
              Aktualisiert: {lastUpdate}
            </p>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
        >
          {refreshing ? "⟳ Wird aktualisiert..." : "⟳ Aktualisieren"}
        </button>
      </div>

      {/* ===== TOP TIPPS ===== */}
      <TopTipps />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SportFilter selected={sport} onChange={setSport} />
        <DateSelector selected={date} onChange={setDate} />
      </div>

      {/* Disclaimer */}
      <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg px-4 py-3 mb-6 text-xs text-blue-300">
        ℹ️ Alle Angaben sind Analysen auf Basis statistischer Daten. Keine Wettempfehlung.
        Bitte verantwortungsvoll handeln. 18+
      </div>

      {/* Match list by sport */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-lg h-48 animate-pulse border border-gray-700" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">📅</div>
          <p className="text-gray-400 text-lg">Keine Spiele gefunden</p>
          <p className="text-gray-500 text-sm mt-2">
            Drücke Aktualisieren, um neue Daten zu laden
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedSports.map((sportKey) => (
            <div key={sportKey}>
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                {sportLabels[sportKey] || sportKey}
                <span className="text-sm font-normal text-gray-500">
                  ({groupedMatches[sportKey].length} Spiele)
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedMatches[sportKey].map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
