import { readFile, writeFile } from "node:fs/promises";

const path = "scr/pages/AdminWorkoutBuilder.tsx";
let source = await readFile(path, "utf8");

const replacements = [
  {
    from: `import "./admin-workout-builder-v11.css";`,
    to: `import "./admin-workout-builder-v11.css";\nimport "./admin-workout-builder-v1486.css";`,
  },
  {
    from: `  const [checklistOpen, setChecklistOpen] = useState(true);`,
    to: `  const [checklistOpen, setChecklistOpen] = useState(false);`,
  },
  {
    from: `  const activeStepMeta =\n    BUILDER_STEPS.find((step) => step.key === mobileStep) ?? BUILDER_STEPS[0];`,
    to: `  const activeStepMeta =\n    BUILDER_STEPS.find((step) => step.key === mobileStep) ?? BUILDER_STEPS[0];\n  const activeStepIndex = Math.max(0, BUILDER_STEPS.findIndex((step) => step.key === mobileStep));`,
  },
  {
    from: `    <div className="admin-builder-screen">`,
    to: `    <div className={clsx("admin-builder-screen", \`is-step-\${mobileStep}\`)}>`,
  },
  {
    from: `        </nav>\n\n        <section className="admin-builder-readiness">`,
    to: `        </nav>\n\n        <div className="admin-builder-mobile-step-controls" aria-label="Navegação entre etapas">\n          <button\n            type="button"\n            disabled={activeStepIndex === 0}\n            onClick={() => {\n              const previous = BUILDER_STEPS[activeStepIndex - 1];\n              if (previous) showBuilderSection(previous.key);\n            }}\n          >\n            <AdminBackIcon size={16} />\n            Voltar\n          </button>\n\n          <span>\n            <small>ETAPA {activeStepMeta.number} DE {BUILDER_STEPS.length}</small>\n            <strong>{activeStepMeta.label}</strong>\n          </span>\n\n          <button\n            type="button"\n            disabled={activeStepIndex >= BUILDER_STEPS.length - 1}\n            onClick={() => {\n              const next = BUILDER_STEPS[activeStepIndex + 1];\n              if (next) showBuilderSection(next.key);\n            }}\n          >\n            Próximo\n            <AdminChevronIcon size={16} />\n          </button>\n        </div>\n\n        <section className="admin-builder-readiness">`,
  },
];

let changed = 0;
for (const replacement of replacements) {
  if (source.includes(replacement.to)) continue;
  if (!source.includes(replacement.from)) {
    throw new Error(`Build 1.4.8.6: expected pattern not found: ${replacement.from.slice(0, 90)}`);
  }
  source = source.replace(replacement.from, replacement.to);
  changed += 1;
}

await writeFile(path, source);
console.log(`Build 1.4.8.6 AdminWorkoutBuilder changes applied: ${changed}`);
