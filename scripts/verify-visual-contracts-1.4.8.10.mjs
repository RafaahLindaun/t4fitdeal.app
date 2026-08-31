import "./verify-visual-contracts-1.4.8.8.mjs";
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
  if (!pattern.test(read(file))) {
    failures.push(`${id} — ${note} (${file})`);
    return;
  }
  passes.push(id);
}

// Preserve M1 / L from 1.4.8.9 — exact local flag, not only generic StatusBadge.
requireMatch(
  "M1/exact-no-workout",
  "scr/styles/build-1.4.8.9.css",
  /\.admin-student-flags i\.is-no-workout\s*\{[\s\S]*?color:\s*#07162d\s*!important;[\s\S]*?background:\s*#ffd128\s*!important;/,
  "flag real Sem treino voltou a ficar sem contraste",
);
requireMatch(
  "L/warning-system",
  "scr/components/status-badge.css",
  /\.accqua-status-badge\.is-warning\s*\{[\s\S]*?color:\s*#07162d;[\s\S]*?background:\s*#ffd128;/,
  "StatusBadge warning perdeu o par amarelo + texto escuro",
);

// Preserve M2 / K — no blob in the mobile student roster.
requireMatch(
  "M2/remove-blob",
  "scr/styles/build-1.4.8.9.css",
  /\.admin-area-screen:has\(\.admin-dashboard-roster\) \.admin-area-background span,[\s\S]*?\.admin-area-background i\s*\{[\s\S]*?display:\s*none\s*!important;/,
  "formas decorativas voltaram à lista de alunos",
);

// Preserve M3 / I — solid sticky student-detail header.
requireMatch(
  "M3/solid-header",
  "scr/styles/build-1.4.8.9.css",
  /is-student-detail-screen[\s\S]*?\.admin-area-header\s*\{[\s\S]*?z-index:\s*90\s*!important;[\s\S]*?background:\s*var\(--surface-deep\)\s*!important;/,
  "header Professor/Administração voltou a ser translúcido ou ficar abaixo dos cards",
);

// O — Staff mobile is route-focus mode: no --app-bottomnav-offset reservation.
requireMatch(
  "O/root-no-bottom-offset",
  "scr/styles/build-1.4.8.10.css",
  /\.accqua-main-layout\.is-route-focus-mode > \.accqua-main-layout-content\s*\{[\s\S]*?padding-bottom:\s*0\s*!important;/,
  "AppShell Staff ainda reserva padding global para bottom nav inexistente",
);
requireMatch(
  "O/staff-full-height",
  "scr/styles/build-1.4.8.10.css",
  /\.accqua-main-layout\.is-route-focus-mode \.accqua-staff-layout\.uses-document-scroll\s*\{[\s\S]*?height:\s*100dvh\s*!important;[\s\S]*?padding-bottom:\s*0\s*!important;/,
  "Staff document-scroll ainda subtrai espaço da bottom nav",
);
requireMatch(
  "O/admin-area-no-offset",
  "scr/styles/build-1.4.8.10.css",
  /\.accqua-main-layout\.is-route-focus-mode \.accqua-staff-route > \.admin-area-screen\s*\{[\s\S]*?min-height:\s*calc\(100dvh - var\(--staff-mobile-nav-height, 56px\)\)\s*!important;[\s\S]*?padding-bottom:\s*max\(18px, env\(safe-area-inset-bottom\)\)\s*!important;/,
  "admin-area mobile ainda usa --app-bottomnav-offset",
);
requireMatch(
  "O/operational-screens-no-offset",
  "scr/styles/build-1.4.8.10.css",
  /\.classes-admin-screen,[\s\S]*?\.store-admin-screen,[\s\S]*?\.admin-builder-screen\s*\{[\s\S]*?height:\s*calc\(100dvh - var\(--staff-mobile-nav-height, 56px\)\)\s*!important;/,
  "subtelas Staff ainda reservam altura da bottom nav global",
);

// N v2 — fixed 84px tiles, never aspect-ratio or viewport-height cards.
requireMatch(
  "N2/grid",
  "scr/styles/build-1.4.8.10.css",
  /\.admin-student-summary-list\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)\s*!important;[\s\S]*?grid-auto-rows:\s*84px\s*!important;/,
  "perfil mobile não usa grade compacta de três colunas com linhas de 84px",
);
requireMatch(
  "N2/fixed-height",
  "scr/styles/build-1.4.8.10.css",
  /\.profile-menu-item\s*\{[\s\S]*?height:\s*84px\s*!important;[\s\S]*?min-height:\s*84px\s*!important;[\s\S]*?max-height:\s*84px\s*!important;[\s\S]*?aspect-ratio:\s*auto\s*!important;/,
  "tile do perfil deixou de ter altura fixa de 84px ou reativou aspect-ratio",
);
requireMatch(
  "N2/icon",
  "scr/styles/build-1.4.8.10.css",
  /\.profile-menu-icon svg\s*\{[\s\S]*?width:\s*24px\s*!important;[\s\S]*?height:\s*24px\s*!important;/,
  "ícone do grid compacto deixou de medir 24px",
);
requireMatch(
  "N2/copy",
  "scr/styles/build-1.4.8.10.css",
  /\.profile-menu-item strong\s*\{[\s\S]*?font-size:\s*10\.5px\s*!important;[\s\S]*?-webkit-line-clamp:\s*2;/,
  "label do tile deixou de ser compacto ou voltou a ultrapassar duas linhas",
);
requireMatch(
  "N2/no-secondary",
  "scr/styles/build-1.4.8.10.css",
  /\.profile-menu-item p,[\s\S]*?\.profile-menu-item > svg\s*\{[\s\S]*?display:\s*none\s*!important;/,
  "subtitle ou chevron voltou ao grupo de apps",
);

if (failures.length) {
  console.error("\nACCQUA Build 1.4.8.10 — contratos visuais FALHARAM:\n");
  for (const failure of failures) console.error(` - ${failure}`);
  console.error(`\n${failures.length} contrato(s) 1.4.8.10 quebrado(s).`);
  process.exit(1);
}

console.log(`ACCQUA Build 1.4.8.10 — ${passes.length} contratos adicionais validados.`);
