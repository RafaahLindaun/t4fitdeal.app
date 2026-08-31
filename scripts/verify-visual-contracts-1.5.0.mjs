import "./verify-visual-contracts-1.4.8.10.mjs";
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

// P1 — one mobile progress system: stories segments + contextual review disclosure.
requireMatch(
  "P1/story-progress",
  "scr/pages/AdminWorkoutBuilder.tsx",
  /admin-builder-mobile-progress[\s\S]*?admin-builder-story-segments[\s\S]*?Etapa \{activeStepMeta\.number\} de \{BUILDER_STEPS\.length\}/,
  "barra segmentada de progresso não está presente",
);
requireMatch(
  "P1/review-step",
  "scr/pages/AdminWorkoutBuilder.tsx",
  /\{ key: "cardio", number: 4, label: "Revisão" \}/,
  "quarta etapa deixou de ser apresentada como Revisão",
);
requireMatch(
  "P1/hide-duplicates",
  "scr/pages/admin-workout-builder-v150.css",
  /\.admin-builder-context-bar,[\s\S]*?\.admin-builder-step-nav,[\s\S]*?\.admin-builder-mobile-step-controls\s*\{[\s\S]*?display:\s*none\s*!important;/,
  "indicadores antigos voltaram a competir no mobile",
);
requireMatch(
  "P1/contextual-readiness",
  "scr/pages/AdminWorkoutBuilder.tsx",
  /className=\{clsx\("admin-builder-readiness", !nextReadinessIssue && "is-complete"\)\}/,
  "revisão não diferencia ausência de pendências",
);
requireMatch(
  "P1/readiness-final-only",
  "scr/pages/admin-workout-builder-v150.css",
  /\.admin-builder-screen\.is-step-cardio \.admin-builder-readiness:not\(\.is-complete\)\s*\{[\s\S]*?display:\s*block\s*!important;/,
  "preparação não está restrita à etapa final quando existe pendência",
);

// P4 — scroll ownership + one contextual primary action in the fixed footer.
requireMatch(
  "P4/scroll-chain",
  "scr/pages/admin-workout-builder-v150.css",
  /\.admin-builder-screen\s*\{[\s\S]*?height:\s*100dvh;[\s\S]*?min-height:\s*0;[\s\S]*?overflow:\s*hidden;[\s\S]*?\.admin-builder-shell\s*\{[\s\S]*?min-height:\s*0;[\s\S]*?overflow-y:\s*auto;/,
  "scroll mobile não está isolado no conteúdo rolável",
);
requireMatch(
  "P4/context-footer",
  "scr/pages/AdminWorkoutBuilder.tsx",
  /admin-builder-mobile-footer[\s\S]*?activeStepIndex < BUILDER_STEPS\.length - 1[\s\S]*?>\s*Próximo[\s\S]*?Salvar treino/,
  "footer mobile não alterna Próximo/Salvar conforme etapa",
);
requireMatch(
  "P4/template-link",
  "scr/pages/admin-workout-builder-v150.css",
  /\.admin-builder-mobile-save-template\s*\{[\s\S]*?background:\s*transparent;[\s\S]*?text-decoration:\s*underline;/,
  "Salvar modelo voltou a competir como botão primário",
);
requireMatch(
  "P4/legacy-footer-hidden",
  "scr/pages/admin-workout-builder-v150.css",
  /\.admin-builder-footer-summary,[\s\S]*?\.admin-builder-footer-actions\s*\{[\s\S]*?display:\s*none\s*!important;/,
  "resumo/dupla ação antigos voltaram ao footer mobile",
);

// P2 — semantic hierarchy: neutral helper, blue selection, yellow primary, green complete.
requireMatch(
  "P2/neutral-guide",
  "scr/pages/admin-workout-builder-v150.css",
  /\.admin-builder-guide-button\s*\{[\s\S]*?background:\s*color-mix\([^}]*var\(--surface-raised\)/,
  "Montagem guiada voltou a usar destaque primário",
);
requireMatch(
  "P2/blue-selection",
  "scr/pages/admin-workout-builder-v150.css",
  /\.admin-builder-split-options button\.is-active,[\s\S]*?border-color:\s*var\(--brand-blue\)\s*!important;[\s\S]*?background:\s*color-mix\([^}]*var\(--brand-blue\)/,
  "seleção deixou de usar azul",
);
requireMatch(
  "P2/yellow-primary",
  "scr/pages/admin-workout-builder-v150.css",
  /\.admin-builder-mobile-primary\s*\{[\s\S]*?background:\s*var\(--accent\);/,
  "ação primária mobile deixou de usar o accent amarelo",
);
requireMatch(
  "P2/green-complete",
  "scr/pages/admin-workout-builder-v150.css",
  /\.admin-builder-story-segments button\.is-complete i\s*\{[\s\S]*?background:\s*var\(--status-success\);/,
  "segmento concluído deixou de usar verde semântico",
);

// P3 — horizontal snap carousel for workout split selection.
requireMatch(
  "P3/carousel",
  "scr/pages/admin-workout-builder-v150.css",
  /\.admin-builder-split-options\s*\{[\s\S]*?display:\s*flex\s*!important;[\s\S]*?overflow-x:\s*auto;[\s\S]*?scroll-snap-type:\s*x mandatory;/,
  "divisão voltou a ser grid estático",
);
requireMatch(
  "P3/chip",
  "scr/pages/admin-workout-builder-v150.css",
  /\.admin-builder-split-options button\s*\{[\s\S]*?min-width:\s*88px;[\s\S]*?scroll-snap-align:\s*center;[\s\S]*?border-radius:\s*16px;/,
  "chips do carrossel perderam largura/snap",
);
requireMatch(
  "P3/selected-scale",
  "scr/pages/admin-workout-builder-v150.css",
  /\.admin-builder-split-options button\.is-active\s*\{[\s\S]*?transform:\s*scale\(1\.05\);/,
  "seleção do carrossel perdeu feedback de escala",
);

// P5 — Framer Motion Reorder drives state order; publish already persists routines.
requireMatch(
  "P5/framer-reorder",
  "scr/pages/AdminWorkoutBuilder.tsx",
  /import \{ Reorder, useDragControls \} from "framer-motion";/,
  "reordenação deixou de usar a biblioteca instalada",
);
requireMatch(
  "P5/reorder-group",
  "scr/pages/AdminWorkoutBuilder.tsx",
  /<Reorder\.Group[\s\S]*?axis="y"[\s\S]*?values=\{activeRoutine\.exercises\}[\s\S]*?onReorder=\{reorderActiveRoutineExercises\}/,
  "lista não envia a nova ordem ao estado",
);
requireMatch(
  "P5/state-persistence",
  "scr/pages/AdminWorkoutBuilder.tsx",
  /const reorderActiveRoutineExercises = \(nextExercises: BuilderExercise\[\]\) => \{[\s\S]*?updateRoutine\(activeRoutineIndex,[\s\S]*?exercises:\s*reorder\(nextExercises\)/,
  "ordem arrastada não persiste em routines",
);
requireMatch(
  "P5/drag-handle",
  "scr/pages/AdminWorkoutBuilder.tsx",
  /dragControls\.start\(event\)/,
  "handle não inicia drag controlado",
);
requireMatch(
  "P5/touch-target",
  "scr/pages/admin-workout-builder-v150.css",
  /\.admin-builder-reorder-handle\s*\{[\s\S]*?width:\s*44px\s*!important;[\s\S]*?height:\s*44px\s*!important;/,
  "handle de reordenação deixou de respeitar 44px",
);

if (failures.length) {
  console.error("\nACCQUA Build 1.5.0 — contratos P1–P5 FALHARAM:\n");
  for (const failure of failures) console.error(` - ${failure}`);
  console.error(`\n${failures.length} contrato(s) 1.5.0 quebrado(s).`);
  process.exit(1);
}

console.log(`ACCQUA Build 1.5.0 — ${passes.length} contratos P1–P5 validados.`);
