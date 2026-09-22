alter table public.profiles
  add column if not exists departments text[] not null default '{}';

update public.profiles
set departments = array[department]
where departments = '{}' or departments is null;
