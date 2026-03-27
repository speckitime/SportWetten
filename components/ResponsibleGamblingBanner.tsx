export default function ResponsibleGamblingBanner() {
  return (
    <footer className="bg-gray-900 border-t border-gray-700 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-gray-800 border border-yellow-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-yellow-400 text-xl shrink-0">⚠️</span>
            <div>
              <p className="text-yellow-400 font-semibold text-sm mb-1">
                Verantwortungsvolles Spielen
              </p>
              <p className="text-gray-300 text-sm">
                18+ | Glücksspiel kann süchtig machen. Diese Website bietet
                ausschließlich{" "}
                <strong>Analyse und Informationen</strong>, keine
                Wettfunktionalität. Alle Empfehlungen sind Analysen, keine
                Garantien.
              </p>
              <p className="text-gray-400 text-xs mt-2">
                Bundeszentrale für gesundheitliche Aufklärung:{" "}
                <a
                  href="tel:08001372700"
                  className="text-blue-400 hover:underline"
                >
                  0800 1 37 27 00
                </a>{" "}
                (kostenlos, 24/7) |{" "}
                <a
                  href="https://www.bzga.de"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  www.bzga.de
                </a>
              </p>
            </div>
          </div>
        </div>
        <p className="text-gray-600 text-xs text-center mt-4">
          SportWetten Analyse © {new Date().getFullYear()} – Nur zur
          Informationszwecken. Kein Angebot von Glücksspieldienstleistungen.
        </p>
      </div>
    </footer>
  );
}
