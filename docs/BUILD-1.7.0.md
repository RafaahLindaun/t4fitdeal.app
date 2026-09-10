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

Não houve alteração de schema, migração ou dados do Supabase nesta revisão. Persistência real do tour, push em dispositivos Android/iPhone e fluxos autenticados de aluno/professor precisam de homologação; não foram marcados como testados.

Avisos herdados do build: chunk principal acima de 500 kB e referência a `/login-water-clean.webp` inexistente.

No Windows, o repositório contém `public/fonts/SevenSegment.` (nome incompatível) e dois GIFs que diferem apenas em maiúsculas/minúsculas. O checkout local exclui apenas a fonte via sparse checkout; alterações locais de GIF/manifest decorrentes do sistema de arquivos não fazem parte da revisão. O build Linux da Vercel é a referência para os assets completos.

Produção encontrada: 1.6.5.9 (`1eb18ea`). A revisão 1.7.0 é destinada a preview para homologação.
