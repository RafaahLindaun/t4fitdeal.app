import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = (name) => path.join(root, name);
const read = (name) => fs.readFileSync(file(name), "utf8");
const write = (name, value) => fs.writeFileSync(file(name), value);

function replaceExact(name, source, target, replacement) {
  if (!source.includes(target)) throw new Error(`[1.6.2] trecho não encontrado em ${name}: ${target.slice(0, 90)}`);
  return source.replace(target, replacement);
}
function replaceRegex(name, source, pattern, replacement) {
  if (!pattern.test(source)) throw new Error(`[1.6.2] padrão não encontrado em ${name}: ${pattern}`);
  return source.replace(pattern, replacement);
}

// package + camada CSS
{
  const pkg = JSON.parse(read("package.json"));
  pkg.version = "1.6.2";
  pkg.scripts["visual:contracts"] = "node scripts/verify-visual-contracts-1.6.2.mjs";
  write("package.json", `${JSON.stringify(pkg, null, 2)}\n`);

  const lock = JSON.parse(read("package-lock.json"));
  lock.version = "1.6.2";
  if (lock.packages?.[""]) lock.packages[""].version = "1.6.2";
  write("package-lock.json", `${JSON.stringify(lock, null, 2)}\n`);

  let main = read("scr/main.tsx");
  main = replaceExact("scr/main.tsx", main, 'import "./styles/build-1.6.0.css";\n', 'import "./styles/build-1.6.0.css";\nimport "./styles/build-1.6.2.css";\n');
  write("scr/main.tsx", main);
}

// Entrada do Montar Treino: corrige a causa raiz do copy 44x44 e mantém o texto estático.
{
  let css = read("scr/pages/workout-builder-entry.css");
  css = css.replace(/\.workout-entry-methods>button>span\{/g, ".workout-entry-methods>button>.staff-action-card-icon{");
  css = css.replace(/\.workout-entry-methods>button\.is-ai>span\{/g, ".workout-entry-methods>button.is-ai>.staff-action-card-icon{");
  css = css.replace(/border-color:rgba\(59,130,246,\.5\);background:rgba\(59,130,246,\.08\)/g, "border-color:rgba(255,209,40,.5);background:rgba(255,209,40,.07)");
  css = css.replace(/border-color:#3b82f6;background:rgba\(59,130,246,\.15\);box-shadow:inset 0 0 0 1px rgba\(59,130,246,\.18\)/g, "border-color:#ffd128;background:rgba(255,209,40,.13);box-shadow:inset 0 0 0 1px rgba(255,209,40,.18)");
  css = css.replace(/border-color:#3b82f6;box-shadow:0 0 0 3px rgba\(59,130,246,\.12\)/g, "border-color:#ffd128;box-shadow:0 0 0 3px rgba(255,209,40,.12)");
  write("scr/pages/workout-builder-entry.css", css);
}

// Tipos/payload do editor Staff.
{
  let admin = read("scr/lib/admin.ts");
  admin = replaceExact(
    "scr/lib/admin.ts",
    admin,
    "  position: number;\n};\n\nexport type CreateExerciseLibraryInput",
    "  position: number;\n  setType?: \"normal\" | \"biset\" | \"triset\";\n  setGroupId?: string;\n  setGroupOrder?: number;\n};\n\nexport type CreateExerciseLibraryInput",
  );
  admin = replaceExact(
    "scr/lib/admin.ts",
    admin,
    "    notes: exercise.notes.trim(),\n    position: exercise.position,\n  };",
    "    notes: exercise.notes.trim(),\n    position: exercise.position,\n    set_type: exercise.setType ?? \"normal\",\n    set_group_id: exercise.setGroupId || null,\n    set_group_order: Math.max(0, exercise.setGroupOrder ?? 0),\n  };",
  );
  admin = replaceExact(
    "scr/lib/admin.ts",
    admin,
    "    notes: \"\",\n    position,\n  };\n}",
    "    notes: \"\",\n    position,\n    setType: \"normal\",\n    setGroupId: \"\",\n    setGroupOrder: 0,\n  };\n}",
  );
  admin = admin.replace(/\.GIF(["'])/g, ".gif$1");
  write("scr/lib/admin.ts", admin);
}

// Editor: stepper, agrupamento, resumo de revisão e label de cardio.
{
  let builder = read("scr/pages/AdminWorkoutBuilder.tsx");
  const stepProgress = [
    "function StepProgress({ current, onSelect }: { current: BuilderStep; onSelect: (step: BuilderStep) => void; }) {",
    "  const currentIndex = Math.max(0, BUILDER_STEPS.findIndex((step) => step.key === current));",
    "  return (",
    "    <nav className=\"admin-builder-progress-v162\" aria-label=\"Etapas do treino\">",
    "      <ol>",
    "        {BUILDER_STEPS.map((step, index) => (",
    "          <li key={step.key}>",
    "            <button",
    "              type=\"button\"",
    "              className={clsx(index < currentIndex && \"is-complete\", index === currentIndex && \"is-current\")}",
    "              aria-current={index === currentIndex ? \"step\" : undefined}",
    "              onClick={() => onSelect(step.key)}",
    "              title={step.label}",
    "            >",
    "              <span className=\"admin-builder-step-orb\"><i>{index < currentIndex ? <AdminCheckIcon size={18} /> : step.number}</i></span>",
    "              <small>{step.label}</small>",
    "            </button>",
    "          </li>",
    "        ))}",
    "      </ol>",
    "    </nav>",
    "  );",
    "}",
    "",
    "type CustomExerciseDraft",
  ].join("\n");
  builder = replaceRegex(
    "scr/pages/AdminWorkoutBuilder.tsx",
    builder,
    /function StepProgress\([\s\S]*?\n}\n\ntype CustomExerciseDraft/,
    stepProgress,
  );

  const oldUpdate = [
    "  const updateExercise = (",
    "    draftId: string,",
    "    patch: Partial<BuilderExercise>,",
    "  ) => {",
    "    updateRoutine(activeRoutineIndex, {",
    "      exercises: activeRoutine.exercises.map((exercise) =>",
    "        exercise.draftId === draftId",
    "          ? { ...exercise, ...patch }",
    "          : exercise,",
    "      ),",
    "    });",
    "  };",
  ].join("\n");
  const newUpdate = [
    "  const updateExercise = (",
    "    draftId: string,",
    "    patch: Partial<BuilderExercise>,",
    "  ) => {",
    "    const target = activeRoutine.exercises.find((exercise) => exercise.draftId === draftId);",
    "    updateRoutine(activeRoutineIndex, {",
    "      exercises: activeRoutine.exercises.map((exercise) => {",
    "        if (exercise.draftId === draftId) return { ...exercise, ...patch };",
    "        if (target?.setGroupId && patch.sets !== undefined && exercise.setGroupId === target.setGroupId) {",
    "          return { ...exercise, sets: patch.sets };",
    "        }",
    "        return exercise;",
    "      }),",
    "    });",
    "  };",
    "",
    "  const setExerciseSeriesType = (draftId: string, setType: \"normal\" | \"biset\" | \"triset\") => {",
    "    const source = activeRoutine.exercises;",
    "    const startIndex = source.findIndex((exercise) => exercise.draftId === draftId);",
    "    if (startIndex < 0) return;",
    "    const targetCount = setType === \"biset\" ? 2 : setType === \"triset\" ? 3 : 1;",
    "    const touchedGroupIds = new Set(",
    "      source.slice(startIndex, startIndex + targetCount).map((exercise) => exercise.setGroupId).filter(Boolean) as string[],",
    "    );",
    "    if (source[startIndex].setGroupId) touchedGroupIds.add(source[startIndex].setGroupId as string);",
    "    let next = source.map((exercise) => touchedGroupIds.has(exercise.setGroupId ?? \"\")",
    "      ? { ...exercise, setType: \"normal\" as const, setGroupId: \"\", setGroupOrder: 0 }",
    "      : exercise);",
    "    if (setType === \"normal\") {",
    "      updateRoutine(activeRoutineIndex, { exercises: next });",
    "      setToast(\"Exercício configurado como série normal.\");",
    "      return;",
    "    }",
    "    if (startIndex + targetCount > source.length) {",
    "      setToast(setType === \"biset\" ? \"Adicione mais 1 exercício abaixo para formar o bi-set.\" : \"Adicione mais 2 exercícios abaixo para formar o tri-set.\");",
    "      return;",
    "    }",
    "    const groupId = typeof crypto !== \"undefined\" && \"randomUUID\" in crypto",
    "      ? crypto.randomUUID()",
    "      : `00000000-0000-4000-8000-${Date.now().toString().slice(-12).padStart(12, \"0\")}`;",
    "    const sharedSets = Math.max(1, next[startIndex].sets);",
    "    next = next.map((exercise, index) => index >= startIndex && index < startIndex + targetCount",
    "      ? { ...exercise, sets: sharedSets, setType, setGroupId: groupId, setGroupOrder: index - startIndex + 1 }",
    "      : exercise);",
    "    updateRoutine(activeRoutineIndex, { exercises: next });",
    "    setToast(`${setType === \"biset\" ? \"Bi-set\" : \"Tri-set\"} criado. Uma volta completa conta como 1 série.`);",
    "  };",
  ].join("\n");
  builder = replaceExact("scr/pages/AdminWorkoutBuilder.tsx", builder, oldUpdate, newUpdate);

  builder = replaceExact(
    "scr/pages/AdminWorkoutBuilder.tsx",
    builder,
    '                      } ${recentlyAddedExercise?.draftId === exercise.draftId ? "is-just-added" : ""}`}',
    '                      } ${recentlyAddedExercise?.draftId === exercise.draftId ? "is-just-added" : ""} ${(exercise.setType ?? "normal") !== "normal" ? "is-set-group" : ""}`}',
  );

  builder = replaceExact(
    "scr/pages/AdminWorkoutBuilder.tsx",
    builder,
    '                      </span>\n\n                      <span className="admin-builder-quick-tune" onClick={(event) => event.stopPropagation()}>',
    '                      </span>\n\n                      {(exercise.setType ?? "normal") !== "normal" ? (\n                        <em className="admin-builder-set-group-badge">\n                          {exercise.setType === "biset" ? "BI-SET" : "TRI-SET"} · {exercise.setGroupOrder ?? 1}/{exercise.setType === "biset" ? 2 : 3}\n                        </em>\n                      ) : null}\n\n                      <span className="admin-builder-quick-tune" onClick={(event) => event.stopPropagation()}>',
  );

  builder = replaceExact(
    "scr/pages/AdminWorkoutBuilder.tsx",
    builder,
    '                        <div className="admin-builder-presets" aria-label="Prescrições rápidas">',
    '                        <div className="admin-builder-set-type">\n                          <span>Tipo de série</span>\n                          <div>\n                            {([\n                              ["normal", "Normal"],\n                              ["biset", "Bi-set"],\n                              ["triset", "Tri-set"],\n                            ] as const).map(([value, label]) => (\n                              <button\n                                type="button"\n                                key={value}\n                                className={(exercise.setType ?? "normal") === value ? "is-active" : ""}\n                                aria-pressed={(exercise.setType ?? "normal") === value}\n                                onClick={() => setExerciseSeriesType(exercise.draftId, value)}\n                              >\n                                {label}\n                              </button>\n                            ))}\n                          </div>\n                        </div>\n\n                        <div className="admin-builder-presets" aria-label="Prescrições rápidas">',
  );

  const reviewSummary = [
    "        <section className=\"admin-builder-review-summary admin-builder-anchor\" aria-label=\"Resumo do treino para revisão\">",
    "          <header>",
    "            <div><small>RESUMO PARA PUBLICAÇÃO</small><h2>Revise o programa completo</h2></div>",
    "            <span>{totalExercises} exercício{totalExercises === 1 ? \"\" : \"s\"}</span>",
    "          </header>",
    "          <div className=\"admin-builder-review-days\">",
    "            {routines.map((routine) => (",
    "              <article className=\"admin-builder-review-day\" key={`review-${routine.code}`}>",
    "                <header><strong>Treino {routine.code} · {routine.name}</strong><span>{routine.weekDays.length ? `${routine.weekDays.length} dia(s)/semana` : \"Sem dia definido\"}</span></header>",
    "                <div className=\"admin-builder-review-exercises\">",
    "                  {routine.exercises.length ? routine.exercises.map((exercise) => (",
    "                    <div key={`review-${routine.code}-${exercise.draftId}`}>",
    "                      <strong>{exercise.name}</strong>",
    "                      <small>{exercise.sets}×{exercise.repsMin}{exercise.repsMax !== exercise.repsMin ? `–${exercise.repsMax}` : \"\"} · {exercise.restSeconds}s</small>",
    "                      {(exercise.setType ?? \"normal\") !== \"normal\" ? <em>{exercise.setType === \"biset\" ? \"Bi-set\" : \"Tri-set\"} · posição {exercise.setGroupOrder ?? 1}</em> : null}",
    "                    </div>",
    "                  )) : <div><strong>Nenhum exercício adicionado</strong><small>Revisão necessária</small></div>}",
    "                </div>",
    "              </article>",
    "            ))}",
    "          </div>",
    "        </section>",
    "",
    "        <section",
    "          ref={cardioSectionRef}",
  ].join("\n");
  builder = replaceExact(
    "scr/pages/AdminWorkoutBuilder.tsx",
    builder,
    '        <section\n          ref={cardioSectionRef}',
    reviewSummary,
  );

  builder = replaceExact(
    "scr/pages/AdminWorkoutBuilder.tsx",
    builder,
    '            <i className={cardio.enabled ? "is-active" : ""}>\n              <b />\n            </i>',
    '            <i className={cardio.enabled ? "is-active" : ""}>\n              <b />\n            </i>\n            <span className="admin-builder-cardio-state-label">{cardio.enabled ? "Cardio opcional habilitado" : "Cardio opcional desabilitado"}</span>',
  );

  write("scr/pages/AdminWorkoutBuilder.tsx", builder);
}

// Preferência de repouso no perfil.
{
  let profile = read("scr/lib/profile.ts");
  profile = replaceExact("scr/lib/profile.ts", profile, "  vibrationEnabled: boolean;\n  classReminderMinutes: number;", "  vibrationEnabled: boolean;\n  restRequired: boolean;\n  classReminderMinutes: number;");
  profile = replaceExact("scr/lib/profile.ts", profile, "  vibrationEnabled: true,\n  classReminderMinutes: 120,", "  vibrationEnabled: true,\n  restRequired: true,\n  classReminderMinutes: 120,");
  profile = replaceExact(
    "scr/lib/profile.ts",
    profile,
    "    vibrationEnabled: booleanValue(\n      raw?.vibration_enabled,\n      defaultPreferences.vibrationEnabled,\n    ),\n    classReminderMinutes:",
    "    vibrationEnabled: booleanValue(\n      raw?.vibration_enabled,\n      defaultPreferences.vibrationEnabled,\n    ),\n    restRequired: booleanValue(\n      raw?.rest_required,\n      defaultPreferences.restRequired,\n    ),\n    classReminderMinutes:",
  );
  profile = replaceExact(
    "scr/lib/profile.ts",
    profile,
    "      vibration_enabled: preferences.vibrationEnabled,\n      class_reminder_minutes: preferences.classReminderMinutes,",
    "      vibration_enabled: preferences.vibrationEnabled,\n      rest_required: preferences.restRequired,\n      class_reminder_minutes: preferences.classReminderMinutes,",
  );
  profile += [
    "",
    "export async function loadRestRequiredPreference(userId: string): Promise<boolean> {",
    "  if (!isSupabaseConfigured || !userId) return true;",
    "  const response = await supabase",
    "    .from(\"accqua_profile_preferences\")",
    "    .select(\"rest_required\")",
    "    .eq(\"user_id\", userId)",
    "    .maybeSingle();",
    "  if (response.error) return true;",
    "  return booleanValue((response.data as Record<string, unknown> | null)?.rest_required, true);",
    "}",
  ].join("\n");
  write("scr/lib/profile.ts", profile);

  let page = read("scr/pages/Profile.tsx");
  page = page.replace(/vibrationEnabled: true,\n(\s*)classReminderMinutes: 120,/g, "vibrationEnabled: true,\n$1restRequired: true,\n$1classReminderMinutes: 120,");
  page = replaceExact(
    "scr/pages/Profile.tsx",
    page,
    '                <ProfileToggle title="Vibração" subtitle="Feedback sutil nos controles" checked={dashboard.preferences.vibrationEnabled} onChange={(value) => void updatePreferences("vibrationEnabled", value)} />\n              </div>',
    '                <ProfileToggle title="Vibração" subtitle="Feedback sutil nos controles" checked={dashboard.preferences.vibrationEnabled} onChange={(value) => void updatePreferences("vibrationEnabled", value)} />\n                <ProfileToggle title="Repouso obrigatório entre séries" subtitle="Desative para poder pular o descanso imediatamente" checked={dashboard.preferences.restRequired} onChange={(value) => void updatePreferences("restRequired", value)} />\n              </div>',
  );
  write("scr/pages/Profile.tsx", page);
}

// Modelo de execução do aluno.
{
  let workout = read("scr/lib/workout.ts");
  workout = replaceExact(
    "scr/lib/workout.ts",
    workout,
    "  position: number;\n  isSimple: boolean;",
    "  position: number;\n  setType: \"normal\" | \"biset\" | \"triset\";\n  setGroupId: string;\n  setGroupOrder: number;\n  isSimple: boolean;",
  );
  workout = replaceExact(
    "scr/lib/workout.ts",
    workout,
    "    position: toNumber(raw.position ?? raw.order_index, 0),\n    isSimple: false,",
    "    position: toNumber(raw.position ?? raw.order_index, 0),\n    setType: raw.set_type === \"biset\" || raw.set_type === \"triset\" ? raw.set_type : \"normal\",\n    setGroupId: String(raw.set_group_id ?? \"\"),\n    setGroupOrder: Math.max(0, toNumber(raw.set_group_order, 0)),\n    isSimple: false,",
  );
  write("scr/lib/workout.ts", workout);
}

// Execução: ciclo A→B / A→B→C; uma volta completa = uma série.
{
  let treino = read("scr/pages/Treino.tsx");
  treino = replaceExact("scr/pages/Treino.tsx", treino, 'import LoadingSplash from "../components/LoadingSplash";\n', 'import LoadingSplash from "../components/LoadingSplash";\nimport TimerOverlay from "../components/TimerOverlay";\n');
  treino = replaceExact("scr/pages/Treino.tsx", treino, 'import { performHaptic } from "../lib/appFeedback";\n', 'import { performHaptic } from "../lib/appFeedback";\nimport { loadRestRequiredPreference } from "../lib/profile";\n');
  treino = replaceExact(
    "scr/pages/Treino.tsx",
    treino,
    "  | {\n      kind: \"exercise\";\n      targetIndex: number;\n    }\n  | null;",
    "  | {\n      kind: \"exercise\";\n      targetIndex: number;\n    }\n  | {\n      kind: \"group\";\n      exerciseIds: string[];\n      nextSet: number;\n      targetIndex: number;\n    }\n  | null;",
  );
  treino = replaceExact("scr/pages/Treino.tsx", treino, "  const [restConfirmation, setRestConfirmation] = useState(\"\");\n  const [restAction, setRestAction] =", "  const [restConfirmation, setRestConfirmation] = useState(\"\");\n  const [restRequired, setRestRequired] = useState(true);\n  const [restAction, setRestAction] =");
  treino = replaceExact(
    "scr/pages/Treino.tsx",
    treino,
    "    void loadActiveWorkoutCardioPrescription(user.id).then(\n      setCardioPrescription,\n    );\n  }, [user?.id]);",
    "    void loadActiveWorkoutCardioPrescription(user.id).then(\n      setCardioPrescription,\n    );\n    void loadRestRequiredPreference(user.id).then(setRestRequired);\n  }, [user?.id]);",
  );
  treino = replaceExact(
    "scr/pages/Treino.tsx",
    treino,
    "    if (action.kind === \"set\") {\n      setSetCursor((previous) => ({\n        ...previous,\n        [action.exerciseId]: action.nextSet,\n      }));\n      setToast(`Descanso concluído. Série ${action.nextSet} liberada.`);\n      return;\n    }\n\n    goToExercise(action.targetIndex, \"next\");",
    "    if (action.kind === \"set\") {\n      setSetCursor((previous) => ({\n        ...previous,\n        [action.exerciseId]: action.nextSet,\n      }));\n      setToast(`Descanso concluído. Série ${action.nextSet} liberada.`);\n      return;\n    }\n\n    if (action.kind === \"group\") {\n      setSetCursor((previous) => ({\n        ...previous,\n        ...Object.fromEntries(action.exerciseIds.map((exerciseId) => [exerciseId, action.nextSet])),\n      }));\n      setToast(`Descanso concluído. Série ${action.nextSet} do grupo liberada.`);\n      goToExercise(action.targetIndex, \"next\");\n      return;\n    }\n\n    goToExercise(action.targetIndex, \"next\");",
  );

  const oldConclude = /  const concludeSet = async \(\) => \{[\s\S]*?\n  \};\n\n  if \(viewState === \"empty\"\)/;
  const newConclude = [
    "  const concludeSet = async () => {",
    "    if (!current || busy || restRemaining > 0) return;",
    "    setBusy(true);",
    "    const completedKey = setDraftKey(current.id, currentSet);",
    "    const wasCompleted = Boolean(completedSets[completedKey]);",
    "    try {",
    "      const activeSession = await ensureSession();",
    "      await saveCompletedSet({ userId: user.id, sessionId: activeSession.id, localSession: activeSession.local, exerciseId: current.id, simpleExercise: false, setNumber: currentSet, loadKg: currentLoad, reps: currentReps });",
    "      const updatedCompletedCount = wasCompleted ? completedSetCount : completedSetCount + 1;",
    "      setCompletedSets((previous) => ({ ...previous, [completedKey]: true }));",
    "      performHaptic(user.id, [32]);",
    "",
    "      const grouped = current.setType !== \"normal\" && Boolean(current.setGroupId);",
    "      const groupMembers = grouped",
    "        ? exercises.filter((exercise) => exercise.setGroupId === current.setGroupId).sort((a, b) => a.setGroupOrder - b.setGroupOrder)",
    "        : [];",
    "      const groupIndex = groupMembers.findIndex((exercise) => exercise.id === current.id);",
    "      const lastGroupMember = grouped && groupIndex === groupMembers.length - 1;",
    "      const isFinalSet = currentSet === current.sets && (grouped ? lastGroupMember && Math.max(...groupMembers.map((member) => exercises.findIndex((exercise) => exercise.id === member.id))) === exercises.length - 1 : exerciseIndex === exercises.length - 1);",
    "      if (!reduceMotion && !isFinalSet) confetti({ particleCount: 16, spread: 42, startVelocity: 18, scalar: 0.65, origin: { x: 0.5, y: 0.82 }, disableForReducedMotion: true });",
    "",
    "      if (grouped && groupMembers.length >= 2) {",
    "        if (!lastGroupMember) {",
    "          const nextMember = groupMembers[groupIndex + 1];",
    "          const nextIndex = exercises.findIndex((exercise) => exercise.id === nextMember.id);",
    "          showRestConfirmation(`${current.name} concluído · continue o ${current.setType === \"biset\" ? \"bi-set\" : \"tri-set\"}`);",
    "          setToast(`Próximo do ${current.setType === \"biset\" ? \"bi-set\" : \"tri-set\"}.`);",
    "          goToExercise(nextIndex, \"next\");",
    "          return;",
    "        }",
    "",
    "        const globalGroupIndexes = groupMembers.map((member) => exercises.findIndex((exercise) => exercise.id === member.id)).filter((index) => index >= 0);",
    "        const firstGroupIndex = Math.min(...globalGroupIndexes);",
    "        const lastGlobalGroupIndex = Math.max(...globalGroupIndexes);",
    "        if (currentSet < current.sets) {",
    "          showRestConfirmation(`Série ${currentSet}/${current.sets} do grupo concluída`);",
    "          setToast(\"Volta completa. Descanso iniciado.\");",
    "          startRest(current.restSeconds, { kind: \"group\", exerciseIds: groupMembers.map((member) => member.id), nextSet: currentSet + 1, targetIndex: firstGroupIndex });",
    "          return;",
    "        }",
    "        if (lastGlobalGroupIndex < exercises.length - 1) {",
    "          showRestConfirmation(`${current.setType === \"biset\" ? \"Bi-set\" : \"Tri-set\"} concluído`);",
    "          startRest(current.restSeconds, { kind: \"exercise\", targetIndex: lastGlobalGroupIndex + 1 });",
    "          return;",
    "        }",
    "        await finishWorkout(updatedCompletedCount);",
    "        return;",
    "      }",
    "",
    "      if (currentSet < current.sets) {",
    "        showRestConfirmation(`Série ${currentSet}/${current.sets} concluída`);",
    "        setToast(\"Descanso iniciado.\");",
    "        startRest(current.restSeconds, { kind: \"set\", exerciseId: current.id, nextSet: currentSet + 1 });",
    "        return;",
    "      }",
    "      if (exerciseIndex < exercises.length - 1) {",
    "        showRestConfirmation(`${current.name} concluído`);",
    "        setToast(\"Próximo exercício após o descanso.\");",
    "        startRest(current.restSeconds, { kind: \"exercise\", targetIndex: exerciseIndex + 1 });",
    "        return;",
    "      }",
    "      await finishWorkout(updatedCompletedCount);",
    "    } catch {",
    "      setToast(\"Não foi possível salvar esta série. Confira sua conexão e tente novamente.\");",
    "    } finally {",
    "      setBusy(false);",
    "    }",
    "  };",
    "",
    "  if (viewState === \"empty\")",
  ].join("\n");
  treino = replaceRegex("scr/pages/Treino.tsx", treino, oldConclude, newConclude);

  treino = replaceExact(
    "scr/pages/Treino.tsx",
    treino,
    '                        <motion.button type="button" onClick={() => completeRestAction()} whileTap={{ scale: 0.92 }}>Pular descanso</motion.button>',
    '                        {!restRequired ? <motion.button type="button" onClick={() => completeRestAction()} whileTap={{ scale: 0.92 }}>Pular descanso</motion.button> : null}',
  );
  treino = replaceExact(
    "scr/pages/Treino.tsx",
    treino,
    "      {finishOpen ? (",
    "      {restRemaining > 0 ? (\n        <TimerOverlay\n          remainingSeconds={restRemaining}\n          totalSeconds={restTotal}\n          title={restAction?.kind === \"exercise\" ? \"ANTES DO PRÓXIMO EXERCÍCIO\" : restAction?.kind === \"group\" ? \"DESCANSO DO GRUPO\" : \"DESCANSO ENTRE SÉRIES\"}\n          subtitle={restRequired ? \"Repouso obrigatório ativo\" : \"Você pode seguir quando quiser\"}\n          mediaUrl={(restAction?.kind === \"exercise\" || restAction?.kind === \"group\") ? exercises[restAction.targetIndex]?.mediaUrl : current?.mediaUrl}\n          mediaAlt={(restAction?.kind === \"exercise\" || restAction?.kind === \"group\") ? exercises[restAction.targetIndex]?.name : current?.name}\n          canSkip={!restRequired}\n          onSkip={() => completeRestAction()}\n        />\n      ) : null}\n\n      {finishOpen ? (",
  );
  write("scr/pages/Treino.tsx", treino);
}

// Cardio reutiliza o mesmo overlay enquanto a meta está em contagem.
{
  let cardio = read("scr/pages/Cardio.tsx");
  cardio = replaceExact("scr/pages/Cardio.tsx", cardio, 'import LoadingSplash from "../components/LoadingSplash";\n', 'import LoadingSplash from "../components/LoadingSplash";\nimport TimerOverlay from "../components/TimerOverlay";\n');
  cardio = replaceExact(
    "scr/pages/Cardio.tsx",
    cardio,
    "      {settingsOpen ? (",
    "      {cardioSession.phase === \"em_andamento\" && cardioSession.elapsedSeconds < targetSeconds ? (\n        <TimerOverlay\n          remainingSeconds={Math.max(0, targetSeconds - cardioSession.elapsedSeconds)}\n          totalSeconds={targetSeconds}\n          title={`CARDIO · ${getActivityOption(activity).label}`}\n          subtitle=\"Sessão em andamento\"\n          mediaUrl={getActivityOption(activity).image}\n          mediaAlt={getActivityOption(activity).label}\n          canSkip\n          skipLabel=\"Pausar cardio\"\n          onSkip={() => { haptic(14); void cardioSession.pause(); }}\n        />\n      ) : null}\n\n      {settingsOpen ? (",
  );
  write("scr/pages/Cardio.tsx", cardio);
}

console.log("ACCQUA Build 1.6.2 — patch aplicado.");
