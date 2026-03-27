import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const team = searchParams.get("team") || undefined;
  const injuryOnly = searchParams.get("injuryOnly") === "true";
  const limit = parseInt(searchParams.get("limit") || "20");

  const articles = await prisma.newsArticle.findMany({
    where: {
      ...(injuryOnly ? { hasInjuryInfo: true } : {}),
      ...(team
        ? {
            OR: [
              { title: { contains: team } },
              { description: { contains: team } },
            ],
          }
        : {}),
    },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ articles, count: articles.length });
}
