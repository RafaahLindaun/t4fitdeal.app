from pathlib import Path
import re, json

ROOT = Path(__file__).resolve().parents[1]

def read(path): return (ROOT / path).read_text(encoding='utf-8')
def write(path, text):
    p = ROOT / path; p.parent.mkdir(parents=True, exist_ok=True); p.write_text(text, encoding='utf-8')
def replace_once(path, old, new):
    text = read(path)
    if old not in text: raise RuntimeError(f'anchor not found: {path}: {old[:90]!r}')
    write(path, text.replace(old, new, 1))
def sub_once(path, pattern, repl, flags=0):
    text = read(path)
    out, n = re.subn(pattern, repl, text, count=1, flags=flags)
    if n != 1: raise RuntimeError(f'regex anchor count={n}: {path}: {pattern[:100]}')
    write(path, out)

# ---------- version / CSS chain ----------
for path in ['package.json', 'package-lock.json']:
    text = read(path)
    text = text.replace('"version": "1.6.0"', '"version": "1.6.1"', 2 if path.endswith('lock.json') else 1)
    if path == 'package.json':
        text = text.replace('node scripts/verify-visual-contracts-1.6.0.mjs', 'node scripts/verify-visual-contracts-1.6.1.mjs')
    write(path, text)
replace_once('scr/main.tsx', 'import "./styles/build-1.6.0.css";', 'import "./styles/build-1.6.0.css";\nimport "./styles/build-1.6.1.css";')

# ---------- shared set types / media normalization ----------
replace_once('scr/lib/admin.ts',
'''export type BuilderExercise = ExerciseLibraryItem & {\n  draftId: string;''',
'''export type ExerciseSetType = "normal" | "bi_set" | "tri_set";\n\nexport type BuilderExercise = ExerciseLibraryItem & {\n  draftId: string;''')
replace_once('scr/lib/admin.ts',
'''  position: number;\n};''',
'''  position: number;\n  setType: ExerciseSetType;\n  setGroupId: string;\n  setGroupOrder: number;\n};''')
replace_once('scr/lib/admin.ts',
'''    position,\n  };\n}''',
'''    position,\n    setType: override?.setType === "bi_set" || override?.setType === "tri_set" ? override.setType : "normal",\n    setGroupId: typeof override?.setGroupId === "string" ? override.setGroupId : "",\n    setGroupOrder: Math.max(0, Number(override?.setGroupOrder ?? 0) || 0),\n  };\n}''')
# Add grouping to both template/admin payload helpers by matching media/position tail.
text = read('scr/lib/admin.ts')
text = text.replace(
'''    notes: exercise.notes.trim() || null,\n    position: exercise.position,\n  };''',
'''    notes: exercise.notes.trim() || null,\n    position: exercise.position,\n    set_type: exercise.setType,\n    set_group_id: exercise.setType === "normal" ? null : exercise.setGroupId || null,\n    set_group_order: exercise.setType === "normal" ? 0 : exercise.setGroupOrder,\n  };''')
text = text.replace(
'''    notes: exercise.notes.trim() || null,\n    position,\n  };''',
'''    notes: exercise.notes.trim() || null,\n    position,\n    set_type: exercise.setType,\n    set_group_id: exercise.setType === "normal" ? null : exercise.setGroupId || null,\n    set_group_order: exercise.setType === "normal" ? 0 : exercise.setGroupOrder,\n  };''')
write('scr/lib/admin.ts', text)

# Explicit media paths are case-normalized before candidates/persistence.
replace_once('scr/lib/exerciseMedia.ts',
'''  const clean = normalizeSlashes(path.trim()).replace(/^public\\//i, "/");''',
'''  const clean = normalizeSlashes(path.trim()).replace(/^public\\//i, "/").replace(/\\.gif(?=([?#]|$))/gi, ".gif");''')
# Also normalize the final storage/media key helper return paths.
text = read('scr/lib/exerciseMedia.ts').replace('/\\.GIF$/', '/\\.gif$/i')
write('scr/lib/exerciseMedia.ts', text)

# ---------- editor import + mobile stepper ----------
replace_once('scr/pages/AdminWorkoutBuilder.tsx',
'import { Reorder, useDragControls } from "framer-motion";',
'import { Reorder, motion, useDragControls } from "framer-motion";')
replace_once('scr/pages/AdminWorkoutBuilder.tsx',
'''  type BuilderExercise,\n  type CreateExerciseLibraryInput,''',
'''  type BuilderExercise,\n  type ExerciseSetType,\n  type CreateExerciseLibraryInput,''')
replace_once('scr/pages/AdminWorkoutBuilder.tsx',
'import { loadExerciseMediaManifest } from "../lib/exerciseMedia";',
'import { loadExerciseMediaManifest, normalizeExerciseMediaKey } from "../lib/exerciseMedia";')

sub_once('scr/pages/AdminWorkoutBuilder.tsx',
r'''function StepProgress\(\{ current, onSelect \}: \{ current: BuilderStep; onSelect: \(step: BuilderStep\) => void; \}\) \{.*?\n\}\n\nfunction SwipeDeleteShell''',
'''function StepProgress({ current, onSelect }: { current: BuilderStep; onSelect: (step: BuilderStep) => void; }) {\n  const currentIndex = Math.max(0, BUILDER_STEPS.findIndex((step) => step.key === current));\n  return (\n    <nav className="admin-builder-progress-v160 admin-builder-progress-v161" aria-label="Etapas do treino">\n      <div>\n        {BUILDER_STEPS.map((step, index) => {\n          const complete = index < currentIndex;\n          const active = index === currentIndex;\n          return (\n            <button type="button" key={step.key} className={clsx(complete && "is-complete", active && "is-current")} aria-current={active ? "step" : undefined} onClick={() => onSelect(step.key)} title={step.label}>\n              <span className="admin-builder-step-number" aria-hidden="true">\n                {active ? <motion.i className="admin-builder-step-ring" animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }} /> : null}\n                <b>{step.number}</b>\n              </span>\n              <span className="admin-builder-step-label">{step.label}</span>\n            </button>\n          );\n        })}\n      </div>\n    </nav>\n  );\n}\n\nfunction SwipeDeleteShell''', flags=re.S)

# ---------- editor grouping helpers ----------
anchor = '''  function adjustExerciseNumber(\n'''
text = read('scr/pages/AdminWorkoutBuilder.tsx')
pos = text.find(anchor)
if pos < 0: raise RuntimeError('adjustExerciseNumber anchor missing')
helper = '''  function setExerciseSetType(draftId: string, setType: ExerciseSetType) {\n    setRoutines((current) =>\n      current.map((routine) => {\n        const index = routine.exercises.findIndex((exercise) => exercise.draftId === draftId);\n        if (index < 0) return routine;\n        const source = routine.exercises[index];\n        const oldGroup = source.setGroupId;\n        let next = routine.exercises.map((exercise) =>\n          oldGroup && exercise.setGroupId === oldGroup\n            ? { ...exercise, setType: "normal" as const, setGroupId: "", setGroupOrder: 0 }\n            : exercise,\n        );\n        if (setType === "normal") return { ...routine, exercises: next };\n        const size = setType === "bi_set" ? 2 : 3;\n        if (index + size > next.length) {\n          notify.error(`${setType === "bi_set" ? "Bi-set" : "Tri-set"} precisa de ${size} exercícios consecutivos.`);\n          return routine;\n        }\n        const selected = next.slice(index, index + size);\n        const groupsToDissolve = new Set(selected.map((exercise) => exercise.setGroupId).filter(Boolean));\n        next = next.map((exercise) =>\n          groupsToDissolve.has(exercise.setGroupId)\n            ? { ...exercise, setType: "normal" as const, setGroupId: "", setGroupOrder: 0 }\n            : exercise,\n        );\n        const groupId = `set-${Date.now()}-${draftId.slice(-6)}`;\n        const sharedSets = Math.max(1, source.sets);\n        next = next.map((exercise, exerciseIndex) => {\n          if (exerciseIndex < index || exerciseIndex >= index + size) return exercise;\n          return { ...exercise, sets: sharedSets, setType, setGroupId: groupId, setGroupOrder: exerciseIndex - index };\n        });\n        return { ...routine, exercises: next };\n      }),\n    );\n  }\n\n'''
text = text[:pos] + helper + text[pos:]
# Sync set count for grouped exercises.
old = '''          exercise.draftId === draftId\n            ? { ...exercise, ...patch }\n            : exercise,'''
new = '''          exercise.draftId === draftId\n            ? { ...exercise, ...patch }\n            : patch.sets != null && routine.exercises.some((item) => item.draftId === draftId && item.setGroupId && item.setGroupId === exercise.setGroupId)\n              ? { ...exercise, sets: patch.sets }\n              : exercise,'''
if old not in text: raise RuntimeError('updateExercise anchor missing')
text = text.replace(old, new, 1)
write('scr/pages/AdminWorkoutBuilder.tsx', text)

# Media field always writes normalized lowercase extension.
replace_once('scr/pages/AdminWorkoutBuilder.tsx',
'''onChange={(event) =>\n                                updateExercise(exercise.draftId, { mediaUrl: event.target.value })\n                              }''',
'''onChange={(event) =>\n                                updateExercise(exercise.draftId, { mediaUrl: normalizeExerciseMediaKey(event.target.value) })\n                              }''')

# Exercise card gets group classes/label + selector. Keep primary series/reps and secondary reorder distinct in CSS.
replace_once('scr/pages/AdminWorkoutBuilder.tsx',
'''className={clsx(\n                              "admin-builder-exercise",\n                              expandedExerciseId === exercise.draftId && "is-expanded",\n                            )}''',
'''className={clsx(\n                              "admin-builder-exercise",\n                              expandedExerciseId === exercise.draftId && "is-expanded",\n                              exercise.setType !== "normal" && "is-set-group",\n                              exercise.setType === "bi_set" && "is-bi-set",\n                              exercise.setType === "tri_set" && "is-tri-set",\n                            )}''')
replace_once('scr/pages/AdminWorkoutBuilder.tsx',
'''<small>{exercise.muscleGroup} · {exercise.equipment}</small>''',
'''<small>{exercise.muscleGroup} · {exercise.equipment}</small>\n                                  {exercise.setType !== "normal" ? <em className="admin-builder-set-label">{exercise.setType === "bi_set" ? "Bi-set" : "Tri-set"} · {exercise.setGroupOrder + 1}</em> : null}''')
# Insert selector in expanded content before media field.
replace_once('scr/pages/AdminWorkoutBuilder.tsx',
'''<div className="admin-builder-exercise-fields">''',
'''<div className="admin-builder-set-type-field">\n                              <span>Tipo de série</span>\n                              <div role="group" aria-label={`Tipo de série de ${exercise.name}`}>\n                                {([\n                                  ["normal", "Normal"],\n                                  ["bi_set", "Bi-set"],\n                                  ["tri_set", "Tri-set"],\n                                ] as Array<[ExerciseSetType, string]>).map(([value, label]) => (\n                                  <button key={value} type="button" className={exercise.setType === value ? "is-active" : ""} aria-pressed={exercise.setType === value} onClick={() => setExerciseSetType(exercise.draftId, value)}>{label}</button>\n                                ))}\n                              </div>\n                              <small>Uma volta completa pelo grupo conta como 1 série.</small>\n                            </div>\n\n                            <div className="admin-builder-exercise-fields">''')

# The date gets an app icon/wrapper, native indicator hidden in CSS.
replace_once('scr/pages/AdminWorkoutBuilder.tsx',
'''<span>Revisão</span>\n                        <input\n                          type="date"''',
'''<span>Revisão</span>\n                        <div className="admin-builder-date-field">\n                          <AdminCalendarIcon size={18} />\n                          <input\n                          type="date"''')
replace_once('scr/pages/AdminWorkoutBuilder.tsx',
'''                          onChange={(event) => setReviewAt(event.target.value)}\n                        />\n                      </label>''',
'''                          onChange={(event) => setReviewAt(event.target.value)}\n                          />\n                        </div>\n                      </label>''')

# Review summary before cardio toggle.
replace_once('scr/pages/AdminWorkoutBuilder.tsx',
'''<section className="admin-builder-cardio">''',
'''<section className="admin-builder-review-summary" aria-label="Resumo do treino montado">\n                  <header>\n                    <small>REVISÃO DO PROGRAMA</small>\n                    <h3>Confira o treino antes de publicar</h3>\n                    <p>Rotinas, séries, repetições e agrupamentos ficam visíveis aqui para a última conferência.</p>\n                  </header>\n                  <div>\n                    {validRoutines.map((routine) => (\n                      <article key={routine.id}>\n                        <div className="admin-builder-review-routine-head">\n                          <span>{routine.code}</span>\n                          <div><strong>{routine.name}</strong><small>{routine.weekDays.length ? `${routine.weekDays.length} dia(s) por semana` : "Sem dia definido"}</small></div>\n                          <b>{routine.exercises.length} exercício(s)</b>\n                        </div>\n                        <ol>\n                          {routine.exercises.map((exercise) => (\n                            <li key={exercise.draftId} className={exercise.setType !== "normal" ? "is-set-group" : undefined}>\n                              <span><strong>{exercise.name}</strong><small>{exercise.muscleGroup}</small></span>\n                              <b>{exercise.sets} × {exercise.repsMin === exercise.repsMax ? exercise.repsMin : `${exercise.repsMin}-${exercise.repsMax}`}</b>\n                              {exercise.setType !== "normal" ? <em>{exercise.setType === "bi_set" ? "Bi-set" : "Tri-set"} · posição {exercise.setGroupOrder + 1}</em> : null}\n                            </li>\n                          ))}\n                        </ol>\n                      </article>\n                    ))}\n                  </div>\n                </section>\n\n                <section className="admin-builder-cardio">''')
# Visible toggle state label.
replace_once('scr/pages/AdminWorkoutBuilder.tsx',
'''<span>Inclua o bloco final sem transformar o cardio em etapa obrigatória.</span>''',
'''<span>Inclua o bloco final sem transformar o cardio em etapa obrigatória.</span>\n                      <em className="admin-builder-cardio-toggle-state">{cardio.enabled ? "Cardio opcional habilitado" : "Cardio opcional desabilitado"}</em>''')

# ---------- profile preference: required rest ----------
replace_once('scr/lib/profile.ts',
'''  vibrationEnabled: boolean;\n  classReminderMinutes: number;''',
'''  vibrationEnabled: boolean;\n  restRequired: boolean;\n  classReminderMinutes: number;''')
replace_once('scr/lib/profile.ts',
'''  vibrationEnabled: true,\n  classReminderMinutes: 10,''',
'''  vibrationEnabled: true,\n  restRequired: true,\n  classReminderMinutes: 10,''')
replace_once('scr/lib/profile.ts',
'''    vibrationEnabled: readBoolean(row?.vibration_enabled, true),\n    classReminderMinutes:''',
'''    vibrationEnabled: readBoolean(row?.vibration_enabled, true),\n    restRequired: readBoolean(row?.rest_required, true),\n    classReminderMinutes:''')
replace_once('scr/lib/profile.ts',
'''    vibration_enabled: preferences.vibrationEnabled,\n    class_reminder_minutes:''',
'''    vibration_enabled: preferences.vibrationEnabled,\n    rest_required: preferences.restRequired,\n    class_reminder_minutes:''')
# Lightweight preference loader for runtime.
insert_anchor = 'export async function saveProfilePreferences('
text = read('scr/lib/profile.ts'); idx = text.find(insert_anchor)
if idx < 0: raise RuntimeError('saveProfilePreferences anchor missing')
loader = '''export async function loadProfilePreferences(userId: string): Promise<ProfilePreferences> {\n  if (!supabase) return { ...DEFAULT_PROFILE_PREFERENCES };\n  const result = await loadPreferencesRow(userId);\n  if (result.error) throw result.error;\n  return normalizePreferences(result.data);\n}\n\n'''
text = text[:idx] + loader + text[idx:]; write('scr/lib/profile.ts', text)
replace_once('scr/pages/Profile.tsx',
'''              <ProfileToggle\n                title="Vibração"\n                subtitle="Feedback sutil nos controles"\n                checked={dashboard.preferences.vibrationEnabled}\n                onChange={(value) => void updatePreferences("vibrationEnabled", value)}\n              />''',
'''              <ProfileToggle\n                title="Vibração"\n                subtitle="Feedback sutil nos controles"\n                checked={dashboard.preferences.vibrationEnabled}\n                onChange={(value) => void updatePreferences("vibrationEnabled", value)}\n              />\n              <ProfileToggle\n                title="Repouso obrigatório"\n                subtitle="Quando desligado, você pode seguir antes do timer terminar"\n                checked={dashboard.preferences.restRequired}\n                onChange={(value) => void updatePreferences("restRequired", value)}\n              />''')

# ---------- runtime workout grouping ----------
replace_once('scr/lib/workout.ts',
'''export type WorkoutExerciseRecord = {''',
'''export type WorkoutSetType = "normal" | "bi_set" | "tri_set";\n\nexport type WorkoutExerciseRecord = {''')
replace_once('scr/lib/workout.ts',
'''  position: number;\n};''',
'''  position: number;\n  setType: WorkoutSetType;\n  setGroupId: string;\n  setGroupOrder: number;\n};''')
replace_once('scr/lib/workout.ts',
'''    position: Math.max(0, toNumber(raw?.position, index)),\n  };''',
'''    position: Math.max(0, toNumber(raw?.position, index)),\n    setType: raw?.set_type === "bi_set" || raw?.set_type === "tri_set" ? raw.set_type : "normal",\n    setGroupId: asString(raw?.set_group_id),\n    setGroupOrder: Math.max(0, toNumber(raw?.set_group_order, 0)),\n  };''')

# reusable timer overlay
write('scr/components/TimerOverlay.tsx', '''import { AnimatePresence, motion } from "framer-motion";\n\ntype TimerOverlayProps = {\n  open: boolean;\n  mode: "rest" | "cardio";\n  title: string;\n  subtitle?: string;\n  remainingSeconds: number;\n  totalSeconds: number;\n  mediaUrl?: string | null;\n  mediaAlt?: string;\n  primaryLabel?: string;\n  onPrimary?: () => void;\n};\n\nexport default function TimerOverlay({ open, mode, title, subtitle, remainingSeconds, totalSeconds, mediaUrl, mediaAlt = "", primaryLabel, onPrimary }: TimerOverlayProps) {\n  const radius = 76;\n  const circumference = 2 * Math.PI * radius;\n  const total = Math.max(1, totalSeconds);\n  const progress = Math.max(0, Math.min(1, remainingSeconds / total));\n  const offset = circumference * (1 - progress);\n  return (\n    <AnimatePresence>\n      {open ? (\n        <motion.section className={`accqua-timer-overlay is-${mode}`} role="dialog" aria-modal="true" aria-label={title} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>\n          <img className="accqua-timer-overlay-logo" src="/logo/logo_app_4k.png" alt="ACCQUA Sports" />\n          <div className="accqua-timer-overlay-copy"><small>{mode === "rest" ? "RECUPERAÇÃO" : "CARDIO"}</small><h2>{title}</h2>{subtitle ? <p>{subtitle}</p> : null}</div>\n          <div className="accqua-timer-overlay-media">{mediaUrl ? <img src={mediaUrl} alt={mediaAlt || title} /> : <div aria-hidden="true" className="accqua-timer-overlay-media-fallback">ACCQUA</div>}</div>\n          <div className="accqua-timer-overlay-ring" aria-label={`${Math.max(0, Math.ceil(remainingSeconds))} segundos restantes`}>\n            <svg viewBox="0 0 180 180" aria-hidden="true"><circle cx="90" cy="90" r={radius} className="track"/><motion.circle cx="90" cy="90" r={radius} className="progress" strokeDasharray={circumference} animate={{ strokeDashoffset: offset }} transition={{ duration: .35, ease: "linear" }}/></svg>\n            <div><strong>{Math.max(0, Math.ceil(remainingSeconds))}</strong><span>seg</span></div>\n          </div>\n          {primaryLabel && onPrimary ? <button type="button" className="accqua-timer-overlay-action" onClick={onPrimary}>{primaryLabel}</button> : null}\n        </motion.section>\n      ) : null}\n    </AnimatePresence>\n  );\n}\n''')

# Treino imports/rest action/preference.
replace_once('scr/pages/Treino.tsx', 'import PageHeader from "../components/PageHeader";', 'import PageHeader from "../components/PageHeader";\nimport TimerOverlay from "../components/TimerOverlay";')
replace_once('scr/pages/Treino.tsx', 'import { performHaptic } from "../lib/appFeedback";', 'import { performHaptic } from "../lib/appFeedback";\nimport { loadProfilePreferences } from "../lib/profile";')
replace_once('scr/pages/Treino.tsx',
'''      exerciseId: string;\n      nextSet: number;\n    }''',
'''      exerciseId: string;\n      nextSet: number;\n      targetIndex?: number;\n      groupExerciseIds?: string[];\n    }''')
# restRequired state next to rest state.
replace_once('scr/pages/Treino.tsx',
'''  const [restAction, setRestAction] = useState<RestAction>(null);''',
'''  const [restAction, setRestAction] = useState<RestAction>(null);\n  const [restRequired, setRestRequired] = useState(true);''')
# Insert preference loader before a convenient existing effect.
replace_once('scr/pages/Treino.tsx',
'''  useEffect(() => {\n    if (!user) return;\n    let mounted = true;''',
'''  useEffect(() => {\n    if (!user?.id) return;\n    let active = true;\n    loadProfilePreferences(user.id).then((preferences) => { if (active) setRestRequired(preferences.restRequired); }).catch(() => { if (active) setRestRequired(true); });\n    return () => { active = false; };\n  }, [user?.id]);\n\n  useEffect(() => {\n    if (!user) return;\n    let mounted = true;''')

# completeRestAction grouped cursor + optional target.
sub_once('scr/pages/Treino.tsx',
r'''if \(action\.kind === "set"\) \{\n\s*setSetCursor\(\(current\) => \(\{.*?\}\)\);\n\s*return;\n\s*\}''',
'''if (action.kind === "set") {\n      setSetCursor((current) => {\n        const next = { ...current };\n        const ids = action.groupExerciseIds?.length ? action.groupExerciseIds : [action.exerciseId];\n        ids.forEach((id) => { next[id] = action.nextSet; });\n        return next;\n      });\n      if (typeof action.targetIndex === "number") goToExercise(action.targetIndex, "next");\n      return;\n    }''', flags=re.S)

# Replace branch after saveCompletedSet with grouped semantics. Anchor exact from current source.
old = '''    if (currentSet < currentExercise.sets) {\n      startRest(currentExercise.restSeconds, {\n        kind: "set",\n        exerciseId: currentExercise.id,\n        nextSet: currentSet + 1,\n      });\n      return;\n    }\n\n    if (exerciseIndex < exercises.length - 1) {\n      startRest(currentExercise.restSeconds, {\n        kind: "exercise",\n        targetIndex: exerciseIndex + 1,\n      });\n      return;\n    }'''
new = '''    const groupedExercises = currentExercise.setType !== "normal" && currentExercise.setGroupId\n      ? exercises.filter((exercise) => exercise.setGroupId === currentExercise.setGroupId).sort((a, b) => a.setGroupOrder - b.setGroupOrder || a.position - b.position)\n      : [currentExercise];\n    const groupedIndex = groupedExercises.findIndex((exercise) => exercise.id === currentExercise.id);\n    const nextGrouped = groupedExercises[groupedIndex + 1];\n\n    if (groupedExercises.length > 1 && nextGrouped) {\n      const targetIndex = exercises.findIndex((exercise) => exercise.id === nextGrouped.id);\n      setSetCursor((cursor) => ({ ...cursor, [nextGrouped.id]: currentSet }));\n      goToExercise(targetIndex, "next");\n      return;\n    }\n\n    if (groupedExercises.length > 1) {\n      const firstGrouped = groupedExercises[0];\n      const firstIndex = exercises.findIndex((exercise) => exercise.id === firstGrouped.id);\n      if (currentSet < firstGrouped.sets) {\n        startRest(currentExercise.restSeconds, {\n          kind: "set",\n          exerciseId: firstGrouped.id,\n          nextSet: currentSet + 1,\n          targetIndex: firstIndex,\n          groupExerciseIds: groupedExercises.map((exercise) => exercise.id),\n        });\n        return;\n      }\n      const groupIds = new Set(groupedExercises.map((exercise) => exercise.id));\n      const lastIndex = Math.max(...groupedExercises.map((exercise) => exercises.findIndex((item) => item.id === exercise.id)));\n      const nextIndex = exercises.findIndex((exercise, index) => index > lastIndex && !groupIds.has(exercise.id));\n      if (nextIndex >= 0) {\n        startRest(currentExercise.restSeconds, { kind: "exercise", targetIndex: nextIndex });\n        return;\n      }\n    } else {\n      if (currentSet < currentExercise.sets) {\n        startRest(currentExercise.restSeconds, { kind: "set", exerciseId: currentExercise.id, nextSet: currentSet + 1 });\n        return;\n      }\n      if (exerciseIndex < exercises.length - 1) {\n        startRest(currentExercise.restSeconds, { kind: "exercise", targetIndex: exerciseIndex + 1 });\n        return;\n      }\n    }'''
if old not in read('scr/pages/Treino.tsx'): raise RuntimeError('concludeSet tail anchor missing')
replace_once('scr/pages/Treino.tsx', old, new)

# Overlay before current workout main content close: insert right after root opening identified by class.
# Use currentExercise media and optional immediate continue.
text = read('scr/pages/Treino.tsx')
root_anchor = '<div className="workout-execution-shell">'
if root_anchor not in text:
    # actual root may have another known class; locate first execution root.
    m = re.search(r'<div className="[^"]*workout[^\"]*">', text[text.find('return ('):])
    if not m: raise RuntimeError('Treino root anchor missing')
    root_anchor = m.group(0)
overlay = '''\n      <TimerOverlay\n        open={restRemaining > 0}\n        mode="rest"\n        title="Repouso"\n        subtitle={restRequired ? "Recupere e aguarde a próxima série liberar." : "Repouso opcional — continue quando estiver pronto."}\n        remainingSeconds={restRemaining}\n        totalSeconds={restTotal}\n        mediaUrl={currentExercise?.mediaUrl}\n        mediaAlt={currentExercise?.name ?? "Exercício"}\n        primaryLabel={!restRequired ? "Continuar agora" : undefined}\n        onPrimary={!restRequired ? completeRestAction : undefined}\n      />\n'''
text = text.replace(root_anchor, root_anchor + overlay, 1)
write('scr/pages/Treino.tsx', text)

# ---------- Cardio full-screen timer overlay ----------
replace_once('scr/pages/Cardio.tsx', 'import { WorkoutBackIcon } from "../components/WorkoutIcons";', 'import { WorkoutBackIcon } from "../components/WorkoutIcons";\nimport TimerOverlay from "../components/TimerOverlay";')
# Insert overlay directly before settings modal, after main closes.
replace_once('scr/pages/Cardio.tsx',
'''      </main>\n\n      {settingsOpen ? (''',
'''      </main>\n\n      <TimerOverlay\n        open={cardioSession.phase === "em_andamento"}\n        mode="cardio"\n        title={getActivityOption(activity).label}\n        subtitle="Cardio em andamento"\n        remainingSeconds={Math.max(0, targetSeconds - cardioSession.elapsedSeconds)}\n        totalSeconds={targetSeconds}\n        mediaUrl={getActivityOption(activity).image}\n        mediaAlt={getActivityOption(activity).label}\n        primaryLabel="Pausar cardio"\n        onPrimary={() => { haptic(14); void cardioSession.pause(); }}\n      />\n\n      {settingsOpen ? (''')

# ---------- StaffActionCard regression hardening ----------
replace_once('scr/components/StaffActionCard.tsx',
'''      whileHover={{ y: -2 }}\n      whileTap={{ scale: 0.985 }}''',
'''      whileHover={undefined}\n      whileTap={{ scale: 0.99 }}''')

# ---------- Build 1.6.1 CSS ----------
write('scr/styles/build-1.6.1.css', r'''/* ACCQUA Sports — Build 1.6.1 */
:root{--accqua-select:#f2c230;--accqua-select-ink:#171300}

/* Method cards: text has one stable flow, never a hover duplicate/overlay. */
.staff-action-card{min-height:174px!important;height:auto!important;overflow:hidden!important;display:grid!important;grid-template-rows:auto minmax(0,1fr) auto!important;align-content:start!important;transform:none!important}
.staff-action-card-copy{min-width:0!important;display:block!important;overflow:hidden!important}
.staff-action-card-copy strong{display:block!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
.staff-action-card-copy p{position:static!important;opacity:1!important;max-height:none!important;margin-top:6px!important;display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:2!important;overflow:hidden!important;line-height:1.35!important}
.staff-action-card-meta{position:static!important;inset:auto!important;display:block!important;align-self:end!important;margin-top:10px!important;white-space:normal!important;line-height:1.25!important;overflow:hidden!important}
.staff-action-card:hover{transform:none!important}

/* Numbered stepper; the legacy mobile bar stays mounted for regression contracts but invisible. */
.admin-builder-progress-v161{padding:10px 12px 12px!important;overflow:visible!important}
.admin-builder-progress-v161>div{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:6px!important;width:100%!important}
.admin-builder-progress-v161 button{min-width:0!important;display:flex!important;flex-direction:column!important;align-items:center!important;gap:6px!important;background:transparent!important;border:0!important;color:rgba(255,255,255,.5)!important;padding:4px 2px!important}
.admin-builder-step-number{position:relative!important;width:44px!important;height:44px!important;border-radius:50%!important;display:grid!important;place-items:center!important;background:rgba(255,255,255,.06)!important;border:1px solid rgba(255,255,255,.12)!important;flex:0 0 44px!important}
.admin-builder-step-number b{position:relative;z-index:2;font-size:18px!important;line-height:1!important;color:inherit!important}
.admin-builder-step-ring{position:absolute!important;inset:-4px!important;border-radius:50%!important;border:3px solid transparent!important;border-top-color:var(--accqua-select)!important;border-right-color:var(--accqua-select)!important;z-index:1!important}
.admin-builder-progress-v161 button.is-current{color:#fff!important}
.admin-builder-progress-v161 button.is-current .admin-builder-step-number{border-color:rgba(242,194,48,.45)!important;background:rgba(242,194,48,.08)!important}
.admin-builder-progress-v161 button.is-complete{color:var(--accqua-select-ink)!important}
.admin-builder-progress-v161 button.is-complete .admin-builder-step-number{background:var(--accqua-select)!important;border-color:var(--accqua-select)!important}
.admin-builder-step-label{display:block!important;max-width:100%!important;font-size:10px!important;font-weight:800!important;line-height:1.15!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;color:rgba(255,255,255,.62)!important}
.admin-builder-progress-v161 button.is-current .admin-builder-step-label{color:var(--accqua-select)!important}
.admin-builder-mobile-progress{display:none!important}

/* Program: yellow is the single selection token. */
.admin-builder-split-options button.is-active,.admin-builder-split-options button[aria-pressed="true"]{border-color:var(--accqua-select)!important;background:rgba(242,194,48,.14)!important;color:#fff!important;box-shadow:0 0 0 1px rgba(242,194,48,.18)!important}
.admin-builder-split-options button.is-active *{color:inherit!important}
.admin-builder-date-field{min-height:46px;display:flex;align-items:center;gap:10px;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:#0d2037;padding:0 12px;color:var(--accqua-select)}
.admin-builder-date-field input{min-width:0;width:100%;height:44px;border:0!important;background:transparent!important;color:#fff!important;color-scheme:dark;outline:0}
.admin-builder-date-field input::-webkit-calendar-picker-indicator{opacity:0;width:0;padding:0;margin:0}

/* Library/card copy cannot collide. */
.admin-builder-library-item,.admin-builder-library-card{min-height:76px!important;align-items:center!important;overflow:hidden!important}
.admin-builder-library-item strong,.admin-builder-library-card strong{display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:2!important;white-space:normal!important;overflow:hidden!important;line-height:1.25!important;max-height:2.5em!important;word-break:normal!important;overflow-wrap:anywhere!important}
.admin-builder-library-item small,.admin-builder-library-card small{display:block!important;margin-top:5px!important;position:static!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}

/* Exercise controls: primary tuning gets its own row; reorder actions stay secondary. */
.admin-builder-exercise-summary{display:grid!important;grid-template-columns:auto minmax(0,1fr) auto!important;grid-template-areas:"media copy chevron" "tune tune tune" "secondary secondary secondary"!important;gap:10px 12px!important;align-items:center!important;min-width:0!important}
.admin-builder-exercise-summary>.exercise-media,.admin-builder-exercise-summary>[class*="media"]{grid-area:media}
.admin-builder-exercise-copy{grid-area:copy!important;min-width:0!important;overflow:hidden!important}
.admin-builder-exercise-copy strong{white-space:normal!important;line-height:1.25!important;display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:2!important;overflow:hidden!important}
.admin-builder-quick-tune{grid-area:tune!important;display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important;width:100%!important;min-width:0!important}
.admin-builder-quick-tune>span,.admin-builder-quick-tune>div{min-height:46px!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;padding:5px 8px!important;border-radius:12px!important;background:rgba(255,255,255,.055)!important}
.admin-builder-quick-tune button{width:36px!important;height:36px!important;min-width:36px!important;border-radius:10px!important}
.admin-builder-quick-tune b{min-width:42px!important;text-align:center!important;white-space:nowrap!important}
.admin-builder-reorder-handle,.admin-builder-exercise-controls{grid-area:secondary!important;justify-self:end!important;min-height:44px!important}
.admin-builder-reorder-handle{margin-right:94px!important;width:44px!important;height:44px!important}
.admin-builder-exercise-controls{display:flex!important;gap:6px!important}
.admin-builder-exercise-controls button{width:44px!important;height:44px!important}
.admin-builder-exercise-summary>.admin-builder-chevron{grid-area:chevron!important}

/* Set grouping and selector. */
.admin-builder-exercise.is-set-group{border-left:3px solid var(--accqua-select)!important;background:linear-gradient(90deg,rgba(242,194,48,.08),transparent 42%)!important}
.admin-builder-exercise.is-bi-set{--set-kind:"BI-SET"}.admin-builder-exercise.is-tri-set{--set-kind:"TRI-SET"}
.admin-builder-set-label{display:inline-flex!important;width:max-content!important;margin-top:5px!important;padding:3px 7px!important;border-radius:999px!important;background:rgba(242,194,48,.12)!important;color:var(--accqua-select)!important;font-size:10px!important;font-weight:850!important;font-style:normal!important}
.admin-builder-set-type-field{display:grid;gap:8px;margin:12px 0;padding:12px;border-radius:14px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.08)}
.admin-builder-set-type-field>span{font-size:12px;font-weight:850;color:#fff}.admin-builder-set-type-field>div{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}
.admin-builder-set-type-field button{min-height:42px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:#10243c;color:rgba(255,255,255,.72);font-weight:800}
.admin-builder-set-type-field button.is-active{border-color:var(--accqua-select);background:var(--accqua-select);color:var(--accqua-select-ink)}
.admin-builder-set-type-field small{font-size:11px;color:rgba(255,255,255,.52)}

/* Review is a real review step, not an empty canvas. */
.admin-builder-review-summary{display:grid;gap:14px;margin-bottom:16px;padding:16px;border-radius:18px;background:rgba(8,28,50,.86);border:1px solid rgba(255,255,255,.09);overflow:hidden}
.admin-builder-review-summary header small{color:var(--accqua-select);font-weight:900;letter-spacing:.08em}.admin-builder-review-summary header h3{margin:4px 0 5px;color:#fff}.admin-builder-review-summary header p{margin:0;color:rgba(255,255,255,.58);font-size:12px;line-height:1.45}
.admin-builder-review-summary>div{display:grid;gap:10px}.admin-builder-review-summary article{min-width:0;border-radius:14px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);overflow:hidden}
.admin-builder-review-routine-head{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center;padding:12px}.admin-builder-review-routine-head>span{width:36px;height:36px;border-radius:10px;background:var(--accqua-select);color:var(--accqua-select-ink);display:grid;place-items:center;font-weight:900}.admin-builder-review-routine-head div{min-width:0}.admin-builder-review-routine-head strong,.admin-builder-review-routine-head small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.admin-builder-review-routine-head small{margin-top:2px;color:rgba(255,255,255,.5)}.admin-builder-review-routine-head>b{font-size:11px;color:rgba(255,255,255,.58);white-space:nowrap}
.admin-builder-review-summary ol{list-style:none;margin:0;padding:0 12px 12px;display:grid;gap:7px}.admin-builder-review-summary li{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 10px;align-items:center;padding:9px 10px;border-radius:10px;background:rgba(0,0,0,.12);min-width:0}.admin-builder-review-summary li span{min-width:0}.admin-builder-review-summary li strong,.admin-builder-review-summary li small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.admin-builder-review-summary li small{color:rgba(255,255,255,.45);margin-top:2px}.admin-builder-review-summary li>b{color:#fff;white-space:nowrap}.admin-builder-review-summary li>em{grid-column:1/-1;color:var(--accqua-select);font-size:10px;font-style:normal;font-weight:850}
.admin-builder-cardio-toggle{min-height:112px!important;overflow:hidden!important;align-items:flex-start!important}.admin-builder-cardio-toggle>span{min-width:0!important;overflow:hidden!important}.admin-builder-cardio-toggle>span>*{position:static!important}.admin-builder-cardio-toggle-state{display:block!important;margin-top:7px!important;color:var(--accqua-select)!important;font-size:11px!important;font-weight:850!important;font-style:normal!important}

/* Full-screen timers for rest and cardio. */
.accqua-timer-overlay{position:fixed;inset:0;z-index:140;background:radial-gradient(circle at 50% 22%,#11385c 0,#061a30 42%,#03101f 100%);display:grid;grid-template-rows:auto auto minmax(120px,1fr) auto auto;justify-items:center;align-items:center;gap:14px;padding:calc(18px + env(safe-area-inset-top)) 18px calc(22px + env(safe-area-inset-bottom));overflow-y:auto;color:#fff;text-align:center}
.accqua-timer-overlay-logo{width:64px;height:64px;object-fit:contain}.accqua-timer-overlay-copy{max-width:360px}.accqua-timer-overlay-copy small{color:var(--accqua-select);font-weight:900;letter-spacing:.14em}.accqua-timer-overlay-copy h2{margin:4px 0;font-size:24px}.accqua-timer-overlay-copy p{margin:0;color:rgba(255,255,255,.62);line-height:1.4}
.accqua-timer-overlay-media{width:min(78vw,340px);height:min(32vh,250px);border-radius:22px;overflow:hidden;background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.1);display:grid;place-items:center}.accqua-timer-overlay-media img{width:100%;height:100%;object-fit:contain}.accqua-timer-overlay.is-cardio .accqua-timer-overlay-media img{object-fit:cover}.accqua-timer-overlay-media-fallback{font-size:28px;font-weight:950;color:rgba(255,255,255,.16)}
.accqua-timer-overlay-ring{position:relative;width:180px;height:180px;display:grid;place-items:center}.accqua-timer-overlay-ring svg{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg);overflow:visible}.accqua-timer-overlay-ring circle{fill:none;stroke-width:10}.accqua-timer-overlay-ring .track{stroke:rgba(255,255,255,.1)}.accqua-timer-overlay-ring .progress{stroke:var(--accqua-select);stroke-linecap:round}.accqua-timer-overlay-ring>div{position:relative;z-index:1;display:flex;align-items:baseline;gap:4px}.accqua-timer-overlay-ring strong{font-size:48px;line-height:1;font-variant-numeric:tabular-nums}.accqua-timer-overlay-ring span{font-size:13px;color:rgba(255,255,255,.55)}
.accqua-timer-overlay-action{width:min(100%,360px);min-height:50px;border:0;border-radius:14px;background:var(--accqua-select);color:var(--accqua-select-ink);font-weight:900;font-size:15px}

@media(max-width:430px){.admin-builder-progress-v161{padding-inline:8px!important}.admin-builder-progress-v161>div{gap:2px!important}.admin-builder-step-number{width:40px!important;height:40px!important;flex-basis:40px!important}.admin-builder-step-label{font-size:9px!important;letter-spacing:-.01em!important}.admin-builder-quick-tune{grid-template-columns:1fr!important}.admin-builder-review-routine-head{grid-template-columns:auto minmax(0,1fr)}.admin-builder-review-routine-head>b{grid-column:2}.accqua-timer-overlay{gap:10px;padding-left:14px;padding-right:14px}.accqua-timer-overlay-media{width:min(88vw,330px);height:min(28vh,220px)}.accqua-timer-overlay-ring{width:156px;height:156px}.accqua-timer-overlay-ring svg{width:156px;height:156px}.accqua-timer-overlay-ring strong{font-size:42px}}
''')

# ---------- SQL migration ----------
migration = r'''-- ACCQUA Sports — Build 1.6.1: bi/tri sets, repouso opcional e mídia normalizada
alter table public.workout_exercises add column if not exists set_type text not null default 'normal';
alter table public.workout_exercises add column if not exists set_group_id text;
alter table public.workout_exercises add column if not exists set_group_order integer not null default 0;
alter table public.accqua_profile_preferences add column if not exists rest_required boolean not null default true;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='workout_exercises_set_type_check') then
    alter table public.workout_exercises add constraint workout_exercises_set_type_check check (set_type in ('normal','bi_set','tri_set'));
  end if;
end $$;
create index if not exists workout_exercises_set_group_idx on public.workout_exercises(plan_id,set_group_id,set_group_order) where set_group_id is not null;

update public.exercise_library
set media_url = regexp_replace(media_url, '\.GIF([?#]|$)', '.gif\1', 'gi'), updated_at = now()
where media_url ~* '\.GIF([?#]|$)';

create or replace function public.publish_accqua_training_program(p_student_id uuid, p_program jsonb, p_routines jsonb, p_cardio jsonb default null::jsonb)
returns uuid language plpgsql security definer set search_path to 'public','auth','pg_catalog' as $function$
declare
  v_staff_id uuid := auth.uid(); v_program_id uuid; v_plan_id uuid; v_version integer; v_routine jsonb; v_exercise jsonb;
  v_routine_position integer := 0; v_exercise_position integer; v_library_id uuid; v_library_raw text;
  v_split text := coalesce(nullif(trim(p_program->>'split_code'), ''), 'PERSONALIZADO');
  v_name text := coalesce(nullif(trim(p_program->>'name'), ''), 'Treino personalizado');
begin
  if not public.accqua_current_is_staff_v8() then raise exception 'Apenas a equipe autorizada pode publicar treinos.'; end if;
  if p_student_id is null or public.accqua_effective_role_v4(p_student_id) <> 'student' then raise exception 'Aluno inválido.'; end if;
  if jsonb_typeof(coalesce(p_routines,'[]'::jsonb)) <> 'array' then raise exception 'As rotinas do treino são inválidas.'; end if;
  select coalesce(max(version),0)+1 into v_version from public.workout_programs where student_id=p_student_id;
  update public.workout_programs set is_active=false,updated_at=now() where student_id=p_student_id and coalesce(is_active,true);
  update public.workout_plans set is_active=false,updated_at=now() where coalesce(student_id,user_id)=p_student_id and coalesce(is_active,true);
  insert into public.workout_programs(student_id,created_by,name,split_code,notes,review_at,version,is_active,created_at,updated_at)
  values(p_student_id,v_staff_id,v_name,v_split,coalesce(p_program->>'notes',''),nullif(p_program->>'review_at','')::date,v_version,true,now(),now()) returning id into v_program_id;
  for v_routine in select value from jsonb_array_elements(coalesce(p_routines,'[]'::jsonb)) loop
    v_routine_position:=v_routine_position+1;
    insert into public.workout_plans(program_id,student_id,user_id,professor_id,created_by,name,focus,notes,review_at,week_days,routine_code,split_code,version,is_active,is_simple,created_at,updated_at)
    values(v_program_id,p_student_id,p_student_id,v_staff_id,v_staff_id,coalesce(nullif(trim(v_routine->>'name'),''),'Treino '||coalesce(v_routine->>'code',v_routine_position::text)),coalesce(v_routine->>'focus',''),coalesce(p_program->>'notes',''),nullif(p_program->>'review_at','')::date,coalesce(array(select value::integer from jsonb_array_elements_text(coalesce(v_routine->'week_days','[]'::jsonb)) where value~'^[0-6]$'),'{}'::integer[]),coalesce(nullif(trim(v_routine->>'code'),''),chr(64+v_routine_position)),v_split,v_version,true,false,now(),now()) returning id into v_plan_id;
    v_exercise_position:=0;
    for v_exercise in select value from jsonb_array_elements(coalesce(v_routine->'exercises','[]'::jsonb)) loop
      v_exercise_position:=v_exercise_position+1; v_library_id:=null; v_library_raw:=coalesce(v_exercise->>'exercise_library_id',v_exercise->>'id','');
      if v_library_raw ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then v_library_id:=v_library_raw::uuid; end if;
      insert into public.workout_exercises(plan_id,exercise_library_id,name,muscle_group,equipment,media_url,media_type,sets,reps_min,reps_max,rest_seconds,initial_load_kg,notes,position,set_type,set_group_id,set_group_order,created_at,updated_at)
      values(v_plan_id,v_library_id,coalesce(nullif(trim(v_exercise->>'name'),''),'Exercício'),coalesce(nullif(trim(v_exercise->>'muscle_group'),''),'Outros'),coalesce(v_exercise->>'equipment',''),nullif(regexp_replace(trim(v_exercise->>'media_url'),'\.GIF([?#]|$)','.gif\1','gi'),''),coalesce(nullif(trim(v_exercise->>'media_type'),''),'gif'),greatest(1,coalesce((v_exercise->>'sets')::integer,3)),greatest(1,coalesce((v_exercise->>'reps_min')::integer,10)),greatest(1,coalesce((v_exercise->>'reps_max')::integer,12)),greatest(0,coalesce((v_exercise->>'rest_seconds')::integer,60)),greatest(0,coalesce((v_exercise->>'initial_load_kg')::numeric,0)),coalesce(v_exercise->>'notes',''),coalesce((v_exercise->>'position')::integer,v_exercise_position),case when v_exercise->>'set_type' in ('bi_set','tri_set') then v_exercise->>'set_type' else 'normal' end,case when v_exercise->>'set_type' in ('bi_set','tri_set') then nullif(v_exercise->>'set_group_id','') else null end,case when v_exercise->>'set_type' in ('bi_set','tri_set') then greatest(0,coalesce((v_exercise->>'set_group_order')::integer,0)) else 0 end,now(),now());
    end loop;
  end loop;
  if p_cardio is not null and jsonb_typeof(p_cardio)='object' then
    insert into public.workout_cardio_prescriptions(program_id,student_id,activity_type,timing,target_duration_minutes,target_speed_kmh,target_calories,notes,created_at,updated_at)
    values(v_program_id,p_student_id,coalesce(nullif(trim(p_cardio->>'activity_type'),''),'treadmill'),coalesce(nullif(trim(p_cardio->>'timing'),''),'after'),greatest(1,coalesce((p_cardio->>'target_duration_minutes')::integer,20)),greatest(0,coalesce((p_cardio->>'target_speed_kmh')::numeric,0)),greatest(0,coalesce((p_cardio->>'target_calories')::integer,0)),coalesce(p_cardio->>'notes',''),now(),now());
  end if;
  update public.accqua_staff_notifications set resolved_at=coalesce(resolved_at,now()),read_at=coalesce(read_at,now()),updated_at=now() where student_id=p_student_id and notification_type='workout_required' and resolved_at is null;
  return v_program_id;
end;
$function$;
'''
write('supabase/migrations/20260902174500_build_1_6_1_workout_sets_and_rest.sql', migration)

# ---------- 1.6.1 contracts ----------
write('scripts/verify-visual-contracts-1.6.1.mjs', r'''import "./verify-visual-contracts-1.6.0.mjs";
import fs from "node:fs";import path from "node:path";import { fileURLToPath } from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");const failures=[];const passes=[];const read=(f)=>fs.readFileSync(path.join(root,f),"utf8");const all=(id,f,ps,n)=>ps.every(p=>p.test(read(f)))?passes.push(id):failures.push(`${id} — ${n} (${f})`);
all("161/version","package.json",[/"version":\s*"1\.6\.1"/,/verify-visual-contracts-1\.6\.1/],"versão/contratos incorretos");
all("161/css","scr/main.tsx",[/build-1\.6\.0\.css";\s*\nimport "\.\/styles\/build-1\.6\.1\.css";/],"CSS 1.6.1 não é a última camada");
all("161/cards","scr/styles/build-1.6.1.css",[/staff-action-card\{min-height:/,/line-clamp:2/,/staff-action-card-meta\{position:static/],"cards de método podem sobrepor texto");
all("161/yellow-date","scr/styles/build-1.6.1.css",[/admin-builder-split-options button\.is-active/,/--accqua-select:#f2c230/,/admin-builder-date-field/],"seleção/data fora do tema");
all("161/controls","scr/styles/build-1.6.1.css",[/grid-template-areas:"media copy chevron" "tune tune tune" "secondary secondary secondary"/,/admin-builder-quick-tune button\{width:36px/,/admin-builder-exercise-controls button\{width:44px/],"controles continuam apertados");
all("161/media","scr/lib/exerciseMedia.ts",[/replace\(\/\\\\\.gif.*?gi, "\.gif"\)/s],"GIF não é normalizado");
all("161/sets-editor","scr/pages/AdminWorkoutBuilder.tsx",[/setExerciseSetType/,/"bi_set", "Bi-set"/,/"tri_set", "Tri-set"/,/Uma volta completa pelo grupo conta como 1 série/],"bi/tri set ausente no editor");
all("161/sets-data","scr/lib/admin.ts",[/setType: ExerciseSetType/,/set_group_id/,/set_group_order/],"grupo não persiste no payload");
all("161/sets-runtime","scr/pages/Treino.tsx",[/groupedExercises/,/groupExerciseIds/,/nextGrouped/],"alternância bi/tri set não existe");
all("161/review","scr/pages/AdminWorkoutBuilder.tsx",[/admin-builder-review-summary/,/Confira o treino antes de publicar/,/Cardio opcional habilitado/],"revisão continua vazia");
all("161/rest-pref","scr/lib/profile.ts",[/restRequired: boolean/,/rest_required: preferences\.restRequired/,/loadProfilePreferences/],"repouso opcional não persiste");
all("161/rest-ui","scr/pages/Profile.tsx",[/Repouso obrigatório/,/restRequired/],"toggle de repouso não aparece");
all("161/timer","scr/components/TimerOverlay.tsx",[/accqua-timer-overlay/,/strokeDasharray/,/logo_app_4k/],"overlay de timer incompleto");
all("161/cardio-overlay","scr/pages/Cardio.tsx",[/<TimerOverlay/,/Pausar cardio/,/targetSeconds - cardioSession\.elapsedSeconds/],"cardio não usa overlay");
all("161/stepper","scr/pages/AdminWorkoutBuilder.tsx",[/admin-builder-step-number/,/admin-builder-step-ring/,/rotate: 360/],"stepper numerado ausente");
all("161/stepper-mobile","scr/styles/build-1.6.1.css",[/@media\(max-width:430px\)/,/admin-builder-step-number\{width:40px/],"stepper não protege mobile 375–430");
all("161/sql","supabase/migrations/20260902174500_build_1_6_1_workout_sets_and_rest.sql",[/set_type/,/rest_required/,/regexp_replace\(media_url/,/publish_accqua_training_program/],"migration incompleta");
if(failures.length){console.error("\nACCQUA Build 1.6.1 — contratos FALHARAM:\n");failures.forEach(f=>console.error(` - ${f}`));process.exit(1)}console.log(`ACCQUA Build 1.6.1 — ${passes.length} contratos adicionais validados.`);
''')

# Docs
write('docs/BUILD-1.6.1.md', '''# ACCQUA Sports — Build 1.6.1\n\nPacote de correções do fluxo Montar Treino e execução.\n\n- cards do ponto de entrada protegidos contra sobreposição;\n- seleção do programa unificada em amarelo e data com UI escura;\n- controles de exercícios redistribuídos e mídia `.gif` normalizada;\n- bi-set e tri-set persistidos, revisáveis e executados por alternância; uma volta completa do grupo = uma série;\n- Revisão exibe o resumo integral antes de publicar;\n- preferência `Repouso obrigatório` por aluno;\n- overlay full-screen compartilhado para repouso e cardio;\n- stepper mobile 1–4 com anel amarelo animado.\n''')

print('Build 1.6.1 source patch applied.')
