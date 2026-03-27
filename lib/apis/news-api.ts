import axios from "axios";

const NEWS_API_BASE = "https://newsapi.org/v2";
const API_KEY = process.env.NEWS_API_KEY;

const INJURY_KEYWORDS_DE = [
  "verletzt", "gesperrt", "fraglich", "fällt aus", "ausfallen",
  "verletzung", "ausfall", "rekonvaleszenz", "pause",
];

const INJURY_KEYWORDS_EN = [
  "injured", "injury", "suspended", "doubtful", "ruled out",
  "out for", "sidelined", "unavailable",
];

const GERMAN_SPORTS_RSS_FEEDS = [
  { url: "https://www.kicker.de/news/rss/tipsticker.rss", source: "kicker.de" },
  { url: "https://www.sport1.de/news/fussball/bundesliga.rss", source: "sport1.de" },
];

export interface NewsArticle {
  title: string;
  description: string | null;
  url: string;
  source: string;
  publishedAt: string;
  hasInjuryInfo: boolean;
  injuryPlayers: string[];
}

export async function fetchSportsNews(query = "Bundesliga Verletzung"): Promise<NewsArticle[]> {
  const articles: NewsArticle[] = [];

  // Fetch from NewsAPI
  if (API_KEY && API_KEY !== "your_key_here") {
    try {
      const response = await axios.get(`${NEWS_API_BASE}/everything`, {
        params: {
          apiKey: API_KEY,
          q: query,
          language: "de",
          sortBy: "publishedAt",
          pageSize: 20,
        },
        timeout: 10000,
      });

      for (const article of response.data.articles || []) {
        articles.push(processArticle(article));
      }
    } catch (error) {
      console.error("NewsAPI fetch failed:", error);
    }
  }

  // Fallback mock data
  if (articles.length === 0) {
    return getMockNews();
  }

  return articles;
}

export async function fetchTeamNews(teamName: string): Promise<NewsArticle[]> {
  return fetchSportsNews(`${teamName} Verletzung Aufstellung`);
}

function processArticle(raw: {
  title: string;
  description?: string;
  url: string;
  source: { name: string };
  publishedAt: string;
}): NewsArticle {
  const text = `${raw.title} ${raw.description || ""}`.toLowerCase();
  const hasInjuryInfo =
    INJURY_KEYWORDS_DE.some((k) => text.includes(k)) ||
    INJURY_KEYWORDS_EN.some((k) => text.includes(k));

  // Simple player name extraction (words after injury keywords)
  const injuryPlayers: string[] = [];
  if (hasInjuryInfo) {
    const words = (raw.description || raw.title).split(/\s+/);
    words.forEach((word, i) => {
      // Look for capitalized words near injury keywords (likely player names)
      if (
        i > 0 &&
        word.length > 3 &&
        word[0] === word[0].toUpperCase() &&
        INJURY_KEYWORDS_DE.some((k) =>
          words
            .slice(Math.max(0, i - 3), i)
            .join(" ")
            .toLowerCase()
            .includes(k)
        )
      ) {
        injuryPlayers.push(word.replace(/[.,;:!?]/, ""));
      }
    });
  }

  return {
    title: raw.title,
    description: raw.description || null,
    url: raw.url,
    source: raw.source.name,
    publishedAt: raw.publishedAt,
    hasInjuryInfo,
    injuryPlayers: [...new Set(injuryPlayers)].slice(0, 5),
  };
}

function getMockNews(): NewsArticle[] {
  return [
    {
      title: "Bayern München: Kane und Müller vor Bundesliga-Kracher fit",
      description:
        "Trainer Vincent Kompany bestätigt: Beide Stürmer trainieren ohne Einschränkungen und stehen für das Topspiel zur Verfügung.",
      url: "https://www.kicker.de/news",
      source: "kicker.de",
      publishedAt: new Date().toISOString(),
      hasInjuryInfo: false,
      injuryPlayers: [],
    },
    {
      title: "BVB: Reus fällt verletzt aus - Kracher gegen Bayern fraglich",
      description:
        "Marco Reus zog sich im Training eine Muskelverletzung zu und fällt voraussichtlich 2-3 Wochen aus. Sein Einsatz gegen Bayern München ist fraglich.",
      url: "https://www.sport1.de/news",
      source: "sport1.de",
      publishedAt: new Date(Date.now() - 3600000).toISOString(),
      hasInjuryInfo: true,
      injuryPlayers: ["Reus"],
    },
    {
      title: "Bundesliga Vorschau: Topspiele am Wochenende",
      description:
        "Die Bundesliga bietet am kommenden Wochenende spektakuläre Partien. Alle Informationen zu den Begegnungen im Überblick.",
      url: "https://www.kicker.de/news",
      source: "kicker.de",
      publishedAt: new Date(Date.now() - 7200000).toISOString(),
      hasInjuryInfo: false,
      injuryPlayers: [],
    },
    {
      title: "THW Kiel: Rekordspieler gesperrt für HBL-Derby",
      description:
        "Nach einer Roten Karte ist Stammspielerin für das Derby gegen SG Flensburg-Handewitt gesperrt.",
      url: "https://www.sport1.de/handball",
      source: "sport1.de",
      publishedAt: new Date(Date.now() - 10800000).toISOString(),
      hasInjuryInfo: true,
      injuryPlayers: [],
    },
    {
      title: "NFL: Chiefs bereiten sich auf Playoff-Partie vor",
      description:
        "Kansas City Chiefs trainieren mit vollem Kader. Patrick Mahomes gibt Entwarnung nach leichter Schulterverletzung.",
      url: "https://www.sport1.de/nfl",
      source: "sport1.de",
      publishedAt: new Date(Date.now() - 14400000).toISOString(),
      hasInjuryInfo: true,
      injuryPlayers: ["Mahomes"],
    },
  ];
}
