# ACCQUA Sports — Build 1.7.0

Base recuperada: branch `build-1.7.0`, commit `cf0ffe100fefa1fdd01bf6688bb207447eab2f6f`.

O histórico "Supabase ACCQUA Health" termina com a remoção de Parceiros e do acesso ao treino pelo Ranking. A branch já contém a rodada seguinte: onboarding paginado, tour guiado, skeletons de navegação, prefetch, estados iniciais orientados e configurações por capacidade do aparelho.

## Fechamento em 10/09/2026

- Versão do package e lockfile alinhada em 1.7.0.
- Tour: substituído `.catch()` inexistente no builder PostgREST por `await` e tratamento de erro; falhas de persistência têm feedback visível.
- Componente antigo de Parceiros convertido em export inerte, sem consultas.
- Corrigidos tipos/imports de notificações, check-in e gestão de equipe.
- Edição de produto executa as duas atualizações de estado explicitamente.
- Validação legada atualizada para a versão e os comportamentos atuais, incluindo a retirada de Parceiros.

## Validação e limites

TypeScript sem erros e 27 contratos estáticos aprovados. Esses contratos não substituem testes visuais ou testes autenticados. A compilação Vite também deve ser verificada para cada novo commit.

O commit de fechamento do frontend não alterou o Supabase. Na auditoria posterior, foi aplicada a migração `20260910062842_restrict_legacy_profile_helpers_and_ranking.sql`: remove acesso direto de clientes a dois helpers de perfil e faz a view legada de ranking respeitar o RLS do chamador. Nenhum cadastro foi alterado. O teste de regressão correspondente está em `supabase/tests/build_1_7_0_profile_privacy_verify.sql`.

Persistência real do tour, push em dispositivos Android/iPhone e fluxos completos de aluno ativo/professor precisam de homologação; não foram marcados como testados. No navegador, a conta de aluno pendente foi redirecionada para `/aguardando` ao tentar abrir `/treino` e `/area-accqua`. Não houve erros de console nos caminhos observados. Esses resultados não substituem testes de autorização diretamente na API.

Avisos herdados do build: chunk principal acima de 500 kB e referência a `/login-water-clean.webp` inexistente.

No Windows, o repositório contém `public/fonts/SevenSegment.` (nome incompatível) e dois GIFs que diferem apenas em maiúsculas/minúsculas. O checkout local exclui apenas a fonte via sparse checkout; alterações locais de GIF/manifest decorrentes do sistema de arquivos não fazem parte da revisão. O build Linux da Vercel é a referência para os assets completos.

## Publicação

Em 10/09/2026 o usuário autorizou push e promoção de builds validadas para Production como padrão de continuidade.

- Frontend publicado: commit `c41be0e74f3ec8d219cbabde4516988bf310c788`, branch `codex/build-1.7.0-validation`.
- Preview validado pela Vercel: `dpl_AiAzfRniJoWL1Q56MsMzMncCZmc7`.
- Deployment promovido: `dpl_HihBBp5jqxRhU9FaR8CqoDCBnkXK`, estado `READY`, destino `production`.
- Endereço: https://fitdeal.vercel.app.

A próxima versão está em auditoria. Isso não representa uma certificação de ausência de vulnerabilidades ou a publicação da versão 1.7.1.
