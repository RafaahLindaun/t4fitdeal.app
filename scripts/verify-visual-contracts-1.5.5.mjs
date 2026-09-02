import "./verify-visual-contracts-1.5.4.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const passes = [];
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const requireMatch = (id, file, pattern, note) => pattern.test(read(file)) ? passes.push(id) : failures.push(`${id} — ${note} (${file})`);
const requireAll = (id, file, patterns, note) => patterns.every((pattern) => pattern.test(read(file))) ? passes.push(id) : failures.push(`${id} — ${note} (${file})`);

const css = "scr/styles/build-1.5.5.css";
const schemaMigration = "supabase/migrations/20260901070000_build_1_5_5_workout_ai_access_and_store.sql";
const storeMigration = "supabase/migrations/20260901070200_build_1_5_5_store_soft_delete_compat.sql";
const aiFunction = "supabase/functions/generate-workout-ai-v155/index.ts";

// Contrato histórico: qualquer patch >= 1.5.5 precisa preservar a feature 1.5.5.
requireMatch("155/version", "package.json", /"version":\s*"(?:1\.5\.[3-9]|1\.(?:[6-9]|\d{2,})\.\d+)"/, "package ficou abaixo da linha 1.5.5");
requireMatch("155/contracts", "package.json", /verify-visual-contracts-(?:1\.5\.[3-9]|1\.(?:[6-9]|\d{2,})\.\d+)\.mjs/, "npm não executa a cadeia de contratos 1.5.5+");
requireMatch("155/css-order", "scr/main.tsx", /build-1\.5\.4\.css";\s*\nimport "\.\/styles\/build-1\.5\.5\.css";/, "camada 1.5.5 não vem depois da 1.5.4 na cascata");

// Entrada única e convergência no mesmo editor.
requireAll("155/method-entry", "scr/pages/WorkoutBuilderEntry.tsx", [/Montar manualmente/, /Assistente guiado/, /Modelo salvo/, /Descrever pra IA/], "faltou algum dos quatro métodos de montagem");
requireMatch("155/review-convergence", "scr/pages/WorkoutBuilderEntry.tsx", /storeWorkoutBuilderDraft[\s\S]*?navigate\(editorUrl\)/, "rascunhos não convergem no editor humano");
requireAll("155/routes", "scr/App.tsx", [/path="montar" element={<WorkoutBuilderEntry/, /path="montar\/editor" element={<AdminWorkoutBuilder/], "rota ainda pula a escolha de método");
requireAll("155/guide-tone", "scr/pages/WorkoutBuilderEntry.tsx", [/Beleza, o que o\(a\)/, /ponto de partida/i, /Quantos dias o\(a\)/], "assistente guiado voltou ao tom formal");

// IA somente usa catálogo real e nunca salva diretamente.
requireAll("155/ai-catalog", aiFunction, [/from\("exercise_library"\)/, /\.eq\("is_active",true\)/, /valid\.has\(exercise\.id\)/, /catalogValidated:true/], "IA não está ancorada/validada na Biblioteca real");
requireMatch("155/ai-no-plan-write", aiFunction, /return new Response\(JSON\.stringify\(\{programName:/, "Edge Function deixou de retornar somente rascunho");
requireMatch("155/ai-client", "scr/lib/workoutAi.ts", /generate-workout-ai-v155[\s\S]*?catalogValidated/, "cliente não exige validação do catálogo");

// Modelo com origem e acesso dinâmico.
requireMatch("155/template-origin", schemaMigration, /origin in \('manual','assistente_guiado','ia_descricao'\)/, "origem dos modelos não está versionada");
requireMatch("155/access-summary-rpc", schemaMigration, /get_accqua_access_mode_summary_v1_5_5[\s\S]*?accqua_app_access[\s\S]*?group by 1/, "resumo de acesso não é dinâmico");
requireAll("155/classes", "scr/pages/ClassesAdminV155.tsx", [/loadAccessModeSummary/, /<ClassesAdmin \/>/, /StaffPageLayout/], "Aulas perdeu wrapper/resumo real");
requireAll("155/classes-accordion", "scr/pages/ClassesAdmin.tsx", [/expandedId/, /setExpandedId/, /expandedId === type\.id/], "accordion voltou a ter fontes de verdade paralelas");

// Store soft-delete: excluído some, desativado continua semanticamente distinto.
requireMatch("155/store-column", schemaMigration, /add column if not exists excluido_em timestamptz/, "produto não tem marcador de exclusão lógica");
requireAll("155/store-soft-delete", storeMigration, [/set ativo = false,[\s\S]*?excluido_em = now\(\)/, /excluido_em is null/], "fluxo legado ainda pode hard-delete ou listar excluídos");

// Layout / mobile / modais.
requireAll("155/active-contrast", css, [/--surface-active:#1e3a5f/, /--text-on-active:#fff/, /--border-active:#f2c230/], "estados ativos perderam tokens próprios");
requireAll("155/modal-close", css, [/responsive-dialog-header[\s\S]*?gap:24px/, /accqua-modal-close-button[\s\S]*?min-width:40px/], "X de modal pode voltar a colar no título");
requireAll("155/builder-single-progress", css, [/admin-builder-context-bar,[\s\S]*?admin-builder-step-nav,[\s\S]*?display:none!important/, /admin-builder-readiness-score\{display:none!important/], "montador voltou a duplicar etapa/percentual");
requireAll("155/builder-columns-scroll", css, [/admin-builder-screen\{height:100dvh/, /admin-builder-library,[\s\S]*?admin-builder-desktop-aside[\s\S]*?overflow-y:auto!important/, /min-width:280px!important/], "3 colunas perderam scroll/min-width");
requireAll("155/builder-library-wrap", css, [/admin-builder-groups[\s\S]*?overflow-x:auto/, /white-space:normal!important/], "filtros/nomes da Biblioteca voltaram a cortar");
requireMatch("155/builder-reorder", "scr/pages/AdminWorkoutBuilder.tsx", /<Reorder\.Group[\s\S]*?<ReorderExerciseItem/, "reordenação real foi removida");
requireAll("155/mobile-diet-icons", css, [/diet-topbar-side\.is-right[\s\S]*?gap:12px/, /diet-round-button[\s\S]*?width:44px/, /diet-round-button svg[\s\S]*?width:20px/], "ícones da Dieta perderam encaixe/touch target");
requireAll("155/store-trash", css, [/store-admin-list \.accqua-swipe-desktop-delete[\s\S]*?top:-10px/, /right:-10px/], "lixeira da Loja voltou a cobrir o card");
requireAll("155/library-trash-scroll", css, [/admin-dashboard-resource-grid[\s\S]*?overflow-y:auto!important/, /admin-dashboard-resource-grid \.accqua-swipe-desktop-delete[\s\S]*?top:-9px/], "Biblioteca perdeu scroll/lixeira externa");
requireMatch("155/nav-modal", css, /body\[data-accqua-modal-open="true"\] \.accqua-main-layout-nav[\s\S]*?visibility:hidden!important/, "bottom nav pode reaparecer sobre modal");

if (failures.length) {
  console.error("\nACCQUA Build 1.5.5 — contratos FALHARAM:\n");
  failures.forEach((failure) => console.error(` - ${failure}`));
  console.error(`\n${failures.length} contrato(s) 1.5.5 quebrado(s).`);
  process.exit(1);
}
console.log(`ACCQUA Build 1.5.5 — ${passes.length} contratos validados.`);
