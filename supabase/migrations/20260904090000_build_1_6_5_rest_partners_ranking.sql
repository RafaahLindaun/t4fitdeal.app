-- ACCQUA Sports — Build 1.6.5
-- Safe reconciliation against the live schema. This migration is intentionally
-- additive and does not depend on the abandoned Build 1.6.3 partner migration.

begin;

-- The frontend has supported this preference for several builds, but the live
-- table never received the column. Keep the existing self-read/write RLS.
alter table public.accqua_profile_preferences
  add column if not exists rest_required boolean not null default true;

-- A training partner is a saved relationship initiated by the current user.
-- It is deliberately separate from a future one-off "call to train" action.
create table if not exists public.accqua_training_partners (
  user_id uuid not null references auth.users(id) on delete cascade,
  partner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, partner_id),
  constraint accqua_training_partners_not_self check (user_id <> partner_id)
);

alter table public.accqua_training_partners enable row level security;

drop policy if exists accqua_training_partners_self_select on public.accqua_training_partners;
create policy accqua_training_partners_self_select
  on public.accqua_training_partners
  for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists accqua_training_partners_self_insert on public.accqua_training_partners;
create policy accqua_training_partners_self_insert
  on public.accqua_training_partners
  for insert
  to authenticated
  with check (user_id = (select auth.uid()) and partner_id <> (select auth.uid()));

drop policy if exists accqua_training_partners_self_delete on public.accqua_training_partners;
create policy accqua_training_partners_self_delete
  on public.accqua_training_partners
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

create index if not exists accqua_training_partners_partner_idx
  on public.accqua_training_partners(partner_id);

create or replace function public.accqua_add_training_partner_v1_6_5(p_partner_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;
  if p_partner_id is null or p_partner_id = v_user_id then
    raise exception 'invalid_partner';
  end if;
  if not exists (
    select 1
    from public.profiles p
    where p.id = p_partner_id
      and coalesce(p.show_in_ranking, true)
      and coalesce(p.role::text, 'student') = 'student'
  ) then
    raise exception 'partner_unavailable';
  end if;

  insert into public.accqua_training_partners(user_id, partner_id)
  values (v_user_id, p_partner_id)
  on conflict (user_id, partner_id) do nothing;

  return true;
end;
$$;

create or replace function public.accqua_remove_training_partner_v1_6_5(p_partner_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;

  delete from public.accqua_training_partners
  where user_id = v_user_id and partner_id = p_partner_id;

  return true;
end;
$$;

create or replace function public.accqua_is_training_partner_v1_6_5(p_partner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when auth.uid() is null then false
    else exists (
      select 1
      from public.accqua_training_partners tp
      where tp.user_id = auth.uid()
        and tp.partner_id = p_partner_id
    )
  end;
$$;

create or replace function public.get_my_accqua_training_partners_v1_6_5()
returns table (
  student_id uuid,
  first_name text,
  avatar_url text,
  objective text,
  added_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;

  return query
  select
    p.id,
    coalesce(nullif(split_part(coalesce(nullif(p.full_name, ''), nullif(p.nome, ''), 'Aluno ACCQUA'), ' ', 1), ''), 'Aluno ACCQUA')::text,
    coalesce(p.avatar_url, p.photo_url, '')::text,
    coalesce(nullif(p.objective, ''), nullif(p.objetivo, ''), '')::text,
    tp.created_at
  from public.accqua_training_partners tp
  join public.profiles p on p.id = tp.partner_id
  where tp.user_id = auth.uid()
  order by tp.created_at desc;
end;
$$;

create or replace function public.get_my_accqua_training_partner_count_v1_6_5()
returns integer
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when auth.uid() is null then 0
    else (
      select count(*)::integer
      from public.accqua_training_partners tp
      where tp.user_id = auth.uid()
    )
  end;
$$;

-- Public here means "visible inside the authenticated ranking", not anonymous.
-- Only a compact training summary is exposed; loads, notes and health/private
-- profile fields are intentionally excluded.
create or replace function public.get_accqua_public_workout_summary_v1_6_5(p_student_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_program_id uuid;
  v_program_name text;
  v_program_split text;
  v_program_review date;
  v_plan_name text;
  v_plan_split text;
  v_plan_focus text;
  v_plan_review date;
  v_routines integer := 0;
  v_exercises integer := 0;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;

  if p_student_id is null then
    return null;
  end if;

  if p_student_id <> v_user_id and not exists (
    select 1
    from public.profiles p
    where p.id = p_student_id
      and coalesce(p.show_in_ranking, false)
      and coalesce(p.role::text, 'student') = 'student'
  ) then
    return null;
  end if;

  select wp.id, wp.name, wp.split_code, wp.review_at
    into v_program_id, v_program_name, v_program_split, v_program_review
  from public.workout_programs wp
  where wp.student_id = p_student_id
    and coalesce(wp.is_active, true)
  order by wp.version desc nulls last, wp.updated_at desc nulls last, wp.created_at desc
  limit 1;

  select
    coalesce(nullif(wp.name, ''), nullif(wp.title, '')),
    coalesce(nullif(wp.split_code, ''), nullif(wp.split_label, '')),
    nullif(wp.focus, ''),
    wp.review_at
    into v_plan_name, v_plan_split, v_plan_focus, v_plan_review
  from public.workout_plans wp
  where (wp.student_id = p_student_id or wp.user_id = p_student_id)
    and coalesce(wp.is_active, true)
    and (v_program_id is null or wp.program_id = v_program_id or wp.program_id is null)
  order by wp.version desc nulls last, wp.updated_at desc nulls last, wp.created_at desc
  limit 1;

  select count(*)::integer
    into v_routines
  from public.workout_plans wp
  where (wp.student_id = p_student_id or wp.user_id = p_student_id)
    and coalesce(wp.is_active, true)
    and (v_program_id is null or wp.program_id = v_program_id or wp.program_id is null);

  select count(we.id)::integer
    into v_exercises
  from public.workout_exercises we
  join public.workout_plans wp on wp.id = we.plan_id
  where (wp.student_id = p_student_id or wp.user_id = p_student_id)
    and coalesce(wp.is_active, true)
    and (v_program_id is null or wp.program_id = v_program_id or wp.program_id is null);

  if coalesce(v_program_name, v_plan_name, '') = '' and v_routines = 0 then
    return null;
  end if;

  return jsonb_build_object(
    'programName', coalesce(nullif(v_program_name, ''), nullif(v_plan_name, ''), 'Treino atual'),
    'split', coalesce(nullif(v_program_split, ''), nullif(v_plan_split, ''), 'Não informada'),
    'focus', coalesce(v_plan_focus, ''),
    'routines', greatest(v_routines, 0),
    'exercises', greatest(v_exercises, 0),
    'reviewAt', coalesce(v_program_review, v_plan_review)
  );
end;
$$;

revoke all on function public.accqua_add_training_partner_v1_6_5(uuid) from public, anon;
revoke all on function public.accqua_remove_training_partner_v1_6_5(uuid) from public, anon;
revoke all on function public.accqua_is_training_partner_v1_6_5(uuid) from public, anon;
revoke all on function public.get_my_accqua_training_partners_v1_6_5() from public, anon;
revoke all on function public.get_my_accqua_training_partner_count_v1_6_5() from public, anon;
revoke all on function public.get_accqua_public_workout_summary_v1_6_5(uuid) from public, anon;

grant execute on function public.accqua_add_training_partner_v1_6_5(uuid) to authenticated;
grant execute on function public.accqua_remove_training_partner_v1_6_5(uuid) to authenticated;
grant execute on function public.accqua_is_training_partner_v1_6_5(uuid) to authenticated;
grant execute on function public.get_my_accqua_training_partners_v1_6_5() to authenticated;
grant execute on function public.get_my_accqua_training_partner_count_v1_6_5() to authenticated;
grant execute on function public.get_accqua_public_workout_summary_v1_6_5(uuid) to authenticated;

commit;
