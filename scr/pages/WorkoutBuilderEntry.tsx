import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useDragControls, type PanInfo } from "framer-motion";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../auth/AuthProvider";
import LoadingSplash from "../components/LoadingSplash";
import ResponsiveDialog from "../components/ResponsiveDialog";
import StaffActionCard from "../components/StaffActionCard";
import {
  AdminBackIcon,
  AdminCheckIcon,
  AdminDumbbellIcon,
  AdminEditIcon,
  AdminLayersIcon,
  AdminSparkIcon,
  AdminTargetIcon,
} from "../components/AdminIcons";
import {
  createBuilderExercise,
  getWorkoutStudentById,
  loadAdminProgramTemplates,
  loadExerciseLibrary,
  type AdminProgramTemplate,
  type AdminRoutine,
  type ExerciseLibraryItem,
  type WorkoutStudent,
} from "../lib/admin";
import {
  clearWorkoutBuilderDraft,
  generateWorkoutDraftWithAI,
  storeWorkoutBuilderDraft,
  type WorkoutBuilderDraft,
} from "../lib/workoutAi";
import { staffMotionTransition } from "../lib/staffMotion";
import "./workout-builder-entry.css";

type GuideGoal = "hipertrofia" | "emagrecimento" | "condicionamento" | "forca" | "saude";
type GuideLevel = "iniciante" | "intermediario" | "avancado";
type DialogMode = "" | "guide" | "templates" | "ai";

const GOALS: Array<{ value: GuideGoal; label: string }> = [
  { value: "hipertrofia", label: "Hipertrofia" },
  { value: "emagrecimento", label: "Emagrecimento" },
  { value: "condicionamento", label: "Condicionamento" },
  { value: "forca", label: "Força" },
  { value: "saude", label: "Saúde / adaptação" },
];
const LEVELS: Array<{ value: GuideLevel; label: string }> = [
  { value: "iniciante", label: "Iniciante" },
  { value: "intermediario", label: "Intermediário" },
  { value: "avancado", label: "Avançado" },
];
const GROUPS: Record<string, string[][]> = {
  FULL: [["Peitoral", "Costas", "Quadríceps", "Posterior de coxa", "Ombros", "Abdômen"]],
  AB: [["Peitoral", "Costas", "Ombros", "Bíceps", "Tríceps"], ["Quadríceps", "Posterior de coxa", "Glúteos", "Panturrilhas", "Abdômen"]],
  ABC: [["Peitoral", "Ombros", "Tríceps"], ["Costas", "Bíceps", "Abdômen"], ["Quadríceps", "Posterior de coxa", "Glúteos", "Panturrilhas"]],
  ABCD: [["Peitoral", "Tríceps"], ["Costas", "Bíceps"], ["Quadríceps", "Posterior de coxa", "Glúteos"], ["Ombros", "Abdômen"]],
  ABCDE: [["Peitoral"], ["Costas"], ["Quadríceps", "Posterior de coxa", "Glúteos"], ["Ombros", "Abdômen"], ["Bíceps", "Tríceps", "Panturrilhas"]],
  ABCDEF: [["Peitoral", "Tríceps"], ["Costas", "Bíceps"], ["Quadríceps"], ["Ombros", "Abdômen"], ["Posterior de coxa", "Glúteos"], ["Bíceps", "Tríceps", "Panturrilhas"]],
};
const SCHEDULES: Record<number, number[][]> = {
  1: [[1, 3, 5]], 2: [[1, 4], [2, 5]], 3: [[1, 4], [2, 5], [3, 6]],
  4: [[1], [2], [4], [5]], 5: [[1], [2], [3], [4], [5]], 6: [[1], [2], [3], [4], [5], [6]],
};

const SWIPE_OFFSET = 70;
const SWIPE_VELOCITY = 600;
const GUIDE_SELECTION_DELAY = 160;

const questionVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction > 0 ? 34 : -34, scale: 0.985 }),
  center: { opacity: 1, x: 0, scale: 1 },
  exit: (direction: number) => ({ opacity: 0, x: direction > 0 ? -34 : 34, scale: 0.985 }),
};

function splitForDays(days: number) {
  return (["FULL", "FULL", "AB", "ABC", "ABCD", "ABCDE", "ABCDEF"] as const)[Math.max(1, Math.min(6, days))];
}
function firstName(name: string) { return name.trim().split(/\s+/)[0] || "aluno"; }
function normalize(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
function goalFromObjective(objective: string): GuideGoal {
  const value = normalize(objective);
  if (value.includes("emagrec")) return "emagrecimento";
  if (value.includes("condicion")) return "condicionamento";
  if (value.includes("forca")) return "forca";
  if (value.includes("saude") || value.includes("adapt")) return "saude";
  return "hipertrofia";
}
function parameters(goal: GuideGoal, level: GuideLevel) {
  if (goal === "forca") return { sets: level === "iniciante" ? 3 : 4, repsMin: 4, repsMax: 8, restSeconds: 120 };
  if (goal === "emagrecimento" || goal === "condicionamento") return { sets: 3, repsMin: 12, repsMax: 15, restSeconds: 45 };
  if (goal === "saude") return { sets: 3, repsMin: 10, repsMax: 15, restSeconds: 60 };
  return { sets: level === "avancado" ? 4 : 3, repsMin: 8, repsMax: 12, restSeconds: 75 };
}
function guidedDraft(library: ExerciseLibraryItem[], goal: GuideGoal, level: GuideLevel, days: number): WorkoutBuilderDraft {
  const split = splitForDays(days);
  const groups = GROUPS[split] ?? GROUPS.FULL;
  const used = new Set<string>();
  const params = parameters(goal, level);
  const target = level === "iniciante" ? 5 : level === "intermediario" ? 6 : 7;
  const routines: AdminRoutine[] = Array.from({ length: Math.max(1, Math.min(6, days)) }, (_, routineIndex) => {
    const routineGroups = groups[routineIndex] ?? groups[0] ?? [];
    const selected: ExerciseLibraryItem[] = [];
    for (const group of routineGroups) {
      const candidates = library.filter((item) => item.muscleGroup === group && !used.has(item.id));
      for (const item of candidates.slice(0, routineGroups.length <= 3 ? 2 : 1)) { selected.push(item); used.add(item.id); }
    }
    for (const item of library) {
      if (selected.length >= target) break;
      if (!used.has(item.id)) { selected.push(item); used.add(item.id); }
    }
    const code = String.fromCharCode(65 + routineIndex);
    return {
      code,
      name: days === 1 ? "Treino Full Body" : `Treino ${code}`,
      focus: routineGroups.join(", "),
      weekDays: SCHEDULES[Math.max(1, Math.min(6, days))]?.[routineIndex] ?? [],
      exercises: selected.slice(0, target).map((item, index) => ({ ...createBuilderExercise(item, index + 1), ...params })),
    };
  });
  const goalLabel = GOALS.find((item) => item.value === goal)?.label ?? "Treino";
  const review = new Date(); review.setDate(review.getDate() + (level === "iniciante" ? 35 : 42));
  return {
    programName: `${goalLabel} ${split}`,
    splitCode: split,
    programNotes: `Base do assistente guiado para ${goalLabel.toLowerCase()}, nível ${LEVELS.find((item) => item.value === level)?.label ?? level}. Revise exercícios, cargas e limitações antes de publicar.`,
    reviewAt: review.toISOString().slice(0, 10), routines,
    cardio: { enabled: goal === "emagrecimento" || goal === "condicionamento", activityType: "treadmill", timing: "after", durationMinutes: goal === "emagrecimento" ? 30 : 20, speedKmh: 0, calories: 0, notes: "" },
    origin: "assistente_guiado", updatedAt: new Date().toISOString(),
  };
}

function SelectedCheck({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.span
          className="workout-entry-answer-check"
          initial={{ opacity: 0, scale: 0.65 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.65 }}
          transition={{ type: "spring", stiffness: 480, damping: 30 }}
        >
          <AdminCheckIcon size={16} />
        </motion.span>
      ) : null}
    </AnimatePresence>
  );
}

export default function WorkoutBuilderEntry() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get("student") ?? "";
  const returnStudentId = searchParams.get("returnStudent") ?? studentId;
  const { user, profile, loading, landingPath } = useAuth();
  const canManage = Boolean(profile && ["professor", "reception", "admin"].includes(profile.role));
  const [student, setStudent] = useState<WorkoutStudent | null>(null);
  const [library, setLibrary] = useState<ExerciseLibraryItem[]>([]);
  const [templates, setTemplates] = useState<AdminProgramTemplate[]>([]);
  const [busy, setBusy] = useState(true);
  const [mode, setMode] = useState<DialogMode>("");
  const [guideStep, setGuideStep] = useState(0);
  const [guideDirection, setGuideDirection] = useState(1);
  const [guideGoal, setGuideGoal] = useState<GuideGoal>("hipertrofia");
  const [guideLevel, setGuideLevel] = useState<GuideLevel>("iniciante");
  const [guideDays, setGuideDays] = useState(3);
  const [guideFinishing, setGuideFinishing] = useState(false);
  const [guideLocked, setGuideLocked] = useState(false);
  const [aiDescription, setAiDescription] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const guideTimer = useRef<number>(0);
  const guideDragControls = useDragControls();

  useEffect(() => {
    if (!user?.id || !canManage || !studentId) return;
    let alive = true;
    setBusy(true);
    Promise.all([getWorkoutStudentById(studentId), loadExerciseLibrary(), loadAdminProgramTemplates(user.id)])
      .then(([studentData, libraryData, templateData]) => {
        if (!alive) return;
        setStudent(studentData);
        setLibrary(libraryData);
        setTemplates(templateData);
        if (studentData) setGuideGoal(goalFromObjective(studentData.objective));
      })
      .catch(() => toast.error("Não foi possível abrir as opções de montagem."))
      .finally(() => { if (alive) setBusy(false); });
    return () => { alive = false; };
  }, [canManage, studentId, user?.id]);

  useEffect(() => () => window.clearTimeout(guideTimer.current), []);

  const editorUrl = useMemo(() => `/area-accqua/montar/editor?student=${encodeURIComponent(studentId)}&returnStudent=${encodeURIComponent(returnStudentId)}`, [returnStudentId, studentId]);
  if (loading || busy) return <LoadingSplash />;
  if (!user) return <Navigate to="/login" replace />;
  if (!canManage || landingPath !== "/menu-teste") return <Navigate to={landingPath} replace />;
  if (!student) return <Navigate to="/area-accqua" replace />;

  const name = firstName(student.fullName);
  const openEditor = (draft?: WorkoutBuilderDraft) => {
    if (draft) storeWorkoutBuilderDraft(user.id, student.id, draft);
    navigate(editorUrl);
  };
  const manual = () => { clearWorkoutBuilderDraft(user.id, student.id); navigate(editorUrl); };
  const applyTemplate = (template: AdminProgramTemplate) => {
    openEditor({ programName: template.payload.programName, splitCode: template.splitCode || "PERSONALIZADO", programNotes: template.payload.notes, reviewAt: template.payload.reviewAt, routines: template.payload.routines, cardio: template.payload.cardio ?? { enabled: false, activityType: "treadmill", timing: "after", durationMinutes: 20, speedKmh: 0, calories: 0, notes: "" }, origin: "manual", updatedAt: new Date().toISOString() });
  };
  const finishGuide = () => {
    if (!library.length) { toast.error("A Biblioteca da equipe está vazia."); return; }
    setGuideLocked(true);
    setGuideFinishing(true);
    window.clearTimeout(guideTimer.current);
    guideTimer.current = window.setTimeout(() => {
      openEditor(guidedDraft(library, guideGoal, guideLevel, guideDays));
    }, 620);
  };
  const generateAI = async () => {
    if (!aiDescription.trim()) return;
    setAiGenerating(true);
    try {
      const draft = await generateWorkoutDraftWithAI(student.id, aiDescription);
      storeWorkoutBuilderDraft(user.id, student.id, draft);
      toast.success("Sugestão criada. Revise tudo antes de publicar.");
      navigate(editorUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível gerar a sugestão.");
    } finally { setAiGenerating(false); }
  };

  const moveGuide = (next: number) => {
    if (guideLocked || next < 0 || next > 2 || next === guideStep) return;
    setGuideDirection(next > guideStep ? 1 : -1);
    setGuideStep(next);
  };
  const selectAndAdvance = (applySelection: () => void, step: number) => {
    if (guideLocked) return;
    applySelection();
    setGuideLocked(true);
    window.clearTimeout(guideTimer.current);
    guideTimer.current = window.setTimeout(() => {
      setGuideLocked(false);
      if (step >= 2) finishGuide();
      else moveGuide(step + 1);
    }, GUIDE_SELECTION_DELAY);
  };
  const handleGuideSwipe = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (guideLocked) return;
    if (Math.abs(info.offset.y) > Math.abs(info.offset.x)) return;
    const strong = Math.abs(info.offset.x) > SWIPE_OFFSET || Math.abs(info.velocity.x) > SWIPE_VELOCITY;
    if (!strong) return;
    if (info.offset.x < 0) {
      if (guideStep === 2) finishGuide();
      else moveGuide(guideStep + 1);
    } else {
      moveGuide(guideStep - 1);
    }
  };

  const answerMotion = {
    whileHover: { y: -3, scale: 1.012 },
    whileTap: { scale: 0.975 },
    transition: { duration: 0.16 },
  } as const;

  return (
    <div className="workout-entry-screen">
      <main className="workout-entry-shell">
        <header className="workout-entry-header">
          <button type="button" onClick={() => navigate(returnStudentId ? `/area-accqua?student=${encodeURIComponent(returnStudentId)}` : "/area-accqua")} aria-label="Voltar"><AdminBackIcon /></button>
          <div><small>MONTAR TREINO</small><strong>Como você quer começar?</strong></div><span />
        </header>

        <section className="workout-entry-student">
          <div className="workout-entry-student-icon"><AdminDumbbellIcon size={24} /></div>
          <div><small>O QUE {name.toLocaleUpperCase("pt-BR")} PRECISA</small><h1>{student.hasActiveWorkout ? "Revisar ou criar um novo programa" : "Ainda não há treino publicado"}</h1><p>Objetivo: <strong>{student.objective || "não informado"}</strong>{student.programCode ? ` · Atual: ${student.programCode}` : ""}</p></div>
          <span className={student.hasActiveWorkout ? "is-active" : "is-pending"}>{student.hasActiveWorkout ? "Treino ativo" : "Treino pendente"}</span>
        </section>

        <section className="workout-entry-methods" aria-label="Métodos de montagem">
          <StaffActionCard icon={<AdminEditIcon size={24} />} title="Montar manualmente" subtitle="Você escolhe cada exercício do zero." meta="Começar do zero" onClick={manual} />
          <StaffActionCard icon={<AdminTargetIcon size={24} />} title="Assistente guiado" subtitle="Responda 3 perguntas rápidas e receba uma base pronta para revisar." meta="3 perguntas" onClick={() => { setGuideDirection(1); setGuideStep(0); setGuideFinishing(false); setGuideLocked(false); setMode("guide"); }} />
          <StaffActionCard icon={<AdminLayersIcon size={24} />} title="Modelo salvo" subtitle="Reaproveite um treino que você já montou antes." meta={`${templates.length} salvo${templates.length === 1 ? "" : "s"}`} onClick={() => setMode("templates")} />
          <StaffActionCard className="is-ai" icon={<AdminSparkIcon size={24} />} title="Descrever pra IA" subtitle="Conte sobre o aluno e receba uma sugestão usando apenas a Biblioteca real." meta="Revisão obrigatória" onClick={() => setMode("ai")} />
        </section>
        <p className="workout-entry-footnote">Todos os caminhos terminam no mesmo editor. Nenhum treino é publicado sem sua revisão.</p>
      </main>

      <ResponsiveDialog open={mode === "guide"} onOpenChange={(open) => { if (!open && !guideFinishing) setMode(""); }} title="Assistente guiado" description="Uma pergunta por vez. Suas respostas ficam salvas quando você volta." className="workout-entry-dialog workout-entry-guide-v158">
        <div className="workout-entry-guide-progress-v158" aria-label={`Pergunta ${guideStep + 1} de 3`}>
          <span><small>Pergunta {guideStep + 1} de 3</small><strong>{Math.round(((guideStep + 1) / 3) * 100)}%</strong></span>
          <i><motion.b initial={false} animate={{ scaleX: (guideStep + 1) / 3 }} transition={{ duration: 0.25 }} /></i>
        </div>

        <AnimatePresence mode="wait" custom={guideDirection}>
          {guideFinishing ? (
            <motion.div key="finish" className="workout-entry-guide-finish" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <span><AdminCheckIcon size={24} /></span>
              <strong>Entendi o perfil</strong>
              <p>Montando uma sugestão...</p>
            </motion.div>
          ) : (
            <motion.div
              key={`guide-${guideStep}`}
              className="workout-entry-question workout-entry-question-v158"
              custom={guideDirection}
              variants={questionVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              drag="x"
              dragListener={false}
              dragControls={guideDragControls}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.14}
              onDragEnd={handleGuideSwipe}
              onPointerDown={(event) => {
                const target = event.target as HTMLElement;
                if (target.closest("input, textarea, select, [data-swipe-ignore], [data-horizontal-scroll], [draggable='true']")) return;
                guideDragControls.start(event);
              }}
            >
              {guideStep === 0 ? (
                <>
                  <h3>Beleza, o que o(a) {name} quer treinar?</h3>
                  <p>Isso define o estilo do treino — dá para mudar depois.</p>
                  <div className="workout-entry-answer-grid">
                    {GOALS.map((item) => {
                      const selected = guideGoal === item.value;
                      return <motion.button {...answerMotion} type="button" className="workout-entry-answer-card" data-selected={selected} key={item.value} onClick={() => selectAndAdvance(() => setGuideGoal(item.value), 0)}><span>{item.label}</span><SelectedCheck visible={selected} /></motion.button>;
                    })}
                  </div>
                </>
              ) : null}

              {guideStep === 1 ? (
                <>
                  <h3>Como você diria que o(a) {name} está hoje?</h3>
                  <p>É só um ponto de partida; tudo poderá ser revisado no editor.</p>
                  <div className="workout-entry-answer-grid">
                    {LEVELS.map((item) => {
                      const selected = guideLevel === item.value;
                      return <motion.button {...answerMotion} type="button" className="workout-entry-answer-card" data-selected={selected} key={item.value} onClick={() => selectAndAdvance(() => setGuideLevel(item.value), 1)}><span>{item.label}</span><SelectedCheck visible={selected} /></motion.button>;
                    })}
                  </div>
                </>
              ) : null}

              {guideStep === 2 ? (
                <>
                  <h3>Quantos dias o(a) {name} consegue treinar por semana?</h3>
                  <p>A divisão se ajusta sozinha a partir disso.</p>
                  <div className="workout-entry-answer-grid is-days">
                    {[1, 2, 3, 4, 5, 6].map((day) => {
                      const selected = guideDays === day;
                      return <motion.button {...answerMotion} type="button" className="workout-entry-answer-card" data-selected={selected} key={day} onClick={() => selectAndAdvance(() => setGuideDays(day), 2)}><span>{day}x</span><SelectedCheck visible={selected} /></motion.button>;
                    })}
                  </div>
                </>
              ) : null}

              <div className="workout-entry-guide-nav" data-swipe-ignore>
                <motion.button type="button" disabled={guideStep === 0 || guideLocked} onClick={() => moveGuide(guideStep - 1)} whileTap={{ scale: 0.96 }} transition={staffMotionTransition}><AdminBackIcon size={16} /> Voltar</motion.button>
                <small>Arraste para os lados no celular</small>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </ResponsiveDialog>

      <ResponsiveDialog open={mode === "templates"} onOpenChange={(open) => { if (!open) setMode(""); }} title="Modelos salvos" description={`Escolha uma base e revise para o(a) ${name}.`} className="workout-entry-dialog">
        <div className="workout-entry-template-list">{templates.length ? templates.map((template) => <button type="button" key={template.id} onClick={() => applyTemplate(template)}><span><strong>{template.name}</strong><small>{template.splitCode} · {template.payload.routines.length} rotina{template.payload.routines.length === 1 ? "" : "s"}</small></span><em>Usar modelo</em></button>) : <div className="workout-entry-empty"><AdminLayersIcon size={28}/><strong>Nenhum modelo salvo ainda</strong><p>Monte um treino manualmente e salve como modelo para reutilizar aqui.</p></div>}</div>
      </ResponsiveDialog>

      <ResponsiveDialog open={mode === "ai"} onOpenChange={(open) => { if (!open && !aiGenerating) setMode(""); }} title={`Me conta sobre o ${name}`} description="Escreva como se estivesse explicando para outro professor." className="workout-entry-dialog">
        {aiGenerating ? <div className="workout-entry-ai-loading"><AdminSparkIcon size={34}/><strong>Montando uma sugestão...</strong><p>Selecionando apenas exercícios que já existem na Biblioteca da equipe.</p></div> : <div className="workout-entry-ai"><textarea autoFocus rows={6} value={aiDescription} onChange={(event) => setAiDescription(event.target.value)} placeholder="Ex: quer emagrecer, tem dor no joelho direito, treina 3x por semana, gosta mais de treino em pé do que sentado na máquina"/><p>A IA não publica nada e não pode inventar exercícios. O resultado abre no mesmo editor para sua revisão.</p><button type="button" className="workout-entry-primary" disabled={!aiDescription.trim()} onClick={() => void generateAI()}>Gerar sugestão de treino</button></div>}
      </ResponsiveDialog>
    </div>
  );
}
