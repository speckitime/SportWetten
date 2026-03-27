"use client";

import { NewsArticleRecord } from "@/lib/types";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface NewsWidgetProps {
  articles: NewsArticleRecord[];
}

function InjuryBadge({ players }: { players: string | null }) {
  if (!players) return null;
  let playerList: string[] = [];
  try {
    playerList = JSON.parse(players);
  } catch {
    return null;
  }
  if (playerList.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {playerList.map((player) => (
        <span
          key={player}
          className="text-xs bg-red-900/50 text-red-300 border border-red-700 px-1.5 py-0.5 rounded"
        >
          🏥 {player}
        </span>
      ))}
    </div>
  );
}

export default function NewsWidget({ articles }: NewsWidgetProps) {
  if (articles.length === 0) {
    return (
      <div className="text-gray-400 text-sm text-center py-4">
        Keine Nachrichten verfügbar
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {articles.map((article) => (
        <div
          key={article.id}
          className="border-b border-gray-700 pb-3 last:border-0"
        >
          <div className="flex items-start justify-between gap-2">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white hover:text-blue-400 transition-colors line-clamp-2 flex-1"
            >
              {article.hasInjuryInfo && (
                <span className="inline-block text-red-400 mr-1">⚠️</span>
              )}
              {article.title}
            </a>
          </div>
          {article.description && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">
              {article.description}
            </p>
          )}
          <InjuryBadge players={article.injuryPlayers} />
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs text-gray-500">{article.source}</span>
            <span className="text-gray-600">·</span>
            <span className="text-xs text-gray-500">
              {format(new Date(article.publishedAt), "dd.MM. HH:mm", {
                locale: de,
              })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
