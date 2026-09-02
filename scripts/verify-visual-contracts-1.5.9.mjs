import "./verify-visual-contracts-1.5.8.mjs";
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

const css = "scr/styles/build-1.5.9.css";
const area = "scr/pages/AdminArea.tsx";
const entry = "scr/pages/WorkoutBuilderEntry.tsx";
const builder = "scr/pages/AdminWorkoutBuilder.tsx";
const admin = "scr/lib/admin.ts";

requireMatch("159/version", "package.json", /"version":\s*"1\.5\.9"/, "package não está em 1.5.9");
requireMatch("159/contracts", "package.json", /verify-visual-contracts-1\.5\.9\.mjs/, "npm não executa contratos 1.5.9");
requireMatch("159/css-last", "scr/main.tsx", /build-1\.5\.8\.css";\s*\nimport "\.\/styles\/build-1\.5\.9\.css";/, "camada 1.5.9 não é a última da cascata");

requireAll("159/roster-stable", area, [/studentsHydratedRef/, /if \(!studentsHydratedRef\.current\) setStudentsLoading\(true\)/], "lista não preserva dados durante atualização explícita");
requireAbsent("159/no-roster-poll", area, /setInterval\(refresh,\s*15000\)|addEventListener\("focus",\s*refresh\)|visibilitychange/, "polling/focus antigo ainda desmonta a lista");
requireAll("159/sticky-search", area, [/is-student-sticky/, /admin-dashboard-search-wrap/], "busca/filtros não usam grupo sticky");
requireAll("159/sticky-opaque", css, [/is-student-sticky[\s\S]*?position:\s*sticky/, /top:\s*0/, /background:\s*var\(--surface-deep/], "grupo sticky não é opaco/ancorado");
requireAll("159/pending-active", css, [/admin-area-pending\.has-pending/, /--surface-active/, /--text-on-active/, /--border-active/], "badge pendentes não usa tokens ativos");
requireAll("159/profile-grid", css, [/admin-student-summary-list[\s\S]*?gap:\s*12px/, /profile-menu-item[\s\S]*?border-radius:\s*16px/, /min-height:\s*44px/, /height:\s*84px/], "grid do perfil perdeu encaixe/touch target");

requireAll("159/template-plus", area, [/admin-template-add-v159/, /\/area-accqua\/montar\?modo=modelo/, /Criar novo modelo de treino/], "Modelos não possui entrada + dedicada");
requireAll("159/template-entry", entry, [/templateMode/, /WORKOUT_TEMPLATE_STUDENT_ID/, /montar\/editor\?student=/, /modo=modelo/], "modo modelo não converge no editor comum");
requireAll("159/template-context", admin, [/WORKOUT_TEMPLATE_STUDENT_ID/, /fullName:\s*"Modelo da equipe"/, /objective:\s*"Modelo reutilizável"/], "editor não possui contexto seguro sem aluno real");
requireAll("159/template-save", admin, [/input\.studentId === WORKOUT_TEMPLATE_STUDENT_ID/, /saveAdminProgramTemplate\(input\.staffId/, /programName:\s*modelName/], "salvar modo modelo não grava na biblioteca existente");
requireAll("159/template-return", builder, [/modelMode/, /section=templates/, /Modelo salvo na biblioteca da equipe/], "editor não retorna para Modelos após salvar");

if (failures.length) {
  console.error("\nACCQUA Build 1.5.9 — contratos FALHARAM:\n");
  failures.forEach((failure) => console.error(` - ${failure}`));
  console.error(`\n${failures.length} contrato(s) 1.5.9 quebrado(s).`);
  process.exit(1);
}
console.log(`ACCQUA Build 1.5.9 — ${passes.length} contratos validados.`);
