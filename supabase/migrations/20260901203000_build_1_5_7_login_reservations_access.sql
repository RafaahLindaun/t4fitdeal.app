-- ACCQUA Sports Build 1.5.7
update public.profiles
set cpf = regexp_replace(cpf, '\D', '', 'g')
where cpf is not null and cpf <> regexp_replace(cpf, '\D', '', 'g');

update public.profiles
set phone = regexp_replace(phone, '\D', '', 'g')
where phone is not null and phone <> regexp_replace(phone, '\D', '', 'g');

drop policy if exists reservas_select_own_or_staff on public.reservas;
create policy reservas_select_own_or_staff
on public.reservas for select to authenticated
using (public.accqua_is_staff() or aluno_id = auth.uid());

create or replace function public.delete_my_cancelled_reservation_v1_5_7(p_reserva_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_catalog
as $$
declare v_deleted uuid;
begin
  if auth.uid() is null then raise exception 'unauthorized'; end if;
  delete from public.reservas
  where id = p_reserva_id
    and aluno_id = auth.uid()
    and lower(coalesce(status, '')) = 'cancelado'
  returning id into v_deleted;
  return v_deleted is not null;
end;
$$;
revoke all on function public.delete_my_cancelled_reservation_v1_5_7(uuid) from public, anon;
grant execute on function public.delete_my_cancelled_reservation_v1_5_7(uuid) to authenticated;

create or replace function public.get_accqua_access_mode_summary_v1_5_5()
returns table(access_mode text, total bigint)
language sql
stable
security definer
set search_path = public, auth, pg_catalog
as $$
  with approved_students as (
    select p.id,
      case
        when nullif(trim(p.numero_totalpass), '') is not null then 'totalpass'
        when nullif(trim(p.numero_gympass), '') is not null then 'gympass'
        when lower(coalesce(nullif(trim(p.access_mode), ''), '')) not in (
          '', 'pending', 'pendente', 'active', 'ativo', 'approved', 'aprovado',
          'blocked', 'bloqueado', 'inactive', 'inativo'
        ) then lower(trim(p.access_mode))
        else 'matricula'
      end as resolved_mode
    from public.profiles p
    join public.accqua_app_approval aa on aa.user_id = p.id
    where public.accqua_is_staff()
      and lower(coalesce(p.role::text, 'student')) = 'student'
      and lower(coalesce(aa.status, '')) in ('approved', 'active', 'ativo')
  )
  select resolved_mode as access_mode, count(*)::bigint as total
  from approved_students
  group by resolved_mode
  order by total desc, resolved_mode asc;
$$;
revoke all on function public.get_accqua_access_mode_summary_v1_5_5() from public, anon;
grant execute on function public.get_accqua_access_mode_summary_v1_5_5() to authenticated;
