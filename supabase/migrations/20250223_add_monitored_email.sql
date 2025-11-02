-- Profiles (optional if you already have one)
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free', -- 'free' | 'flexpass'
  created_at timestamptz not null default now()
);

-- Monitored emails: enforce max 1 for free plan at app layer (and via partial index)
create table if not exists public.monitored_emails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  unique (user_id, email)
);

-- Optional: cache last HIBP lookup for an email (avoid rate limits)
create table if not exists public.hibp_email_cache (
  email text primary key,
  last_result jsonb not null,
  checked_at timestamptz not null default now()
);

-- Keep your existing 'breaches' & 'alerts' tables from earlier, but ensure they
-- can link to a monitored email if you want:
alter table public.breaches add column if not exists monitored_email_id uuid references public.monitored_emails(id);

-- RLS
alter table public.profiles enable row level security;
alter table public.monitored_emails enable row level security;
alter table public.hibp_email_cache enable row level security;

create policy if not exists "own-profile" on public.profiles
  for select using (auth.uid() = user_id);

create policy if not exists "own-monitored-emails" on public.monitored_emails
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- cache is read-only to everyone (or lock it down if you prefer)
create policy if not exists "cache-read" on public.hibp_email_cache
  for select using (true);
create policy if not exists "cache-upsert" on public.hibp_email_cache
  for insert with check (true);
create policy if not exists "cache-update" on public.hibp_email_cache
  for update using (true);
