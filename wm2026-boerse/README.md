# WM-Börse 2026

**Peer-to-Peer Trading-Tracker für WM 2026** — eine private Aktien-Börse auf die 48 WM-Nationalmannschaften.

## Konzept

Stell dir vor, jedes WM-Team ist eine Aktie. Eine private Gruppe handelt untereinander — wie an einer echten Börse, aber mit WM-Ausgängen als Underlying.

### Wie es funktioniert

| Position | Wer profitiert |
|----------|---------------|
| **Long** (Kaufen) | Team kommt weit → Endkurs steigt → Gewinn |
| **Short** (Verkaufen) | Team scheidet früh aus → Endkurs sinkt → Gewinn |

Naked Shorts sind erlaubt — du kannst ein Team verkaufen, das du gar nicht besitzt (wie Leerverkäufe).

### Kursbewertung

Der Admin setzt nach jeder Runde den Kurs:

| Runde | Kurs |
|-------|------|
| Ausgeschieden / Gruppe | 0 Fr. |
| Sechzehntelfinale | 10 Fr. |
| Achtelfinale | 15 Fr. |
| Viertelfinale | 25 Fr. |
| Halbfinale | 50 Fr. |
| Finale | 75 Fr. |
| Weltmeister | 100 Fr. |

### Abrechnung

Am Turnierende wird jeder bestätigte Trade gegen den letzten Kurs seines Teams abgerechnet:

```
Long-Gewinn  = (Endkurs − Kaufpreis) × Stückzahl
Short-Gewinn = (Verkaufspreis − Endkurs) × Stückzahl
```

Schulden werden paarweise genetzt (wenn A→B 50 Fr. und B→A 30 Fr., zahlt A netto 20 Fr. an B).

## Features

- 🔐 **Magic Link Auth** — kein Passwort, sicher per E-Mail
- 📋 **Order-Buch** — öffentliche Orders, andere können akzeptieren
- 🎯 **Direct Trades** — bilaterale Verträge zwischen zwei Spielern
- ✅ **Zwei-Signatur-Protokoll** — beide Parteien müssen bestätigen
- ⚡ **Realtime** — Live-Updates via Supabase Realtime
- 🔒 **RLS** — du siehst nur deine eigenen Trades
- 📊 **Portfolio** — P/L und Positionen in Echtzeit
- ⚖️ **Settlement** — Schulden-Übersicht mit paarweisem Netting
- 📱 **PWA** — installierbar als App auf iPhone/Android

## Tech Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS v4)
- **Supabase** (Auth · Postgres · Realtime · RLS)
- **Vercel** (Deployment)

## Schnellstart

Lies `SETUP.md` für die vollständige Anleitung.

```bash
cp .env.local.example .env.local
# .env.local mit deinen Supabase-Credentials befüllen
npm install
npm run dev
```
