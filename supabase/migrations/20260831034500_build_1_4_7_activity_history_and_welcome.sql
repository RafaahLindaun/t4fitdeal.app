-- ACCQUA Sports — Build 1.4.7
-- Cardio canônico, gasto energético/volume persistidos e boas-vindas do primeiro acesso.

-- ---------------------------------------------------------------------------
-- 1. Cardio: prescription_id passou a ser polimórfico durante a transição.
--    O app atual usa workout_cardio_prescriptions; a FK antiga ainda apontava
--    exclusivamente para cardio_prescriptions e fazia a sessão cair em modo local.
-- ---------------------------------------------------------------------------
alter table public.cardio_sessions
  drop constraint if exists cardio_sessions_prescription_id_fkey;

create index if not exists cardio_sessions_prescription_idx
  on public.cardio_sessions (prescription_id);

comment on column public.cardio_sessions.prescription_id is
  'ACCQUA: prescrição de cardio. Pode referenciar workout_cardio_prescriptions (atual) ou cardio_prescriptions (legado).';

create or replace function public.start_cardio_session_v9_2(
  p_prescription_id uuid,
  p_activity_type text,
  p_session_context text,
  p_target_duration_seconds integer,
  p_target_snapshot jsonb,
  p_source text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_catalog
as $function$
declare
  v_user_id uuid := auth.uid();
  v_session_id uuid;
  v_activity text := lower(coalesce(nullif(trim(p_activity_type), ''), 'treadmill'));
  v_context text := lower(coalesce(nullif(trim(p_session_context), ''), 'anytime'));
  v_source text := lower(coalesce(nullif(trim(p_source), ''), 'free'));
begin
  if v_user_id is null then
    raise exception 'Sessão autenticada necessária.';
  end if;

  if v_activity not in ('treadmill','spinning','elliptical','stairs','rowing','walk','swim') then
    raise exception 'Modalidade de cardio inválida.';
  end if;

  if v_context not in ('before','after','anytime') then
    v_context := 'anytime';
  end if;

  if v_source not in ('professor','free') then
    v_source := 'free';
  end if;

  if p_prescription_id is not null
     and not exists (
       select 1
         from public.workout_cardio_prescriptions wcp
        where wcp.id = p_prescription_id
          and wcp.student_id = v_user_id
     )
     and not exists (
       select 1
         from public.cardio_prescriptions cp
        where cp.id = p_prescription_id
          and cp.student_id = v_user_id
     ) then
    raise exception 'Prescrição de cardio não pertence ao aluno autenticado.';
  end if;

  insert into public.cardio_sessions (
    student_id,
    user_id,
    prescription_id,
    activity_type,
    cardio_type,
    mode,
    session_context,
    source,
    status,
    target_duration_seconds,
    target_snapshot,
    started_at,
    last_heartbeat_at,
    session_date,
    date_key,
    elapsed_seconds,
    duration_seconds,
    distance_meters,
    distance_km,
    average_pace_seconds,
    average_speed_kmh,
    cadence_rpm,
    laps,
    calories,
    calories_burned,
    kcal
  ) values (
    v_user_id,
    v_user_id,
    p_prescription_id,
    v_activity,
    v_activity,
    v_activity,
    v_context,
    v_source,
    'running',
    greatest(0, coalesce(p_target_duration_seconds, 0)),
    coalesce(p_target_snapshot, '{}'::jsonb),
    now(),
    now(),
    (now() at time zone 'America/Sao_Paulo')::date,
    to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD'),
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0
  )
  returning id into v_session_id;

  return v_session_id;
end;
$function$;

create or replace function public.complete_cardio_session_v9_2(
  p_session_id uuid,
  p_elapsed_seconds integer,
  p_distance_meters numeric,
  p_average_pace_seconds integer,
  p_average_speed_kmh numeric,
  p_cadence_rpm integer,
  p_laps integer,
  p_calories integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_catalog
as $function$
declare
  v_user_id uuid := auth.uid();
  v_completed_at timestamptz;
  v_valid boolean := false;
  v_activity text;
  v_elapsed integer := greatest(0, coalesce(p_elapsed_seconds, 0));
  v_calories integer := greatest(0, coalesce(p_calories, 0));
  v_distance numeric := greatest(0, coalesce(p_distance_meters, 0));
begin
  if v_user_id is null then
    raise exception 'Sessão autenticada necessária.';
  end if;

  select coalesce(cs.completed_at, now()), cs.activity_type
    into v_completed_at, v_activity
    from public.cardio_sessions cs
   where cs.id = p_session_id
     and coalesce(cs.student_id, cs.user_id) = v_user_id
   limit 1;

  if v_activity is null then
    raise exception 'Sessão de cardio não encontrada.';
  end if;

  update public.cardio_sessions
     set status = 'completed',
         elapsed_seconds = v_elapsed,
         duration_seconds = v_elapsed,
         minutes = case when v_elapsed <= 0 then 0 else ceil(v_elapsed / 60.0)::integer end,
         distance_meters = v_distance,
         distance_km = round((v_distance / 1000.0)::numeric, 4),
         average_pace_seconds = greatest(0, coalesce(p_average_pace_seconds, 0)),
         pace = greatest(0, coalesce(p_average_pace_seconds, 0)),
         average_speed_kmh = greatest(0, coalesce(p_average_speed_kmh, 0)),
         cadence_rpm = greatest(0, coalesce(p_cadence_rpm, 0)),
         laps = greatest(0, coalesce(p_laps, 0)),
         calories = v_calories,
         calories_burned = v_calories,
         kcal = v_calories,
         cardio_type = coalesce(nullif(activity_type, ''), v_activity),
         mode = coalesce(nullif(activity_type, ''), v_activity),
         session_date = (v_completed_at at time zone 'America/Sao_Paulo')::date,
         date_key = to_char(v_completed_at at time zone 'America/Sao_Paulo', 'YYYY-MM-DD'),
         completed_at = v_completed_at,
         last_heartbeat_at = now(),
         updated_at = now()
   where id = p_session_id
     and coalesce(student_id, user_id) = v_user_id
   returning valid_for_ranking into v_valid;

  return jsonb_build_object(
    'saved', true,
    'valid_for_ranking', coalesce(v_valid, false)
  );
end;
$function$;

grant execute on function public.start_cardio_session_v9_2(uuid,text,text,integer,jsonb,text) to authenticated;
grant execute on function public.complete_cardio_session_v9_2(uuid,integer,numeric,integer,numeric,integer,integer,integer) to authenticated;

-- Enriquecemos o histórico de cardio para a futura tela de evolução/ganhos.
create or replace function public.accqua_capture_cardio_history_v8_5()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_catalog
as $function$
begin
  if new.status <> 'completed' or new.completed_at is null then
    return new;
  end if;

  insert into public.accqua_activity_history (
    student_id,
    activity_kind,
    source_session_id,
    prescription_id,
    title,
    duration_seconds,
    calories,
    completion_percentage,
    status,
    metadata,
    valid_for_ranking,
    ranking_reason,
    performed_at,
    updated_at
  ) values (
    coalesce(new.student_id, new.user_id),
    'cardio',
    new.id,
    new.prescription_id,
    case lower(coalesce(new.activity_type, ''))
      when 'spinning' then 'Bike'
      when 'elliptical' then 'Elíptico'
      when 'stairs' then 'Escada'
      when 'rowing' then 'Remo'
      when 'walk' then 'Caminhada'
      when 'swim' then 'Nado'
      else 'Esteira'
    end,
    greatest(0, coalesce(new.elapsed_seconds, new.duration_seconds, 0)),
    greatest(0, coalesce(new.calories, new.calories_burned, new.kcal, 0)),
    100,
    'complete',
    jsonb_build_object(
      'activity_type', new.activity_type,
      'source', new.source,
      'session_context', new.session_context,
      'distance_meters', greatest(0, coalesce(new.distance_meters, 0)),
      'average_speed_kmh', greatest(0, coalesce(new.average_speed_kmh, 0)),
      'average_pace_seconds', greatest(0, coalesce(new.average_pace_seconds, 0)),
      'cadence_rpm', greatest(0, coalesce(new.cadence_rpm, 0)),
      'laps', greatest(0, coalesce(new.laps, 0)),
      'started_at', new.started_at,
      'completed_at', new.completed_at
    ),
    coalesce(new.valid_for_ranking, false),
    new.ranking_reason,
    new.completed_at,
    now()
  )
  on conflict (activity_kind, source_session_id)
  do update set
    student_id = excluded.student_id,
    prescription_id = excluded.prescription_id,
    title = excluded.title,
    duration_seconds = excluded.duration_seconds,
    calories = excluded.calories,
    completion_percentage = excluded.completion_percentage,
    status = excluded.status,
    metadata = excluded.metadata,
    valid_for_ranking = excluded.valid_for_ranking,
    ranking_reason = excluded.ranking_reason,
    performed_at = excluded.performed_at,
    updated_at = now();

  return new;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 2. Musculação: persistir gasto energético estimado e volume para histórico.
--    O cálculo é propositalmente conservador e usa o mesmo MET fallback (5.2)
--    já utilizado pelo frontend quando não existe wearable.
-- ---------------------------------------------------------------------------
create or replace function public.accqua_estimate_strength_calories_v1(
  p_student_id uuid,
  p_duration_seconds integer
)
returns integer
language plpgsql
stable
security definer
set search_path = public, auth, pg_catalog
as $function$
declare
  v_weight numeric := 70;
  v_duration integer := greatest(0, coalesce(p_duration_seconds, 0));
begin
  select greatest(35, coalesce(p.weight_kg, p.peso, 70))
    into v_weight
    from public.profiles p
   where p.id = p_student_id
   limit 1;

  v_weight := coalesce(v_weight, 70);
  return greatest(0, round(5.2 * v_weight * (v_duration / 3600.0))::integer);
end;
$function$;

create or replace function public.accqua_workout_volume_v1(p_session_id uuid)
returns numeric
language plpgsql
stable
security definer
set search_path = public, auth, pg_catalog
as $function$
declare
  v_volume numeric := 0;
  v_count integer := 0;
begin
  select coalesce(sum(greatest(0, coalesce(wsl.load_kg, 0)) * greatest(0, coalesce(wsl.reps, 0))), 0), count(*)
    into v_volume, v_count
    from public.workout_set_logs wsl
   where wsl.session_id = p_session_id;

  if v_count = 0 then
    select coalesce(sum(greatest(0, coalesce(se.carga_executada_kg, 0)) * greatest(0, coalesce(se.reps_executadas, 0))), 0)
      into v_volume
      from public.serie_execucoes se
     where se.sessao_id = p_session_id;
  end if;

  return greatest(0, coalesce(v_volume, 0));
end;
$function$;

create or replace function public.accqua_prepare_workout_completion_v9_5()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_catalog
as $function$
begin
  new.student_id := coalesce(new.student_id, new.user_id);
  new.user_id := coalesce(new.user_id, new.student_id);

  if new.student_id is null then
    raise exception 'Aluno não informado para a sessão.';
  end if;

  new.completion_percentage := greatest(0, least(100, coalesce(new.completion_percentage, 0)));
  new.duration_seconds := greatest(0, coalesce(new.duration_seconds, 0));
  new.completed_sets := greatest(0, coalesce(new.completed_sets, 0));
  new.total_sets := greatest(0, coalesce(new.total_sets, 0));
  new.valid_for_ranking := new.completed_at is not null and new.completion_percentage >= 70;

  if new.completed_at is not null and coalesce(new.calories_burned, 0) <= 0 then
    new.calories_burned := public.accqua_estimate_strength_calories_v1(
      new.student_id,
      new.duration_seconds
    );
  end if;

  new.updated_at := now();
  return new;
end;
$function$;

create or replace function public.accqua_register_workout_history_v9_5(p_session_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_catalog
as $function$
declare
  v_session public.workout_sessions%rowtype;
  v_student_id uuid;
  v_title text := 'Treino';
  v_history_id uuid;
  v_calories integer := 0;
  v_volume numeric := 0;
begin
  select * into v_session
    from public.workout_sessions
   where id = p_session_id
   limit 1;

  v_student_id := coalesce(v_session.student_id, v_session.user_id);

  if v_session.id is null or v_student_id is null or v_session.completed_at is null then
    return null;
  end if;

  select coalesce(
           nullif(trim(to_jsonb(wp)->>'name'), ''),
           nullif(trim(to_jsonb(wp)->>'title'), ''),
           nullif(trim(to_jsonb(wp)->>'routine_label'), ''),
           'Treino'
         )
    into v_title
    from public.workout_plans wp
   where wp.id = v_session.plan_id
   limit 1;

  v_calories := greatest(
    0,
    coalesce(
      v_session.calories_burned,
      public.accqua_estimate_strength_calories_v1(v_student_id, v_session.duration_seconds),
      0
    )
  );
  v_volume := public.accqua_workout_volume_v1(v_session.id);

  insert into public.accqua_activity_history (
    student_id,
    activity_kind,
    source_session_id,
    plan_id,
    title,
    duration_seconds,
    calories,
    completion_percentage,
    status,
    metadata,
    valid_for_ranking,
    ranking_reason,
    performed_at,
    updated_at
  ) values (
    v_student_id,
    'workout',
    v_session.id,
    v_session.plan_id,
    coalesce(v_title, 'Treino'),
    greatest(0, coalesce(v_session.duration_seconds, 0)),
    v_calories,
    greatest(0, least(100, coalesce(v_session.completion_percentage, 0))),
    case when coalesce(v_session.completion_percentage, 0) >= 100 then 'complete' else 'partial' end,
    jsonb_build_object(
      'completed_sets', greatest(0, coalesce(v_session.completed_sets, 0)),
      'total_sets', greatest(0, coalesce(v_session.total_sets, 0)),
      'training_volume_kg', v_volume,
      'started_at', v_session.started_at,
      'completed_at', v_session.completed_at
    ),
    coalesce(v_session.completion_percentage, 0) >= 70,
    case
      when coalesce(v_session.completion_percentage, 0) >= 70
        then 'Treino válido realizado neste dia.'
      else 'Treino registrado, mas abaixo de 70% de conclusão.'
    end,
    v_session.completed_at,
    now()
  )
  on conflict (activity_kind, source_session_id)
  do update set
    student_id = excluded.student_id,
    plan_id = excluded.plan_id,
    title = excluded.title,
    duration_seconds = excluded.duration_seconds,
    calories = excluded.calories,
    completion_percentage = excluded.completion_percentage,
    status = excluded.status,
    metadata = excluded.metadata,
    valid_for_ranking = excluded.valid_for_ranking,
    ranking_reason = excluded.ranking_reason,
    performed_at = excluded.performed_at,
    updated_at = now()
  returning id into v_history_id;

  return v_history_id;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 3. Boas-vindas do novo app: somente cadastros feitos após esta migration.
--    Usuários existentes são marcados como já apresentados para não receberem
--    um tour retroativo inesperado.
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists app_welcome_seen_at timestamptz;

update public.profiles
   set app_welcome_seen_at = now()
 where app_welcome_seen_at is null;

create or replace function public.get_my_app_welcome_state_v1()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_catalog
as $function$
  select coalesce(
    (select p.app_welcome_seen_at is not null from public.profiles p where p.id = auth.uid()),
    true
  );
$function$;

create or replace function public.mark_my_app_welcome_seen_v1()
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_catalog
as $function$
begin
  if auth.uid() is null then
    return false;
  end if;

  update public.profiles
     set app_welcome_seen_at = coalesce(app_welcome_seen_at, now()),
         updated_at = now()
   where id = auth.uid();

  return found;
end;
$function$;

revoke all on function public.get_my_app_welcome_state_v1() from public, anon;
revoke all on function public.mark_my_app_welcome_seen_v1() from public, anon;
grant execute on function public.get_my_app_welcome_state_v1() to authenticated;
grant execute on function public.mark_my_app_welcome_seen_v1() to authenticated;
