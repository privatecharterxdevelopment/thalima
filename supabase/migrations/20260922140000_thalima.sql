-- Thalima crew CRM: shared yacht ops, profiles, activity, files.

create table if not exists public.profiles (
  id text primary key,
  auth_id uuid unique references auth.users (id) on delete cascade,
  name text not null,
  title text not null,
  role text not null,
  department text not null,
  level smallint not null check (level in (1, 2, 3)),
  accounting text not null default 'none',
  initials text not null,
  watch text not null default '',
  email text not null unique,
  phone text not null default '',
  photo text not null default '',
  access text not null default 'crew' check (access in ('owner', 'crew')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ops (
  id int primary key default 1 check (id = 1),
  payload jsonb not null,
  revision int not null default 1,
  updated_at timestamptz not null default now()
);

create table if not exists public.activity (
  id text primary key,
  at timestamptz not null default now(),
  actor_id text references public.profiles (id) on delete set null,
  action text not null,
  detail text not null
);

create index if not exists activity_at_idx on public.activity (at desc);

insert into public.ops (id, payload, revision)
values (1, '{}'::jsonb, 1)
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.ops enable row level security;
alter table public.activity enable row level security;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.auth_id = auth.uid() and p.access = 'owner' and p.active
  );
$$;

create policy "crew_read_profiles"
  on public.profiles for select
  to authenticated
  using (active or auth.uid() = auth_id or public.is_owner());

create policy "owner_write_profiles"
  on public.profiles for all
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

create policy "crew_read_ops"
  on public.ops for select
  to authenticated
  using (true);

create policy "crew_update_ops"
  on public.ops for update
  to authenticated
  using (true)
  with check (true);

create policy "crew_insert_activity"
  on public.activity for insert
  to authenticated
  with check (true);

create policy "owner_read_activity"
  on public.activity for select
  to authenticated
  using (public.is_owner());

insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

create policy "public_read_uploads"
  on storage.objects for select
  using (bucket_id = 'uploads');

create policy "crew_write_uploads"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'uploads');

create policy "crew_update_uploads"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'uploads');

create policy "crew_delete_uploads"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'uploads');
