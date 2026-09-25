-- Live AIS fix + track history for Thalima (MMSI 235077622)

create table if not exists public.boat_fix (
  id int primary key default 1 check (id = 1),
  lat double precision not null,
  lon double precision not null,
  sog_kn double precision,
  cog double precision,
  status text not null default '',
  city text not null default '',
  region text not null default '',
  country text not null default '',
  provider text not null default 'ais',
  fetched_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.boat_track (
  id bigserial primary key,
  lat double precision not null,
  lon double precision not null,
  sog_kn double precision,
  cog double precision,
  status text not null default '',
  provider text not null default 'ais',
  fetched_at timestamptz not null default now()
);

create index if not exists boat_track_fetched_at_idx on public.boat_track (fetched_at desc);

alter table public.boat_fix enable row level security;
alter table public.boat_track enable row level security;

create policy "crew_read_boat_fix"
  on public.boat_fix for select
  to authenticated
  using (true);

create policy "crew_upsert_boat_fix"
  on public.boat_fix for insert
  to authenticated
  with check (true);

create policy "crew_update_boat_fix"
  on public.boat_fix for update
  to authenticated
  using (true)
  with check (true);

create policy "crew_read_boat_track"
  on public.boat_track for select
  to authenticated
  using (true);

create policy "crew_insert_boat_track"
  on public.boat_track for insert
  to authenticated
  with check (true);

insert into public.boat_fix (id, lat, lon, sog_kn, cog, status, city, region, country, provider, fetched_at)
values (
  1,
  41.36491,
  2.1866,
  0,
  null,
  'Making port at BARCELONA',
  'Barcelona',
  'Catalonia',
  'Spain',
  'magicport',
  now()
)
on conflict (id) do update set
  lat = excluded.lat,
  lon = excluded.lon,
  sog_kn = excluded.sog_kn,
  status = excluded.status,
  city = excluded.city,
  region = excluded.region,
  country = excluded.country,
  provider = excluded.provider,
  fetched_at = excluded.fetched_at,
  updated_at = now();
