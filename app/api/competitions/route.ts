import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addDays, startOfDay, endOfDay } from "date-fns";

// Known competition metadata: emoji flag + display name
const COMPETITION_META: Record<string, { flag: string; country: string }> = {
  "1. Bundesliga":                  { flag: "🇩🇪", country: "Deutschland" },
  "Bundesliga":                     { flag: "🇩🇪", country: "Deutschland" },
  "UEFA Champions League":          { flag: "🇪🇺", country: "Europa" },
  "Champions League":               { flag: "🇪🇺", country: "Europa" },
  "UEFA Europa League":             { flag: "🇪🇺", country: "Europa" },
  "Premier League":                 { flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", country: "England" },
  "Handball Bundesliga (HBL)":      { flag: "🇩🇪", country: "Deutschland" },
  "Handball-Bundesliga":            { flag: "🇩🇪", country: "Deutschland" },
  "Basketball Bundesliga (BBL)":    { flag: "🇩🇪", country: "Deutschland" },
  "Basketball Bundesliga":          { flag: "🇩🇪", country: "Deutschland" },
  "NBA":                            { flag: "🇺🇸", country: "USA" },
  "EuroLeague":                     { flag: "🇪🇺", country: "Europa" },
  "NFL":                            { flag: "🇺🇸", country: "USA" },
};

function getMeta(comp: string): { flag: string; country: string } {
  if (COMPETITION_META[comp]) return COMPETITION_META[comp];
  // Partial match
  for (const [key, val] of Object.entries(COMPETITION_META)) {
    if (comp.includes(key) || key.includes(comp)) return val;
  }
  return { flag: "🌍", country: "International" };
}

export async function GET() {
  const now = new Date();
  const rangeEnd = endOfDay(addDays(startOfDay(now), 14));

  try {
    const rows = await prisma.match.groupBy({
      by: ["sport", "competition"],
      where: {
        kickoff: { gte: now, lte: rangeEnd },
        status: { in: ["scheduled", "live"] },
      },
      _count: { id: true },
      orderBy: { competition: "asc" },
    });

    const grouped: Record<string, { competition: string; flag: string; country: string; count: number }[]> = {};

    for (const row of rows) {
      const meta = getMeta(row.competition);
      if (!grouped[row.sport]) grouped[row.sport] = [];
      grouped[row.sport].push({
        competition: row.competition,
        flag: meta.flag,
        country: meta.country,
        count: row._count.id,
      });
    }

    return NextResponse.json({ competitions: grouped });
  } catch {
    return NextResponse.json({ competitions: {} });
  }
}
