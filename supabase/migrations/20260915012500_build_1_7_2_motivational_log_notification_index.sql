-- ACCQUA Sports — Build 1.7.2
-- Índice de cobertura para a FK notification_id do log motivacional.

create index if not exists accqua_motivational_log_notification_idx
  on public.accqua_motivational_notification_log (notification_id);
