import "./verify-visual-contracts-1.5.2.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const passes = [];

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function requireMatch(id, file, pattern, note) {
  if (!pattern.test(read(file))) failures.push(`${id} — ${note} (${file})`);
  else passes.push(id);
}

function requireAll(id, file, patterns, note) {
  const content = read(file);
  if (!patterns.every((pattern) => pattern.test(content))) failures.push(`${id} — ${note} (${file})`);
  else passes.push(id);
}

function collectFiles(dir) {
  const absolute = path.join(root, dir);
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(dir, entry.name);
    return entry.isDirectory() ? collectFiles(relative) : [relative];
  });
}

function requireAbsentInTree(id, dir, pattern, note) {
  const found = collectFiles(dir).find((file) => pattern.test(read(file)));
  if (found) failures.push(`${id} — ${note} (${found})`);
  else passes.push(id);
}

const migration = "supabase/migrations/20260901053000_build_1_5_3_ranking_recipes_notifications.sql";
const rankingLib = "scr/lib/ranking.ts";
const rankingStudent = "scr/pages/Ranking.tsx";
const rankingStaff = "scr/pages/RankingStaff.tsx";
const storeAdmin = "scr/pages/StoreAdmin.tsx";
const recipeFn = "supabase/functions/generate-recipe-ai/index.ts";
const imageFn = "supabase/functions/validate-recipe-image/index.ts";
const notificationsLib = "scr/lib/notifications.ts";
const notificationsStaff = "scr/pages/NotificationsStaff.tsx";
const notificationBridge = "scr/components/NotificationPreferenceBridge.tsx";
const sendFn = "supabase/functions/send-staff-notification/index.ts";
const pushConfigFn = "supabase/functions/push-config/index.ts";
const serviceWorker = "public/accqua-notifications-sw.js";

// Ranking: aluno e Staff compartilham a mesma RPC mensal/cálculo.
requireMatch("S/ranking-rpc", rankingLib, /get_accqua_monthly_ranking_v1_5_3/, "Ranking deixou de usar a RPC mensal 1.5.3");
requireMatch("S/ranking-canonical", migration, /get_accqua_monthly_workout_ranking_v9_7/, "RPC 1.5.3 deixou de envolver a fonte canônica mensal");
requireMatch("S/prize-table", migration, /create table if not exists public\.ranking_premios/, "tabela de prêmio mensal não está versionada");
requireAll("S/prize-student", rankingStudent, [/Prêmio deste mês/, /workoutsToLeader/], "aluno perdeu contexto do prêmio/distância do líder");
requireAll("S/prize-staff", rankingStaff, [/Prêmio do período/, /saveRankingPrize/], "Staff perdeu editor do prêmio mensal");
requireMatch("S/race-close", rankingStaff, /Disputa acirrada/, "badge de disputa acirrada foi removido");

// Receitas: IA cria rascunho, TACO calcula macro e aprovação continua humana.
requireMatch("T/ai-entry", storeAdmin, /Criar receita com IA/, "entrada Criar receita com IA foi removida");
requireAll("T/ai-draft", storeAdmin, [/generateRecipeWithAI/, /setRecipeForm/], "IA não volta mais para o mesmo editor manual");
requireMatch("T/taco-source", recipeFn, /nepa\.unicamp\.br\/publicacoes\/tabela-taco-excel\//, "fonte oficial TACO deixou de ser usada");
requireMatch("T/no-llm-macros", recipeFn, /NÃO calcule e NÃO retorne kcal/, "LLM voltou a poder inventar macros");
requireMatch("T/taco-match-warning", recipeFn, /macrosEstimatedAi:!allMatched/, "ingrediente sem match deixou de exigir revisão");
requireAll("T/image-human-review", imageFn, [/requires_human_review:true/, /imagem_validada:false/], "imagem sugerida pela IA pode voltar aprovada automaticamente");
requireAll("T/image-replace-confirm", imageFn, [/confirmation_required/, /status:409/], "substituição de imagem aprovada perdeu confirmação");

// Notificações: público segmentado, preferência mestre, soft delete e Web Push real.
requireAll("U/staff-audiences", notificationsStaff, [/todos/, /matriculados/, /gympass/, /totalpass/], "segmentação de público ficou incompleta");
requireMatch("U/recipient-preference", migration, /coalesce\(p\.notificacoes_ativas, true\) = true/, "backend deixou de respeitar a preferência geral do aluno");
requireAll("U/master-toggle", notificationBridge, [/Notificações ativas/, /setMyNotificationsEnabled/], "Perfil perdeu o toggle geral de notificações");
requireMatch("U/ios-install", notificationBridge, /Tela de Início/, "orientação de push no iPhone foi removida");
requireMatch("U/soft-delete", notificationsLib, /excluida:\s*true/, "swipe delete deixou de ser exclusão individual/soft delete");
requireAll("U/push-subscribe", notificationsLib, [/pushManager\.subscribe/, /push_subscriptions/], "cliente deixou de registrar assinatura Web Push");
requireAll("U/sw-push", serviceWorker, [/addEventListener\("push"/, /showNotification/], "Service Worker não exibe push real");
requireMatch("U/push-send", sendFn, /webpush\.sendNotification/, "Edge Function deixou de enviar Web Push");
requireAll("U/push-expired-cleanup", sendFn, [/status === 404 \|\| status === 410/, /push_subscriptions/], "assinaturas expiradas deixaram de ser limpas");
requireMatch("U/public-vapid-only", pushConfigFn, /publicKey: row\.public_key/, "endpoint de config deixou de retornar somente chave pública");
requireAbsentInTree("U/no-private-vapid-client", "scr", /get_push_vapid_config_v1_5_3|accqua_vapid_private_1_5_3/, "chave privada/VAPID RPC apareceu no bundle React");

// PWA/iOS: push exige app instalável em standalone.
requireMatch("U/pwa-manifest", "public/manifest.webmanifest", /"display":\s*"standalone"/, "manifest deixou de ser instalável");
requireMatch("U/pwa-index", "index.html", /rel="manifest" href="\/manifest\.webmanifest"/, "manifest não está ligado ao HTML");
requireMatch("U/pwa-ios", "index.html", /apple-mobile-web-app-capable/, "metadados de instalação iOS foram removidos");

// Versionamento final.
requireMatch("VERSION/1.5.3", "package.json", /"version":\s*"1\.5\.3"/, "package ainda não está marcado como 1.5.3");
requireMatch("VERSION/css", "scr/main.tsx", /build-1\.5\.3\.css/, "camada visual 1.5.3 não está carregada");

if (failures.length) {
  console.error("\nACCQUA Build 1.5.3 — contratos FALHARAM:\n");
  for (const failure of failures) console.error(` - ${failure}`);
  console.error(`\n${failures.length} contrato(s) 1.5.3 quebrado(s).`);
  process.exit(1);
}

console.log(`ACCQUA Build 1.5.3 — ${passes.length} contratos validados.`);
