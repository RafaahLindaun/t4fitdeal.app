import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const passes = [];
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const requireMatch = (id, file, pattern, note) => pattern.test(read(file)) ? passes.push(id) : failures.push(`${id} — ${note} (${file})`);
const requireAll = (id, file, patterns, note) => patterns.every((p) => p.test(read(file))) ? passes.push(id) : failures.push(`${id} — ${note} (${file})`);
const requireAbsent = (id, file, pattern, note) => !pattern.test(read(file)) ? passes.push(id) : failures.push(`${id} — ${note} (${file})`);

requireMatch("163/version", "package.json", /"version":\s*"1\.6\.3"/, "package não está em 1.6.3");
requireMatch("163/contracts", "package.json", /verify-visual-contracts-1\.6\.3\.mjs/, "npm não executa contratos 1.6.3");
requireMatch("163/css-last", "scr/main.tsx", /build-1\.6\.2\.css";\s*\nimport "\.\/styles\/build-1\.6\.3\.css";/, "camada 1.6.3 não é a última");
requireAll("163/staff-scroll", "scr/styles/build-1.6.3.css", [/\.staff-page-layout\{/,/min-height:0!important/,/staff-page-layout-scroll/,/overflow-y:auto!important/], "layout Staff voltou a travar scroll");
requireAll("163/sidebar", "scr/components/StaffLayout.tsx", [/sidebarCollapsed/,/aria-expanded=\{!sidebarCollapsed\}/,/startsWith\("\/area-accqua\/montar"\)/], "sidebar não mantém estado/collapse canônico");
requireAll("163/method-copy", "scr/styles/build-1.6.3.css", [/workout-entry-methods/,/staff-action-card-copy p/,/-webkit-line-clamp:unset/], "subtítulos dos métodos ainda podem sumir/truncar");
requireAll("163/stage-single", "scr/pages/AdminWorkoutBuilder.tsx", [/admin-builder-stage-v163 is-programa/,/mobileStep === "rotina"/,/mobileStep === "exercicios"/,/mobileStep === "cardio"/], "etapas continuam empilhadas no DOM");
requireAll("163/stepper", "scr/pages/AdminWorkoutBuilder.tsx", [/admin-builder-progress-v162/,/admin-builder-step-orb/], "stepper grande 1–4 foi perdido");
requireAll("163/split", "scr/styles/build-1.6.3.css", [/scroll-snap-type:x proximity/,/admin-builder-split-options>button\.is-active/,/#ffd128!important/], "carrossel/seleção da divisão não está canônico");
requireAll("163/reorder", "scr/pages/AdminWorkoutBuilder.tsx", [/Reorder\.Group/,/onReorder=\{reorderActiveRoutineExercises\}/], "reordenação de exercícios foi removida");
requireAll("163/grouping", "scr/pages/AdminWorkoutBuilder.tsx", [/setExerciseSeriesType/,/Bi-set/,/Tri-set/], "bi-set/tri-set ausentes");
requireAll("163/rest", "scr/pages/Profile.tsx", [/Repouso obrigatório entre séries/,/restRequired/], "toggle de repouso ausente");
requireAll("163/timer", "scr/pages/Treino.tsx", [/TimerOverlay/,/setGroupId/], "execução agrupada/timer não está ativa");
requireAll("163/dialog", "scr/components/ResponsiveDialog.tsx", [/Drawer\.Root/,/responsive-dialog-handle/,/syncModalAccessibility/], "bottom sheet compartilhado perdeu drag/modal guard");
requireAll("163/modal-gap", "scr/styles/build-1.6.3.css", [/responsive-dialog-header/,/gap:24px!important/], "X do modal continua encostado no título");
requireAll("163/bottom-nav", "scr/components/MainLayout.tsx", [/<BottomNavigation/,/effectiveFocusMode/], "BottomNavigation canônica foi duplicada/removida");
requireAll("163/reservations", "scr/components/ProfileReservations157.tsx", [/status === "reservado"/,/status === "cancelado"/,/deleteMyCancelledReservation/,/activeCount/], "cancelar/apagar reserva perdeu fluxo correto");
requireAll("163/store-delete", "scr/lib/store.ts", [/excluido_em/,/accqua_staff_soft_delete_product_v1_5_5/], "soft delete da Loja não está preservado");
requireAll("163/login-client", "supabase/functions/login-identifier-v157/index.ts", [/resolve_accqua_login_email_v1_6_3/,/signInWithPassword/], "login por CPF/telefone não usa resolvedor canônico");
requireAll("163/login-sql", "supabase/migrations/20260904061000_build_1_6_3_login_cardio_partners.sql", [/resolve_accqua_login_email_v1_6_3/,/p\.telefone/,/regexp_replace\(coalesce\(p\.phone/], "login legado não contempla phone + telefone");
requireAll("163/cardio-source", "scr/lib/cardioStats.ts", [/get_accqua_cardio_stats_v1_5_6/,/CardioStatsPeriod = "day" \| "month"/], "cardio deixou de usar fonte única já existente");
requireAll("163/ranking-days", "scr/lib/ranking.ts", [/get_accqua_monthly_ranking_v1_5_6/,/daysToLeader/,/totalWorkouts/], "ranking não separa dias válidos de treinos totais");
requireAll("163/ranking-profile", "scr/lib/ranking.ts", [/get_accqua_ranking_profile_summary_v1_6_3/,/objective: string/], "perfil do ranking não mostra objetivo");
requireAll("163/partner-ui", "scr/components/ProfileTrainingPartners163.tsx", [/Parceiros de treino/,/inviteTrainingPartner/,/refetchOnWindowFocus: false/], "parceiros de treino ausentes");
requireAll("163/partner-sql", "supabase/migrations/20260904061000_build_1_6_3_login_cardio_partners.sql", [/accqua_training_partner_invites/,/list_accqua_training_partners_v1_6_3/,/create_accqua_training_partner_invite_v1_6_3/], "backend de parceiros ausente");
requireAll("163/partner-push", "supabase/functions/send-training-partner-invite-v163/index.ts", [/webpush/,/push_subscriptions/,/create_accqua_training_partner_invite_v1_6_3/], "convite não reutiliza push");
requireAbsent("163/no-parallel-cardio-table", "supabase/migrations/20260904061000_build_1_6_3_login_cardio_partners.sql", /create table\s+(?:if not exists\s+)?public\.cardio_sessoes/i, "migration criou tabela paralela de cardio");

if (failures.length) {
  console.error("\nACCQUA Build 1.6.3 — contratos FALHARAM:\n");
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}
console.log(`ACCQUA Build 1.6.3 — ${passes.length} contratos validados.`);
