# ACCQUA Sports — Product readiness audit

Atualizado após a Build 1.4.8.

## Estado atual

O aplicativo já é um beta operacional avançado: os fluxos centrais de autenticação/aprovação, Treino, Cardio, Aulas, Dieta, Perfil, Loja e Área ACCQUA estão integrados; CI executa instalação limpa, TypeScript, build de produção e teste SQL de Aulas. A próxima etapa deve priorizar confiabilidade, segurança e operação, não novas telas.

## P0 — antes de considerar produção madura

1. **Consolidar segurança do Supabase**
   - revisar todos os RPCs `SECURITY DEFINER` e revogar `EXECUTE` de `anon`/roles que não precisam chamar a função;
   - corrigir a view `accqua_ranking_v8_5` sinalizada como security-definer;
   - decidir e documentar as policies de `cardio_live_state`, que hoje está com RLS ligado e sem policy;
   - fixar `search_path` nas funções restantes sinalizadas pelos advisors;
   - habilitar proteção contra senhas vazadas no Supabase Auth.

2. **Corrigir login por CPF/telefone**
   - o frontend ainda consulta `profiles` antes da autenticação para converter CPF/telefone em e-mail;
   - substituir por endpoint/RPC específico, rate-limited e sem expor o endereço de e-mail associado ao documento/telefone.

3. **Proteger a branch `main`**
   - exigir Pull Request;
   - exigir o check `ACCQUA CI` verde;
   - bloquear push/merge acidental sem validação.

4. **Reproduzir o banco por migrations**
   - o repositório contém somente migrations incrementais recentes (1.4.6 e 1.4.7), não um baseline completo do schema atual;
   - gerar baseline versionado de tabelas, funções, triggers, RLS, grants, storage e índices;
   - validar reconstrução em um projeto Supabase de staging vazio.

## P1 — QA e operação

1. **Testes E2E reais**
   - `package.json` aponta para `playwright.visual.config.ts` e `playwright.real.config.ts`, mas esses arquivos ainda não existem no repositório;
   - criar testes para login, aprovação, publicação/execução de treino, Cardio, reserva de Aulas, Dieta, Loja e permissões Staff.

2. **Lint obrigatório**
   - existe `eslint.config.js`, mas não existe script/dependências de lint reproduzíveis no `package.json`;
   - adicionar `npm run lint` e torná-lo obrigatório no CI.

3. **Observabilidade**
   - adicionar captura de erros frontend/backend, release/version tag, breadcrumbs e alertas;
   - registrar falhas de RPC e sincronização sem armazenar dados pessoais desnecessários.

4. **Staging e rollback**
   - separar ambiente Supabase/Vercel de staging do ambiente real;
   - migrations passam primeiro por staging;
   - documentar rollback de banco e deploy.

5. **Backups e recuperação**
   - conferir política de backup do Supabase;
   - testar restauração;
   - definir quais dados podem ser reconstruídos e quais são históricos canônicos.

## P2 — banco e performance

Os advisors do Supabase apontam dívida técnica acumulada por várias gerações de schema:

- várias policies RLS duplicadas/permissivas para a mesma operação;
- muitas policies recalculando `auth.uid()` por linha em vez de `(select auth.uid())`;
- diversas foreign keys sem índice de suporte;
- índices idênticos/duplicados em `accqua_activity_history`, `workout_sessions`, `cardio_sessions`, `hydration_daily` e outras tabelas;
- vários índices antigos aparentemente sem uso.

Esses ajustes devem ser feitos por migration e medidos antes/depois, sem apagar policies/índices apenas porque o advisor os marcou.

## P2 — arquitetura frontend

1. Consolidar os arquivos CSS `build-1.4.5-hardening.css`, `build-1.4.6.css`, `build-1.4.7.css` e `build-1.4.8.css` em componentes/tokens definitivos depois que a interface estabilizar.
2. Dividir os maiores módulos Staff/Admin em componentes e hooks menores.
3. Definir orçamento de bundle e rodar Lighthouse em mobile real.
4. Remover o `.env` rastreado do tree atual; manter apenas `.env.example`. A anon/publishable key pode existir no frontend, mas o padrão de versionamento deve impedir futuros segredos no Git.

## P2 — produto, marca e conformidade

1. Migrar de `fitdeal.vercel.app` para domínio oficial ACCQUA e atualizar OAuth/redirects/Supabase.
2. Criar Política de Privacidade, Termos de Uso, consentimentos e fluxo de exclusão/exportação alinhado à LGPD, pois o app processa CPF, telefone, dados de treino, dieta e histórico do aluno.
3. Definir retenção de históricos, fotos de refeições/avatar e logs administrativos.
4. Revisar acessibilidade: teclado, leitor de tela, contraste, reduced-motion e aparelhos/fontes ampliadas.

## P3 — produto depois da estabilização

- Evolução/Ganhos usando os dados já coletados de volume, kcal, frequência, Cardio e treino;
- push notifications completas e preferências por tipo;
- métricas administrativas de retenção/adesão;
- integrações de check-in mais profundas quando Wellhub/Gympass oferecerem fluxo permitido;
- pagamentos apenas quando o modelo comercial estiver definido.

## Critério proposto para “produto pronto”

O ACCQUA deve ser tratado como pronto para produção madura quando: P0 estiver zerado; CI incluir lint + E2E; banco puder ser reconstruído em staging; fluxos críticos tiverem testes automatizados; monitoramento/rollback estiverem ativos; e a auditoria de segurança do Supabase não apresentar findings críticos de autorização.
