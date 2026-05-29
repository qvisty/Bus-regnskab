-- Skema for "Fælles buskørsel"-appen.
-- Kør dette i Supabase SQL Editor (Project → SQL Editor → New query).
-- Tabellerne seedes automatisk af appen første gang den indlæses.

-- Globale satser (én række, id = 1).
create table if not exists public.settings (
  id integer primary key default 1,
  bus_price numeric not null default 3000,
  ticket_price numeric not null default 65,
  constraint settings_singleton check (id = 1)
);

-- Afregningsperioder (kalenderår, skoleår, …).
create table if not exists public.periods (
  id text primary key,
  name text not null,
  start_date date not null,
  end_date date not null,
  hd_running_transferred numeric not null default 0,
  ee_running_transferred numeric not null default 0
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
