import "./verify-visual-contracts-1.5.3.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const passes = [];
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

function requireMatch(id, file, pattern, note) {
  if (!pattern.test(read(file))) failures.push(`${id} — ${note} (${file})`);
  else passes.push(id);
}
function requireAll(id, file, patterns, note) {
  const source = read(file);
  if (!patterns.every((pattern) => pattern.test(source))) failures.push(`${id} — ${note} (${file})`);
  else passes.push(id);
}
function requireAbsent(id, file, pattern, note) {
  if (pattern.test(read(file))) failures.push(`${id} — ${note} (${file})`);
  else passes.push(id);
}

const css = "scr/styles/build-1.5.4.css";
const membershipMigration = "supabase/migrations/20260901060000_build_1_5_4_staff_hardening.sql";
const reservationsMigration = "supabase/migrations/20260901060100_build_1_5_4_student_active_reservations.sql";

requireMatch("154/sql-alias", membershipMigration, /coalesce\(p_notes,\s*prof\.matricula_observacao,\s*''\)/, "matricula_observacao voltou a ficar ambígua");
requireAbsent("154/sql-no-unqualified", membershipMigration, /coalesce\(p_notes,\s*matricula_observacao,/, "referência não qualificada reapareceu");
requireMatch("154/staff-sanitizer", "scr/lib/staffErrors.ts", /column reference[\s\S]*?is ambiguous[\s\S]*?row-level security/i, "sanitizador deixou de cobrir erros de infraestrutura");
requireMatch("154/membership-safe-toast", "scr/components/StudentMembershipEditor.tsx", /staffFacingErrorMessage[\s\S]*?Não foi possível atualizar a matrícula agora/, "Matrícula voltou a expor erro cru");
requireMatch("154/ranking-safe-toast", "scr/pages/RankingStaff.tsx", /staffFacingErrorMessage/, "Ranking Staff voltou a expor erro cru");
requireMatch("154/notifications-safe-toast", "scr/pages/NotificationsStaff.tsx", /staffFacingErrorMessage/, "Notificações Staff voltou a expor erro cru");

requireMatch("154/avatar-cache", "scr/lib/profileAvatar.ts", /SIGNED_URL_TTL_MS\s*=\s*50\s*\*\s*60\s*\*\s*1000/, "cache de avatar deixou de ser menor que a expiração");
requireMatch("154/avatar-inflight", "scr/lib/profileAvatar.ts", /avatarInFlight[\s\S]*?if \(pending\) return pending/, "requests simultâneos de avatar deixaram de ser deduplicados");
requireMatch("154/reservations-active-only", reservationsMigration, /accqua_is_staff\(\)[\s\S]*?status\s*=\s*'reservado'/, "reservas canceladas podem reaparecer na lista do aluno");

requireMatch("154/no-workout", css, /\.admin-area-shell\.is-dashboard \.admin-student-flags i\.is-no-workout\s*\{[\s\S]*?color:\s*#07162d\s*!important;[\s\S]*?background:\s*#ffd128\s*!important;/, "Sem treino perdeu contraste");
requireMatch("154/training-title", css, /\.admin-area-shell\.is-student-detail \.admin-training-action strong[\s\S]*?color:\s*#f8fbff\s*!important;/, "título de montar treino voltou acinzentado");
requireMatch("154/staff-scroll", css, /\.accqua-staff-layout\.uses-document-scroll \.accqua-staff-content\s*\{[\s\S]*?min-height:\s*0\s*!important;[\s\S]*?overflow-y:\s*auto\s*!important;/, "lista Staff perdeu scroll interno");
requireMatch("154/library-trash", css, /\.admin-area-shell\.is-library-view \.accqua-swipe-desktop-delete\s*\{[\s\S]*?top:\s*-9px[\s\S]*?right:\s*-9px/, "lixeira da Biblioteca voltou a cobrir conteúdo");

requireMatch("154/mobile-tiles", css, /grid-auto-rows:\s*84px\s*!important;[\s\S]*?height:\s*84px\s*!important;[\s\S]*?aspect-ratio:\s*auto\s*!important;/, "atalhos do perfil deixaram de usar 84px fixos");
requireMatch("154/mobile-header", css, /is-student-detail-screen[\s\S]*?\.admin-area-header\s*\{[\s\S]*?z-index:\s*90[\s\S]*?background:\s*var\(--surface-deep/, "header Professor/Administração pode vazar conteúdo");
requireMatch("154/no-ghost-bottom", css, /is-route-focus-mode[\s\S]*?padding-bottom:\s*0\s*!important;/, "Staff voltou a reservar espaço para bottom nav inexistente");
requireMatch("154/roster-blob", css, /admin-dashboard-roster\) \.admin-area-background span[\s\S]*?display:\s*none\s*!important;/, "blob decorativo voltou para a lista de alunos");

requireMatch("154/nav-transparent", css, /\.accqua-main-layout-nav\s*\{[\s\S]*?background:\s*transparent\s*!important;/, "wrapper reto da bottom nav voltou a pintar fundo");
requireMatch("154/modal-over-nav", css, /body:has\(\[aria-modal="true"\]\) \.accqua-main-layout-nav[\s\S]*?visibility:\s*hidden\s*!important;/, "bottom nav pode aparecer sobre modal");

requireMatch("154/store-image", css, /\.store-product-detail-main-image > img[\s\S]*?transform:\s*none\s*!important;[\s\S]*?rotate:\s*0deg\s*!important;/, "imagem da Loja voltou a rotacionar");
requireMatch("154/store-discount", css, /\.store-product-detail-discount\s*\{[\s\S]*?position:\s*absolute\s*!important;[\s\S]*?top:\s*12px[\s\S]*?left:\s*12px/, "selo de desconto deixou de ficar ancorado");
requireMatch("154/store-reserve-color", css, /\.store-product-detail-reserve:not\(:disabled\)\s*\{[\s\S]*?color:\s*#07152a\s*!important;[\s\S]*?background:\s*linear-gradient\(135deg,\s*#ffd128,\s*#ffe36a\)\s*!important;/, "Reservar voltou a depender do breakpoint desktop");

requireMatch("154/builder-progress", "scr/pages/admin-workout-builder-v150.css", /admin-builder-story-segments[\s\S]*?repeat\(4/, "progresso segmentado foi removido");
requireMatch("154/builder-carousel", "scr/pages/admin-workout-builder-v150.css", /scroll-snap-type:\s*x mandatory[\s\S]*?min-width:\s*88px/, "divisão deixou de ser carrossel arrastável");
requireMatch("154/builder-one-primary", "scr/pages/admin-workout-builder-v150.css", /admin-builder-footer-actions[\s\S]*?display:\s*none\s*!important[\s\S]*?admin-builder-mobile-primary/, "footer mobile voltou a competir com múltiplas ações");
requireAll("154/builder-reorder", "scr/pages/AdminWorkoutBuilder.tsx", [/<Reorder\.Group/, /<Reorder\.Item/, /reorderActiveRoutineExercises/], "lista de exercícios deixou de ser reordenável/persistente");

// Versionamento: versões posteriores também devem preservar todos os contratos 1.5.4.
requireMatch("154/version", "package.json", /"version":\s*"(?:1\.5\.[3-9]|1\.(?:[6-9]|\d{2,})\.\d+)"/, "package está abaixo da 1.5.4");
requireMatch("154/contracts-script", "package.json", /verify-visual-contracts-(?:1\.5\.[3-9]|1\.(?:[6-9]|\d{2,})\.\d+)\.mjs/, "npm deixou de encadear contratos 1.5.4+");
requireMatch("154/css-last", "scr/main.tsx", /build-1\.5\.3\.css";\s*\nimport "\.\/styles\/build-1\.5\.4\.css";/, "camada 1.5.4 não está depois da 1.5.3");

if (failures.length) {
  console.error("\nACCQUA Build 1.5.4 — contratos FALHARAM:\n");
  failures.forEach((failure) => console.error(` - ${failure}`));
  console.error(`\n${failures.length} contrato(s) 1.5.4 quebrado(s).`);
  process.exit(1);
}
console.log(`ACCQUA Build 1.5.4 — ${passes.length} contratos validados.`);
