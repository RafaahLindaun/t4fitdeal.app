-- ACCQUA Sports Build 1.5.6
-- Ranking: um ponto por dia válido. Cardio: resumo diário/mensal em uma única fonte.

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
      split_part(
        coalesce(
          nullif(to_jsonb(p)->>'full_name', ''),
          nullif(to_jsonb(p)->>'nome', ''),
          split_part(coalesce(u.email, 'Aluno'), '@', 1),
          'Aluno'
        ), ' ', 1
      )::text as first_name,
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
      greatest(0,coalesce(wr.duration_seconds,0))::bigint as duration_seconds,
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
    where h.activity_kind='workout'
      and h.source_session_id is not null
      and not exists (
        select 1 from public.accqua_workout_records wr
        where wr.student_id=h.student_id and wr.legacy_session_id=h.source_session_id
      )
  ), all_workouts as (
    select * from canonical_workouts
    union all
    select * from legacy_workouts
  ), deduplicated as (
    select distinct on (w.student_id,w.workout_key)
      w.student_id,w.workout_key,w.performed_at,w.duration_seconds,w.valid_workout
    from all_workouts w
    where w.student_id is not null and w.performed_at is not null
    order by w.student_id,w.workout_key,w.performed_at desc
  ), month_workouts as (
    select
      w.*,
      (w.performed_at at time zone 'America/Sao_Paulo')::date as workout_day
    from deduplicated w
    cross join bounds b
    where (w.performed_at at time zone 'America/Sao_Paulo')::date >= b.month_start
      and (w.performed_at at time zone 'America/Sao_Paulo')::date < b.month_end
      and w.valid_workout
  ), backed_workouts as (
    select w.*
    from month_workouts w
    join student_profiles p on p.student_id=w.student_id
    where (
      (
        p.matricula_valida_ate is not null
        and p.matricula_valida_ate >= w.workout_day
        and (p.matricula_confirmada_em is null or (p.matricula_confirmada_em at time zone 'America/Sao_Paulo')::date <= w.workout_day)
      )
      or exists (
        select 1
        from public.reservas_aula ra
        where ra.aluno_id=w.student_id
          and ra.data_aula=w.workout_day
          and lower(coalesce(ra.status,''))='presente'
      )
    )
  ), totals as (
    select
      student_id,
      count(distinct workout_day)::bigint as dias_treinados,
      coalesce(sum(duration_seconds),0)::bigint as total_duration_seconds,
      max(workout_day) as last_activity_date
    from backed_workouts
    group by student_id
  ), base as (
    select
      p.student_id,
      p.first_name,
      p.avatar_url,
      coalesce(t.dias_treinados,0)::bigint as dias_treinados,
      coalesce(t.total_duration_seconds,0)::bigint as total_duration_seconds,
      t.last_activity_date
    from student_profiles p
    left join totals t on t.student_id=p.student_id
  ), ranked as (
    select
      b.*,
      rank() over (
        order by b.dias_treinados desc, b.last_activity_date asc nulls last, b.first_name asc, b.student_id asc
      )::bigint as posicao,
      (max(b.dias_treinados) over () - b.dias_treinados)::bigint as dias_para_lider
    from base b
  )
  select
    r.student_id,
    r.first_name,
    r.avatar_url,
    r.dias_treinados as monthly_workout_count,
    r.dias_treinados as workout_days,
    0::bigint as cardio_only_days,
    r.total_duration_seconds,
    r.last_activity_date,
    r.posicao,
    r.dias_para_lider,
    r.dias_para_lider as treinos_para_lider
  from ranked r
  order by r.posicao,r.first_name,r.student_id;
$function$;

revoke all on function public.get_accqua_monthly_ranking_v1_5_6() from public, anon;
grant execute on function public.get_accqua_monthly_ranking_v1_5_6() to authenticated, service_role;

create or replace function public.get_accqua_cardio_stats_v1_5_6(
  p_student_id uuid,
  p_period text default 'day',
  p_reference_date date default current_date
)
returns table(
  student_id uuid,
  period text,
  reference_date date,
  calories_total bigint,
  distance_total_m numeric,
  duration_total_seconds bigint,
  sessions bigint
)
language plpgsql
stable
security definer
set search_path = public, auth, pg_catalog
as $function$
begin
  if p_student_id is null then raise exception 'student_required'; end if;
  if auth.uid() is distinct from p_student_id and not public.accqua_is_staff() then raise exception 'forbidden'; end if;
  if lower(coalesce(p_period,'')) not in ('day','month') then raise exception 'invalid_period'; end if;

  return query
  with canonical as (
    select distinct on (coalesce(nullif(cs.idempotency_key,''),cs.id::text))
      cs.id,
      coalesce(cs.student_id,cs.user_id) as owner_id,
      (coalesce(cs.completed_at,cs.started_at,cs.created_at) at time zone 'America/Sao_Paulo')::date as local_day,
      greatest(0,coalesce(nullif(cs.calories,0),nullif(cs.kcal,0),nullif(cs.calories_burned,0),0))::bigint as kcal_value,
      greatest(0,coalesce(nullif(cs.distance_meters,0),nullif(cs.distance_km,0)*1000,0))::numeric as distance_value,
      greatest(0,coalesce(nullif(cs.elapsed_seconds,0),nullif(cs.duration_seconds,0),nullif(cs.minutes,0)*60,0))::bigint as duration_value
    from public.cardio_sessions cs
    where coalesce(cs.student_id,cs.user_id)=p_student_id
      and (lower(coalesce(cs.status,'')) in ('completed','complete','concluido','finalizado','finished','done') or cs.completed_at is not null)
    order by coalesce(nullif(cs.idempotency_key,''),cs.id::text),coalesce(cs.completed_at,cs.updated_at,cs.created_at) desc
  ), scoped as (
    select * from canonical c
    where case
      when lower(p_period)='month' then date_trunc('month',c.local_day::timestamp)::date=date_trunc('month',p_reference_date::timestamp)::date
      else c.local_day=p_reference_date
    end
  )
  select
    p_student_id,
    lower(p_period),
    p_reference_date,
    coalesce(sum(s.kcal_value),0)::bigint,
    coalesce(sum(s.distance_value),0)::numeric,
    coalesce(sum(s.duration_value),0)::bigint,
    count(*)::bigint
  from scoped s;
end;
$function$;

revoke all on function public.get_accqua_cardio_stats_v1_5_6(uuid,text,date) from public, anon;
grant execute on function public.get_accqua_cardio_stats_v1_5_6(uuid,text,date) to authenticated, service_role;
