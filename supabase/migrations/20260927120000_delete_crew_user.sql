-- Remove a crew seat from auth and profiles. Callable by an owner or level 1.
-- Deleting auth.users cascades to the profile, so the person disappears everywhere.

create or replace function public.delete_crew_user(p_id text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  caller_id text;
  caller_access text;
  caller_level int;
  target_auth uuid;
  target_access text;
  target_name text;
  owners int;
begin
  select id, access, level
    into caller_id, caller_access, caller_level
  from public.profiles
  where auth_id = auth.uid()
    and active;

  if caller_id is null or (caller_access is distinct from 'owner' and caller_level is distinct from 1) then
    raise exception 'Not allowed';
  end if;

  if caller_id = p_id then
    raise exception 'You cannot remove yourself.';
  end if;

  select auth_id, access, name
    into target_auth, target_access, target_name
  from public.profiles
  where id = p_id;

  if not found then
    raise exception 'User not found.';
  end if;

  if target_access = 'owner' then
    select count(*) into owners
    from public.profiles
    where access = 'owner'
      and active
      and id <> p_id;
    if owners < 1 then
      raise exception 'Keep at least one owner.';
    end if;
  end if;

  insert into public.activity (id, actor_id, action, detail)
  values (
    'log_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
    caller_id,
    'user_delete',
    'Removed ' || target_name
  );

  if target_auth is null then
    delete from public.profiles where id = p_id;
  else
    delete from auth.users where id = target_auth;
  end if;
end;
$$;

revoke all on function public.delete_crew_user(text) from public;
revoke all on function public.delete_crew_user(text) from anon;
revoke all on function public.delete_crew_user(text) from authenticated;
grant execute on function public.delete_crew_user(text) to authenticated;

alter table public.profiles replica identity full;
alter publication supabase_realtime add table public.profiles;
