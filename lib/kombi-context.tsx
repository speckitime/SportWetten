"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface KombiSelection {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  competition: string;
  selection: "home" | "draw" | "away";
  odds: number;
  label: string;
}

interface KombiContextType {
  selections: KombiSelection[];
  addSelection: (sel: KombiSelection) => void;
  removeSelection: (matchId: string) => void;
  clearAll: () => void;
  totalOdds: number;
}

const KombiContext = createContext<KombiContextType | null>(null);

const STORAGE_KEY = "sportwetten-kombi";

export function KombiProvider({ children }: { children: ReactNode }) {
  const [selections, setSelections] = useState<KombiSelection[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSelections(JSON.parse(saved) as KombiSelection[]);
    } catch {
      // localStorage not available
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selections));
    } catch {
      // ignore
    }
  }, [selections]);

  const addSelection = (sel: KombiSelection) => {
    setSelections((prev) => {
      const without = prev.filter((s) => s.matchId !== sel.matchId);
      return [...without, sel];
    });
  };

  const removeSelection = (matchId: string) => {
    setSelections((prev) => prev.filter((s) => s.matchId !== matchId));
  };

  const clearAll = () => setSelections([]);

  const totalOdds = selections.length > 0
    ? selections.reduce((acc, s) => acc * s.odds, 1)
    : 1;

  return (
    <KombiContext.Provider value={{ selections, addSelection, removeSelection, clearAll, totalOdds }}>
      {children}
    </KombiContext.Provider>
  );
}

export function useKombi(): KombiContextType {
  const ctx = useContext(KombiContext);
  if (!ctx) throw new Error("useKombi must be used within KombiProvider");
  return ctx;
}
