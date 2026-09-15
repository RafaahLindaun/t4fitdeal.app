-- ACCQUA Sports — Build 1.7.2
-- Notificações motivacionais independentes: alimentação, hidratação e treino.

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

alter table public.accqua_profile_preferences
  add column if not exists meal_reminders boolean not null default true,
  add column if not exists hydration_reminders boolean not null default true,
  add column if not exists training_reminders boolean not null default true;

alter table public.notifications
  add column if not exists url text,
  add column if not exists category text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'notifications_motivational_category_check'
      and conrelid = 'public.notifications'::regclass
  ) then
    alter table public.notifications
      add constraint notifications_motivational_category_check
      check (category is null or category in ('alimentacao', 'hidratacao', 'treino'));
  end if;
end $$;

create table if not exists public.accqua_motivational_notification_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('alimentacao', 'hidratacao', 'treino')),
  slot_key text not null,
  message_index integer not null check (message_index >= 0),
  notification_id uuid references public.notifications(id) on delete set null,
  push_delivered integer not null default 0,
  push_failed integer not null default 0,
  sent_at timestamptz not null default now(),
  unique (user_id, category, slot_key)
);

create index if not exists accqua_motivational_log_user_category_sent_idx
  on public.accqua_motivational_notification_log (user_id, category, sent_at desc);

alter table public.accqua_motivational_notification_log enable row level security;
revoke all on public.accqua_motivational_notification_log from anon, authenticated;
grant select, insert, update, delete on public.accqua_motivational_notification_log to service_role;

create table if not exists public.accqua_motivational_cron_config (
  id boolean primary key default true check (id),
  function_url text not null,
  cron_token text not null default gen_random_uuid()::text,
  updated_at timestamptz not null default now()
);

alter table public.accqua_motivational_cron_config enable row level security;
revoke all on public.accqua_motivational_cron_config from anon, authenticated;
grant select, update on public.accqua_motivational_cron_config to service_role;

insert into public.accqua_motivational_cron_config (id, function_url)
values (
  true,
  'https://cblokyqoauftejjcqjlt.supabase.co/functions/v1/enviar-notificacoes-motivacionais'
)
on conflict (id) do update
set function_url = excluded.function_url,
    updated_at = now();

create or replace function public.run_accqua_motivational_cron_v1_7_2()
returns bigint
language plpgsql
security definer
set search_path = pg_catalog, public, net
as $$
declare
  cfg public.accqua_motivational_cron_config%rowtype;
  request_id bigint;
begin
  select * into cfg
  from public.accqua_motivational_cron_config
  where id = true;

  if cfg.function_url is null or cfg.cron_token is null then
    raise exception 'motivational_cron_not_configured';
  end if;

  select net.http_post(
    url := cfg.function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-accqua-cron-token', cfg.cron_token
    ),
    body := jsonb_build_object('triggered_at', now()),
    timeout_milliseconds := 120000
  ) into request_id;

  return request_id;
end;
$$;

revoke all on function public.run_accqua_motivational_cron_v1_7_2() from public, anon, authenticated;
grant execute on function public.run_accqua_motivational_cron_v1_7_2() to postgres, service_role;

do $$
declare
  existing_job bigint;
begin
  select jobid into existing_job
  from cron.job
  where jobname = 'accqua-motivational-notifications-v1-7-2'
  limit 1;

  if existing_job is not null then
    perform cron.unschedule(existing_job);
  end if;

  perform cron.schedule(
    'accqua-motivational-notifications-v1-7-2',
    '*/15 * * * *',
    'select public.run_accqua_motivational_cron_v1_7_2();'
  );
end $$;
