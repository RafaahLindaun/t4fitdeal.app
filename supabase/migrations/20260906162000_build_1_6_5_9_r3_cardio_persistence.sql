-- ACCQUA Sports — Build 1.6.5.9 / rodada 3
-- Corrige a persistência de cardio mantendo compatibilidade com as colunas
-- legadas obrigatórias da tabela cardio_sessions.

alter table public.cardio_sessions
  alter column workout_id set default 'cardio',
  alter column workout_name set default 'Cardio',
  alter column intensity set default 'moderate';

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
  v_workout_name text;
  v_intensity text := lower(coalesce(nullif(trim(coalesce(p_target_snapshot ->> 'intensity', '')), ''), 'moderate'));
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

  v_workout_name := case v_activity
    when 'spinning' then 'Bike'
    when 'elliptical' then 'Elíptico'
    when 'stairs' then 'Escada'
    when 'rowing' then 'Remo'
    when 'walk' then 'Caminhada'
    when 'swim' then 'Natação'
    else 'Esteira'
  end;

  insert into public.cardio_sessions (
    student_id, user_id, prescription_id,
    workout_id, workout_name, intensity,
    activity_type, cardio_type, mode,
    session_context, source, status,
    target_duration_seconds, target_snapshot,
    started_at, last_heartbeat_at, session_date, date_key,
    minutes, elapsed_seconds, duration_seconds,
    distance_meters, distance_km, average_pace_seconds,
    average_speed_kmh, cadence_rpm, laps,
    calories, calories_burned, kcal
  ) values (
    v_user_id, v_user_id, p_prescription_id,
    'cardio:' || v_activity, v_workout_name, v_intensity,
    v_activity, v_activity, v_activity,
    v_context, v_source, 'running',
    greatest(0, coalesce(p_target_duration_seconds, 0)),
    coalesce(p_target_snapshot, '{}'::jsonb),
    now(), now(),
    (now() at time zone 'America/Sao_Paulo')::date,
    to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD'),
    0, 0, 0,
    0, 0, 0,
    0, 0, 0,
    0, 0, 0
  ) returning id into v_session_id;

  return v_session_id;
end;
$function$;

revoke all on function public.start_cardio_session_v9_2(uuid,text,text,integer,jsonb,text) from public, anon;
grant execute on function public.start_cardio_session_v9_2(uuid,text,text,integer,jsonb,text) to authenticated, service_role;

revoke all on function public.complete_cardio_session_v9_2(uuid,integer,numeric,integer,numeric,integer,integer,integer) from public, anon;
grant execute on function public.complete_cardio_session_v9_2(uuid,integer,numeric,integer,numeric,integer,integer,integer) to authenticated, service_role;
