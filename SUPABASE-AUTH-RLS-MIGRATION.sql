-- GT TREINOS — Supabase Auth + RLS por owner_id
-- EXECUTAR SOMENTE no projeto indicado por VITE_SUPABASE_URL, após backup.
-- A migração mantém o perfil legado e associa os dados pelo e-mail confirmado no Auth.
-- Ela não importa senhas antigas: os usuários precisam criar/confirmar conta no Supabase Auth.

begin;

-- Pré-validação: não altera nada se a estrutura esperada não estiver presente.
do $$
declare
  tbl text;
  tbls text[] := array['trainings','exercises','loads','history'];
begin
  foreach tbl in array tbls loop
    if to_regclass(format('public.%I', tbl)) is null then
      raise exception 'Tabela public.% não encontrada; migração cancelada.', tbl;
    end if;
    if not exists (
      select 1 from information_schema.columns c
      where c.table_schema = 'public'
        and c.table_name = tbl
        and c.column_name = 'userEmail'
    ) then
      raise exception 'Coluna public.%.userEmail não encontrada; migração cancelada.', tbl;
    end if;
  end loop;

  if to_regclass('public.users') is null then
    raise exception 'Tabela public.users não encontrada; revise esta migração antes de executar.';
  end if;
end
$$;

create schema if not exists private;
revoke all on schema private from PUBLIC, anon, authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  age integer,
  gender text,
  weight numeric(7,2),
  height numeric(7,2),
  goal text,
  photo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
revoke all on table public.profiles from PUBLIC, anon;
grant select, insert, update on table public.profiles to authenticated;

drop policy if exists "gt_profiles_owner_access" on public.profiles;
create policy "gt_profiles_owner_access"
  on public.profiles as permissive for all to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists "gt_profiles_owner_guard" on public.profiles;
create policy "gt_profiles_owner_guard"
  on public.profiles as restrictive for all to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Atribui cada linha ao UUID do usuário Auth, preservando registros ainda não migrados.
do $$
declare
  tbl text;
  tbls text[] := array['trainings','exercises','loads','history'];
begin
  foreach tbl in array tbls loop
    execute format(
      'alter table public.%I add column if not exists owner_id uuid references auth.users(id) on delete cascade',
      tbl
    );

    execute format(
      'update public.%I as data
       set owner_id = auth_user.id
       from auth.users as auth_user
       where data.owner_id is null
         and auth_user.email_confirmed_at is not null
         and lower(data."userEmail") = lower(auth_user.email)',
      tbl
    );

    execute format('create index if not exists %I on public.%I (owner_id)', tbl || '_owner_id_idx', tbl);
    execute format('alter table public.%I enable row level security', tbl);
    execute format('revoke all on table public.%I from PUBLIC, anon', tbl);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', tbl);

    -- Política permissiva e restritiva: a restritiva impede que políticas antigas
    -- mais amplas liberem linhas de outro usuário.
    execute format('drop policy if exists "gt_owner_access" on public.%I', tbl);
    execute format(
      'create policy "gt_owner_access" on public.%I as permissive for all to authenticated
       using (owner_id = (select auth.uid()))
       with check (owner_id = (select auth.uid()))',
      tbl
    );

    execute format('drop policy if exists "gt_owner_guard" on public.%I', tbl);
    execute format(
      'create policy "gt_owner_guard" on public.%I as restrictive for all to authenticated
       using (owner_id = (select auth.uid()))
       with check (owner_id = (select auth.uid()))',
      tbl
    );
  end loop;
end
$$;

-- Cria perfil em cada cadastro e migra dados legados quando o e-mail for confirmado.
create or replace function private.sync_gt_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  tbl text;
  tbls text[] := array['trainings','exercises','loads','history'];
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', '')
  )
  on conflict (id) do update
    set email = excluded.email,
        name = case
          when coalesce(public.profiles.name, '') = '' then excluded.name
          else public.profiles.name
        end;

  if new.email is not null and new.email_confirmed_at is not null then
    execute $query$
      update public.profiles as profile
      set name = coalesce(nullif(to_jsonb(legacy) ->> 'name', ''), profile.name),
          age = coalesce(nullif(to_jsonb(legacy) ->> 'age', '')::integer, profile.age),
          gender = coalesce(nullif(to_jsonb(legacy) ->> 'gender', ''), profile.gender),
          weight = coalesce(nullif(to_jsonb(legacy) ->> 'weight', '')::numeric, profile.weight),
          height = coalesce(nullif(to_jsonb(legacy) ->> 'height', '')::numeric, profile.height),
          goal = coalesce(nullif(to_jsonb(legacy) ->> 'goal', ''), profile.goal),
          photo = coalesce(nullif(to_jsonb(legacy) ->> 'photo', ''), profile.photo),
          updated_at = now()
      from public.users as legacy
      where profile.id = $1
        and lower(legacy.email) = lower($2)
    $query$ using new.id, new.email;

    foreach tbl in array tbls loop
      execute format(
        'update public.%I as data
         set owner_id = $1
         where data.owner_id is null
           and lower(data."userEmail") = lower($2)',
        tbl
      ) using new.id, new.email;
    end loop;
  end if;

  return new;
end;
$$;

revoke all on function private.sync_gt_auth_user() from PUBLIC, anon, authenticated;
drop trigger if exists gt_sync_auth_user on auth.users;
create trigger gt_sync_auth_user
after insert or update of email_confirmed_at on auth.users
for each row execute function private.sync_gt_auth_user();

-- Cria os perfis de usuários Auth já existentes e aplica o vínculo por e-mail.
insert into public.profiles (id, email, name)
select id, email, coalesce(raw_user_meta_data ->> 'name', '')
from auth.users
on conflict (id) do nothing;

-- Bloqueia a autenticação legada e elimina a senha em texto puro.
alter table public.users enable row level security;
revoke all on table public.users from PUBLIC, anon, authenticated;
alter table public.users drop column if exists password;

commit;
