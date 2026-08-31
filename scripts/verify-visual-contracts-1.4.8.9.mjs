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

// M1 / L — o flag real "Sem treino" precisa de amarelo da marca + texto escuro.
requireMatch(
  "M1/exact-no-workout",
  "scr/styles/build-1.4.8.9.css",
  /\.admin-student-flags i\.is-no-workout\s*\{[\s\S]*?color:\s*#07162d\s*!important;[\s\S]*?background:\s*#ffd128\s*!important;/,
  "flag local Sem treino voltou a usar texto amarelo sobre amarelo",
);
requireMatch(
  "L/warning-system",
  "scr/components/status-badge.css",
  /\.accqua-status-badge\.is-warning\s*\{[\s\S]*?color:\s*#07162d;[\s\S]*?background:\s*#ffd128;/,
  "StatusBadge warning perdeu o par de contraste canônico",
);

// M2 / K — decoração da lista de alunos é removida, não reposicionada.
requireMatch(
  "M2/remove-blob",
  "scr/styles/build-1.4.8.9.css",
  /\.admin-area-screen:has\(\.admin-dashboard-roster\) \.admin-area-background span,[\s\S]*?\.admin-area-background i\s*\{[\s\S]*?display:\s*none\s*!important;/,
  "formas decorativas continuam visíveis atrás do roster mobile",
);
requireMatch(
  "K/base-only",
  "scr/styles/build-1.4.8.9.css",
  /\.admin-area-screen:has\(\.admin-dashboard-roster\) \.admin-area-background\s*\{[\s\S]*?background:\s*linear-gradient\(/,
  "fundo do roster não foi simplificado para a superfície base",
);

// M3 / I — header sticky precisa ser opaco e ficar acima dos cards durante todo o scroll.
requireMatch(
  "M3/solid-header",
  "scr/styles/build-1.4.8.9.css",
  /is-student-detail-screen[\s\S]*?\.admin-area-header\s*\{[\s\S]*?z-index:\s*90\s*!important;[\s\S]*?background:\s*var\(--surface-deep\)\s*!important;/,
  "header Professor/Administração voltou a ficar translúcido ou abaixo dos cards",
);
requireMatch(
  "M3/backplate",
  "scr/styles/build-1.4.8.9.css",
  /\.admin-area-header::before\s*\{[\s\S]*?inset:\s*-12px\s+-16px\s+-9px;[\s\S]*?background:\s*var\(--surface-deep\);/,
  "backplate sólido do header sticky ausente",
);

// N — atalhos do perfil em grupo de apps compacto apenas no mobile.
requireMatch(
  "N/grid",
  "scr/styles/build-1.4.8.9.css",
  /\.admin-student-summary-list\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)\s*!important;/,
  "atalhos do perfil deixaram de usar grid de três colunas no mobile",
);
requireMatch(
  "N/tile",
  "scr/styles/build-1.4.8.9.css",
  /\.profile-menu-item\s*\{[\s\S]*?aspect-ratio:\s*1\s*\/\s*1\s*!important;[\s\S]*?border-radius:\s*16px\s*!important;/,
  "tiles do grupo de apps perderam proporção/raio compacto",
);
requireMatch(
  "N/compact-copy",
  "scr/styles/build-1.4.8.9.css",
  /\.profile-menu-item p,[\s\S]*?\.profile-menu-item > svg\s*\{[\s\S]*?display:\s*none\s*!important;/,
  "subtitle ou chevron voltou ao grid mobile",
);
requireMatch(
  "N/status-dot",
  "scr/styles/build-1.4.8.9.css",
  /data-subtitle-tone="warning"\]\s*::after[\s\S]*?background:\s*#ffd128;/,
  "indicador semântico compacto dos tiles ausente",
);

if (failures.length) {
  console.error("\nACCQUA Build 1.4.8.9 — contratos visuais adicionais FALHARAM:\n");
  for (const failure of failures) console.error(` - ${failure}`);
  console.error(`\n${failures.length} contrato(s) 1.4.8.9 quebrado(s).`);
  process.exit(1);
}

console.log(`ACCQUA Build 1.4.8.9 — ${passes.length} contratos visuais adicionais validados.`);
