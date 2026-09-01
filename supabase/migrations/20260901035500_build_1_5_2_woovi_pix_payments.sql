begin;

create table if not exists public.pagamentos (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references public.produtos(id) on delete restrict,
  aluno_id uuid not null references auth.users(id) on delete cascade,
  reserva_id uuid not null unique references public.reservas(id) on delete restrict,
  correlation_id text not null unique,
  transaction_id text,
  br_code text,
  qr_code_image_url text,
  status text not null default 'pendente' check (status in ('pendente','pago','expirado','cancelado')),
  valor numeric(12,2) not null check (valor > 0),
  expira_em timestamptz not null,
  pago_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists pagamentos_transaction_id_unique
  on public.pagamentos(transaction_id)
  where transaction_id is not null;
create index if not exists pagamentos_aluno_created_idx on public.pagamentos(aluno_id, created_at desc);
create index if not exists pagamentos_status_expira_idx on public.pagamentos(status, expira_em);
create index if not exists pagamentos_produto_idx on public.pagamentos(produto_id);

alter table public.pagamentos enable row level security;
alter table public.pagamentos replica identity full;

revoke all on table public.pagamentos from anon, authenticated;
grant select on table public.pagamentos to authenticated;
grant all on table public.pagamentos to service_role;

create policy pagamentos_select_own_v1_5_2
  on public.pagamentos
  for select
  to authenticated
  using (aluno_id = auth.uid());

create policy pagamentos_select_staff_v1_5_2
  on public.pagamentos
  for select
  to authenticated
  using (public.accqua_is_staff());

create trigger pagamentos_touch_updated_at
before update on public.pagamentos
for each row execute function public.accqua_touch_updated_at();

create or replace function public.release_expired_pix_holds_v1_5_2(p_aluno_id uuid default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item record;
  v_count integer := 0;
begin
  for v_item in
    select p.id, p.reserva_id
    from public.pagamentos p
    where p.status = 'pendente'
      and p.expira_em <= now()
      and (p_aluno_id is null or p.aluno_id = p_aluno_id)
    for update
  loop
    update public.pagamentos
      set status = 'expirado', updated_at = now()
      where id = v_item.id and status = 'pendente';

    if found then
      update public.reservas
        set status = 'cancelado'
        where id = v_item.reserva_id and status = 'reservado';
      v_count := v_count + 1;
    end if;
  end loop;

  return v_count;
end;
$$;

create or replace function public.create_pix_payment_hold_v1_5_2(
  p_produto_id uuid,
  p_aluno_id uuid,
  p_correlation_id text,
  p_expira_em timestamptz
)
returns table (
  payment_id uuid,
  reservation_id uuid,
  product_name text,
  amount numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nome text;
  v_preco numeric;
  v_ativo boolean;
  v_stock integer;
  v_reserva_id uuid;
  v_payment_id uuid;
begin
  if p_aluno_id is null then raise exception 'student_required'; end if;
  if nullif(trim(p_correlation_id), '') is null then raise exception 'correlation_required'; end if;
  if p_expira_em <= now() then raise exception 'invalid_expiration'; end if;

  perform public.release_expired_pix_holds_v1_5_2(p_aluno_id);

  if exists (
    select 1 from public.pagamentos p
    where p.aluno_id = p_aluno_id
      and p.produto_id = p_produto_id
      and p.status = 'pendente'
      and p.expira_em > now()
  ) then
    raise exception 'payment_already_pending';
  end if;

  select nome, preco_pix, ativo, estoque_quantidade
    into v_nome, v_preco, v_ativo, v_stock
  from public.produtos
  where id = p_produto_id
  for update;

  if not found or not coalesce(v_ativo, false) then raise exception 'product_unavailable'; end if;
  if coalesce(v_stock, 0) <= 0 then raise exception 'product_out_of_stock'; end if;
  if coalesce(v_preco, 0) <= 0 then raise exception 'invalid_product_price'; end if;

  insert into public.reservas(produto_id, aluno_id, status)
  values (p_produto_id, p_aluno_id, 'reservado')
  returning id into v_reserva_id;

  insert into public.pagamentos(
    produto_id, aluno_id, reserva_id, correlation_id, status, valor, expira_em
  ) values (
    p_produto_id, p_aluno_id, v_reserva_id, trim(p_correlation_id), 'pendente', v_preco, p_expira_em
  ) returning id into v_payment_id;

  return query select v_payment_id, v_reserva_id, v_nome, v_preco;
end;
$$;

create or replace function public.finalize_pix_payment_charge_v1_5_2(
  p_correlation_id text,
  p_transaction_id text,
  p_br_code text,
  p_qr_code_image_url text,
  p_expira_em timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.pagamentos
  set transaction_id = nullif(trim(p_transaction_id), ''),
      br_code = nullif(trim(p_br_code), ''),
      qr_code_image_url = nullif(trim(p_qr_code_image_url), ''),
      expira_em = p_expira_em,
      updated_at = now()
  where correlation_id = p_correlation_id
    and status = 'pendente';

  if not found then raise exception 'payment_not_pending'; end if;
end;
$$;

create or replace function public.cancel_pix_payment_hold_v1_5_2(p_correlation_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reserva_id uuid;
begin
  update public.pagamentos
  set status = 'cancelado', updated_at = now()
  where correlation_id = p_correlation_id and status = 'pendente'
  returning reserva_id into v_reserva_id;

  if v_reserva_id is null then return false; end if;

  update public.reservas
  set status = 'cancelado'
  where id = v_reserva_id and status = 'reservado';

  return true;
end;
$$;

create or replace function public.expire_pix_payment_v1_5_2(p_correlation_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reserva_id uuid;
begin
  update public.pagamentos
  set status = 'expirado', updated_at = now()
  where correlation_id = p_correlation_id and status = 'pendente'
  returning reserva_id into v_reserva_id;

  if v_reserva_id is null then return false; end if;

  update public.reservas
  set status = 'cancelado'
  where id = v_reserva_id and status = 'reservado';

  return true;
end;
$$;

create or replace function public.complete_pix_payment_v1_5_2(
  p_correlation_id text,
  p_paid_at timestamptz default now()
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_reserva_id uuid;
begin
  select status, reserva_id into v_status, v_reserva_id
  from public.pagamentos
  where correlation_id = p_correlation_id
  for update;

  if not found then return false; end if;
  if v_status = 'pago' then return true; end if;
  if v_status <> 'pendente' then return false; end if;

  if not exists (
    select 1 from public.reservas
    where id = v_reserva_id and status = 'reservado'
  ) then
    raise exception 'payment_reservation_not_held';
  end if;

  update public.pagamentos
  set status = 'pago', pago_em = coalesce(p_paid_at, now()), updated_at = now()
  where correlation_id = p_correlation_id;

  return true;
end;
$$;

create or replace function public.accqua_pix_reservation_cancel_guard_v1_5_2()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'reservado' and new.status = 'cancelado' and exists (
    select 1
    from public.pagamentos p
    where p.reserva_id = old.id
      and p.status in ('pendente','pago')
  ) then
    raise exception 'pix_reservation_cannot_be_cancelled';
  end if;
  return new;
end;
$$;

create trigger reservas_pix_cancel_guard_v1_5_2
before update of status on public.reservas
for each row execute function public.accqua_pix_reservation_cancel_guard_v1_5_2();

revoke all on function public.release_expired_pix_holds_v1_5_2(uuid) from public, anon, authenticated;
revoke all on function public.create_pix_payment_hold_v1_5_2(uuid,uuid,text,timestamptz) from public, anon, authenticated;
revoke all on function public.finalize_pix_payment_charge_v1_5_2(text,text,text,text,timestamptz) from public, anon, authenticated;
revoke all on function public.cancel_pix_payment_hold_v1_5_2(text) from public, anon, authenticated;
revoke all on function public.expire_pix_payment_v1_5_2(text) from public, anon, authenticated;
revoke all on function public.complete_pix_payment_v1_5_2(text,timestamptz) from public, anon, authenticated;

grant execute on function public.release_expired_pix_holds_v1_5_2(uuid) to service_role;
grant execute on function public.create_pix_payment_hold_v1_5_2(uuid,uuid,text,timestamptz) to service_role;
grant execute on function public.finalize_pix_payment_charge_v1_5_2(text,text,text,text,timestamptz) to service_role;
grant execute on function public.cancel_pix_payment_hold_v1_5_2(text) to service_role;
grant execute on function public.expire_pix_payment_v1_5_2(text) to service_role;
grant execute on function public.complete_pix_payment_v1_5_2(text,timestamptz) to service_role;

comment on table public.pagamentos is 'Build 1.5.2 — cobranças Pix Woovi. Cliente só lê; criação e status passam por Edge Functions.';
comment on function public.create_pix_payment_hold_v1_5_2(uuid,uuid,text,timestamptz) is 'Reserva estoque antes de criar a cobrança externa. A trigger existente de reservas decrementa o estoque atomicamente.';
comment on function public.complete_pix_payment_v1_5_2(text,timestamptz) is 'Confirma pagamento apenas pelo backend/webhook. O estoque já está retido pela reserva criada na cobrança.';

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'pagamentos'
     ) then
    alter publication supabase_realtime add table public.pagamentos;
  end if;
end $$;

commit;
