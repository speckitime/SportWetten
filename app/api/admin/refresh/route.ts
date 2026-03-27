import { NextResponse } from "next/server";
import { syncOddsAndMatches, syncNewsAndInjuries, syncLiveScores } from "@/lib/data-sync";

export async function POST() {
  try {
    await syncLiveScores();
    await syncOddsAndMatches();
    await syncNewsAndInjuries();

    return NextResponse.json({
      success: true,
      message: "Daten erfolgreich aktualisiert",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Manual refresh failed:", error);
    return NextResponse.json(
      { success: false, error: "Aktualisierung fehlgeschlagen" },
      { status: 500 }
    );
  }
}
