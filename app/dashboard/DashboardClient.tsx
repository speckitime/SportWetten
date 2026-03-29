"use client";

import { useEffect, useState, useCallback } from "react";
import MatchCard from "@/components/MatchCard";
import SportFilter from "@/components/SportFilter";
import DateSelector from "@/components/DateSelector";
import LeagueFilter from "@/components/LeagueFilter";
import TopTipps from "@/components/TopTipps";
import { MatchWithOdds } from "@/lib/types";

export default function DashboardClient() {
  const [matches, setMatches] = useState<MatchWithOdds[]>([]);
  const [loading, setLoading] = useState(true);
  const [sport, setSport] = useState("all");
  const [competition, setCompetition] = useState("");
  const [date, setDate] = useState("week");
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  const fetchMatches = useCallback(async () => {
    try {
      const params = new URLSearchParams({ date });
      if (sport !== "all") params.set("sport", sport);
      if (competition) params.set("competition", competition);
      const res = await fetch(`/api/matches?${params}`);
      const data = await res.json();
      setMatches(data.matches || []);
      setLastUpdate(new Date().toLocaleTimeString("de-DE"));
    } catch (error) {
      console.error("Failed to fetch matches:", error);
    } finally {
      setLoading(false);
    }
  }, [sport, competition, date]);

  useEffect(() => {
    setLoading(true);
    fetchMatches();
  }, [fetchMatches]);

  // Reset competition filter when sport changes
  const handleSportChange = (newSport: string) => {
    setSport(newSport);
    setCompetition("");
  };

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
      // Group by competition when no sport filter, else by sport
      const key = competition ? match.competition : match.sport;
      if (!groups[key]) groups[key] = [];
      groups[key].push(match);
      return groups;
    },
    {} as Record<string, MatchWithOdds[]>
  );

  const SPORT_ORDER = ["football", "handball", "basketball", "nfl"];
  const sortedKeys = Object.keys(groupedMatches).sort((a, b) => {
    if (!competition) {
      return SPORT_ORDER.indexOf(a) - SPORT_ORDER.indexOf(b);
    }
    return a.localeCompare(b, "de");
  });

  const sportLabels: Record<string, string> = {
    football: "⚽ Fußball",
    handball: "🤾 Handball",
    basketball: "🏀 Basketball",
    nfl: "🏈 NFL",
  };

  const getGroupLabel = (key: string) =>
    competition ? key : (sportLabels[key] || key);

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
          {refreshing ? "⟳ Lädt..." : "⟳ Aktualisieren"}
        </button>
      </div>

      {/* ===== TOP TIPPS ===== */}
      <TopTipps />

      {/* Sport + Date filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        <SportFilter selected={sport} onChange={handleSportChange} />
        <DateSelector selected={date} onChange={setDate} />
      </div>

      {/* ===== Liga / Land Filter ===== */}
      <LeagueFilter
        selectedSport={sport}
        selectedCompetition={competition}
        onChange={setCompetition}
      />

      {/* Active filter indicator */}
      {competition && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-gray-400">Filter:</span>
          <span className="text-xs bg-indigo-800 text-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1">
            {competition}
            <button
              onClick={() => setCompetition("")}
              className="ml-1 hover:text-white"
            >
              ×
            </button>
          </span>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg px-4 py-3 mb-6 text-xs text-blue-300">
        ℹ️ Alle Angaben sind Analysen auf Basis statistischer Daten. Keine Wettempfehlung.
        Bitte verantwortungsvoll handeln. 18+
      </div>

      {/* Match list */}
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
            {competition
              ? `Keine Spiele für "${competition}" im gewählten Zeitraum`
              : "Drücke Aktualisieren, um neue Daten zu laden"}
          </p>
          {competition && (
            <button
              onClick={() => setCompetition("")}
              className="mt-3 text-sm text-blue-400 hover:underline"
            >
              Liga-Filter entfernen
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {sortedKeys.map((key) => (
            <div key={key}>
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                {getGroupLabel(key)}
                <span className="text-sm font-normal text-gray-500">
                  ({groupedMatches[key].length} Spiele)
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedMatches[key].map((match) => (
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
