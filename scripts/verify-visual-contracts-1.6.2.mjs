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

requireMatch("162/version", "package.json", /"version":\s*"1\.6\.2"/, "package não está em 1.6.2");
requireMatch("162/contracts", "package.json", /verify-visual-contracts-1\.6\.2\.mjs/, "npm não executa contratos 1.6.2");
requireMatch("162/css-last", "scr/main.tsx", /build-1\.6\.0\.css";\s*\nimport "\.\/styles\/build-1\.6\.2\.css";/, "camada 1.6.2 não está depois da 1.6.0");
requireAll("162/entry-copy", "scr/styles/build-1.6.2.css", [/staff-action-card-copy/,/line-clamp:3/,/staff-action-card-icon/], "cards de entrada continuam suscetíveis a sobreposição");
requireAll("162/stepper", "scr/pages/AdminWorkoutBuilder.tsx", [/admin-builder-progress-v162/,/admin-builder-step-orb/,/AdminCheckIcon/], "stepper grande 1–4 ausente");
requireAll("162/split-yellow", "scr/styles/build-1.6.2.css", [/admin-builder-split-options button\.is-active/,/#ffd128!important/], "divisão selecionada não usa amarelo");
requireAll("162/set-types", "scr/lib/admin.ts", [/setType:\s*"normal"\s*\|\s*"biset"\s*\|\s*"triset"/,/setGroupId/,/setGroupOrder/], "modelo de bi-set/tri-set ausente");
requireAll("162/set-editor", "scr/pages/AdminWorkoutBuilder.tsx", [/Tipo de série/,/Bi-set/,/Tri-set/,/setExerciseSeriesType/], "editor não configura bi-set/tri-set");
requireAll("162/review", "scr/pages/AdminWorkoutBuilder.tsx", [/admin-builder-review-summary/,/RESUMO PARA PUBLICAÇÃO/,/admin-builder-review-exercises/], "etapa Revisão não mostra resumo completo");
requireAll("162/rest-pref", "scr/lib/profile.ts", [/restRequired:\s*boolean/,/rest_required/,/loadRestRequiredPreference/], "preferência de repouso não persiste");
requireMatch("162/rest-toggle", "scr/pages/Profile.tsx", /Repouso obrigatório entre séries/, "toggle de repouso ausente no Perfil");
requireAll("162/timer", "scr/components/TimerOverlay.tsx", [/accqua-timer-overlay/,/strokeDasharray/,/accqua-logo-header\.png/], "overlay compartilhado de timer incompleto");
requireAll("162/workout-groups", "scr/pages/Treino.tsx", [/setGroupId/,/kind:\s*"group"/,/TimerOverlay/], "execução não alterna grupos ou não usa overlay");
requireAll("162/cardio-overlay", "scr/pages/Cardio.tsx", [/TimerOverlay/,/Pausar cardio/], "cardio não usa overlay compartilhado");
requireAbsent("162/no-uppercase-fallback", "scr/lib/admin.ts", /\/gifs\/[^"']+\.GIF/, "fallback ainda contém extensão .GIF maiúscula");

if (failures.length) {
  console.error("\nACCQUA Build 1.6.2 — contratos FALHARAM:\n");
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}
console.log(`ACCQUA Build 1.6.2 — ${passes.length} contratos validados.`);
