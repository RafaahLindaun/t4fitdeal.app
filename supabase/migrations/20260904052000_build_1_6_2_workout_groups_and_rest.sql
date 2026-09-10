-- ACCQUA Sports — Build 1.6.2
-- Bi-set / tri-set, repouso obrigatório e normalização de mídia.

alter table public.workout_exercises
  add column if not exists set_type text not null default 'normal',
  add column if not exists set_group_id uuid,
  add column if not exists set_group_order smallint not null default 0;

alter table public.accqua_profile_preferences
  add column if not exists rest_required boolean not null default true;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.workout_exercises'::regclass
      and conname = 'workout_exercises_set_type_check'
  ) then
    alter table public.workout_exercises
      add constraint workout_exercises_set_type_check
      check (set_type in ('normal','biset','triset'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.workout_exercises'::regclass
      and conname = 'workout_exercises_set_group_order_check'
  ) then
    alter table public.workout_exercises
      add constraint workout_exercises_set_group_order_check
      check (set_group_order between 0 and 3);
  end if;
end $$;

update public.exercise_library
   set media_url = regexp_replace(media_url, '\.GIF', '.gif', 'gi')
 where media_url ~* '\.gif';

update public.workout_template_exercises
   set media_url = regexp_replace(media_url, '\.GIF', '.gif', 'gi')
 where media_url ~* '\.gif';

update public.workout_exercises
   set media_url = regexp_replace(media_url, '\.GIF', '.gif', 'gi')
 where media_url ~* '\.gif';

create or replace function public.publish_accqua_training_program(
  p_student_id uuid,
  p_program jsonb,
  p_routines jsonb,
  p_cardio jsonb default null::jsonb
)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'auth', 'pg_catalog'
as $function$
declare
  v_staff_id uuid := auth.uid();
  v_program_id uuid;
  v_plan_id uuid;
  v_version integer;
  v_routine jsonb;
  v_exercise jsonb;
  v_routine_position integer := 0;
  v_exercise_position integer;
  v_library_id uuid;
  v_library_raw text;
  v_group_id uuid;
  v_group_raw text;
  v_set_type text;
  v_split text := coalesce(nullif(trim(p_program->>'split_code'), ''), 'PERSONALIZADO');
  v_name text := coalesce(nullif(trim(p_program->>'name'), ''), 'Treino personalizado');
begin
  if not public.accqua_current_is_staff_v8() then
    raise exception 'Apenas a equipe autorizada pode publicar treinos.';
  end if;

  if p_student_id is null or public.accqua_effective_role_v4(p_student_id) <> 'student' then
    raise exception 'Aluno inválido.';
  end if;

  if jsonb_typeof(coalesce(p_routines, '[]'::jsonb)) <> 'array' then
    raise exception 'As rotinas do treino são inválidas.';
  end if;

  select coalesce(max(version), 0) + 1
    into v_version
    from public.workout_programs
   where student_id = p_student_id;

  update public.workout_programs
     set is_active = false, updated_at = now()
   where student_id = p_student_id and coalesce(is_active, true);

  update public.workout_plans
     set is_active = false, updated_at = now()
   where coalesce(student_id, user_id) = p_student_id
     and coalesce(is_active, true);

  insert into public.workout_programs (
    student_id, created_by, name, split_code, notes,
    review_at, version, is_active, created_at, updated_at
  ) values (
    p_student_id,
    v_staff_id,
    v_name,
    v_split,
    coalesce(p_program->>'notes', ''),
    nullif(p_program->>'review_at', '')::date,
    v_version,
    true,
    now(),
    now()
  ) returning id into v_program_id;

  for v_routine in
    select value from jsonb_array_elements(coalesce(p_routines, '[]'::jsonb))
  loop
    v_routine_position := v_routine_position + 1;

    insert into public.workout_plans (
      program_id, student_id, user_id, professor_id, created_by,
      name, focus, notes, review_at, week_days,
      routine_code, split_code, version, is_active, is_simple,
      created_at, updated_at
    ) values (
      v_program_id,
      p_student_id,
      p_student_id,
      v_staff_id,
      v_staff_id,
      coalesce(nullif(trim(v_routine->>'name'), ''), 'Treino ' || coalesce(v_routine->>'code', v_routine_position::text)),
      coalesce(v_routine->>'focus', ''),
      coalesce(p_program->>'notes', ''),
      nullif(p_program->>'review_at', '')::date,
      coalesce(
        array(
          select value::integer
          from jsonb_array_elements_text(coalesce(v_routine->'week_days', '[]'::jsonb))
          where value ~ '^[0-6]$'
        ),
        '{}'::integer[]
      ),
      coalesce(nullif(trim(v_routine->>'code'), ''), chr(64 + v_routine_position)),
      v_split,
      v_version,
      true,
      false,
      now(),
      now()
    ) returning id into v_plan_id;

    v_exercise_position := 0;

    for v_exercise in
      select value from jsonb_array_elements(coalesce(v_routine->'exercises', '[]'::jsonb))
    loop
      v_exercise_position := v_exercise_position + 1;
      v_library_id := null;
      v_library_raw := coalesce(v_exercise->>'exercise_library_id', v_exercise->>'id', '');
      v_group_id := null;
      v_group_raw := coalesce(v_exercise->>'set_group_id', '');
      v_set_type := case
        when lower(coalesce(v_exercise->>'set_type', 'normal')) in ('normal','biset','triset')
          then lower(coalesce(v_exercise->>'set_type', 'normal'))
        else 'normal'
      end;

      if v_library_raw ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
        v_library_id := v_library_raw::uuid;
      end if;

      if v_group_raw ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
        v_group_id := v_group_raw::uuid;
      end if;

      if v_set_type = 'normal' then
        v_group_id := null;
      end if;

      insert into public.workout_exercises (
        plan_id, exercise_library_id, name, muscle_group, equipment,
        media_url, media_type, sets, reps_min, reps_max,
        rest_seconds, initial_load_kg, notes, position,
        set_type, set_group_id, set_group_order,
        created_at, updated_at
      ) values (
        v_plan_id,
        v_library_id,
        coalesce(nullif(trim(v_exercise->>'name'), ''), 'Exercício'),
        coalesce(nullif(trim(v_exercise->>'muscle_group'), ''), 'Outros'),
        coalesce(v_exercise->>'equipment', ''),
        nullif(regexp_replace(trim(v_exercise->>'media_url'), '\.GIF', '.gif', 'gi'), ''),
        coalesce(nullif(trim(v_exercise->>'media_type'), ''), 'gif'),
        greatest(1, coalesce((v_exercise->>'sets')::integer, 3)),
        greatest(1, coalesce((v_exercise->>'reps_min')::integer, 10)),
        greatest(1, coalesce((v_exercise->>'reps_max')::integer, 12)),
        greatest(0, coalesce((v_exercise->>'rest_seconds')::integer, 60)),
        greatest(0, coalesce((v_exercise->>'initial_load_kg')::numeric, 0)),
        coalesce(v_exercise->>'notes', ''),
        coalesce((v_exercise->>'position')::integer, v_exercise_position),
        v_set_type,
        v_group_id,
        case when v_set_type = 'normal' then 0 else least(3, greatest(1, coalesce((v_exercise->>'set_group_order')::integer, 1))) end,
        now(),
        now()
      );
    end loop;
  end loop;

  if p_cardio is not null and jsonb_typeof(p_cardio) = 'object' then
    insert into public.workout_cardio_prescriptions (
      program_id, student_id, activity_type, timing,
      target_duration_minutes, target_speed_kmh,
      target_calories, notes, created_at, updated_at
    ) values (
      v_program_id,
      p_student_id,
      coalesce(nullif(trim(p_cardio->>'activity_type'), ''), 'treadmill'),
      coalesce(nullif(trim(p_cardio->>'timing'), ''), 'after'),
      greatest(1, coalesce((p_cardio->>'target_duration_minutes')::integer, 20)),
      greatest(0, coalesce((p_cardio->>'target_speed_kmh')::numeric, 0)),
      greatest(0, coalesce((p_cardio->>'target_calories')::integer, 0)),
      coalesce(p_cardio->>'notes', ''),
      now(),
      now()
    );
  end if;

  update public.accqua_staff_notifications
     set resolved_at = coalesce(resolved_at, now()),
         read_at = coalesce(read_at, now()),
         updated_at = now()
   where student_id = p_student_id
     and notification_type = 'workout_required'
     and resolved_at is null;

  return v_program_id;
end;
$function$;
