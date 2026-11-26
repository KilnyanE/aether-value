-- Run this entire script in Supabase SQL Editor.
create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  value numeric not null default 0 check (value >= 0),
  demand text not null default 'Medium',
  rarity text not null,
  trend text not null default 'Stable',
  tier text not null default 'C',
  obtain text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.units enable row level security;

-- Everyone can read the public value list.
drop policy if exists "Public can read units" on public.units;
create policy "Public can read units" on public.units
for select using (true);

-- Only authenticated users with an admin role in app_metadata can modify data.
-- Set this claim for your account from a trusted server/admin process.
drop policy if exists "Admins can insert units" on public.units;
create policy "Admins can insert units" on public.units
for insert to authenticated
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can update units" on public.units;
create policy "Admins can update units" on public.units
for update to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can delete units" on public.units;
create policy "Admins can delete units" on public.units
for delete to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists set_units_updated_at on public.units;
create trigger set_units_updated_at before update on public.units
for each row execute function public.set_updated_at();

-- Important: never expose the service_role key in config.js or frontend code.
