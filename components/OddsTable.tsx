"use client";

import { OddsRecord, BOOKMAKER_LABELS } from "@/lib/types";

interface OddsTableProps {
  odds: OddsRecord[];
  homeTeam: string;
  awayTeam: string;
}

export default function OddsTable({ odds, homeTeam, awayTeam }: OddsTableProps) {
  if (odds.length === 0) {
    return (
      <div className="text-gray-400 text-sm text-center py-4">
        Keine Quoten verfügbar
      </div>
    );
  }

  const bestHome = Math.max(...odds.map((o) => o.homeOdds));
  const bestDraw = Math.max(...odds.filter((o) => o.drawOdds).map((o) => o.drawOdds!));
  const bestAway = Math.max(...odds.map((o) => o.awayOdds));
  const hasDrawOdds = odds.some((o) => o.drawOdds);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left py-2 pr-4 text-gray-400 font-medium">Anbieter</th>
            <th className="text-center py-2 px-2 text-gray-400 font-medium">
              1 ({homeTeam.split(" ").slice(-1)[0]})
            </th>
            {hasDrawOdds && (
              <th className="text-center py-2 px-2 text-gray-400 font-medium">X</th>
            )}
            <th className="text-center py-2 px-2 text-gray-400 font-medium">
              2 ({awayTeam.split(" ").slice(-1)[0]})
            </th>
            <th className="text-center py-2 pl-2 text-gray-400 font-medium">
              Auszahl. (10€)
            </th>
          </tr>
        </thead>
        <tbody>
          {odds.map((odd) => {
            const isBestHome = odd.homeOdds === bestHome;
            const isBestDraw = odd.drawOdds === bestDraw;
            const isBestAway = odd.awayOdds === bestAway;
            const bestPayout = Math.max(
              odd.homeOdds,
              odd.drawOdds ?? 0,
              odd.awayOdds
            );

            return (
              <tr key={odd.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                <td className="py-3 pr-4">
                  <span className="font-medium text-white">
                    {BOOKMAKER_LABELS[odd.bookmaker] || odd.bookmaker}
                  </span>
                </td>
                <td className="text-center py-3 px-2">
                  <span
                    className={`font-bold ${
                      isBestHome ? "text-green-400" : "text-gray-300"
                    }`}
                  >
                    {odd.homeOdds.toFixed(2)}
                  </span>
                </td>
                {hasDrawOdds && (
                  <td className="text-center py-3 px-2">
                    <span
                      className={`font-bold ${
                        isBestDraw ? "text-green-400" : "text-gray-300"
                      }`}
                    >
                      {odd.drawOdds?.toFixed(2) ?? "-"}
                    </span>
                  </td>
                )}
                <td className="text-center py-3 px-2">
                  <span
                    className={`font-bold ${
                      isBestAway ? "text-green-400" : "text-gray-300"
                    }`}
                  >
                    {odd.awayOdds.toFixed(2)}
                  </span>
                </td>
                <td className="text-center py-3 pl-2 text-yellow-400 font-medium">
                  {(bestPayout * 10).toFixed(2)}€
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-gray-600">
            <td className="py-2 pr-4 text-gray-500 text-xs">Beste Quote</td>
            <td className="text-center py-2 px-2">
              <span className="text-green-400 font-bold text-xs">
                {bestHome.toFixed(2)}
              </span>
            </td>
            {hasDrawOdds && (
              <td className="text-center py-2 px-2">
                <span className="text-green-400 font-bold text-xs">
                  {bestDraw.toFixed(2)}
                </span>
              </td>
            )}
            <td className="text-center py-2 px-2">
              <span className="text-green-400 font-bold text-xs">
                {bestAway.toFixed(2)}
              </span>
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>
      <p className="text-gray-500 text-xs mt-2">
        * Grün = Beste verfügbare Quote. Auszahlung basiert auf 10€ Einsatz (Brutto).
      </p>
    </div>
  );
}
