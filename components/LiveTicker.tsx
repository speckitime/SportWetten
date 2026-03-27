"use client";

import { useEffect, useState } from "react";
import { MatchWithOdds } from "@/lib/types";

export default function LiveTicker() {
  const [liveMatches, setLiveMatches] = useState<MatchWithOdds[]>([]);

  useEffect(() => {
    const fetchLive = async () => {
      try {
        const res = await fetch("/api/live");
        const data = await res.json();
        setLiveMatches(data.liveMatches || []);
      } catch {
        // Silently fail
      }
    };

    fetchLive();
    const interval = setInterval(fetchLive, 60000);
    return () => clearInterval(interval);
  }, []);

  if (liveMatches.length === 0) {
    return (
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 text-sm text-gray-400">
        <span className="inline-block w-2 h-2 rounded-full bg-gray-500 mr-2"></span>
        Keine laufenden Spiele
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border-b border-gray-700 overflow-hidden">
      <div className="flex items-center">
        <div className="bg-red-600 text-white text-xs font-bold px-3 py-2 shrink-0 flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse"></span>
          LIVE
        </div>
        <div className="overflow-hidden flex-1">
          <div
            className="flex gap-6 py-2 px-4 animate-marquee whitespace-nowrap"
            style={{ animation: "marquee 30s linear infinite" }}
          >
            {liveMatches.map((match) => (
              <span key={match.id} className="text-sm shrink-0">
                <span className="text-gray-300">{match.homeTeam}</span>
                <span className="text-white font-bold mx-2">
                  {match.homeScore ?? 0} : {match.awayScore ?? 0}
                </span>
                <span className="text-gray-300">{match.awayTeam}</span>
                <span className="text-yellow-400 ml-2 text-xs">{match.competition}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
