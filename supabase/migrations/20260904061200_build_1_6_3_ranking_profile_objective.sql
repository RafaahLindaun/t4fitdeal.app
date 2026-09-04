-- ACCQUA Sports — Build 1.6.3
-- Reaproveita a mesma proteção do resumo v9.7 e acrescenta apenas o objetivo.
create or replace function public.get_accqua_ranking_profile_summary_v1_6_3(p_student_id uuid)
returns table(
  student_id uuid,
  member_since timestamptz,
  age_years integer,
  total_workouts bigint,
  current_split text,
  objective text
)
language sql
stable
security definer
set search_path = public, auth, pg_catalog
as $$
  select s.student_id,
         s.member_since,
         s.age_years,
         s.total_workouts,
         s.current_split,
         coalesce(nullif(trim(p.objective),''), nullif(trim(p.objetivo),''), '')
    from public.get_accqua_ranking_profile_summary_v9_7(p_student_id) s
    join public.profiles p on p.id = s.student_id;
$$;
revoke all on function public.get_accqua_ranking_profile_summary_v1_6_3(uuid) from public, anon;
grant execute on function public.get_accqua_ranking_profile_summary_v1_6_3(uuid) to authenticated, service_role;
