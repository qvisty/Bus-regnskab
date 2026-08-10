-- Skema for "Fælles buskørsel"-appen.
-- Kør dette i Supabase SQL Editor (Project → SQL Editor → New query).
-- Tabellerne seedes automatisk af appen første gang den indlæses.

-- Globale satser (én række, id = 1).
-- Billetprisen er den samme uanset busstørrelse. Busprisen er pr. tur og
-- afhænger af den bestilte busstørrelse (vælges automatisk efter billettal):
--   lille bus (19 pers.), stor bus (57 pers.), dobbeltdækker (83 sæder).
create table if not exists public.settings (
  id integer primary key default 1,
  ticket_price numeric not null default 65,
  bus_price_small numeric not null default 2430,
  bus_price_large numeric not null default 4375,
  bus_price_double numeric not null default 4866,
  constraint settings_singleton check (id = 1)
);

-- Migrering af eksisterende installationer fra før busstørrelserne
-- (hvor der kun fandtes én samlet buspris i kolonnen bus_price).
alter table public.settings
  add column if not exists bus_price_small numeric not null default 2430;
alter table public.settings
  add column if not exists bus_price_large numeric not null default 4375;
alter table public.settings
  add column if not exists bus_price_double numeric not null default 4866;
alter table public.settings drop column if exists bus_price;

-- Afregningsperioder (kalenderår, skoleår, …).
-- "Løbende overført" udledes automatisk af overførselsdatoerne på
-- planning_days og gemmes derfor ikke her.
create table if not exists public.periods (
  id text primary key,
  name text not null,
  start_date date not null,
  end_date date not null,
  -- Sat når perioden er markeret afregnet ("gjort op til nul").
  settled_at date
);

-- Én række pr. dato i planlægningen.
create table if not exists public.planning_days (
  date date primary key,
  he_need boolean not null default false,
  hd_need boolean not null default false,
  ee_need boolean not null default false,
  he_tickets integer not null default 0,
  hd_tickets integer not null default 0,
  ee_tickets integer not null default 0,
  note text not null default '',
  hd_transferred_date date,
  ee_transferred_date date
);

-- Data API-adgang: eksplicitte rettigheder til API-rollerne, så tabellerne
-- virker uanset om projektets "Automatically expose new tables" er slået til.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete
  on public.settings, public.periods, public.planning_days
  to anon, authenticated;

-- Realtid: gør tabellerne tilgængelige for realtime-abonnementer.
alter publication supabase_realtime add table public.settings;
alter publication supabase_realtime add table public.periods;
alter publication supabase_realtime add table public.planning_days;

-- Row Level Security.
-- Dette er et lille internt værktøj, så vi tillader fuld adgang med anon-nøglen.
-- Stram op (fx kræv login) hvis appen skal være offentligt tilgængelig.
alter table public.settings enable row level security;
alter table public.periods enable row level security;
alter table public.planning_days enable row level security;

create policy "anon full access settings" on public.settings
  for all using (true) with check (true);
create policy "anon full access periods" on public.periods
  for all using (true) with check (true);
create policy "anon full access planning_days" on public.planning_days
  for all using (true) with check (true);
