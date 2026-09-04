-- ACCQUA Sports — Build 1.6.3
-- Login por identificador legado, fonte única de cardio e parceiros de treino.

-- Bases antigas possuem CPF/telefone com e sem máscara. A partir desta build os
-- campos canônicos ficam somente com dígitos; o campo legado telefone continua
-- compatível para cadastros antigos.
update public.profiles set cpf = regexp_replace(cpf, '\D', '', 'g') where cpf is not null;
update public.profiles set phone = regexp_replace(phone, '\D', '', 'g') where phone is not null;
update public.profiles set telefone = regexp_replace(telefone, '\D', '', 'g') where telefone is not null;

create or replace function public.resolve_accqua_login_email_v1_6_3(p_identifier text)
returns text
language plpgsql
security definer
set search_path = public, auth, pg_catalog
as $$
declare
  v_identifier text := trim(coalesce(p_identifier, ''));
  v_digits text := regexp_replace(trim(coalesce(p_identifier, '')), '\D', '', 'g');
  v_email text;
  v_count integer;
begin
  if v_identifier = '' then return null; end if;
  if position('@' in v_identifier) > 0 then
    return lower(v_identifier);
  end if;
  if length(v_digits) not between 10 and 11 then return null; end if;

  select count(*), min(lower(p.email))
    into v_count, v_email
    from public.profiles p
   where regexp_replace(coalesce(p.cpf, ''), '\D', '', 'g') = v_digits
      or regexp_replace(coalesce(p.phone, ''), '\D', '', 'g') = v_digits
      or regexp_replace(coalesce(p.telefone, ''), '\D', '', 'g') = v_digits;

  if v_count <> 1 then return null; end if;
  return nullif(v_email, '');
end;
$$;
revoke all on function public.resolve_accqua_login_email_v1_6_3(text) from public, anon, authenticated;
grant execute on function public.resolve_accqua_login_email_v1_6_3(text) to service_role;

-- Uma única fonte para qualquer resumo diário/mensal de cardio. Não cria uma
-- segunda tabela: a fonte canônica continua public.cardio_sessions.
create or replace view public.accqua_cardio_resumo_v1_6_3
with (security_invoker = true)
as
select
  coalesce(cs.student_id, cs.user_id) as student_id,
  (coalesce(cs.completed_at, cs.started_at, cs.created_at) at time zone 'America/Sao_Paulo')::date as dia,
  date_trunc('month', coalesce(cs.completed_at, cs.started_at, cs.created_at) at time zone 'America/Sao_Paulo')::date as mes,
  sum(greatest(coalesce(cs.kcal, 0), coalesce(cs.calories_burned, 0), coalesce(cs.calories, 0)))::bigint as calorias_totais,
  sum(greatest(coalesce(cs.distance_meters, 0), coalesce(cs.distance_km, 0) * 1000))::numeric as distancia_total_m,
  sum(greatest(coalesce(cs.elapsed_seconds, 0), coalesce(cs.duration_seconds, 0), coalesce(cs.minutes, 0) * 60))::bigint as duracao_total_segundos,
  count(*)::bigint as sessoes
from public.cardio_sessions cs
where coalesce(cs.student_id, cs.user_id) is not null
  and coalesce(cs.status, 'completed') not in ('cancelled', 'canceled', 'cancelado')
group by 1, 2, 3;

grant select on public.accqua_cardio_resumo_v1_6_3 to authenticated;

create or replace function public.get_accqua_cardio_stats_v1_6_3(
  p_student_id uuid default auth.uid(),
  p_period text default 'day'
)
returns table(
  calories bigint,
  distance_m numeric,
  duration_seconds bigint,
  sessions bigint
)
language plpgsql
security definer
set search_path = public, auth, pg_catalog
as $$
declare
  v_user uuid := auth.uid();
  v_period text := lower(trim(coalesce(p_period, 'day')));
begin
  if v_user is null then raise exception 'Sessão necessária.'; end if;
  if p_student_id is distinct from v_user and not public.accqua_current_is_staff_v8() then
    raise exception 'Acesso não autorizado.';
  end if;

  if v_period = 'month' then
    return query
      select coalesce(sum(r.calorias_totais),0)::bigint,
             coalesce(sum(r.distancia_total_m),0)::numeric,
             coalesce(sum(r.duracao_total_segundos),0)::bigint,
             coalesce(sum(r.sessoes),0)::bigint
        from public.accqua_cardio_resumo_v1_6_3 r
       where r.student_id = p_student_id
         and r.mes = date_trunc('month', now() at time zone 'America/Sao_Paulo')::date;
  else
    return query
      select coalesce(sum(r.calorias_totais),0)::bigint,
             coalesce(sum(r.distancia_total_m),0)::numeric,
             coalesce(sum(r.duracao_total_segundos),0)::bigint,
             coalesce(sum(r.sessoes),0)::bigint
        from public.accqua_cardio_resumo_v1_6_3 r
       where r.student_id = p_student_id
         and r.dia = (now() at time zone 'America/Sao_Paulo')::date;
  end if;
end;
$$;
grant execute on function public.get_accqua_cardio_stats_v1_6_3(uuid,text) to authenticated;

-- Convites para treinar junto. O projeto atual é uma única unidade ACCQUA, então
-- a elegibilidade é definida pelo mesmo app_access ativo, sem inventar academy_id.
create table if not exists public.accqua_training_partner_invites (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  partner_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique(sender_id, partner_id)
);
alter table public.accqua_training_partner_invites enable row level security;

drop policy if exists training_partner_invites_select on public.accqua_training_partner_invites;
create policy training_partner_invites_select on public.accqua_training_partner_invites
for select to authenticated using (auth.uid() = sender_id or auth.uid() = partner_id);

drop policy if exists training_partner_invites_insert on public.accqua_training_partner_invites;
create policy training_partner_invites_insert on public.accqua_training_partner_invites
for insert to authenticated with check (auth.uid() = sender_id and sender_id <> partner_id);

drop policy if exists training_partner_invites_update on public.accqua_training_partner_invites;
create policy training_partner_invites_update on public.accqua_training_partner_invites
for update to authenticated using (auth.uid() = sender_id or auth.uid() = partner_id)
with check (auth.uid() = sender_id or auth.uid() = partner_id);

create or replace function public.list_accqua_training_partners_v1_6_3()
returns table(
  student_id uuid,
  full_name text,
  objective text,
  avatar_url text,
  invite_status text
)
language sql
security definer
set search_path = public, auth, pg_catalog
as $$
  select p.id,
         coalesce(nullif(trim(p.full_name),''), nullif(trim(p.nome),''), 'Aluno'),
         coalesce(nullif(trim(p.objective),''), nullif(trim(p.objetivo),''), ''),
         coalesce(p.avatar_url, p.photo_url, ''),
         i.status
    from public.profiles p
    left join public.accqua_training_partner_invites i
      on i.sender_id = auth.uid() and i.partner_id = p.id
   where p.id <> auth.uid()
     and coalesce(p.role::text, 'student') = 'student'
     and exists (
       select 1 from public.accqua_app_access a
        where a.student_id = p.id
          and lower(coalesce(a.status,'')) in ('approved','active','ativo')
     )
   order by coalesce(p.full_name,p.nome,'Aluno');
$$;
grant execute on function public.list_accqua_training_partners_v1_6_3() to authenticated;

create or replace function public.create_accqua_training_partner_invite_v1_6_3(p_partner_id uuid)
returns table(invite_id uuid, notification_id uuid)
language plpgsql
security definer
set search_path = public, auth, pg_catalog
as $$
declare
  v_sender uuid := auth.uid();
  v_invite uuid;
  v_notification uuid;
  v_sender_name text;
begin
  if v_sender is null or p_partner_id is null or p_partner_id = v_sender then
    raise exception 'Convite inválido.';
  end if;
  if not exists (
    select 1 from public.accqua_app_access a
     where a.student_id = p_partner_id
       and lower(coalesce(a.status,'')) in ('approved','active','ativo')
  ) then raise exception 'Aluno indisponível.'; end if;

  insert into public.accqua_training_partner_invites(sender_id, partner_id, status, created_at, responded_at)
  values(v_sender, p_partner_id, 'pending', now(), null)
  on conflict(sender_id, partner_id) do update
    set status='pending', created_at=now(), responded_at=null
  returning id into v_invite;

  select coalesce(nullif(trim(full_name),''), nullif(trim(nome),''), 'Um aluno') into v_sender_name
    from public.profiles where id = v_sender;

  insert into public.notificacoes(titulo,mensagem,icone,publico_alvo,criado_por)
  values('Chamada pra treinar 💪', coalesce(v_sender_name,'Um aluno') || ' te chamou pra treinar junto. Bora?', 'treino', 'individual', v_sender)
  returning id into v_notification;

  insert into public.notificacoes_leitura(notificacao_id, aluno_id)
  values(v_notification, p_partner_id);

  return query select v_invite, v_notification;
end;
$$;
grant execute on function public.create_accqua_training_partner_invite_v1_6_3(uuid) to authenticated;
