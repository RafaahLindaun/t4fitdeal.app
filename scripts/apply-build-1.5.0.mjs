import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const tsxPath = path.join(root, 'scr/pages/AdminWorkoutBuilder.tsx');
const cssPath = path.join(root, 'scr/pages/admin-workout-builder-v150.css');

let source = fs.readFileSync(tsxPath, 'utf8');

function replaceOnce(label, search, replacement) {
  const before = source;
  if (search instanceof RegExp) {
    source = source.replace(search, replacement);
  } else {
    source = source.replace(search, replacement);
  }
  if (source === before) throw new Error(`Build 1.5.0 transformer: replacement failed: ${label}`);
}

replaceOnce(
  'framer-motion imports',
  'import { useDrag } from "@use-gesture/react";\n',
  'import { useDrag } from "@use-gesture/react";\nimport { Reorder, useDragControls } from "framer-motion";\n',
);

replaceOnce(
  'v150 css import',
  'import "./admin-workout-builder-v1486.css";\n',
  'import "./admin-workout-builder-v1486.css";\nimport "./admin-workout-builder-v150.css";\n',
);

replaceOnce(
  'review step label',
  '{ key: "cardio", number: 4, label: "Cardio" },',
  '{ key: "cardio", number: 4, label: "Revisão" },',
);

replaceOnce(
  'drag handle component',
  /type ReorderGestureHandleProps = \{[\s\S]*?\n\}\n\nexport default function AdminWorkoutBuilder\(\) \{/,
`type ReorderGestureHandleProps = {
  label: string;
  dragControls: ReturnType<typeof useDragControls>;
};

function ReorderGestureHandle({
  label,
  dragControls,
}: ReorderGestureHandleProps) {
  return (
    <button
      type="button"
      className="admin-builder-reorder-handle accqua-pressable"
      aria-label={\`Arrastar para reordenar \${label}\`}
      title="Segure e arraste para reordenar"
      onPointerDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
        dragControls.start(event);
      }}
      onClick={(event) => event.stopPropagation()}
      style={{ touchAction: "none" }}
    >
      <span aria-hidden="true">⋮⋮</span>
    </button>
  );
}

type ReorderExerciseItemProps = {
  exercise: BuilderExercise;
  children: (dragControls: ReturnType<typeof useDragControls>) => ReactNode;
};

function ReorderExerciseItem({ exercise, children }: ReorderExerciseItemProps) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      as="div"
      value={exercise}
      dragListener={false}
      dragControls={dragControls}
      className="admin-builder-reorder-item"
      whileDrag={{ scale: 1.018, boxShadow: "0 18px 40px rgba(0, 0, 0, 0.28)" }}
      transition={{ duration: 0.18 }}
    >
      {children(dragControls)}
    </Reorder.Item>
  );
}

export default function AdminWorkoutBuilder() {`,
);

replaceOnce(
  'reorder handler',
  `  const moveExercise = (index: number, direction: -1 | 1) => {\n    const target = index + direction;\n    if (target < 0 || target >= activeRoutine.exercises.length) return;\n\n    const next = [...activeRoutine.exercises];\n    [next[index], next[target]] = [next[target], next[index]];\n\n    updateRoutine(activeRoutineIndex, {\n      exercises: reorder(next),\n    });\n  };\n`,
  `  const moveExercise = (index: number, direction: -1 | 1) => {\n    const target = index + direction;\n    if (target < 0 || target >= activeRoutine.exercises.length) return;\n\n    const next = [...activeRoutine.exercises];\n    [next[index], next[target]] = [next[target], next[index]];\n\n    updateRoutine(activeRoutineIndex, {\n      exercises: reorder(next),\n    });\n  };\n\n  const reorderActiveRoutineExercises = (nextExercises: BuilderExercise[]) => {\n    updateRoutine(activeRoutineIndex, {\n      exercises: reorder(nextExercises),\n    });\n  };\n`,
);

replaceOnce(
  'mobile story progress',
  `        </header>\n\n        <div className="admin-builder-guided-sticky">`,
  `        </header>\n\n        <section className="admin-builder-mobile-progress" aria-label="Progresso da montagem">\n          <div className="admin-builder-story-segments">\n            {BUILDER_STEPS.map((step, index) => {\n              const presentation = stepPresentation[step.key];\n              return (\n                <button\n                  type="button"\n                  key={step.key}\n                  className={clsx(\n                    index === activeStepIndex && "is-active",\n                    presentation.state === "complete" && "is-complete",\n                  )}\n                  onClick={() => showBuilderSection(step.key)}\n                  aria-label={\`\${step.label}: \${presentation.label}\`}\n                >\n                  <i />\n                </button>\n              );\n            })}\n          </div>\n          <div className="admin-builder-progress-copy">\n            <small>Etapa {activeStepMeta.number} de {BUILDER_STEPS.length}</small>\n            <strong>{activeStepMeta.label}</strong>\n          </div>\n        </section>\n\n        <div className="admin-builder-guided-sticky">`,
);

replaceOnce(
  'split selection stays in step',
  `                  onClick={() => {\n                    setMobileStep("rotina");\n                    changeSplit(option.code);\n                  }}\n`,
  `                  onClick={() => {\n                    changeSplit(option.code);\n                  }}\n`,
);

replaceOnce(
  'exercise reorder group open',
  `            <div className="admin-builder-exercise-list">\n              {activeRoutine.exercises.map((exercise, index) => {`,
  `            <Reorder.Group\n              as="div"\n              axis="y"\n              values={activeRoutine.exercises}\n              onReorder={reorderActiveRoutineExercises}\n              className="admin-builder-exercise-list"\n            >\n              {activeRoutine.exercises.map((exercise, index) => {`,
);

replaceOnce(
  'exercise reorder item open',
  `                return (\n                  <SwipeToRemove\n                    key={exercise.draftId}\n                    label={exercise.name}`,
  `                return (\n                  <ReorderExerciseItem key={exercise.draftId} exercise={exercise}>\n                    {(dragControls) => (\n                  <SwipeToRemove\n                    label={exercise.name}`,
);

replaceOnce(
  'drag handle usage',
  /<ReorderGestureHandle\n\s+index=\{index\}\n\s+total=\{activeRoutine\.exercises\.length\}\n\s+label=\{exercise\.name\}\n\s+onMove=\{\(direction\) => moveExercise\(index, direction\)\}\n\s+\/>/,
  `<ReorderGestureHandle\n                        label={exercise.name}\n                        dragControls={dragControls}\n                      />`,
);

replaceOnce(
  'exercise reorder item close',
  `                    </article>\n                  </SwipeToRemove>\n                );`,
  `                    </article>\n                  </SwipeToRemove>\n                    )}\n                  </ReorderExerciseItem>\n                );`,
);

replaceOnce(
  'exercise reorder group close',
  `              })}\n            </div>\n          )}\n        </section>\n\n        <section\n          ref={librarySectionRef}`,
  `              })}\n            </Reorder.Group>\n          )}\n        </section>\n\n        <section\n          ref={librarySectionRef}`,
);

replaceOnce(
  'review cardio label',
  '<small>CARDIO OPCIONAL</small>',
  '<small>REVISÃO · CARDIO OPCIONAL</small>',
);

replaceOnce(
  'mobile footer',
  `        <footer className="admin-builder-footer">\n          {saveAttempted && nextReadinessIssue ? (`,
  `        <footer className="admin-builder-footer">\n          <div className="admin-builder-mobile-footer">\n            <div className="admin-builder-mobile-footer-copy">\n              <small>ETAPA ATUAL</small>\n              <strong>{activeStepMeta.label}</strong>\n              <button\n                type="button"\n                className="admin-builder-mobile-save-template"\n                onClick={openTemplateName}\n                disabled={saving}\n              >\n                Salvar modelo\n              </button>\n            </div>\n\n            {activeStepIndex < BUILDER_STEPS.length - 1 ? (\n              <button\n                type="button"\n                className="admin-builder-mobile-primary"\n                onClick={() => {\n                  const next = BUILDER_STEPS[activeStepIndex + 1];\n                  if (next) showBuilderSection(next.key);\n                }}\n              >\n                Próximo\n                <AdminChevronIcon size={17} />\n              </button>\n            ) : (\n              <button\n                type="button"\n                className="admin-builder-mobile-primary"\n                onClick={() => void publish()}\n                disabled={saving}\n              >\n                <AdminCheckIcon size={17} />\n                {saving ? "Salvando..." : "Salvar treino"}\n              </button>\n            )}\n          </div>\n\n          {saveAttempted && nextReadinessIssue ? (`,
);

fs.writeFileSync(tsxPath, source);

const css = `/* ACCQUA Sports — Build 1.5.0
   Mobile workout-builder information architecture. */

.admin-builder-mobile-progress,
.admin-builder-mobile-footer {
  display: none;
}

.admin-builder-reorder-item {
  min-width: 0;
}

@media (max-width: 1023px) {
  .admin-builder-screen {
    height: 100dvh;
    min-height: 0;
    overflow: hidden;
  }

  .admin-builder-shell {
    height: 100%;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior-y: contain;
    -webkit-overflow-scrolling: touch;
    padding-bottom: max(118px, calc(env(safe-area-inset-bottom) + 108px));
  }

  .admin-builder-header {
    position: sticky;
    top: 0;
    z-index: 110;
    background: var(--surface-deep);
  }

  .admin-builder-mobile-progress {
    position: sticky;
    top: 56px;
    z-index: 108;
    display: grid;
    gap: 7px;
    padding: 8px 16px 10px;
    border-bottom: 1px solid color-mix(in srgb, var(--builder-line) 72%, transparent);
    background: color-mix(in srgb, var(--surface-deep) 96%, transparent);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
  }

  .admin-builder-story-segments {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 6px;
  }

  .admin-builder-story-segments button {
    min-width: 0;
    height: 14px;
    padding: 5px 0;
    border: 0;
    background: transparent;
  }

  .admin-builder-story-segments button i {
    display: block;
    width: 100%;
    height: 4px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--text-tertiary) 34%, transparent);
    transition: background 180ms ease, transform 180ms ease;
  }

  .admin-builder-story-segments button.is-complete i {
    background: var(--status-success);
  }

  .admin-builder-story-segments button.is-active i {
    background: var(--accent);
    transform: scaleY(1.35);
  }

  .admin-builder-progress-copy {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .admin-builder-progress-copy small {
    color: var(--text-tertiary);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
  }

  .admin-builder-progress-copy strong {
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 800;
  }

  .admin-builder-context-bar,
  .admin-builder-step-nav,
  .admin-builder-mobile-step-controls,
  .admin-builder-readiness {
    display: none !important;
  }

  .admin-builder-guided-sticky {
    position: static;
  }

  .admin-builder-guide-button {
    color: var(--text-primary) !important;
    border: 1px solid var(--builder-line) !important;
    background: color-mix(in srgb, var(--surface-raised) 56%, transparent) !important;
    box-shadow: none !important;
  }

  .admin-builder-program-heading > span,
  .admin-builder-program-heading small,
  .admin-builder-routine-card header small,
  .admin-builder-selected header small,
  .admin-builder-cardio-toggle small {
    color: var(--text-secondary);
  }

  .admin-builder-split-options button.is-active,
  .admin-builder-routine-tabs button.is-active,
  .admin-builder-groups button.is-active,
  .admin-builder-week-days button.is-active {
    color: #fff !important;
    border-color: var(--brand-blue) !important;
    background: color-mix(in srgb, var(--brand-blue) 82%, var(--surface-raised)) !important;
  }

  .admin-builder-split-options {
    width: calc(100% + 32px);
    margin-inline: -16px;
    padding: 4px 16px 10px;
    display: flex !important;
    gap: 12px;
    overflow-x: auto;
    overflow-y: visible;
    scroll-snap-type: x mandatory;
    scroll-padding-inline: 16px;
    overscroll-behavior-inline: contain;
    scrollbar-width: none;
  }

  .admin-builder-split-options::-webkit-scrollbar { display: none; }

  .admin-builder-split-options button {
    flex: 0 0 88px;
    min-width: 88px;
    scroll-snap-align: center;
    border-radius: 16px;
    background: color-mix(in srgb, var(--surface-raised) 68%, var(--surface-deep));
    transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
  }

  .admin-builder-split-options button.is-active {
    transform: scale(1.05);
  }

  .admin-builder-footer {
    position: fixed;
    left: 12px;
    right: 12px;
    bottom: calc(12px + env(safe-area-inset-bottom));
    z-index: 140;
    padding: 10px 12px;
    border-radius: 22px;
    background: color-mix(in srgb, var(--surface-base) 97%, transparent);
    box-shadow: 0 18px 46px rgba(0, 0, 0, .32);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  .admin-builder-footer-summary,
  .admin-builder-footer-actions {
    display: none !important;
  }

  .admin-builder-mobile-footer {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
  }

  .admin-builder-mobile-footer-copy {
    min-width: 0;
    display: grid;
    gap: 1px;
  }

  .admin-builder-mobile-footer-copy > small {
    color: var(--text-tertiary);
    font-size: 9px;
    font-weight: 850;
    letter-spacing: .08em;
  }

  .admin-builder-mobile-footer-copy > strong {
    overflow: hidden;
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 850;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .admin-builder-mobile-save-template {
    width: max-content;
    padding: 2px 0;
    color: var(--text-secondary);
    border: 0;
    background: transparent;
    font-size: 11px;
    font-weight: 700;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .admin-builder-mobile-primary {
    min-width: 116px;
    min-height: 48px;
    padding: 0 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    color: #07162d;
    border: 1px solid var(--accent);
    border-radius: 15px;
    background: var(--accent);
    font-size: 13px;
    font-weight: 900;
    box-shadow: 0 10px 28px color-mix(in srgb, var(--accent) 18%, transparent);
  }

  .admin-builder-save-warning {
    position: fixed;
    left: 16px;
    right: 16px;
    bottom: calc(92px + env(safe-area-inset-bottom));
    z-index: 142;
  }

  .admin-builder-reorder-item {
    position: relative;
    min-width: 0;
    list-style: none;
  }

  .admin-builder-reorder-handle {
    width: 44px !important;
    min-width: 44px !important;
    height: 44px !important;
    min-height: 44px !important;
    display: inline-flex !important;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--builder-line);
    border-radius: 12px;
    background: color-mix(in srgb, var(--surface-deep) 74%, var(--surface-raised));
    cursor: grab;
    touch-action: none;
  }

  .admin-builder-reorder-handle:active { cursor: grabbing; }

  .admin-builder-reorder-handle > span {
    font-size: 20px;
    line-height: 1;
    letter-spacing: -4px;
    transform: rotate(90deg);
  }

  .admin-builder-exercise-summary {
    grid-template-columns: 44px minmax(0, 1fr) auto !important;
  }

  .admin-builder-exercise-summary > .admin-builder-selected-gif {
    display: none;
  }

  .admin-builder-exercise-summary > .admin-builder-reorder-handle {
    grid-column: 1;
    grid-row: 1 / span 2;
  }

  .admin-builder-exercise-copy {
    grid-column: 2;
  }

  .admin-builder-quick-tune {
    grid-column: 2 / -1;
  }

  .admin-builder-exercise-controls {
    display: none !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  .admin-builder-story-segments button i,
  .admin-builder-split-options button {
    transition-duration: 1ms !important;
  }
}
`;

fs.writeFileSync(cssPath, css);

console.log('Build 1.5.0 transformer applied successfully.');
