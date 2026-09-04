-- ACCQUA Sports — Build 1.6.3
-- Reutiliza a central de notificações também para convites individuais.
alter table public.notificacoes drop constraint if exists notificacoes_publico_alvo_check;
alter table public.notificacoes
  add constraint notificacoes_publico_alvo_check
  check (publico_alvo in ('todos','matriculados','gympass','totalpass','individual'));
