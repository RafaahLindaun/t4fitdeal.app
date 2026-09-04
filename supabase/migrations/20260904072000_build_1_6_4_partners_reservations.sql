-- ACCQUA Sports — Build 1.6.4
-- Parceiros passam a ser uma conexão bilateral (pedido -> aceite) e a chamada
-- para treino vira uma ação separada. Reservas ganham exclusão real para Staff.

create or replace function public.list_accqua_training_partners_v1_6_4()
returns table(
  student_id uuid,
  full_name text,
  objective text,
  avatar_url text,
  relation_id uuid,
  relation_status text,
  relation_direction text
)
language sql
security definer
set search_path = public, auth, pg_catalog
as $$
  select
    p.id,
    coalesce(nullif(trim(p.full_name),''), nullif(trim(p.nome),''), 'Aluno'),
    coalesce(nullif(trim(p.objective),''), nullif(trim(p.objetivo),''), ''),
    coalesce(p.avatar_url, p.photo_url, ''),
    rel.id,
    case
      when rel.status = 'accepted' then 'accepted'
      when rel.status = 'pending' and rel.sender_id = auth.uid() then 'outgoing_pending'
      when rel.status = 'pending' and rel.partner_id = auth.uid() then 'incoming_pending'
      when rel.status = 'declined' then 'declined'
      else ''
    end,
    case
      when rel.sender_id = auth.uid() then 'outgoing'
      when rel.partner_id = auth.uid() then 'incoming'
      else ''
    end
  from public.profiles p
  left join lateral (
    select i.*
    from public.accqua_training_partner_invites i
    where (i.sender_id = auth.uid() and i.partner_id = p.id)
       or (i.sender_id = p.id and i.partner_id = auth.uid())
    order by
      case i.status when 'accepted' then 0 when 'pending' then 1 else 2 end,
      i.created_at desc
    limit 1
  ) rel on true
  where p.id <> auth.uid()
    and coalesce(p.role::text, 'student') = 'student'
    and exists (
      select 1
      from public.accqua_app_access a
      where a.student_id = p.id
        and lower(coalesce(a.status,'')) in ('approved','active','ativo')
    )
  order by
    case when rel.status = 'accepted' then 0 when rel.status = 'pending' then 1 else 2 end,
    coalesce(p.full_name,p.nome,'Aluno');
$$;
revoke all on function public.list_accqua_training_partners_v1_6_4() from public, anon;
grant execute on function public.list_accqua_training_partners_v1_6_4() to authenticated;

create or replace function public.request_accqua_training_partner_v1_6_4(p_partner_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_catalog
as $$
declare
  v_user uuid := auth.uid();
  v_existing public.accqua_training_partner_invites%rowtype;
  v_id uuid;
  v_notification uuid;
  v_name text;
begin
  if v_user is null then raise exception 'Sessão necessária.'; end if;
  if p_partner_id is null or p_partner_id = v_user then raise exception 'Parceiro inválido.'; end if;
  if not exists (
    select 1 from public.accqua_app_access a
    where a.student_id = p_partner_id
      and lower(coalesce(a.status,'')) in ('approved','active','ativo')
  ) then raise exception 'Aluno indisponível.'; end if;

  select * into v_existing
  from public.accqua_training_partner_invites i
  where (i.sender_id = v_user and i.partner_id = p_partner_id)
     or (i.sender_id = p_partner_id and i.partner_id = v_user)
  order by case i.status when 'accepted' then 0 when 'pending' then 1 else 2 end, i.created_at desc
  limit 1;

  if v_existing.id is not null and v_existing.status = 'accepted' then
    return v_existing.id;
  end if;

  if v_existing.id is not null and v_existing.status = 'pending' then
    return v_existing.id;
  end if;

  if v_existing.id is not null then
    update public.accqua_training_partner_invites
       set sender_id = v_user,
           partner_id = p_partner_id,
           status = 'pending',
           created_at = now(),
           responded_at = null
     where id = v_existing.id
     returning id into v_id;
  else
    insert into public.accqua_training_partner_invites(sender_id, partner_id, status)
    values(v_user, p_partner_id, 'pending')
    returning id into v_id;
  end if;

  select coalesce(nullif(trim(full_name),''), nullif(trim(nome),''), 'Um aluno')
    into v_name from public.profiles where id = v_user;

  insert into public.notificacoes(titulo,mensagem,icone,publico_alvo,criado_por)
  values('Novo parceiro de treino', coalesce(v_name,'Um aluno') || ' quer adicionar você como parceiro de treino.', 'treino', 'individual', v_user)
  returning id into v_notification;

  insert into public.notificacoes_leitura(notificacao_id, aluno_id)
  values(v_notification, p_partner_id)
  on conflict do nothing;

  return v_id;
end;
$$;
revoke all on function public.request_accqua_training_partner_v1_6_4(uuid) from public, anon;
grant execute on function public.request_accqua_training_partner_v1_6_4(uuid) to authenticated;

create or replace function public.respond_accqua_training_partner_v1_6_4(p_relation_id uuid, p_accept boolean)
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_catalog
as $$
declare
  v_user uuid := auth.uid();
  v_sender uuid;
  v_notification uuid;
  v_name text;
begin
  if v_user is null then raise exception 'Sessão necessária.'; end if;

  update public.accqua_training_partner_invites
     set status = case when p_accept then 'accepted' else 'declined' end,
         responded_at = now()
   where id = p_relation_id
     and partner_id = v_user
     and status = 'pending'
   returning sender_id into v_sender;

  if v_sender is null then return false; end if;

  select coalesce(nullif(trim(full_name),''), nullif(trim(nome),''), 'Um aluno')
    into v_name from public.profiles where id = v_user;

  insert into public.notificacoes(titulo,mensagem,icone,publico_alvo,criado_por)
  values(
    case when p_accept then 'Parceiro confirmado 💪' else 'Pedido de parceiro atualizado' end,
    case when p_accept
      then coalesce(v_name,'Um aluno') || ' aceitou ser seu parceiro de treino.'
      else coalesce(v_name,'Um aluno') || ' não aceitou o pedido de parceiro agora.'
    end,
    'treino', 'individual', v_user
  ) returning id into v_notification;

  insert into public.notificacoes_leitura(notificacao_id, aluno_id)
  values(v_notification, v_sender)
  on conflict do nothing;

  return true;
end;
$$;
revoke all on function public.respond_accqua_training_partner_v1_6_4(uuid,boolean) from public, anon;
grant execute on function public.respond_accqua_training_partner_v1_6_4(uuid,boolean) to authenticated;

create or replace function public.call_accqua_training_partner_v1_6_4(p_partner_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_catalog
as $$
declare
  v_user uuid := auth.uid();
  v_notification uuid;
  v_name text;
begin
  if v_user is null then raise exception 'Sessão necessária.'; end if;
  if not exists (
    select 1 from public.accqua_training_partner_invites i
    where i.status = 'accepted'
      and ((i.sender_id = v_user and i.partner_id = p_partner_id)
        or (i.sender_id = p_partner_id and i.partner_id = v_user))
  ) then raise exception 'Vocês ainda não são parceiros de treino.'; end if;

  select coalesce(nullif(trim(full_name),''), nullif(trim(nome),''), 'Seu parceiro')
    into v_name from public.profiles where id = v_user;

  insert into public.notificacoes(titulo,mensagem,icone,publico_alvo,criado_por)
  values('Bora treinar? 💪', coalesce(v_name,'Seu parceiro') || ' te chamou para treinar hoje.', 'treino', 'individual', v_user)
  returning id into v_notification;

  insert into public.notificacoes_leitura(notificacao_id, aluno_id)
  values(v_notification, p_partner_id)
  on conflict do nothing;

  return v_notification;
end;
$$;
revoke all on function public.call_accqua_training_partner_v1_6_4(uuid) from public, anon;
grant execute on function public.call_accqua_training_partner_v1_6_4(uuid) to authenticated;

create or replace function public.staff_delete_reservation_v1_6_4(
  p_reserva_id uuid,
  p_allow_retirado boolean default false
)
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_catalog
as $$
declare
  v_status text;
  v_deleted uuid;
begin
  if auth.uid() is null or not public.accqua_current_is_staff_v8() then
    raise exception 'Acesso não autorizado.';
  end if;

  select lower(coalesce(status,'')) into v_status
  from public.reservas where id = p_reserva_id;

  if v_status = '' then return false; end if;
  if v_status = 'retirado' and not p_allow_retirado then
    raise exception 'Reserva já retirada. Confirme a exclusão definitiva.';
  end if;

  delete from public.reservas where id = p_reserva_id returning id into v_deleted;
  return v_deleted is not null;
end;
$$;
revoke all on function public.staff_delete_reservation_v1_6_4(uuid,boolean) from public, anon;
grant execute on function public.staff_delete_reservation_v1_6_4(uuid,boolean) to authenticated;
