# SportWetten Analyse

Professionelles Sport-Wetten Analyse-Tool für Fußball (Bundesliga/Champions League), Handball (HBL), Basketball (BBL/EuroLeague) und NFL.

**Wichtig:** Dieses Tool bietet ausschließlich Analyse und Informationen — keine Wettfunktionalität. 18+ | Bitte verantwortungsvoll handeln.

---

## Features

- Quoten-Vergleich (Tipico, Bet365, Bwin, Betway, Unibet)
- Value-Bet-Erkennung mit Wahrscheinlichkeits-Engine
- Kelly-Criterion Empfehlungen (nur zur Anzeige)
- Live-Ticker für laufende Spiele
- Automatische Verletzungs-Berichte aus Sportnews
- Cron-Jobs für automatisches Daten-Update
- Dark-Theme, mobiloptimiertes Design auf Deutsch

---

## Voraussetzungen (Ubuntu 24.04)

### 1. Node.js installieren (v20 LTS empfohlen)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version   # sollte v20.x.x zeigen
npm --version
```

### 2. Git installieren (falls nicht vorhanden)

```bash
sudo apt-get install -y git
```

---

## Installation

### 1. Repository klonen

```bash
git clone https://github.com/speckitime/SportWetten.git
cd SportWetten
```

### 2. Abhängigkeiten installieren

```bash
npm install
```

### 3. Umgebungsvariablen konfigurieren

```bash
cp .env.example .env
nano .env
```

Inhalt der `.env` Datei:

```env
DATABASE_URL="file:./dev.db"

# The Odds API (kostenlos, 500 Anfragen/Monat)
THE_ODDS_API_KEY=dein_key_hier

# API-Football (kostenlos, 100 Anfragen/Tag)
API_FOOTBALL_KEY=dein_key_hier

# NewsAPI (kostenlos, 100 Anfragen/Tag)
NEWS_API_KEY=dein_key_hier
```

> Die App funktioniert auch **ohne API-Keys** mit Mock-Daten (für Tests/Entwicklung).

### 4. Datenbank initialisieren

```bash
npx prisma migrate deploy
npx prisma generate
```

### 5. Anwendung starten

**Entwicklungsmodus:**
```bash
npm run dev
```

**Produktionsmodus:**
```bash
npm run build
npm run start
```

Die App ist dann erreichbar unter: `http://localhost:3000`

---

## API-Keys beschaffen (alle kostenlos)

### The Odds API — Quoten von Bookmarkern
Liefert Live-Quoten von Tipico, Bet365, Bwin, Betway, Unibet.

1. Registrieren auf **https://the-odds-api.com**
2. E-Mail bestätigen
3. Kostenlosen API-Key kopieren (500 Anfragen/Monat gratis)
4. In `.env` eintragen: `THE_ODDS_API_KEY=dein_key`

**Verfügbare Ligen im Free Tier:** Bundesliga, Champions League, Premier League, NFL, NBA

---

### API-Football — Fußball-Statistiken & Spielpläne
Liefert Teaminformationen, Statistiken, Form und Verletzungen.

1. Registrieren auf **https://www.api-football.com**
2. Kostenlosen Plan wählen (100 Anfragen/Tag gratis)
3. API-Key aus dem Dashboard kopieren
4. In `.env` eintragen: `API_FOOTBALL_KEY=dein_key`

---

### NewsAPI — Sportnachrichten & Verletzungsberichte
Liefert aktuelle Nachrichten von Kicker, Sport1 und internationalen Quellen.

1. Registrieren auf **https://newsapi.org**
2. Kostenlosen Developer-Plan aktivieren (100 Anfragen/Tag gratis)
3. API-Key kopieren
4. In `.env` eintragen: `NEWS_API_KEY=dein_key`

> **Hinweis:** ESPN-Daten (Live-Scores für NFL/Bundesliga) werden ohne API-Key abgerufen und funktionieren immer.

---

## Produktiv-Deployment auf Ubuntu 24.04 Server

### 1. PM2 installieren (Prozess-Manager)

```bash
sudo npm install -g pm2
```

### 2. Anwendung bauen und starten

```bash
npm run build
pm2 start npm --name "sportwetten" -- start
pm2 save
pm2 startup   # Autostart nach Reboot aktivieren
```

PM2-Befehle:
```bash
pm2 status          # Status anzeigen
pm2 logs sportwetten  # Logs anzeigen
pm2 restart sportwetten  # Neustarten
```

### 3. Nginx als Reverse-Proxy einrichten (optional, für Port 80/443)

```bash
sudo apt-get install -y nginx
sudo nano /etc/nginx/sites-available/sportwetten
```

Inhalt:
```nginx
server {
    listen 80;
    server_name deine-domain.de;  # oder Server-IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/sportwetten /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. HTTPS mit Let's Encrypt (optional)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d deine-domain.de
```

---

## Projektstruktur

```
/app
  /dashboard          - Haupt-Dashboard (Client Component)
  /match/[id]         - Match-Detailseite mit Analyse
  /analysis           - Value Picks Übersicht
  /api/matches        - REST API für Spiele
  /api/odds/[matchId] - Quoten-Vergleich API
  /api/analysis       - Value-Bet-Picks API
  /api/news           - Nachrichten API
  /api/live           - Live-Scores API
  /api/admin/refresh  - Manuelles Daten-Update
/lib
  /apis/              - Externe API-Clients
  /analysis/          - Wahrscheinlichkeits-Engine
  /scheduler.ts       - Cron-Job Setup
  /data-sync.ts       - Daten-Synchronisierung
  /prisma.ts          - Datenbank-Client
/components           - UI-Komponenten
/prisma
  schema.prisma       - Datenbank-Schema
```

---

## Automatische Daten-Updates (Cron-Jobs)

Die Cron-Jobs starten automatisch beim App-Start (via `instrumentation.ts`):

| Intervall | Aufgabe |
|-----------|---------|
| Jede Minute | Live-Scores aktualisieren |
| Alle 15 Minuten | Quoten & Spiele aktualisieren |
| Alle 2 Stunden | News & Verletzungsberichte |
| Täglich 6:00 Uhr | Aufräumen alter Spiele |

Manuelles Update jederzeit möglich:
```bash
curl -X POST http://localhost:3000/api/admin/refresh
```

---

## Verantwortungsvolles Spielen

**18+ | Glücksspiel kann süchtig machen.**

Bundeszentrale für gesundheitliche Aufklärung: **0800 1 37 27 00** (kostenlos, 24/7)

Weitere Hilfe: https://www.bzga.de
