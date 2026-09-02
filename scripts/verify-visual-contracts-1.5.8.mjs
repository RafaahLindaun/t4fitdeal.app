import "./verify-visual-contracts-1.5.7.mjs";
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

const css = "scr/styles/build-1.5.8.css";
const entry = "scr/pages/WorkoutBuilderEntry.tsx";

requireMatch("158/version", "package.json", /"version":\s*"(?:1\.5\.[3-9]|1\.(?:[6-9]|\d{2,})\.\d+)"/, "package não está em 1.5.8");
requireMatch("158/contracts", "package.json", /verify-visual-contracts-(?:1\.5\.[3-9]|1\.(?:[6-9]|\d{2,})\.\d+)\.mjs/, "npm não executa contratos 1.5.8");
requireMatch("158/css-last", "scr/main.tsx", /build-1\.5\.7\.css";\s*\nimport "\.\/styles\/build-1\.5\.8\.css";/, "camada 1.5.8 não é a última da cascata");

requireAll("158/shared-motion", "scr/lib/staffMotion.ts", [/hover:\s*\{\s*y:\s*-3,\s*scale:\s*1\.01/, /tap:\s*\{\s*y:\s*0,\s*scale:\s*0\.975/, /hover:\s*\{\s*x:\s*2,\s*y:\s*-1/], "motion Staff não segue padrão compartilhado");
requireAll("158/action-card", "scr/components/StaffActionCard.tsx", [/motion\.button/, /staffCardVariants/, /staffIconVariants/, /staff-action-card/], "card de ação compartilhado não está versionado");
requireAll("158/sidebar-flow-collapse", "scr/components/StaffLayout.tsx", [/startsWith\("\/area-accqua\/montar"\)/, /setSidebarCollapsed\(true\)/, /Build158MotionBridge/], "sidebar/editor não compartilham o fluxo 1.5.8");

requireAll("158/assistant-motion", entry, [/AnimatePresence/, /questionVariants/, /duration:\s*0\.22/, /GUIDE_SELECTION_DELAY\s*=\s*160/], "assistente não confirma e move uma pergunta por vez");
requireAll("158/assistant-swipe", entry, [/SWIPE_OFFSET\s*=\s*70/, /SWIPE_VELOCITY\s*=\s*600/, /Math\.abs\(info\.offset\.y\)\s*>\s*Math\.abs\(info\.offset\.x\)/, /dragControls/], "swipe do assistente não possui threshold/eixo seguro");
requireAll("158/assistant-state", entry, [/guideGoal/, /guideLevel/, /guideDays/, /moveGuide\(guideStep - 1\)/], "respostas anteriores podem se perder ao voltar");
requireAll("158/assistant-finish", entry, [/Entendi o perfil/, /Montando uma sugestão\.\.\./, /openEditor\(guidedDraft/], "fim do assistente não converge no editor comum");
requireAll("158/method-cards", entry, [/StaffActionCard/, /Montar manualmente/, /Assistente guiado/, /Modelo salvo/, /Descrever pra IA/], "quatro métodos não usam o card interativo compartilhado");

requireAll("158/root-structure", css, [/admin-builder-screen \*/, /min-width:\s*0/, /min-height:\s*0/, /admin-builder-shell/], "raiz do montador continua sem min-size seguro");
requireAbsent("158/no-100vw", css, /100vw/, "camada 1.5.8 voltou a usar largura da viewport dentro do Staff");
requireAll("158/progressive-disclosure", css, [/is-step-programa \.admin-builder-program-card/, /is-step-rotina \.admin-builder-routines/, /is-step-exercicios \.admin-builder-selected/, /is-step-cardio \.admin-builder-cardio/], "etapas continuam disputando a mesma viewport");
requireAll("158/days-reflow", css, [/grid-template-columns:\s*repeat\(auto-fit,minmax\(240px,1fr\)\)/, /opacity:\s*\.72/, /transform:\s*scale\(\.985\)/], "Dias não reflowa/foca seleção estruturalmente");
requireAll("158/exercise-wide", css, [/minmax\(300px,\.85fr\)\s+minmax\(420px,1\.35fr\)\s+minmax\(240px,\.7fr\)/, /minmax\(280px,\.8fr\)\s+minmax\(0,1\.2fr\)/, /max-width:1180px/], "Exercícios não alterna 3→2 colunas pela largura real");
requireAll("158/secondary-yields", css, [/is-step-exercicios \.admin-builder-desktop-aside\s*\{\s*display:\s*none\s*!important/, /admin-builder-library-list[\s\S]*?overflow-y:\s*auto/], "painel secundário não cede antes das áreas principais");
requireAll("158/muscle-local-scroll", css, [/admin-builder-groups,[\s\S]*?overflow-x:\s*auto\s*!important/, /padding-right:\s*24px\s*!important/], "filtros musculares não têm scroll local completo");
requireAll("158/exercise-readable", css, [/admin-builder-exercise-copy strong[\s\S]*?-webkit-line-clamp:\s*2/, /white-space:\s*normal\s*!important/], "nome de exercício voltou a ellipsis agressivo");
requireAll("158/review-summary", css, [/is-step-cardio \.admin-builder-program-fields[\s\S]*?display:\s*none\s*!important/, /is-step-cardio \.admin-builder-routine-card[\s\S]*?display:\s*none\s*!important/], "Revisão ainda reapresenta ferramentas de edição completas");
requireAll("158/footer-flow", css, [/admin-builder-footer[\s\S]*?position:\s*static\s*!important/, /@media \(max-width:1023px\)[\s\S]*?admin-builder-footer[\s\S]*?position:\s*sticky\s*!important/], "footer ainda depende de posicionamento fixo sobre conteúdo");
requireAbsent("158/footer-no-fixed", css, /admin-builder-footer\s*\{[^}]*position:\s*fixed/s, "footer 1.5.8 voltou a cobrir campos");

requireAll("158/step-direction", "scr/components/Build158MotionBridge.tsx", [/MutationObserver/, /stepDirection/, /"forward"\s*:\s*"back"|"forward" \| "back"/, /scrollTo/], "transição das quatro etapas não conhece direção");
requireAll("158/step-animation", css, [/@keyframes build158-step-in-forward/, /translateX\(24px\)/, /@keyframes build158-step-in-back/, /translateX\(-24px\)/], "etapas não entram lateralmente");
requireAll("158/mobile-one-step", css, [/@media \(max-width:1023px\)/, /is-step-programa \.admin-builder-program-card/, /is-step-exercicios \.admin-builder-selected/, /position:\s*sticky\s*!important/], "mobile não mantém uma etapa por vez/footer em fluxo");
requireAll("158/reduced-motion", css, [/prefers-reduced-motion:\s*reduce/, /animation:\s*none\s*!important/], "movimento não respeita redução de animação");

if (failures.length) {
  console.error("\nACCQUA Build 1.5.8 — contratos FALHARAM:\n");
  failures.forEach((failure) => console.error(` - ${failure}`));
  console.error(`\n${failures.length} contrato(s) 1.5.8 quebrado(s).`);
  process.exit(1);
}
console.log(`ACCQUA Build 1.5.8 — ${passes.length} contratos validados.`);
