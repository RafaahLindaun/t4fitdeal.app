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
      aria-label={\`Arrastar para reordenar ${label}\`}
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
  `        </header>\n\n        <section className="admin-builder-mobile-progress" aria-label="Progresso da montagem">\n          <div className="admin-builder-story-segments">\n            {BUILDER_STEPS.map((step, index) => {\n              const presentation = stepPresentation[step.key];\n              return (\n                <button\n                  type="button"\n                  key={step.key}\n                  className={clsx(\n                    index === activeStepIndex && "is-active",\n                    presentation.state === "complete" && "is-complete",\n                  )}\n                  onClick={() => showBuilderSection(step.key)}\n                  aria-label={\`${step.label}: ${presentation.label}\`}\n                >\n                  <i />\n                </button>\n              );\n            })}\n          </div>\n          <div className="admin-builder-progress-copy">\n            <small>Etapa {activeStepMeta.number} de {BUILDER_STEPS.length}</small>\n            <strong>{activeStepMeta.label}</strong>\n          </div>\n        </section>\n\n        <div className="admin-builder-guided-sticky">`,
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

const css = `/* ACCQUA Sports — Build 1.5.0\n   Mobile workout-builder information architecture. */\n\n.admin-builder-mobile-progress,\n.admin-builder-mobile-footer {\n  display: none;\n}\n\n.admin-builder-reorder-item {\n  min-width: 0;\n}\n\n@media (max-width: 1023px) {\n  .admin-builder-screen {\n    height: 100dvh;\n    min-height: 0;\n    overflow: hidden;\n  }\n\n  .admin-builder-shell {\n    height: 100%;\n    min-height: 0;\n    overflow-x: hidden;\n    overflow-y: auto;\n    overscroll-behavior-y: contain;\n    -webkit-overflow-scrolling: touch;\n    padding-bottom: max(118px, calc(env(safe-area-inset-bottom) + 108px));\n  }\n\n  .admin-builder-header {\n    position: sticky;\n    top: 0;\n    z-index: 110;\n    background: var(--surface-deep);\n  }\n\n  .admin-builder-mobile-progress {\n    position: sticky;\n    top: 56px;\n    z-index: 108;\n    display: grid;\n    gap: 7px;\n    padding: 8px 16px 10px;\n    border-bottom: 1px solid color-mix(in srgb, var(--builder-line) 72%, transparent);\n    background: color-mix(in srgb, var(--surface-deep) 96%, transparent);\n    backdrop-filter: blur(18px);\n    -webkit-backdrop-filter: blur(18px);\n  }\n\n  .admin-builder-story-segments {\n    display: grid;\n    grid-template-columns: repeat(4, minmax(0, 1fr));\n    gap: 6px;\n  }\n\n  .admin-builder-story-segments button {\n    min-width: 0;\n    height: 14px;\n    padding: 5px 0;\n    border: 0;\n    background: transparent;\n  }\n\n  .admin-builder-story-segments button i {\n    display: block;\n    width: 100%;\n    height: 4px;\n    border-radius: 999px;\n    background: color-mix(in srgb, var(--text-tertiary) 34%, transparent);\n    transition: background 180ms ease, transform 180ms ease;\n  }\n\n  .admin-builder-story-segments button.is-complete i {\n    background: var(--status-success);\n  }\n\n  .admin-builder-story-segments button.is-active i {\n    background: var(--accent);\n    transform: scaleY(1.35);\n  }\n\n  .admin-builder-progress-copy {\n    display: flex;\n    align-items: center;\n    justify-content: space-between;\n    gap: 12px;\n  }\n\n  .admin-builder-progress-copy small {\n    color: var(--text-tertiary);\n    font-size: 10px;\n    font-weight: 800;\n    letter-spacing: .08em;\n    text-transform: uppercase;\n  }\n\n  .admin-builder-progress-copy strong {\n    color: var(--text-primary);\n    font-size: 13px;\n    font-weight: 800;\n  }\n\n  /* P1: remove every competing progress representation on mobile. */\n  .admin-builder-context-bar,\n  .admin-builder-step-nav,\n  .admin-builder-mobile-step-controls,\n  .admin-builder-readiness {\n    display: none !important;\n  }\n\n  .admin-builder-guided-sticky {\n    position: static;\n  }\n\n  /* P2: yellow is reserved for current progress + the one primary action. */\n  .admin-builder-guide-button {\n    color: var(--text-primary) !important;\n    border: 1px solid var(--builder-line) !important;\n    background: color-mix(in srgb, var(--surface-raised) 56%, transparent) !important;\n    box-shadow: none !important;\n  }\n\n  .admin-builder-program-heading > span,\n  .admin-builder-program-heading small,\n  .admin-builder-routine-card header small,\n  .admin-builder-selected header small,\n  .admin-builder-cardio-toggle small {\n    color: var(--text-secondary);\n  }\n\n  .admin-builder-split-options button.is-active,\n  .admin-builder-routine-tabs button.is-active,\n  .admin-builder-groups button.is-active,\n  .admin-builder-week-days button.is-active {\n    color: #fff !important;\n    border-color: var(--brand-blue) !important;\n    background: color-mix(in srgb, var(--brand-blue) 82%, var(--surface-raised)) !important;\n  }\n\n  /* P3: swipeable split selector. */\n  .admin-builder-split-options {\n    width: calc(100% + 32px);\n    margin-inline: -16px;\n    padding: 4px 16px 10px;\n    display: flex !important;\n    gap: 12px;\n    overflow-x: auto;\n    overflow-y: visible;\n    scroll-snap-type: x mandatory;\n    scroll-padding-inline: 16px;\n    overscroll-behavior-inline: contain;\n    scrollbar-width: none;\n  }\n\n  .admin-builder-split-options::-webkit-scrollbar { display: none; }\n\n  .admin-builder-split-options button {\n    flex: 0 0 88px;\n    min-width: 88px;\n    scroll-snap-align: center;\n    border-radius: 16px;\n    background: color-mix(in srgb, var(--surface-raised) 68%, var(--surface-deep));\n    transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;\n  }\n\n  .admin-builder-split-options button.is-active {\n    transform: scale(1.05);\n  }\n\n  /* P4: one contextual footer action. */\n  .admin-builder-footer {\n    position: fixed;\n    left: 12px;\n    right: 12px;\n    bottom: calc(12px + env(safe-area-inset-bottom));\n    z-index: 140;\n    padding: 10px 12px;\n    border-radius: 22px;\n    background: color-mix(in srgb, var(--surface-base) 97%, transparent);\n    box-shadow: 0 18px 46px rgba(0, 0, 0, .32);\n    backdrop-filter: blur(20px);\n    -webkit-backdrop-filter: blur(20px);\n  }\n\n  .admin-builder-footer-summary,\n  .admin-builder-footer-actions {\n    display: none !important;\n  }\n\n  .admin-builder-mobile-footer {\n    display: grid;\n    grid-template-columns: minmax(0, 1fr) auto;\n    align-items: center;\n    gap: 12px;\n  }\n\n  .admin-builder-mobile-footer-copy {\n    min-width: 0;\n    display: grid;\n    gap: 1px;\n  }\n\n  .admin-builder-mobile-footer-copy > small {\n    color: var(--text-tertiary);\n    font-size: 9px;\n    font-weight: 850;\n    letter-spacing: .08em;\n  }\n\n  .admin-builder-mobile-footer-copy > strong {\n    overflow: hidden;\n    color: var(--text-primary);\n    font-size: 14px;\n    font-weight: 850;\n    white-space: nowrap;\n    text-overflow: ellipsis;\n  }\n\n  .admin-builder-mobile-save-template {\n    width: max-content;\n    padding: 2px 0;\n    color: var(--text-secondary);\n    border: 0;\n    background: transparent;\n    font-size: 11px;\n    font-weight: 700;\n    text-decoration: underline;\n    text-underline-offset: 3px;\n  }\n\n  .admin-builder-mobile-primary {\n    min-width: 116px;\n    min-height: 48px;\n    padding: 0 16px;\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n    gap: 7px;\n    color: #07162d;\n    border: 1px solid var(--accent);\n    border-radius: 15px;\n    background: var(--accent);\n    font-size: 13px;\n    font-weight: 900;\n    box-shadow: 0 10px 28px color-mix(in srgb, var(--accent) 18%, transparent);\n  }\n\n  .admin-builder-save-warning {\n    position: fixed;\n    left: 16px;\n    right: 16px;\n    bottom: calc(92px + env(safe-area-inset-bottom));\n    z-index: 142;\n  }\n\n  /* P5: real vertical drag/reorder with a dedicated 44px handle. */\n  .admin-builder-reorder-item {\n    position: relative;\n    min-width: 0;\n    list-style: none;\n  }\n\n  .admin-builder-reorder-handle {\n    width: 44px !important;\n    min-width: 44px !important;\n    height: 44px !important;\n    min-height: 44px !important;\n    display: inline-flex !important;\n    align-items: center;\n    justify-content: center;\n    border: 1px solid var(--builder-line);\n    border-radius: 12px;\n    background: color-mix(in srgb, var(--surface-deep) 74%, var(--surface-raised));\n    cursor: grab;\n    touch-action: none;\n  }\n\n  .admin-builder-reorder-handle:active { cursor: grabbing; }\n\n  .admin-builder-reorder-handle > span {\n    font-size: 20px;\n    line-height: 1;\n    letter-spacing: -4px;\n    transform: rotate(90deg);\n  }\n\n  .admin-builder-exercise-summary {\n    grid-template-columns: 44px minmax(0, 1fr) auto !important;\n  }\n\n  .admin-builder-exercise-summary > .admin-builder-selected-gif {\n    display: none;\n  }\n\n  .admin-builder-exercise-summary > .admin-builder-reorder-handle {\n    grid-column: 1;\n    grid-row: 1 / span 2;\n  }\n\n  .admin-builder-exercise-copy {\n    grid-column: 2;\n  }\n\n  .admin-builder-quick-tune {\n    grid-column: 2 / -1;\n  }\n\n  .admin-builder-exercise-controls {\n    display: none !important;\n  }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .admin-builder-story-segments button i,\n  .admin-builder-split-options button {\n    transition-duration: 1ms !important;\n  }\n}\n`;

fs.writeFileSync(cssPath, css);

console.log('Build 1.5.0 transformer applied successfully.');
