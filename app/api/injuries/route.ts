import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const team = searchParams.get("team");
  const sport = searchParams.get("sport");

  try {
    const injuries = await prisma.injuryReport.findMany({
      where: {
        ...(team && { teamName: { contains: team } }),
        ...(sport && { sport }),
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ injuries });
  } catch {
    return NextResponse.json({ injuries: [] });
  }
}
