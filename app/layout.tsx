import type { Metadata } from "next";
import "./globals.css";
import LiveTicker from "@/components/LiveTicker";
import ResponsibleGamblingBanner from "@/components/ResponsibleGamblingBanner";
import Link from "next/link";

export const metadata: Metadata = {
  title: "SportWetten Analyse",
  description:
    "Professionelle Sport-Wetten Analyse für Fußball, Handball, Basketball und NFL. Quoten-Vergleich, Wahrscheinlichkeiten und Value-Bet-Erkennung.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="h-full">
      <body className="min-h-full flex flex-col bg-gray-900 text-gray-100 antialiased">
        {/* Navigation */}
        <header className="bg-gray-900 border-b border-gray-700 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-blue-400">⚡</span>
              <span>SportAnalyse</span>
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                href="/"
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/analysis"
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Value Picks
              </Link>
              <span className="text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded">
                18+ | Nur Analyse
              </span>
            </nav>
          </div>
        </header>

        {/* Live Ticker */}
        <LiveTicker />

        {/* Main content */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <ResponsibleGamblingBanner />
      </body>
    </html>
  );
}
