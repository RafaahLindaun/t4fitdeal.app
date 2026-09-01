create or replace function public.accqua_staff_delete_product_v1_3_6(p_product_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_catalog
as $$
declare
  v_reservations integer := 0;
begin
  if not public.accqua_is_staff() then
    raise exception 'Apenas a equipe autorizada pode excluir produtos.';
  end if;

  select count(*)::integer into v_reservations
  from public.reservas
  where produto_id = p_product_id;

  update public.produtos
     set ativo = false,
         excluido_em = now(),
         updated_at = now()
   where id = p_product_id
     and excluido_em is null;

  if not found then raise exception 'Produto não encontrado.'; end if;
  return jsonb_build_object('action','deleted','reservations',v_reservations);
end;
$$;

drop policy if exists produtos_select_all on public.produtos;
create policy produtos_select_all
on public.produtos
for select
to authenticated
using (
  excluido_em is null
  and (
    ativo = true
    or public.accqua_is_staff()
    or exists (
      select 1 from public.reservas r
      where r.produto_id = produtos.id
        and r.aluno_id = auth.uid()
    )
  )
);
