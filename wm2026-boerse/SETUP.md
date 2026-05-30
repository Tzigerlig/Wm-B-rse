# Setup-Anleitung — WM-Börse 2026

Diese Anleitung führt dich Schritt für Schritt von Null bis zur laufenden App.

---

## 1. Supabase-Projekt erstellen

1. Geh auf **[supabase.com](https://supabase.com)** und registriere dich (kostenlos).
2. Klick auf **"New Project"**.
3. Wähle eine Organisation (oder erstelle eine neue).
4. Vergib einen Projektnamen, z.B. `wm-boerse-2026`.
5. Setze ein Datenbank-Passwort (notiere es, du brauchst es evtl. später).
6. Wähle eine Region nahe an dir (z.B. `eu-central-1` für Deutschland/Schweiz).
7. Klick **"Create new project"** und warte ~2 Minuten.

---

## 2. SQL-Schema ausführen

Sobald das Projekt erstellt ist:

1. Geh im Supabase Dashboard auf **SQL Editor** (linke Sidebar, Datenbank-Icon).
2. Klick **"New query"**.
3. Kopiere **das gesamte SQL unten** in den Editor und klicke **"Run"**.

```sql
-- ============================================================
-- Tabellen
-- ============================================================

-- Spieler-Profile (1:1 mit auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  avatar text default '🦁',
  color text default 'hsl(40,72%,54%)',
  is_admin boolean default false,
  created_at timestamptz default now()
);

-- Aktuelle Kurse pro Team (vom Admin gesetzt)
create table team_prices (
  team_name text primary key,
  phase text not null check (phase in ('Gruppe','SF16','AF','VF','HF','Finale','Weltmeister')),
  price numeric not null,
  set_at timestamptz default now(),
  set_by uuid references profiles(id)
);

-- Offene Orders im Order-Book
create table orders (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references profiles(id) on delete cascade not null,
  side text check (side in ('buy','sell')) not null,
  team_name text not null,
  qty integer check (qty > 0) not null,
  price_per_unit numeric not null,
  note text,
  status text check (status in ('open','accepted','cancelled')) default 'open' not null,
  accepted_by uuid references profiles(id),
  accepted_at timestamptz,
  created_at timestamptz default now()
);

-- Trades (Zwei-Signatur-Protokoll)
create table trades (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references profiles(id) on delete cascade not null,
  seller_id uuid references profiles(id) on delete cascade not null,
  team_name text not null,
  qty integer check (qty > 0) not null,
  price_per_unit numeric not null,
  proposed_by uuid references profiles(id) not null,
  status text check (status in ('pending','confirmed','rejected','cancelled')) default 'pending' not null,
  from_order_id uuid references orders(id),
  confirmed_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz default now()
);

-- Turnier-Status (Singleton)
create table tournament_state (
  id integer primary key default 1,
  ended boolean default false,
  ended_at timestamptz,
  constraint singleton check (id = 1)
);

insert into tournament_state (id) values (1);

-- Indexes
create index idx_trades_buyer  on trades(buyer_id);
create index idx_trades_seller on trades(seller_id);
create index idx_trades_status on trades(status);
create index idx_orders_status on orders(status);
create index idx_orders_team   on orders(team_name);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table profiles         enable row level security;
alter table team_prices      enable row level security;
alter table orders           enable row level security;
alter table trades           enable row level security;
alter table tournament_state enable row level security;

-- profiles: alle lesen, eigenes schreiben/ändern
create policy "profiles_select_all"  on profiles for select to authenticated using (true);
create policy "profiles_insert_own"  on profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update_own"  on profiles for update to authenticated using (auth.uid() = id);

-- team_prices: alle lesen, nur Admin schreiben
create policy "team_prices_select_all"    on team_prices for select to authenticated using (true);
create policy "team_prices_insert_admin"  on team_prices for insert to authenticated with check (
  exists(select 1 from profiles where id = auth.uid() and is_admin = true)
);
create policy "team_prices_update_admin"  on team_prices for update to authenticated using (
  exists(select 1 from profiles where id = auth.uid() and is_admin = true)
);

-- orders: alle lesen, eigene erstellen/ändern
create policy "orders_select_all"          on orders for select to authenticated using (true);
create policy "orders_insert_own"          on orders for insert to authenticated with check (auth.uid() = creator_id);
create policy "orders_update_own_or_accept" on orders for update to authenticated using (
  auth.uid() = creator_id or auth.uid() = accepted_by or status = 'open'
);

-- trades: nur Trades sehen, in denen ich Buyer ODER Seller bin
create policy "trades_select_own"        on trades for select to authenticated using (
  auth.uid() = buyer_id or auth.uid() = seller_id
);
create policy "trades_insert_own"        on trades for insert to authenticated with check (
  auth.uid() = buyer_id or auth.uid() = seller_id
);
create policy "trades_update_counterparty" on trades for update to authenticated using (
  auth.uid() = buyer_id or auth.uid() = seller_id
);

-- tournament_state: alle lesen, nur Admin schreiben
create policy "tournament_select_all"  on tournament_state for select to authenticated using (true);
create policy "tournament_update_admin" on tournament_state for update to authenticated using (
  exists(select 1 from profiles where id = auth.uid() and is_admin = true)
);

-- ============================================================
-- Trigger: Auto-Create Profile + erster User wird Admin
-- ============================================================

create or replace function handle_new_user()
returns trigger as $$
declare
  user_count integer;
begin
  select count(*) into user_count from profiles;
  insert into profiles (id, name, is_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    user_count = 0
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- Realtime aktivieren
-- ============================================================

alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table trades;
alter publication supabase_realtime add table team_prices;
alter publication supabase_realtime add table tournament_state;
```

> ✅ Nach dem Ausführen solltest du unter **Table Editor** die Tabellen `profiles`, `team_prices`, `orders`, `trades`, `tournament_state` sehen.

---

## 3. Auth konfigurieren

### Magic Link aktivieren (ist standardmäßig an)

1. Geh zu **Authentication → Providers**.
2. Stelle sicher, dass **Email** aktiviert ist.
3. Unter **Email** → deaktiviere "Confirm email" wenn alle Nutzer direkt einloggen sollen (empfohlen für private Gruppe).

### Site URL setzen

1. Geh zu **Authentication → URL Configuration**.
2. **Site URL**: `http://localhost:3000` (für Entwicklung)
3. **Redirect URLs** → füge hinzu: `http://localhost:3000/auth/callback`

> Für Produktion (Vercel) fügst du später `https://deine-app.vercel.app/auth/callback` hinzu.

---

## 4. Umgebungsvariablen

### Wo findest du die Werte?

1. Geh im Supabase Dashboard zu **Project Settings** (Zahnrad-Icon unten links).
2. Klick auf **API**.
3. Du siehst:
   - **Project URL** → das ist `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** (unter "Project API keys") → das ist `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### .env.local erstellen

```bash
cp .env.local.example .env.local
```

Öffne `.env.local` und fülle die Werte ein:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_ADMIN_PW=dein-geheimes-adminpasswort
```

> ⚠️ Die `.env.local` Datei wird **nie committed** (steht in `.gitignore`). Teile den Anon-Key nur mit deiner Gruppe — er ist für Client-seitigen Zugriff gedacht.

---

## 5. Lokal starten

```bash
# Im wm2026-boerse/ Verzeichnis:
npm install        # einmalig
npm run dev        # startet auf http://localhost:3000
```

Öffne [http://localhost:3000](http://localhost:3000).

- Gib deine E-Mail ein → Magic Link kommt per Mail
- Der **erste User** der sich registriert wird automatisch **Admin**
- Geh zu `/admin` um Kurse zu setzen (Admin-Passwort aus `.env.local`)

---

## 6. Deployment auf Vercel

### Schritt 1: Code auf GitHub pushen

Falls noch nicht gemacht:
```bash
git add .
git commit -m "Initial WM-Börse setup"
git push origin main
```

### Schritt 2: Vercel-Account erstellen

1. Geh auf [vercel.com](https://vercel.com) und registriere dich mit deinem GitHub-Account.

### Schritt 3: Projekt importieren

1. Klick auf **"Add New… → Project"**.
2. Wähle dein GitHub-Repository (`wm-b-rse`).
3. Bei **Root Directory** → wähle `wm2026-boerse` aus (da das Projekt ein Unterverzeichnis ist).
4. Framework wird automatisch als **Next.js** erkannt.

### Schritt 4: Umgebungsvariablen setzen

Unter **Environment Variables** füge hinzu:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | deine Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | dein Supabase Anon Key |
| `NEXT_PUBLIC_ADMIN_PW` | dein Admin-Passwort |

### Schritt 5: Deployen

1. Klick **"Deploy"** — Vercel baut und deployt automatisch.
2. Nach ca. 1–2 Minuten bekommst du eine URL wie `https://wm-boerse-2026.vercel.app`.

### Schritt 6: Supabase Redirect-URL aktualisieren

1. Zurück zu Supabase → **Authentication → URL Configuration**.
2. **Site URL** auf deine Vercel-URL setzen: `https://wm-boerse-2026.vercel.app`
3. **Redirect URLs** → füge hinzu: `https://wm-boerse-2026.vercel.app/auth/callback`

### Schritt 7: Fertig! 🎉

Deine App ist live. Teile die URL mit deiner Gruppe — jeder kann sich per Magic Link registrieren.

---

## 7. App als PWA installieren

### iPhone (Safari)
1. Öffne die App-URL in Safari.
2. Tippe auf **Teilen** (Share-Button) → **"Zum Home-Bildschirm"**.
3. Die App erscheint als Icon auf dem Homescreen.

### Android (Chrome)
1. Öffne die URL in Chrome.
2. Tippe auf die drei Punkte → **"Zum Startbildschirm hinzufügen"**.

---

## 8. Admin-Workflow

Nach dem ersten Login als Admin:

1. Geh zu `/admin` in der App.
2. Gib dein Admin-Passwort ein.
3. **⚽ Kurse**: Setze pro Team die aktuelle Phase — der Kurs wird automatisch berechnet.
4. **🏁 Turnier**: Wenn das Turnier endet → "Turnier beenden" drücken → Settlement wird final.

---

## Häufige Probleme

| Problem | Lösung |
|---------|--------|
| "auth_failed" nach Magic Link | Supabase Redirect URL nicht konfiguriert (Schritt 6) |
| Profiles werden nicht erstellt | Trigger `on_auth_user_created` fehlt — SQL erneut ausführen |
| Kurse können nicht gesetzt werden | User hat `is_admin = false` in der `profiles` Tabelle |
| Realtime funktioniert nicht | `alter publication supabase_realtime add table ...` vergessen |
| Build schlägt fehl | `NEXT_PUBLIC_SUPABASE_URL` und `ANON_KEY` in Vercel nicht gesetzt |
