-- ACCQUA Sports — Build 1.5.4
-- O aluno vê apenas reservas ativas. Staff mantém acesso ao histórico completo.

drop policy if exists reservas_select_own_or_staff on public.reservas;

create policy reservas_select_own_or_staff
on public.reservas
for select
to authenticated
using (
  public.accqua_is_staff()
  or (aluno_id = auth.uid() and status = 'reservado')
);
