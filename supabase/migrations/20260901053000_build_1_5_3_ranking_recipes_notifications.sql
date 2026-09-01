-- ACCQUA Sports — Build 1.5.3
-- Ranking mensal + prêmio, receitas com IA/human review e central de notificações/Web Push.

begin;

-- ---------------------------------------------------------------------------
-- Perfis / preferências globais de notificações
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists notificacoes_ativas boolean not null default true,
  add column if not exists numero_totalpass text;

-- ---------------------------------------------------------------------------
-- Receitas: metadados necessários para separar sugestão de IA de aprovação humana
-- ---------------------------------------------------------------------------
alter table public.recipes
  add column if not exists imagem_confianca numeric,
  add column if not exists imagem_fonte text,
  add column if not exists macros_estimados_ia boolean not null default false;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'recipes_imagem_confianca_check') then
    alter table public.recipes add constraint recipes_imagem_confianca_check
      check (imagem_confianca is null or (imagem_confianca >= 0 and imagem_confianca <= 1));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'recipes_imagem_fonte_check') then
    alter table public.recipes add constraint recipes_imagem_fonte_check
      check (imagem_fonte is null or imagem_fonte = any(array['upload_manual','ia_unsplash','ia_catalogo']::text[]));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Prêmio mensal do Ranking
-- ---------------------------------------------------------------------------
create table if not exists public.ranking_premios (
  id uuid primary key default gen_random_uuid(),
  periodo date not null,
  nome_premio text not null,
  descricao text,
  imagem_url text,
  criado_por uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ranking_premios_periodo_unique unique (periodo),
  constraint ranking_premios_periodo_primeiro_dia check ((date_trunc('month', periodo::timestamptz))::date = periodo)
);

alter table public.ranking_premios enable row level security;
drop policy if exists ranking_premios_select_all on public.ranking_premios;
create policy ranking_premios_select_all on public.ranking_premios
  for select to authenticated using (true);
drop policy if exists ranking_premios_write_staff on public.ranking_premios;
create policy ranking_premios_write_staff on public.ranking_premios
  for all to authenticated using (public.accqua_is_staff()) with check (public.accqua_is_staff());

create or replace function public.get_accqua_monthly_ranking_v1_5_3()
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
  treinos_para_lider bigint
)
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  with base as (
    select * from public.get_accqua_monthly_workout_ranking_v9_7()
  ), ranked as (
    select
      b.*,
      rank() over (
        order by b.monthly_workout_count desc,
                 b.last_activity_date asc nulls last,
                 b.first_name asc
      ) as posicao,
      max(b.monthly_workout_count) over () - b.monthly_workout_count as treinos_para_lider
    from base b
  )
  select * from ranked order by posicao, first_name;
$$;

revoke all on function public.get_accqua_monthly_ranking_v1_5_3() from public, anon;
grant execute on function public.get_accqua_monthly_ranking_v1_5_3() to authenticated, service_role;

insert into storage.buckets (id, name, public)
values ('premios-ranking', 'premios-ranking', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists premios_ranking_staff_insert on storage.objects;
create policy premios_ranking_staff_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'premios-ranking' and public.accqua_is_staff());

drop policy if exists premios_ranking_staff_update on storage.objects;
create policy premios_ranking_staff_update on storage.objects
  for update to authenticated
  using (bucket_id = 'premios-ranking' and public.accqua_is_staff())
  with check (bucket_id = 'premios-ranking' and public.accqua_is_staff());

drop policy if exists premios_ranking_staff_delete on storage.objects;
create policy premios_ranking_staff_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'premios-ranking' and public.accqua_is_staff());

-- ---------------------------------------------------------------------------
-- Central de notificações
-- ---------------------------------------------------------------------------
create table if not exists public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (char_length(titulo) between 1 and 60),
  mensagem text not null check (char_length(mensagem) between 1 and 200),
  icone text not null check (icone = any(array['megafone','treino','pagamento','presente','alerta','conquista']::text[])),
  publico_alvo text not null check (publico_alvo = any(array['todos','matriculados','gympass','totalpass']::text[])),
  criado_por uuid references auth.users(id),
  enviado_em timestamptz not null default now(),
  ativo boolean not null default true
);

create table if not exists public.notificacoes_leitura (
  id uuid primary key default gen_random_uuid(),
  notificacao_id uuid not null references public.notificacoes(id) on delete cascade,
  aluno_id uuid not null references auth.users(id) on delete cascade,
  lida boolean not null default false,
  lida_em timestamptz,
  excluida boolean not null default false,
  excluida_em timestamptz,
  constraint notificacoes_leitura_unique unique (notificacao_id, aluno_id)
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth_key text not null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint push_subscriptions_user_endpoint_unique unique (aluno_id, endpoint)
);

create index if not exists notificacoes_leitura_aluno_unread_idx
  on public.notificacoes_leitura (aluno_id, lida, excluida);
create index if not exists notificacoes_enviado_em_idx
  on public.notificacoes (enviado_em desc);
create index if not exists push_subscriptions_aluno_idx
  on public.push_subscriptions (aluno_id);

alter table public.notificacoes enable row level security;
alter table public.notificacoes_leitura enable row level security;
alter table public.push_subscriptions enable row level security;

drop policy if exists notificacoes_select_recipient_or_staff on public.notificacoes;
create policy notificacoes_select_recipient_or_staff on public.notificacoes
  for select to authenticated
  using (
    public.accqua_is_staff()
    or exists (
      select 1 from public.notificacoes_leitura nl
      where nl.notificacao_id = notificacoes.id
        and nl.aluno_id = auth.uid()
        and nl.excluida = false
    )
  );

drop policy if exists notificacoes_staff_manage on public.notificacoes;
create policy notificacoes_staff_manage on public.notificacoes
  for all to authenticated
  using (public.accqua_is_staff())
  with check (public.accqua_is_staff());

drop policy if exists notificacoes_leitura_own_select on public.notificacoes_leitura;
create policy notificacoes_leitura_own_select on public.notificacoes_leitura
  for select to authenticated
  using (aluno_id = auth.uid() or public.accqua_is_staff());

drop policy if exists notificacoes_leitura_own_update on public.notificacoes_leitura;
create policy notificacoes_leitura_own_update on public.notificacoes_leitura
  for update to authenticated
  using (aluno_id = auth.uid())
  with check (aluno_id = auth.uid());

drop policy if exists push_subscriptions_own_select on public.push_subscriptions;
create policy push_subscriptions_own_select on public.push_subscriptions
  for select to authenticated using (aluno_id = auth.uid());
drop policy if exists push_subscriptions_own_insert on public.push_subscriptions;
create policy push_subscriptions_own_insert on public.push_subscriptions
  for insert to authenticated with check (aluno_id = auth.uid());
drop policy if exists push_subscriptions_own_update on public.push_subscriptions;
create policy push_subscriptions_own_update on public.push_subscriptions
  for update to authenticated using (aluno_id = auth.uid()) with check (aluno_id = auth.uid());
drop policy if exists push_subscriptions_own_delete on public.push_subscriptions;
create policy push_subscriptions_own_delete on public.push_subscriptions
  for delete to authenticated using (aluno_id = auth.uid());

create or replace function public.resolve_notification_recipients_v1_5_3(p_publico text)
returns table(aluno_id uuid)
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select p.id
  from public.profiles p
  where p.role = 'student'::public.app_role
    and coalesce(p.notificacoes_ativas, true) = true
    and (
      p_publico = 'todos'
      or (p_publico = 'matriculados' and p.matricula_valida_ate >= current_date)
      or (p_publico = 'gympass' and nullif(trim(coalesce(p.numero_gympass, '')), '') is not null)
      or (p_publico = 'totalpass' and nullif(trim(coalesce(p.numero_totalpass, '')), '') is not null)
    );
$$;

revoke all on function public.resolve_notification_recipients_v1_5_3(text) from public, anon, authenticated;
grant execute on function public.resolve_notification_recipients_v1_5_3(text) to service_role;

create or replace function public.get_my_notifications_active_v1_5_3()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select coalesce((select p.notificacoes_ativas from public.profiles p where p.id = auth.uid()), true);
$$;

revoke all on function public.get_my_notifications_active_v1_5_3() from public, anon;
grant execute on function public.get_my_notifications_active_v1_5_3() to authenticated, service_role;

create or replace function public.set_my_notifications_active_v1_5_3(p_enabled boolean)
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  update public.profiles
  set notificacoes_ativas = coalesce(p_enabled, false), updated_at = now()
  where id = auth.uid();
  return found;
end;
$$;

revoke all on function public.set_my_notifications_active_v1_5_3(boolean) from public, anon;
grant execute on function public.set_my_notifications_active_v1_5_3(boolean) to authenticated, service_role;

-- VAPID: apenas o service_role pode ler a chave privada. As chaves são criadas
-- fora da migration e armazenadas no Supabase Vault com estes nomes estáveis.
create or replace function public.get_push_vapid_config_v1_5_3()
returns table(public_key text, private_key text)
language sql
stable
security definer
set search_path = public, vault, pg_temp
as $$
  select
    (select decrypted_secret from vault.decrypted_secrets where name = 'accqua_vapid_public_1_5_3' order by created_at desc limit 1),
    (select decrypted_secret from vault.decrypted_secrets where name = 'accqua_vapid_private_1_5_3' order by created_at desc limit 1);
$$;

revoke all on function public.get_push_vapid_config_v1_5_3() from public, anon, authenticated;
grant execute on function public.get_push_vapid_config_v1_5_3() to service_role;

create or replace function public.get_push_vapid_public_v1_5_3()
returns text
language sql
stable
security definer
set search_path = public, vault, pg_temp
as $$
  select decrypted_secret
  from vault.decrypted_secrets
  where name = 'accqua_vapid_public_1_5_3'
  order by created_at desc
  limit 1;
$$;

revoke all on function public.get_push_vapid_public_v1_5_3() from public, anon;
grant execute on function public.get_push_vapid_public_v1_5_3() to authenticated, service_role;

commit;
