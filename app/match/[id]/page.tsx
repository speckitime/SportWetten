import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import OddsTable from "@/components/OddsTable";
import AnalysisChart from "@/components/AnalysisChart";
import NewsWidget from "@/components/NewsWidget";
import TippEmpfehlung from "@/components/TippEmpfehlung";
import InjuryWidget from "@/components/InjuryWidget";
import { SPORT_LABELS } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MatchPage({ params }: PageProps) {
  const { id } = await params;

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      odds: { orderBy: { bookmaker: "asc" } },
      analysis: true,
      news: {
        include: { article: true },
        take: 10,
      },
    },
  });

  if (!match) notFound();

  const [homeStats, awayStats, homeInjuries, awayInjuries] = await Promise.all([
    prisma.teamStats.findUnique({
      where: { teamId: match.homeTeam.toLowerCase().replace(/\s+/g, "-") },
    }),
    prisma.teamStats.findUnique({
      where: { teamId: match.awayTeam.toLowerCase().replace(/\s+/g, "-") },
    }),
    prisma.injuryReport.findMany({
      where: { teamName: { contains: match.homeTeam.split(" ")[0] } },
    }),
    prisma.injuryReport.findMany({
      where: { teamName: { contains: match.awayTeam.split(" ")[0] } },
    }),
  ]);

  const articles = match.news.map((n) => n.article);
  const kickoffDate = new Date(match.kickoff);
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";

  // Best odds
  const bestHomeOdds = match.odds.length > 0 ? Math.max(...match.odds.map((o) => o.homeOdds)) : null;
  const bestAwayOdds = match.odds.length > 0 ? Math.max(...match.odds.map((o) => o.awayOdds)) : null;
  const drawOddsArr = match.odds.filter((o) => o.drawOdds).map((o) => o.drawOdds as number);
  const bestDrawOdds = drawOddsArr.length > 0 ? Math.max(...drawOddsArr) : null;

  const tipicoUrl = `https://www.tipico.de/de/live-wetten/`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-6 transition-colors"
      >
        ← Zurück
      </Link>

      {/* Match Header */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-sm text-gray-400">{match.competition}</span>
            <div className="text-xs text-gray-500 mt-0.5">
              {SPORT_LABELS[match.sport] || match.sport}
            </div>
          </div>
          <div className="text-right">
            {isLive ? (
              <span className="inline-flex items-center gap-1 text-sm font-bold text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
                LIVE
              </span>
            ) : isFinished ? (
              <span className="text-sm text-gray-500">Beendet</span>
            ) : (
              <div className="text-right">
                <div className="text-white font-medium">
                  {format(kickoffDate, "EEEE, dd. MMMM yyyy", { locale: de })}
                </div>
                <div className="text-gray-400 text-sm">
                  {format(kickoffDate, "HH:mm", { locale: de })} Uhr
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Teams */}
        <div className="grid grid-cols-3 items-center gap-4 my-6">
          <div className="text-center">
            <div className="text-xl font-bold text-white">{match.homeTeam}</div>
            {homeStats && (
              <div className="text-xs text-gray-400 mt-1">
                Form: <span className="font-mono">{homeStats.form.slice(-5) || "—"}</span>
              </div>
            )}
          </div>
          <div className="text-center">
            {(isLive || isFinished) ? (
              <div className="text-4xl font-bold text-white">
                {match.homeScore ?? 0}
                <span className="text-gray-400 mx-2">:</span>
                {match.awayScore ?? 0}
              </div>
            ) : (
              <div className="text-2xl font-bold text-gray-500">vs</div>
            )}
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-white">{match.awayTeam}</div>
            {awayStats && (
              <div className="text-xs text-gray-400 mt-1">
                Form: <span className="font-mono">{awayStats.form.slice(-5) || "—"}</span>
              </div>
            )}
          </div>
        </div>

        {match.venue && (
          <div className="text-center text-xs text-gray-500">
            📍 {match.venue}
          </div>
        )}

        {/* Quick odds */}
        {bestHomeOdds && bestAwayOdds && !isFinished && (
          <div className="mt-4 flex justify-center gap-4">
            <div className="bg-gray-700 rounded-lg px-4 py-2 text-center">
              <div className="text-xs text-gray-400">Beste 1-Quote</div>
              <div className="text-green-400 font-bold text-lg">
                {bestHomeOdds.toFixed(2)}
              </div>
            </div>
            {bestDrawOdds && (
              <div className="bg-gray-700 rounded-lg px-4 py-2 text-center">
                <div className="text-xs text-gray-400">Beste X-Quote</div>
                <div className="text-yellow-400 font-bold text-lg">
                  {bestDrawOdds.toFixed(2)}
                </div>
              </div>
            )}
            <div className="bg-gray-700 rounded-lg px-4 py-2 text-center">
              <div className="text-xs text-gray-400">Beste 2-Quote</div>
              <div className="text-blue-400 font-bold text-lg">
                {bestAwayOdds.toFixed(2)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== TIPP-EMPFEHLUNG (prominent) ===== */}
      {match.analysis && !isFinished && (
        <TippEmpfehlung
          matchId={match.id}
          homeTeam={match.homeTeam}
          awayTeam={match.awayTeam}
          analysis={{
            homeWinProb: match.analysis.homeWinProb,
            drawProb: match.analysis.drawProb,
            awayWinProb: match.analysis.awayWinProb,
            valueBet: match.analysis.valueBet,
            confidenceScore: match.analysis.confidenceScore,
            isValueBet: match.analysis.isValueBet,
            kellyHome: match.analysis.kellyHome,
            kellyAway: match.analysis.kellyAway,
          }}
          bestOdds={{
            home: bestHomeOdds,
            draw: bestDrawOdds,
            away: bestAwayOdds,
          }}
        />
      )}

      {/* ===== VERLETZUNGSREPORT ===== */}
      <InjuryWidget
        homeTeam={match.homeTeam}
        awayTeam={match.awayTeam}
        preloaded={{
          home: homeInjuries.map((i) => ({
            id: i.id,
            playerName: i.playerName,
            teamName: i.teamName,
            injury: i.injury,
            status: i.status,
            returnDate: i.returnDate,
            source: i.source,
          })),
          away: awayInjuries.map((i) => ({
            id: i.id,
            playerName: i.playerName,
            teamName: i.teamName,
            injury: i.injury,
            status: i.status,
            returnDate: i.returnDate,
            source: i.source,
          })),
        }}
      />

      {/* Analysis charts */}
      {match.analysis && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Detailanalyse</h2>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span
                    key={s}
                    className={
                      s <= match.analysis!.confidenceScore
                        ? "text-yellow-400"
                        : "text-gray-600"
                    }
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
          </div>

          <p className="text-gray-300 text-sm mb-6 bg-gray-700/50 rounded-lg p-3 border-l-4 border-blue-500">
            {match.analysis.summary}
          </p>

          <AnalysisChart
            analysis={{
              ...match.analysis,
              kickoff: match.kickoff.toISOString(),
            } as never}
            homeTeam={match.homeTeam}
            awayTeam={match.awayTeam}
          />

          {(match.analysis.kellyHome || match.analysis.kellyAway) && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">
                  Kelly-Empfehlung {match.homeTeam}
                </div>
                <div className="text-white font-medium">
                  {((match.analysis.kellyHome ?? 0) * 100).toFixed(1)}% des Budgets
                </div>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">
                  Kelly-Empfehlung {match.awayTeam}
                </div>
                <div className="text-white font-medium">
                  {((match.analysis.kellyAway ?? 0) * 100).toFixed(1)}% des Budgets
                </div>
              </div>
            </div>
          )}

          <p className="text-gray-500 text-xs mt-4 italic">
            ⚠️ Dies ist eine Analyse-Empfehlung, keine Garantie. Bitte
            verantwortungsvoll wetten. 18+
          </p>
        </div>
      )}

      {/* Odds comparison */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Quoten-Vergleich</h2>
          <a
            href={tipicoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm bg-blue-700 hover:bg-blue-600 text-white px-3 py-1.5 rounded transition-colors"
          >
            Zu Tipico →
          </a>
        </div>
        <OddsTable
          odds={match.odds.map((o) => ({
            ...o,
            updatedAt: o.updatedAt.toISOString(),
          }))}
          homeTeam={match.homeTeam}
          awayTeam={match.awayTeam}
        />
      </div>

      {/* Team Stats */}
      {(homeStats || awayStats) && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Teamstatistiken
          </h2>
          <div className="grid grid-cols-2 gap-6">
            {homeStats && (
              <div>
                <h3 className="font-medium text-white mb-3">{match.homeTeam}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Heimspiele (S/U/N)</span>
                    <span className="text-white font-mono">
                      {homeStats.homeWins}/{homeStats.homeDraws}/{homeStats.homeLosses}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tore Ø</span>
                    <span className="text-white">
                      {homeStats.goalsFor.toFixed(1)} / {homeStats.goalsAgainst.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Letzte 5</span>
                    <span className="font-mono text-white">
                      {homeStats.form.slice(-5) || "—"}
                    </span>
                  </div>
                </div>
              </div>
            )}
            {awayStats && (
              <div>
                <h3 className="font-medium text-white mb-3">{match.awayTeam}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Auswärtsspiele (S/U/N)</span>
                    <span className="text-white font-mono">
                      {awayStats.awayWins}/{awayStats.awayDraws}/{awayStats.awayLosses}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tore Ø</span>
                    <span className="text-white">
                      {awayStats.goalsFor.toFixed(1)} / {awayStats.goalsAgainst.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Letzte 5</span>
                    <span className="font-mono text-white">
                      {awayStats.form.slice(-5) || "—"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* News */}
      {articles.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Aktuelle Nachrichten & Verletzungsmeldungen
          </h2>
          <NewsWidget
            articles={articles.map((a) => ({
              ...a,
              publishedAt: a.publishedAt.toISOString(),
            }))}
          />
        </div>
      )}
    </div>
  );
}
