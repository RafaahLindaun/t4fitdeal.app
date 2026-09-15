# ACCQUA Sports — auditoria antes das Rodadas 2–4

Base canônica auditada: `27a3e01f2ce66fb25c69a3a91489942a538b8619` (`fix: prevent student roster from trapping mouse wheel scrolling`). Esta base Production, e não a `main` posterior, é a referência da rodada.

## Resultado da auditoria antes de alterar schema

O projeto Supabase já possuía a maior parte das estruturas pedidas no documento, portanto a implementação reaproveita o modelo existente e evita tabelas paralelas:

- perfis e preferências: `profiles`, `accqua_profile_preferences` e `user_preferences`;
- liberação do app: `accqua_app_approval` e `accqua_app_access`;
- treinos: `workout_programs`, `workout_plans`, `workout_plan_days`, `workout_plan_exercises`, `workout_exercises`, sessões e logs;
- cardio prescrito: `workout_cardio_prescriptions`, incluindo `program_id`, `schedule_mode`, `week_days` e `notes`;
- biblioteca: `exercise_library` e tabelas de templates;
- parceiros: `accqua_training_partners` e RPCs de solicitar, aceitar, recusar, remover e chamar para treinar;
- push: `push_subscriptions`, central de notificações e Edge Functions de push;
- loja: `produtos`, `reservas` e `recipes`;
- onboarding/tours: estado de boas-vindas e `profiles.tours_vistos`.

## Relacionamentos e RLS

As tabelas funcionais principais já possuem foreign keys e RLS. A auditoria confirmou políticas próprias para perfil, treino, biblioteca, reservas, parceiros e push. Não foi criada nenhuma política ampla para que um aluno leia diretamente as linhas privadas de outro aluno.

Para o requisito específico “Ver treino” a partir do Ranking, foi adotada uma projeção controlada por RPC (`get_ranking_active_workout_v1_7_1`) em vez de abrir RLS das tabelas de treino. Ela retorna somente nome/divisão/exercícios do programa ativo e somente quando o próprio aluno consulta ou quando o alvo está visível no Ranking. CPF, telefone, e-mail, cargas/histórico e demais dados privados não são expostos por essa função.

## Gargalos encontrados

A análise dos advisors do Supabase encontrou dívida técnica herdada que não pertence integralmente a esta rodada:

- 34 foreign keys sem índice de cobertura;
- políticas RLS antigas com avaliação repetida de `auth.*` por linha;
- múltiplas políticas permissivas sobrepostas em algumas tabelas;
- alguns grupos de índices duplicados e índices sem uso observado;
- funções legadas `SECURITY DEFINER` com permissões mais amplas do que seria ideal;
- proteção contra senhas vazadas desabilitada no projeto Auth.

Esses pontos merecem uma rodada específica de hardening. Não foram reescritas dezenas de políticas nesta entrega para evitar regressões de autorização fora do escopo solicitado.

## Índices criados nesta rodada

Depois da auditoria, a migration `build_1_7_1_rounds_2_4_targeted_indexes` adicionou somente índices diretamente relacionados aos fluxos mapeados:

- `exercise_library(created_by)`;
- `workout_plans(professor_id)`;
- `workout_programs(created_by)`;
- `workout_sessions(plan_id)`;
- `workout_sessions(plan_day_id)`;
- `workout_template_exercises(exercise_library_id)`;
- `cardio_prescriptions(professor_id)`.

Os índices existentes, como `workout_exercises(plan_id, position)`, foram preservados sem duplicação.

## N+1 e chamadas duplicadas

- Ranking: mantém a consulta agregada já existente e o modal reutiliza cache do React Query; o novo treino do Ranking é obtido por uma única RPC controlada.
- Home: continua usando as queries/RPCs agregadas existentes; não foi introduzida consulta por card em loop.
- Montar Treino: biblioteca e estado do programa continuam carregados em lote; a agenda de cardio reutiliza RPCs existentes.
- Biblioteca: continua consultando a coleção de exercícios em lote; a correção de mídia atua sobre a URL já retornada, sem consulta adicional por item.

## Plano priorizado

1. Corrigir layout/scroll/safe-area mobile e Bottom Navigation.
2. Corrigir fluxo de publicação do treino, biblioteca, mídia e cardio prescrito.
3. Centralizar modais e corrigir Loja/Reservas/Receita IA.
4. Reativar Parceiros de forma controlada e adicionar visualização do treino pelo Ranking sem ampliar RLS.
5. Preservar onboarding, tour, prefetch, push PWA e preferências já existentes na base 1.7.0, completando apenas lacunas.
6. Em uma rodada separada, consolidar políticas RLS redundantes e revisar funções `SECURITY DEFINER` herdadas.

## Limites de validação

Build, TypeScript, contratos estáticos e testes em navegador podem validar o código web. Web Push em iPhone exige PWA instalado na Tela de Início (iOS 16.4+) e `navigator.vibrate()` não existe no iOS/Safari; esses comportamentos precisam de aparelho real e são tratados como limitações da plataforma, não como defeitos a contornar com APIs inexistentes.
