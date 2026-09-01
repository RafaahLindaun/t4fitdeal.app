import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../auth/AuthProvider";
import LoadingSplash from "../components/LoadingSplash";
import ResponsiveDialog from "../components/ResponsiveDialog";
import {
  AdminBackIcon,
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
  const [guideGoal, setGuideGoal] = useState<GuideGoal>("hipertrofia");
  const [guideLevel, setGuideLevel] = useState<GuideLevel>("iniciante");
  const [guideDays, setGuideDays] = useState(3);
  const [aiDescription, setAiDescription] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);

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
  const applyGuide = () => {
    if (!library.length) { toast.error("A Biblioteca da equipe está vazia."); return; }
    openEditor(guidedDraft(library, guideGoal, guideLevel, guideDays));
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
          <button type="button" onClick={manual}><span><AdminEditIcon size={24} /></span><strong>Montar manualmente</strong><p>Você escolhe cada exercício do zero.</p><em>Começar do zero</em></button>
          <button type="button" onClick={() => { setGuideStep(0); setMode("guide"); }}><span><AdminTargetIcon size={24} /></span><strong>Assistente guiado</strong><p>Responde 3 perguntas rápidas e a base vem pronta.</p><em>3 perguntas</em></button>
          <button type="button" onClick={() => setMode("templates")}><span><AdminLayersIcon size={24} /></span><strong>Modelo salvo</strong><p>Reaproveita um treino que você já montou antes.</p><em>{templates.length} salvo{templates.length === 1 ? "" : "s"}</em></button>
          <button type="button" className="is-ai" onClick={() => setMode("ai")}><span><AdminSparkIcon size={24} /></span><strong>Descrever pra IA</strong><p>Conta sobre o aluno e a IA monta uma sugestão usando só a Biblioteca real.</p><em>Revisão obrigatória</em></button>
        </section>
        <p className="workout-entry-footnote">Todos os caminhos terminam no mesmo editor. Nenhum treino é publicado sem sua revisão.</p>
      </main>

      <ResponsiveDialog open={mode === "guide"} onOpenChange={(open) => { if (!open) setMode(""); }} title="Assistente guiado" description="Três perguntas e você revisa o resultado no editor normal." className="workout-entry-dialog">
        <div className="workout-entry-guide-progress"><i className={guideStep >= 0 ? "is-active" : ""}/><i className={guideStep >= 1 ? "is-active" : ""}/><i className={guideStep >= 2 ? "is-active" : ""}/></div>
        {guideStep === 0 ? <div className="workout-entry-question"><h3>Beleza, o que o(a) {name} quer treinar?</h3><p>Isso define o estilo do treino — dá pra mudar depois.</p><div>{GOALS.map((item) => <button type="button" className={guideGoal === item.value ? "is-selected" : ""} key={item.value} onClick={() => setGuideGoal(item.value)}>{item.label}</button>)}</div><button className="workout-entry-primary" type="button" onClick={() => setGuideStep(1)}>Continuar</button></div> : null}
        {guideStep === 1 ? <div className="workout-entry-question"><h3>Como você diria que o(a) {name} está hoje?</h3><p>Sem frescura, é só um ponto de partida.</p><div>{LEVELS.map((item) => <button type="button" className={guideLevel === item.value ? "is-selected" : ""} key={item.value} onClick={() => setGuideLevel(item.value)}>{item.label}</button>)}</div><div className="workout-entry-dialog-actions"><button type="button" onClick={() => setGuideStep(0)}>Voltar</button><button className="workout-entry-primary" type="button" onClick={() => setGuideStep(2)}>Continuar</button></div></div> : null}
        {guideStep === 2 ? <div className="workout-entry-question"><h3>Quantos dias o(a) {name} consegue treinar por semana?</h3><p>A divisão se ajusta sozinha a partir disso.</p><div className="is-days">{[1,2,3,4,5,6].map((day) => <button type="button" className={guideDays === day ? "is-selected" : ""} key={day} onClick={() => setGuideDays(day)}>{day}x</button>)}</div><div className="workout-entry-dialog-actions"><button type="button" onClick={() => setGuideStep(1)}>Voltar</button><button className="workout-entry-primary" type="button" onClick={applyGuide}>Criar base para revisar</button></div></div> : null}
      </ResponsiveDialog>

      <ResponsiveDialog open={mode === "templates"} onOpenChange={(open) => { if (!open) setMode(""); }} title="Modelos salvos" description={`Escolha uma base e revise para o(a) ${name}.`} className="workout-entry-dialog">
        <div className="workout-entry-template-list">{templates.length ? templates.map((template) => <button type="button" key={template.id} onClick={() => applyTemplate(template)}><span><strong>{template.name}</strong><small>{template.splitCode} · {template.payload.routines.length} rotina{template.payload.routines.length === 1 ? "" : "s"}</small></span><em>Usar modelo</em></button>) : <div className="workout-entry-empty"><AdminLayersIcon size={28}/><strong>Nenhum modelo salvo ainda</strong><p>Monte um treino manualmente e salve como modelo para reutilizar aqui.</p></div>}</div>
      </ResponsiveDialog>

      <ResponsiveDialog open={mode === "ai"} onOpenChange={(open) => { if (!open && !aiGenerating) setMode(""); }} title={`Me conta sobre o ${name}`} description="Escreve como se estivesse explicando pra outro professor." className="workout-entry-dialog">
        {aiGenerating ? <div className="workout-entry-ai-loading"><AdminSparkIcon size={34}/><strong>Montando uma sugestão...</strong><p>Selecionando apenas exercícios que já existem na Biblioteca da equipe.</p></div> : <div className="workout-entry-ai"><textarea autoFocus rows={6} value={aiDescription} onChange={(event) => setAiDescription(event.target.value)} placeholder="Ex: quer emagrecer, tem dor no joelho direito, treina 3x por semana, gosta mais de treino em pé do que sentado na máquina"/><p>A IA não publica nada e não pode inventar exercícios. O resultado abre no mesmo editor para sua revisão.</p><button type="button" className="workout-entry-primary" disabled={!aiDescription.trim()} onClick={() => void generateAI()}>Gerar sugestão de treino</button></div>}
      </ResponsiveDialog>
    </div>
  );
}
