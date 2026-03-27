import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, addDays } from "date-fns";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const sport = searchParams.get("sport") || undefined;
  const dateParam = searchParams.get("date") || "today";

  let dateStart: Date;
  let dateEnd: Date;

  const now = new Date();
  if (dateParam === "today") {
    dateStart = startOfDay(now);
    dateEnd = endOfDay(now);
  } else if (dateParam === "tomorrow") {
    dateStart = startOfDay(addDays(now, 1));
    dateEnd = endOfDay(addDays(now, 1));
  } else if (dateParam === "week") {
    dateStart = startOfDay(now);
    dateEnd = endOfDay(addDays(now, 7));
  } else {
    // Try parsing as ISO date
    const parsed = new Date(dateParam);
    if (isNaN(parsed.getTime())) {
      dateStart = startOfDay(now);
      dateEnd = endOfDay(now);
    } else {
      dateStart = startOfDay(parsed);
      dateEnd = endOfDay(parsed);
    }
  }

  const matches = await prisma.match.findMany({
    where: {
      kickoff: { gte: dateStart, lte: dateEnd },
      ...(sport ? { sport } : {}),
    },
    include: {
      odds: true,
      analysis: true,
    },
    orderBy: { kickoff: "asc" },
  });

  return NextResponse.json({ matches, count: matches.length });
}
