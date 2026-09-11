-- ACCQUA Sports — Build 1.7.1
-- Cardio prescrito só pontua quando a meta enviada pelo professor foi concluída.
-- O dia continua contando uma única vez quando musculação e cardio coincidem.

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
  v_is_professor_cardio boolean := false;
  v_activity text;
  v_target_seconds integer := 1800;
  v_elapsed integer := greatest(0, coalesce(p_elapsed_seconds, 0));
  v_calories integer := greatest(0, coalesce(p_calories, 0));
  v_distance numeric := greatest(0, coalesce(p_distance_meters, 0));
  v_ranking_reason text;
begin
  if v_user_id is null then
    raise exception 'Sessão autenticada necessária.';
  end if;

  select
    coalesce(cs.completed_at, now()),
    cs.activity_type,
    greatest(60, coalesce(nullif(cs.target_duration_seconds, 0), 1800)),
    (
      lower(coalesce(cs.source, '')) = 'professor'
      or exists (
        select 1 from public.workout_cardio_prescriptions wcp
        where wcp.id = cs.prescription_id and wcp.student_id = v_user_id
      )
      or exists (
        select 1 from public.cardio_prescriptions cp
        where cp.id = cs.prescription_id and cp.student_id = v_user_id
      )
    )
  into v_completed_at, v_activity, v_target_seconds, v_is_professor_cardio
  from public.cardio_sessions cs
  where cs.id = p_session_id
    and coalesce(cs.student_id, cs.user_id) = v_user_id
  limit 1;

  if v_activity is null then
    raise exception 'Sessão de cardio não encontrada.';
  end if;

  v_valid := v_is_professor_cardio and v_elapsed >= v_target_seconds;
  v_ranking_reason := case
    when v_valid then 'Cardio prescrito concluído dentro da meta.'
    when v_is_professor_cardio then 'Cardio registrado, mas a meta do professor ainda não foi concluída.'
    else 'Cardio livre registrado no histórico.'
  end;

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
      valid_for_ranking = v_valid,
      ranking_reason = v_ranking_reason,
      last_heartbeat_at = now(),
      updated_at = now()
  where id = p_session_id
    and coalesce(student_id, user_id) = v_user_id;

  return jsonb_build_object(
    'saved', true,
    'valid_for_ranking', v_valid,
    'ranking_reason', v_ranking_reason
  );
end;
$function$;

revoke all on function public.complete_cardio_session_v9_2(uuid, integer, numeric, integer, numeric, integer, integer, integer) from public, anon;
grant execute on function public.complete_cardio_session_v9_2(uuid, integer, numeric, integer, numeric, integer, integer, integer) to authenticated, service_role;

create or replace function public.get_accqua_monthly_ranking_v1_5_6()
returns table(
  student_id uuid,
  first_name text,
  avatar_url text,
  monthly_workout_count bigint,
  workout_days bigint,
  cardio_only_days bigint,
  total_duration_seconds bigint,
  last_activity_date date,
  posicao bigint,
  dias_para_lider bigint,
  treinos_para_lider bigint
)
language sql
stable
security definer
set search_path = public, auth, pg_catalog
as $function$
with bounds as (
  select
    date_trunc('month', now() at time zone 'America/Sao_Paulo')::date as month_start,
    (date_trunc('month', now() at time zone 'America/Sao_Paulo') + interval '1 month')::date as month_end
), student_profiles as (
  select
    p.id as student_id,
    split_part(coalesce(
      nullif(to_jsonb(p)->>'full_name', ''),
      nullif(to_jsonb(p)->>'nome', ''),
      split_part(coalesce(u.email, 'Aluno'), '@', 1),
      'Aluno'
    ), ' ', 1)::text as first_name,
    coalesce(to_jsonb(p)->>'avatar_url', '')::text as avatar_url,
    p.matricula_valida_ate,
    p.matricula_confirmada_em
  from public.profiles p
  left join auth.users u on u.id = p.id
  where lower(coalesce(to_jsonb(p)->>'show_in_ranking', 'true')) not in ('false','0','no','não')
    and lower(coalesce(
      nullif(to_jsonb(p)->>'role',''),
      nullif(to_jsonb(p)->>'tipo',''),
      nullif(to_jsonb(p)->>'perfil',''),
      'student'
    )) not in ('professor','reception','recepcao','recepção','admin','administracao','administração')
    and lower(coalesce(u.email,'')) not like '%@professor%'
    and lower(coalesce(u.email,'')) not like '%@recepcao%'
    and lower(coalesce(u.email,'')) not like '%@recepção%'
    and lower(coalesce(u.email,'')) not like '%@administracao%'
    and lower(coalesce(u.email,'')) not like '%@adminstracao%'
    and lower(coalesce(u.email,'')) not like '%@admin%'
), canonical_workouts as (
  select
    wr.student_id,
    case
      when wr.legacy_session_id is not null then 'session:' || wr.legacy_session_id::text
      when nullif(trim(wr.client_event_id),'') is not null then 'event:' || wr.client_event_id
      else 'record:' || wr.id::text
    end as workout_key,
    wr.completed_at as performed_at,
    greatest(0, coalesce(wr.duration_seconds,0))::bigint as duration_seconds,
    coalesce(wr.valid_for_ranking,false) as valid_workout
  from public.accqua_workout_records wr
), legacy_workouts as (
  select
    h.student_id,
    'session:' || h.source_session_id::text as workout_key,
    h.performed_at,
    greatest(0,coalesce(h.duration_seconds,0))::bigint as duration_seconds,
    (coalesce(h.valid_for_ranking,false) or coalesce(h.completion_percentage,0) >= 70) as valid_workout
  from public.accqua_activity_history h
  where h.activity_kind = 'workout'
    and h.source_session_id is not null
    and not exists (
      select 1 from public.accqua_workout_records wr
      where wr.student_id = h.student_id and wr.legacy_session_id = h.source_session_id
    )
), all_workouts as (
  select * from canonical_workouts
  union all
  select * from legacy_workouts
), deduplicated_workouts as (
  select distinct on (w.student_id, w.workout_key)
    w.student_id, w.workout_key, w.performed_at, w.duration_seconds
  from all_workouts w
  where w.student_id is not null and w.performed_at is not null and w.valid_workout
  order by w.student_id, w.workout_key, w.performed_at desc
), month_workouts as (
  select
    w.student_id,
    (w.performed_at at time zone 'America/Sao_Paulo')::date as activity_day,
    w.duration_seconds
  from deduplicated_workouts w
  cross join bounds b
  where (w.performed_at at time zone 'America/Sao_Paulo')::date >= b.month_start
    and (w.performed_at at time zone 'America/Sao_Paulo')::date < b.month_end
), backed_workouts as (
  select w.*
  from month_workouts w
  join student_profiles p on p.student_id = w.student_id
  where (
    (p.matricula_valida_ate is not null
      and p.matricula_valida_ate >= w.activity_day
      and (p.matricula_confirmada_em is null or (p.matricula_confirmada_em at time zone 'America/Sao_Paulo')::date <= w.activity_day))
    or exists (
      select 1 from public.reservas_aula ra
      where ra.aluno_id = w.student_id and ra.data_aula = w.activity_day and lower(coalesce(ra.status,'')) = 'presente'
    )
  )
), professor_cardio as (
  select distinct on (coalesce(cs.idempotency_key, cs.id::text))
    coalesce(cs.student_id, cs.user_id) as student_id,
    (coalesce(cs.completed_at, cs.updated_at, cs.created_at) at time zone 'America/Sao_Paulo')::date as activity_day,
    greatest(0, coalesce(cs.elapsed_seconds, cs.duration_seconds, 0))::bigint as duration_seconds
  from public.cardio_sessions cs
  where lower(coalesce(cs.status,'')) in ('completed','complete','concluido','finalizado','finished','done')
    and cs.completed_at is not null
    and lower(coalesce(cs.source,'')) = 'professor'
    and cs.prescription_id is not null
    and greatest(0, coalesce(cs.elapsed_seconds, cs.duration_seconds, 0)) >= greatest(60, coalesce(nullif(cs.target_duration_seconds, 0), 1800))
  order by coalesce(cs.idempotency_key, cs.id::text), coalesce(cs.completed_at, cs.updated_at, cs.created_at) desc
), month_cardio as (
  select c.*
  from professor_cardio c
  cross join bounds b
  where c.activity_day >= b.month_start and c.activity_day < b.month_end
), backed_cardio as (
  select c.*
  from month_cardio c
  join student_profiles p on p.student_id = c.student_id
  where (
    (p.matricula_valida_ate is not null
      and p.matricula_valida_ate >= c.activity_day
      and (p.matricula_confirmada_em is null or (p.matricula_confirmada_em at time zone 'America/Sao_Paulo')::date <= c.activity_day))
    or exists (
      select 1 from public.reservas_aula ra
      where ra.aluno_id = c.student_id and ra.data_aula = c.activity_day and lower(coalesce(ra.status,'')) = 'presente'
    )
  )
), workout_totals as (
  select student_id, count(distinct activity_day)::bigint as workout_days, coalesce(sum(duration_seconds),0)::bigint as workout_duration
  from backed_workouts group by student_id
), cardio_totals as (
  select student_id, count(distinct activity_day)::bigint as cardio_days, coalesce(sum(duration_seconds),0)::bigint as cardio_duration
  from backed_cardio group by student_id
), activity_days as (
  select student_id, activity_day, 'workout'::text as activity_kind from backed_workouts
  union
  select student_id, activity_day, 'cardio'::text as activity_kind from backed_cardio
), activity_totals as (
  select
    a.student_id,
    count(distinct a.activity_day)::bigint as trained_days,
    count(distinct case when a.activity_kind = 'cardio' and not exists (select 1 from backed_workouts w where w.student_id = a.student_id and w.activity_day = a.activity_day) then a.activity_day end)::bigint as cardio_only_days,
    max(a.activity_day) as last_activity_date
  from activity_days a group by a.student_id
), base as (
  select
    p.student_id,
    p.first_name,
    p.avatar_url,
    coalesce(a.trained_days,0)::bigint as dias_treinados,
    coalesce(w.workout_days,0)::bigint as workout_days,
    coalesce(a.cardio_only_days,0)::bigint as cardio_only_days,
    (coalesce(w.workout_duration,0) + coalesce(c.cardio_duration,0))::bigint as total_duration_seconds,
    a.last_activity_date
  from student_profiles p
  left join activity_totals a on a.student_id = p.student_id
  left join workout_totals w on w.student_id = p.student_id
  left join cardio_totals c on c.student_id = p.student_id
), ranked as (
  select
    b.*,
    rank() over (order by b.dias_treinados desc, b.last_activity_date asc nulls last, b.first_name asc, b.student_id asc)::bigint as posicao,
    (max(b.dias_treinados) over () - b.dias_treinados)::bigint as dias_para_lider
  from base b
)
select
  r.student_id,
  r.first_name,
  r.avatar_url,
  r.dias_treinados as monthly_workout_count,
  r.workout_days,
  r.cardio_only_days,
  r.total_duration_seconds,
  r.last_activity_date,
  r.posicao,
  r.dias_para_lider,
  r.dias_para_lider as treinos_para_lider
from ranked r
order by r.posicao, r.first_name, r.student_id;
$function$;

revoke all on function public.get_accqua_monthly_ranking_v1_5_6() from public, anon;
grant execute on function public.get_accqua_monthly_ranking_v1_5_6() to authenticated, service_role;
