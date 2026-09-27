create extension if not exists pgcrypto;

create or replace function public.can_manage_users()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.auth_id = auth.uid()
      and p.active
      and (p.access = 'owner' or p.level = 1)
  );
$$;

revoke all on function public.can_manage_users() from public;
grant execute on function public.can_manage_users() to authenticated;

create or replace function public.create_crew_user(
  p_name text,
  p_email text,
  p_password text,
  p_title text,
  p_role text default 'deckhand',
  p_departments text[] default array['deck'],
  p_level int default 3,
  p_accounting text default 'none',
  p_phone text default '',
  p_watch text default '',
  p_access text default 'crew'
) returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  caller public.profiles%rowtype;
  new_auth uuid := gen_random_uuid();
  new_id text := 'u_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);
  clean_email text := lower(trim(p_email));
  stations text[];
  dept text;
  lvl int;
  access_value text;
  initials text;
  parts text[];
begin
  select * into caller from public.profiles where auth_id = auth.uid() and active;
  if caller.id is null or not (caller.access = 'owner' or caller.level = 1) then
    raise exception 'Admin access only.';
  end if;
  if length(trim(coalesce(p_name, ''))) = 0
     or length(clean_email) = 0
     or position('@' in clean_email) = 0
     or length(coalesce(p_password, '')) < 6
     or length(trim(coalesce(p_title, ''))) = 0 then
    raise exception 'Name, email, title and a password of at least 6 characters are required.';
  end if;
  if exists (select 1 from auth.users u where lower(u.email) = clean_email)
     or exists (select 1 from public.profiles pr where lower(pr.email) = clean_email) then
    raise exception 'That email is already on board.';
  end if;

  stations := array(
    select distinct d
    from unnest(coalesce(p_departments, array['deck'])) as d
    where d in ('bridge', 'engineering', 'deck', 'interior', 'galley')
  );
  if coalesce(array_length(stations, 1), 0) = 0 then
    stations := array['deck'];
  end if;
  dept := stations[1];
  lvl := case when p_level in (1, 2, 3) then p_level else 3 end;
  access_value := case when caller.access = 'owner' and p_access = 'owner' then 'owner' else 'crew' end;

  parts := regexp_split_to_array(trim(p_name), '\s+');
  if coalesce(array_length(parts, 1), 0) <= 1 then
    initials := upper(substr(parts[1], 1, 2));
  else
    initials := upper(substr(parts[1], 1, 1) || substr(parts[array_length(parts, 1)], 1, 1));
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous
  ) values (
    '00000000-0000-0000-0000-000000000000',
    new_auth,
    'authenticated',
    'authenticated',
    clean_email,
    crypt(p_password, gen_salt('bf', 10)),
    now(),
    '', '', '', '', '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('name', trim(p_name)),
    now(),
    now(),
    false,
    false
  );

  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id, created_at, updated_at
  ) values (
    gen_random_uuid(),
    new_auth,
    jsonb_build_object('sub', new_auth::text, 'email', clean_email, 'email_verified', true),
    'email',
    clean_email,
    now(),
    now()
  );

  insert into public.profiles (
    id, auth_id, name, title, role, department, departments, level, accounting,
    initials, watch, email, phone, photo, access, active, updated_at
  ) values (
    new_id, new_auth, trim(p_name), trim(p_title), coalesce(nullif(trim(p_role), ''), 'deckhand'),
    dept, stations, lvl, coalesce(nullif(trim(p_accounting), ''), 'none'),
    initials, trim(coalesce(p_watch, '')), clean_email, trim(coalesce(p_phone, '')), '',
    access_value, true, now()
  );

  insert into public.activity (id, at, actor_id, action, detail)
  values (
    'log_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
    now(),
    caller.id,
    'user_create',
    'Created ' || trim(p_name) || ' <' || clean_email || '> as ' || trim(p_title)
  );

  return jsonb_build_object('id', new_id, 'email', clean_email, 'name', trim(p_name));
end;
$$;

revoke all on function public.create_crew_user(text, text, text, text, text, text[], int, text, text, text, text) from public;
grant execute on function public.create_crew_user(text, text, text, text, text, text[], int, text, text, text, text) to authenticated;
