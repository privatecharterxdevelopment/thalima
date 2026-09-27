-- Shared crew document library. Every active crew member can list, open, upload, and delete.

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  storage_path text not null unique,
  mime text not null default 'application/octet-stream',
  size_bytes bigint not null default 0,
  uploaded_by text references public.profiles (id) on delete set null,
  uploaded_by_name text not null default '',
  created_at timestamptz not null default now()
);

alter table public.documents enable row level security;

revoke all on table public.documents from public, anon;
grant select, insert, delete on table public.documents to authenticated;

create or replace function public.documents_stamp()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  pid text;
  pname text;
begin
  select p.id, p.name into pid, pname
  from public.profiles p
  where p.auth_id = auth.uid()
    and p.active;
  if pid is null then
    raise exception 'Not allowed';
  end if;
  new.uploaded_by := pid;
  new.uploaded_by_name := pname;
  return new;
end;
$$;

revoke all on function public.documents_stamp() from public, anon;
grant execute on function public.documents_stamp() to authenticated;

create trigger documents_stamp
before insert on public.documents
for each row
execute function public.documents_stamp();

create policy documents_read
on public.documents
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.auth_id = auth.uid() and p.active
  )
);

create policy documents_insert
on public.documents
for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles p
    where p.auth_id = auth.uid() and p.active
  )
);

create policy documents_delete
on public.documents
for delete
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.auth_id = auth.uid() and p.active
  )
);

alter table public.documents replica identity full;
alter publication supabase_realtime add table public.documents;

insert into storage.buckets (id, name, public, file_size_limit)
values ('documents', 'documents', false, 52428800);

create policy documents_bucket_read
on storage.objects
for select
to authenticated
using (
  bucket_id = 'documents'
  and exists (
    select 1 from public.profiles p
    where p.auth_id = auth.uid() and p.active
  )
);

create policy documents_bucket_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'documents'
  and exists (
    select 1 from public.profiles p
    where p.auth_id = auth.uid() and p.active
  )
);

create policy documents_bucket_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'documents'
  and exists (
    select 1 from public.profiles p
    where p.auth_id = auth.uid() and p.active
  )
);
