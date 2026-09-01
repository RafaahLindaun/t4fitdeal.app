-- ACCQUA Sports — Build 1.5.5
alter table public.workout_program_templates
  add column if not exists origin text not null default 'manual';
alter table public.workout_program_templates
  drop constraint if exists workout_program_templates_origin_check;
alter table public.workout_program_templates
  add constraint workout_program_templates_origin_check
  check (origin in ('manual','assistente_guiado','ia_descricao'));

alter table public.produtos
  add column if not exists excluido_em timestamptz;

create or replace function public.get_accqua_access_mode_summary_v1_5_5()
returns table(access_mode text, total bigint)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(nullif(trim(a.access_mode), ''), 'matricula') as access_mode,
         count(*)::bigint as total
  from public.accqua_app_access a
  where public.accqua_is_staff()
    and lower(coalesce(a.status,'')) in ('active','ativo','approved')
  group by 1
  order by total desc, access_mode asc;
$$;
revoke all on function public.get_accqua_access_mode_summary_v1_5_5() from public, anon;
grant execute on function public.get_accqua_access_mode_summary_v1_5_5() to authenticated, service_role;

create or replace function public.accqua_staff_soft_delete_product_v1_5_5(p_product_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.accqua_is_staff() then raise exception 'forbidden'; end if;
  update public.produtos p
     set excluido_em = now(), ativo = false, updated_at = now()
   where p.id = p_product_id and p.excluido_em is null;
  if not found then raise exception 'product_not_found'; end if;
  return jsonb_build_object('action','deleted','id',p_product_id);
end;
$$;
revoke all on function public.accqua_staff_soft_delete_product_v1_5_5(uuid) from public, anon;
grant execute on function public.accqua_staff_soft_delete_product_v1_5_5(uuid) to authenticated, service_role;
