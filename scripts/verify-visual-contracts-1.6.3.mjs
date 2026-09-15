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

requireMatch("172/version", "package.json", /"version":\s*"1\.7\.2"/, "package não está em 1.7.2");
requireMatch("163/contracts", "package.json", /verify-visual-contracts-1\.6\.3\.mjs/, "npm não executa contratos 1.6.3");
requireMatch("163/css-last", "scr/main.tsx", /build-1\.6\.2\.css";\s*\nimport "\.\/styles\/build-1\.6\.3\.css";/, "camada 1.6.3 não preserva ordem histórica");
requireMatch("172/final-css-last", "scr/main.tsx", /build-1\.7\.1\.css";\s*\nimport "\.\/styles\/build-1\.7\.2\.css";/, "camada final 1.7.2 não é a última");
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
requireAll("171/dialog-centered", "scr/components/ResponsiveDialog.tsx", [/Dialog\.Root/,/responsive-dialog-content/,/syncModalAccessibility/], "modal compartilhado perdeu centralização/modal guard");
requireAbsent("171/dialog-no-drawer", "scr/components/ResponsiveDialog.tsx", /Drawer\.Root|responsive-dialog-handle/, "modal compartilhado voltou a bottom sheet/drag");
requireAll("163/modal-gap", "scr/styles/build-1.6.3.css", [/responsive-dialog-header/,/gap:24px!important/], "X do modal continua encostado no título");
requireAll("163/bottom-nav", "scr/components/MainLayout.tsx", [/<BottomNavigation/,/effectiveFocusMode/], "BottomNavigation canônica foi duplicada/removida");
requireAll("163/reservations", "scr/components/ProfileReservations157.tsx", [/status === "reservado"/,/status === "cancelado"/,/deleteMyCancelledReservation/,/activeCount/], "cancelar/apagar reserva perdeu fluxo correto");
requireAll("163/store-delete", "scr/lib/store.ts", [/excluido_em/,/accqua_staff_soft_delete_product_v1_5_5/], "soft delete da Loja não está preservado");
requireAll("163/login-client", "supabase/functions/login-identifier-v157/index.ts", [/resolveEmail/,/cpf\.eq\./,/phone\.eq\./,/signInWithPassword/], "login por CPF/telefone perdeu resolução ou autenticação");
requireAll("163/login-sql", "supabase/migrations/20260904061000_build_1_6_3_login_cardio_partners.sql", [/resolve_accqua_login_email_v1_6_3/,/p\.telefone/,/regexp_replace\(coalesce\(p\.phone/], "login legado não contempla phone + telefone");
requireAll("163/cardio-source", "scr/lib/cardioStats.ts", [/get_accqua_cardio_stats_v1_5_6/,/CardioStatsPeriod = "day" \| "month"/], "cardio deixou de usar fonte única já existente");
requireAll("163/ranking-days", "scr/lib/ranking.ts", [/get_accqua_monthly_ranking_v1_5_6/,/daysToLeader/,/totalWorkouts/], "ranking não separa dias válidos de treinos totais");
requireAll("163/ranking-profile", "scr/lib/ranking.ts", [/get_accqua_ranking_profile_summary_v1_6_3/,/objective: string/], "perfil do ranking não mostra objetivo");
requireAbsent("170/partners-retired", "scr/components/ProfileTrainingPartners163.tsx", /inviteTrainingPartner|loadTrainingPartners|useQuery/, "componente aposentado ainda acessa parceiros");
requireAll("163/partner-sql", "supabase/migrations/20260904061000_build_1_6_3_login_cardio_partners.sql", [/accqua_training_partner_invites/,/list_accqua_training_partners_v1_6_3/,/create_accqua_training_partner_invite_v1_6_3/], "backend histórico de parceiros ausente");
requireAll("163/partner-push", "supabase/functions/send-training-partner-invite-v163/index.ts", [/webpush/,/push_subscriptions/,/create_accqua_training_partner_invite_v1_6_3/], "backend histórico de parceiros perdeu push");
requireAbsent("163/no-parallel-cardio-table", "supabase/migrations/20260904061000_build_1_6_3_login_cardio_partners.sql", /create table\s+(?:if not exists\s+)?public\.cardio_sessoes/i, "migration criou tabela paralela de cardio");

/* Build 1.7.1 — Rodada 5. */
requireAll("171/toast-stack", "scr/components/AccquaToaster.tsx", [/position="top-right"/,/visibleToasts=\{3\}/,/closeButton/,/\bexpand\b/,/accquaOverflowLabel/], "notificações não usam pilha global compacta");
requireAll("171/toast-stack-css", "scr/styles/build-1.7.1.css", [/data-accqua-overflow-label/,/max-height:\s*82px/,/data-close-button/], "pilha de notificações perdeu contador/compactação");
requireAll("171/owner-email-flow", "scr/components/OwnerStaffManager.tsx", [/email:\s*cleanEmail/,/type="email"/,/E-mail de acesso/], "Gestão da equipe não envia e-mail explícito");
requireAll("171/owner-email-edge", "supabase/functions/owner-create-staff-v1655/index.ts", [/hasCustomEmail/,/customEmail/,/const email = hasCustomEmail/], "Edge Function voltou a exigir usuário invisível quando há e-mail");
requireAll("171/recipe-timeout", "supabase/functions/generate-recipe-ai/index.ts", [/GENERATION_DEADLINE_MS = 20_000/,/generation_timeout/,/recipe_image_missing/,/console\.error\("generate-recipe-ai"/], "receita IA perdeu timeout, integridade ou log");
requireAll("171/partners-paused-profile", "scr/components/ProfileTabs171.tsx", [/Build 1\.7\.1/,/return null/], "aba Parceiros voltou a aparecer");
requireAll("171/partners-paused-ranking", "scr/components/RankingProfileEnhancements171.tsx", [/Build 1\.7\.1/,/return null/], "Ver treino/Adicionar parceiro voltou ao Ranking");
requireAll("171/partners-hidden", "scr/styles/build-1.7.1.css", [/profile-stat-partners/,/ranking-profile-workout-button/,/display:\s*none/], "UI pausada de parceiros/treino ainda pode aparecer");
requireAll("171/staff-logo-single", "scr/styles/build-1.7.1.css", [/staff-subpage-logo/,/min-width:\s*1024px/,/display:\s*none/], "Staff desktop voltou a duplicar logo no conteúdo");
requireAll("171/ranking-info-short", "scr/components/RankingInfoSheet.tsx", [/Complete pelo menos 70%/,/<details>/,/Seu perfil não aparece na classificação deste mês/], "Como funciona do Ranking perdeu versão resumida/accordions");
requireAbsent("171/ranking-info-no-old-copy", "scr/components/RankingInfoSheet.tsx", /1 dia válido = 1 ponto/, "texto antigo verborrágico do Ranking voltou");
requireAll("171/wizard-badge", "scr/styles/build-1.7.1.css", [/admin-builder-cardio-state-label/,/white-space:\s*nowrap/,/flex-shrink:\s*0/,/width:\s*fit-content/], "badge Sem cardio pode voltar a quebrar letra por letra");
requireAll("171/wizard-tokens", "scr/styles/build-1.7.1.css", [/--wizard-card-pad/,/--wizard-card-radius/,/--wizard-control-height/,/is-revisao \.admin-builder-cardio/], "wizard perdeu tokens/hierarquia uniforme");

/* Build 1.7.1 — rail de navegação expansível fornecido pelo usuário. */
requireAll("171/staff-icon-rail-component", "scr/components/StaffIconNavPill.tsx", [/accqua-staff-icon-nav-pill/,/accqua-staff-icon-nav-pill-label/,/aria-current/,/onPointerEnter=\{onPrefetch\}/], "componente do rail expansível não está conectado ao hover/foco/prefetch");
requireAbsent("171/staff-icon-rail-no-next", "scr/components/StaffIconNavPill.tsx", /next\/link/, "rail usa Next.js em vez do stack React Router/Vite do app");
requireAll("171/staff-icon-rail-wire", "scr/components/StaffLayout.tsx", [/StaffIconNavPill/,/className=\{sidebarCollapsed \? "is-icon-rail"/,/active=\{active === item\.key\}/,/onActivate=\{\(\) => navigate\(item\.href\)\}/], "rail recolhido não usa o componente expansível canônico");
requireAll("171/staff-icon-rail-css", "scr/styles/build-1.7.1.css", [/nav\.is-icon-rail/,/width:\s*165px/,/#f5c518/,/#2c2205/,/#101d3a/,/is-active::before/,/max-width:\s*1023\.98px/], "rail expansível perdeu tokens, estado ativo ou exclusividade desktop");
requireAbsent("171/staff-icon-rail-no-orange", "scr/styles/build-1.7.1.css", /#f97316/i, "rail reintroduziu a cor laranja do exemplo original");

/* Build 1.7.2 — notificações motivacionais. */
const motivationalMigration = "supabase/migrations/20260915012000_build_1_7_2_motivational_notifications.sql";
const motivationalEdge = "supabase/functions/enviar-notificacoes-motivacionais/index.ts";
requireAll("172/motivational-schema", motivationalMigration, [/meal_reminders/,/hydration_reminders/,/training_reminders/,/accqua_motivational_notification_log/,/unique \(user_id, category, slot_key\)/], "schema das três categorias ou deduplicação por slot ausente");
requireAll("172/motivational-cron", motivationalMigration, [/pg_cron/,/\*\/15 \* \* \* \*/,/run_accqua_motivational_cron_v1_7_2/,/x-accqua-cron-token/], "cron de 15 minutos ou autenticação privada ausente");
requireAll("172/motivational-routes", motivationalEdge, [/\/dieta#registro-rapido/,/\/dieta#hidratacao/,/url: "\/treino"/,/times: \["10:00", "15:30"\]/], "horários/deep links motivacionais divergiram do pedido");
requireAll("172/motivational-no-repeat", motivationalEdge, [/previousIndex/,/if \(index === previousIndex\)/,/latestMessage\.set/], "mensagem pode repetir duas vezes seguidas para o mesmo aluno");
requireAll("172/motivational-push", motivationalEdge, [/webpush\.sendNotification/,/push_subscriptions/,/get_push_vapid_config_v1_5_3/,/categoria: config\.category/], "dispatcher deixou de usar Web Push real ou payload categorizado");
requireAll("172/motivational-client-preferences", "scr/lib/notifications.ts", [/MotivationalNotificationPreferences/,/meal_reminders/,/hydration_reminders/,/training_reminders/,/setMyMotivationalNotificationPreference/], "preferências independentes não estão ligadas ao banco");
requireAll("172/motivational-profile-ui", "scr/components/NotificationPreferenceBridge.tsx", [/Lembretes motivacionais/,/Alimentação/,/Hidratação/,/Às 10h e 15h30/,/toggleMotivational/], "Perfil não permite desligar categorias separadamente");
requireAll("172/motivational-inapp-deeplink", "scr/components/home/NotificationsSheet.tsx", [/useNavigate/,/notification\.url/,/navigate\(notification\.url\)/,/is-alimentacao|alimentacao/], "central de notificações não abre a rota exata");
requireAll("172/motivational-sw-deeplink", "public/accqua-notifications-sw.js", [/new URL\(targetPath, self\.location\.origin\)/,/navigate\(targetUrl\)/,/openWindow\(targetUrl\)/], "Service Worker não preserva deep link exato");
requireAll("172/motivational-css", "scr/styles/build-1.7.2.css", [/accqua-motivational-preferences/,/accqua-motivational-preference-row/,/is-alimentacao/,/is-hidratacao/], "acabamento visual das preferências motivacionais ausente");

const motivationalSource = read(motivationalEdge);
const messageBlocks = [...motivationalSource.matchAll(/messages:\s*\[([\s\S]*?)\]/g)].map((match) => match[1]);
const motivationalMessages = messageBlocks.flatMap((block) => [...block.matchAll(/"([^"]+)"/g)].map((match) => match[1]));
if (messageBlocks.length === 3 && motivationalMessages.length === 24 && motivationalMessages.every((message) => !message.includes("-"))) {
  passes.push("172/motivational-copy-no-hyphen");
} else {
  failures.push(`172/motivational-copy-no-hyphen — banco precisa ter 24 mensagens e nenhuma pode usar hífen (${motivationalEdge})`);
}

if (failures.length) {
  console.error("\nACCQUA Build 1.7.2 — contratos FALHARAM:\n");
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}
console.log(`ACCQUA Build 1.7.2 — ${passes.length} contratos validados.`);
