import "./verify-visual-contracts-1.5.5.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const passes = [];
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const requireMatch = (id, file, pattern, note) => pattern.test(read(file)) ? passes.push(id) : failures.push(`${id} — ${note} (${file})`);
const requireAll = (id, file, patterns, note) => patterns.every((pattern) => pattern.test(read(file))) ? passes.push(id) : failures.push(`${id} — ${note} (${file})`);
const requireAbsent = (id, file, pattern, note) => !pattern.test(read(file)) ? passes.push(id) : failures.push(`${id} — ${note} (${file})`);

const css = "scr/styles/build-1.5.6.css";
const migration = "supabase/migrations/20260901073000_build_1_5_6_ranking_days_and_cardio_stats.sql";
const recipeFn = "supabase/functions/generate-recipe-ai/index.ts";

requireMatch("156/version", "package.json", /"version":\s*"1\.5\.(?:[6-9]|\d{2,})"/, "package ficou abaixo de 1.5.6");
requireMatch("156/contracts", "package.json", /verify-visual-contracts-1\.5\.(?:6|7)\.mjs/, "npm não preserva contratos 1.5.6+");
requireMatch("156/css", "scr/main.tsx", /build-1\.5\.6\.css/, "camada 1.5.6 não está carregada");

requireAll("156/sidebar-flex", css, [/\.accqua-staff-layout\s*\{[\s\S]*?display:\s*flex\s*!important/, /is-sidebar-collapsed[\s\S]*?72px\s*!important/, /\.accqua-staff-content\s*\{[\s\S]*?flex:\s*1 1 auto/], "sidebar voltou a compartilhar grid/reflow com conteúdo");
requireAll("156/staff-new-scroll", "scr/components/StaffLayout.tsx", [/"ranking"/, /"notifications"/, /usesDocumentScroll/], "Ranking/Notificações não usam o scroll compartilhado do Staff");
requireAll("156/staff-scroll-css", css, [/uses-document-scroll \.accqua-staff-content[\s\S]*?overflow-y:\s*auto/, /ranking-staff-page/, /notifications-staff-page/], "páginas Staff novas podem voltar a travar scroll");
requireAll("156/active-contrast", css, [/admin-area-filters button\.is-active/, /--surface-active/, /--text-on-active/, /--border-active/], "chips/cards ativos perderam contraste próprio");
requireMatch("156/training-subtitle", css, /admin-training-action small[\s\S]*?color:\s*var\(--text-secondary\)/, "subtítulos do montar treino podem herdar azul");

requireAll("156/ranking-one-day", migration, [/get_accqua_monthly_ranking_v1_5_6/, /count\(distinct workout_day\)/, /r\.dias_treinados as monthly_workout_count/], "ranking ainda pode contar sessões repetidas no mesmo dia");
requireAll("156/ranking-backing", migration, [/matricula_valida_ate\s*>?=\s*w\.workout_day/, /public\.reservas_aula/, /lower\(coalesce\(ra\.status,''\)\)='presente'/], "dia do ranking não exige matrícula/presença");
requireAll("156/ranking-source", "scr/lib/ranking.ts", [/get_accqua_monthly_ranking_v1_5_6/, /dias_para_lider/, /daysToLeader/], "frontend não usa a RPC 1.5.6");
requireAll("156/ranking-copy-student", "scr/pages/Ranking.tsx", [/Dias treinados do mês/, /dia\{entry\.points === 1/, /entry\.daysToLeader/, /Treinos feitos/], "Ranking do aluno mistura dias treinados com total bruto");
requireAll("156/ranking-copy-staff", "scr/pages/RankingStaff.tsx", [/dias treinados/i, /entry\.daysToLeader/, /mesma RPC de dias treinados/], "Staff usa métrica/texto diferente do aluno");
requireAll("156/ranking-desktop-header", css, [/ranking-header-logo\s*\{\s*display:\s*none\s*!important/, /ranking-header-actions[\s\S]*?position:\s*static\s*!important/], "logo/ações do Ranking podem se sobrepor no desktop");

requireAll("156/cardio-rpc", migration, [/get_accqua_cardio_stats_v1_5_6/, /p_period text/, /'day','month'/, /public\.cardio_sessions/], "resumo canônico de cardio não está versionado");
requireAll("156/cardio-client", "scr/lib/cardioStats.ts", [/get_accqua_cardio_stats_v1_5_6/, /CardioStatsPeriod = "day" \| "month"/], "cliente não expõe fonte única de cardio");
requireAll("156/cardio-hook", "scr/hooks/useCardioStats.ts", [/cardio-stats/, /loadCardioStats/], "hook compartilhado de cardio ausente");
requireMatch("156/diet-cardio", "scr/lib/calorieSources.ts", /loadCardioStats\(userId, "day", date\)/, "Minha Dieta voltou a recalcular cardio isoladamente");
requireAll("156/cardio-caption", css, [/cardio-activity-card > small[\s\S]*?position:\s*absolute/, /linear-gradient\(to top, rgba\(0,0,0,\.78\)/], "legenda do tipo de cardio continua sem overlay legível");

requireMatch("156/taco-xlsx", recipeFn, /arquivo\/uploads\/taco-4a-edicao\/taco-4a-edicao-2\//, "IA de receita ainda aponta para página HTML da TACO");
requireAbsent("156/no-taco-page", recipeFn, /publicacoes\/tabela-taco-excel/, "URL HTML antiga da TACO reapareceu");
requireAll("156/taco-guard", recipeFn, [/looksLikeWorkbook/, /taco_invalid_workbook/, /XLSX\.read/], "workbook TACO é parseado sem validação");
requireAll("156/recipe-error", "scr/lib/store.ts", [/edgeFunctionMessage/, /Não foi possível gerar a receita agora\. Tente novamente\./], "Staff ainda pode ver erro cru/non-2xx da Edge Function");
requireAll("156/recipe-buttons", css, [/recipe-create-actions > button:first-child[\s\S]*?height:\s*40px/, /recipe-ai-create-button[\s\S]*?height:\s*40px/, /recipe-ai-create-button svg[\s\S]*?width:\s*18px/], "botões Nova/IA continuam com geometria inconsistente");

requireAll("156/builder-scroll", css, [/\.admin-builder-shell\s*\{[\s\S]*?overflow-y:\s*auto\s*!important/, /admin-builder-library,[\s\S]*?admin-builder-desktop-aside[\s\S]*?overflow-y:\s*auto\s*!important/], "montador de 3 colunas ainda pode travar o centro/laterais");
requireAll("156/builder-library", css, [/admin-builder-library[\s\S]*?min-width:\s*280px/, /admin-builder-groups[\s\S]*?overflow-x:\s*auto/, /white-space:\s*normal\s*!important/], "Biblioteca voltou a cortar filtros/nomes");
requireAll("156/method-entry", "scr/pages/WorkoutBuilderEntry.tsx", [/Montar manualmente/, /Assistente guiado/, /Modelo salvo/, /Descrever pra IA/, /Nenhum treino é publicado sem sua revisão/], "entrada única/4 métodos foi perdida");
requireAll("156/guide-tone", "scr/pages/WorkoutBuilderEntry.tsx", [/Beleza, o que o\(a\)/, /Sem frescura/, /Quantos dias o\(a\)/], "assistente guiado voltou ao tom formal");

if (failures.length) {
  console.error("\nACCQUA Build 1.5.6 — contratos FALHARAM:\n");
  failures.forEach((failure) => console.error(` - ${failure}`));
  console.error(`\n${failures.length} contrato(s) 1.5.6 quebrado(s).`);
  process.exit(1);
}
console.log(`ACCQUA Build 1.5.6 — ${passes.length} contratos validados.`);
