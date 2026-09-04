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

requireMatch("164/version", "package.json", /"version":\s*"1\.6\.4"/, "package não está em 1.6.4");
requireMatch("164/contracts", "package.json", /verify-visual-contracts-1\.6\.4\.mjs/, "npm não executa contratos 1.6.4");
requireAll("164/css", "scr/main.tsx", [/build-1\.6\.3\.css/,/build-1\.6\.4\.css/], "camada CSS 1.6.4 não foi carregada");
requireAll("164/centered-modal", "scr/components/CenteredModal.tsx", [/Dialog\.Overlay/,/centered-modal-content-v164/,/centered-modal-body-v164/], "modal centralizado compartilhado ausente");
requireAll("164/centered-modal-usage", "scr/pages/WorkoutBuilderEntry.tsx", [/CenteredModal/,/mode === "guide"/,/mode === "templates"/], "Assistente/Modelos não usam modal centralizado");
requireAll("164/recipe-modal", "scr/pages/StoreAdmin.tsx", [/CenteredModal/,/recipe-ai-error-v164/,/Gerando receita/], "Receita IA não tem modal/loading/erro explícitos");
requireAbsent("164/guide-copy-1", "scr/pages/WorkoutBuilderEntry.tsx", /Isso define o estilo do treino/, "subtítulo redundante do Assistente permanece");
requireAbsent("164/guide-copy-2", "scr/pages/WorkoutBuilderEntry.tsx", /É só um ponto de partida/, "subtítulo redundante do Assistente permanece");
requireAbsent("164/guide-copy-3", "scr/pages/WorkoutBuilderEntry.tsx", /A divisão se ajusta sozinha/, "subtítulo redundante do Assistente permanece");

const builder = read("scr/pages/AdminWorkoutBuilder.tsx");
const reviewIndex = builder.indexOf('className="admin-builder-review-summary');
const reviewStageIndex = builder.indexOf('admin-builder-stage-v163 is-revisao');
const cardioSectionIndex = builder.indexOf('className="admin-builder-cardio admin-builder-anchor"');
if (reviewStageIndex >= 0 && reviewIndex > reviewStageIndex && reviewIndex < cardioSectionIndex) passes.push("164/review-placement");
else failures.push("164/review-placement — resumo não está dentro da etapa Revisão antes do cardio (scr/pages/AdminWorkoutBuilder.tsx)");
requireAll("164/review-content", "scr/pages/AdminWorkoutBuilder.tsx", [/RESUMO PARA PUBLICAÇÃO/,/routine\.exercises\.map/,/exercise\.sets/,/exercise\.repsMin/], "Revisão não resume dias/exercícios/séries/reps");
requireAll("164/review-polish", "scr/styles/build-1.6.4.css", [/admin-builder-cardio-state-label/,/background:\s*transparent\s*!important/,/admin-builder-mobile-primary:focus-visible/], "vazamentos visuais da Revisão não foram neutralizados");

requireAbsent("164/staff-old-scroll-split", "scr/components/StaffLayout.tsx", /usesDocumentScroll|usesInternalPageScroll/, "Staff ainda divide páginas em contratos de scroll diferentes");
requireAll("164/staff-scroll", "scr/styles/build-1.6.4.css", [/accqua-staff-content/,/overflow-y:\s*auto\s*!important/,/store-admin-screen/,/classes-admin-screen/], "scroll centralizado do Staff ausente");
requireAll("164/library", "scr/pages/AdminArea.tsx", [/dashboardView === "students" \? \(/,/admin-dashboard-statbar/,/admin-library-add/], "cards operacionais da Biblioteca não foram isolados");
requireAll("164/library-plus", "scr/styles/build-1.6.4.css", [/\.admin-library-add/,/align-items:\s*center\s*!important/,/justify-content:\s*center\s*!important/], "botão + continua sem contrato de centralização");

requireAll("164/reservation-delete-client", "scr/lib/store.ts", [/staffDeleteReservation/,/staff_delete_reservation_v1_6_4/], "exclusão real de reserva não existe no client");
requireAll("164/reservation-delete-ui", "scr/pages/StoreAdmin.tsx", [/store-reservation-swipe-v164/,/reservationDeleteTarget/,/SwipeableListItem/], "reservas não têm swipe/lixeira/confirmação");
requireAll("164/reservation-delete-sql", "supabase/migrations/20260904072000_build_1_6_4_partners_reservations.sql", [/staff_delete_reservation_v1_6_4/,/delete from public\.reservas/,/p_allow_retirado/], "delete real de reservas não está protegido no banco");

requireAll("164/ranking", "scr/pages/Ranking.tsx", [/ranking-info-summary-v164/,/ranking-info-rule-v164/], "Como funciona do Ranking não foi simplificado");
requireAll("164/ranking-safe", "scr/styles/build-1.6.4.css", [/ranking-info-dialog-body/,/env\(safe-area-inset-bottom\)/,/overflow-y:\s*auto/], "Ranking não respeita safe-area/scroll interno");
requireAll("164/benefit", "scr/components/home/CheckInButton.tsx", [/Escolha o SEU tipo de benefício/,/QrCheckinIcon/,/checkin-provider-benefit-icon-v164/], "seletor de benefício não segue a 1.6.4");
requireAbsent("164/benefit-note", "scr/components/home/CheckInButton.tsx", /checkin-provider-note/, "frase redundante inferior permanece");
requireAll("164/header-touch", "scr/styles/build-1.6.4.css", [/accqua-checkin-button:active/,/accqua-membership-shield:active/,/accqua-notification-button:active/,/scale\(\.92\)/], "ações do header não têm animação de toque");
requireAll("164/shield", "scr/styles/build-1.6.4.css", [/accqua-membership-shield/,/justify-content:\s*center/,/membership-shield-entry-v164/], "escudo não está centralizado/animado");

requireAll("164/profile", "scr/pages/Profile.tsx", [/profile-highlights-v164/,/view === "partners"/,/ProfileTrainingPartners164/], "Perfil visual/aba Parceiros ausentes");
requireAll("164/partners-client", "scr/lib/trainingPartners.ts", [/requestTrainingPartner/,/respondTrainingPartner/,/callTrainingPartner/,/list_accqua_training_partners_v1_6_4/], "modelo bilateral não está no client");
requireAll("164/partners-ui", "scr/components/ProfileTrainingPartners164.tsx", [/Pedidos recebidos/,/Meus parceiros/,/Chamar pra treino/,/Adicionar/], "aba Parceiros não separa conexão e chamada");
requireAll("164/partners-sql", "supabase/migrations/20260904072000_build_1_6_4_partners_reservations.sql", [/request_accqua_training_partner_v1_6_4/,/respond_accqua_training_partner_v1_6_4/,/call_accqua_training_partner_v1_6_4/], "backend bilateral de parceiros ausente");

// Regressões essenciais preservadas da 1.6.3.
requireAll("164/regression-stepper", "scr/pages/AdminWorkoutBuilder.tsx", [/admin-builder-progress-v162/,/admin-builder-step-orb/], "stepper aprovado foi perdido");
requireAll("164/regression-groups", "scr/pages/AdminWorkoutBuilder.tsx", [/setExerciseSeriesType/,/Bi-set/,/Tri-set/], "bi-set/tri-set foram perdidos");
requireAll("164/regression-bottom-nav", "scr/components/MainLayout.tsx", [/<BottomNavigation/,/effectiveFocusMode/], "BottomNavigation canônica foi alterada");
requireAll("164/regression-login", "supabase/functions/login-identifier-v157/index.ts", [/resolve_accqua_login_email_v1_6_3/,/signInWithPassword/], "login da 1.6.3 regrediu");

if (failures.length) {
  console.error("\nACCQUA Build 1.6.4 — contratos FALHARAM:\n");
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}
console.log(`ACCQUA Build 1.6.4 — ${passes.length} contratos validados.`);
