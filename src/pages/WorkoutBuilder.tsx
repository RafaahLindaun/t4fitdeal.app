import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import AccquaLogo from "../components/AccquaLogo";
import LoadingSplash from "../components/LoadingSplash";
import {
  BuilderBackIcon,
  BuilderCheckIcon,
  BuilderChevronIcon,
  BuilderCloseIcon,
  BuilderDownIcon,
  BuilderDumbbellIcon,
  BuilderLightIcon,
  BuilderMinusIcon,
  BuilderPlusIcon,
  BuilderSaveIcon,
  BuilderSearchIcon,
  BuilderStudentIcon,
  BuilderTemplateIcon,
  BuilderTrashIcon,
  BuilderUpIcon,
} from "../components/WorkoutBuilderIcons";
import {
  FALLBACK_EXERCISE_LIBRARY,
  createBuilderExercise,
  formatStudentDocument,
  loadExerciseLibrary,
  loadWorkoutTemplates,
  saveStudentWorkout,
  saveWorkoutTemplate,
  searchWorkoutStudents,
  type BuilderExercise,
  type ExerciseLibraryItem,
  type WorkoutPlanDraft,
  type WorkoutStudent,
  type WorkoutTemplate,
} from "../lib/workoutBuilder";
import "./workout-builder.css";

type BuilderStep = 1 | 2 | 3;

type Preset = {
  label: string;
  description: string;
  exercises: string[];
};

const DEFAULT_PLAN: WorkoutPlanDraft = {
  name: "Treino A",
  focus: "",
  notes: "",
  reviewAt: "",
  weekDays: [1, 3, 5],
};

const WEEK_DAYS = [
  { value: 1, label: "S" },
  { value: 2, label: "T" },
  { value: 3, label: "Q" },
  { value: 4, label: "Q" },
  { value: 5, label: "S" },
  { value: 6, label: "S" },
  { value: 0, label: "D" },
];

const PRESETS: Preset[] = [
  {
    label: "Full body base",
    description: "Estrutura equilibrada para adaptação e retorno.",
    exercises: [
      "Agachamento livre",
      "Puxada frontal",
      "Supino reto com barra",
      "Elevação lateral",
      "Mesa flexora",
      "Prancha",
    ],
  },
  {
    label: "Superior",
    description: "Peitoral, costas, ombros e braços.",
    exercises: [
      "Supino reto com barra",
      "Puxada frontal",
      "Remada baixa",
      "Elevação lateral",
      "Rosca direta",
      "Tríceps pulley",
    ],
  },
  {
    label: "Inferior",
    description: "Quadríceps, posterior, glúteos e panturrilhas.",
    exercises: [
      "Agachamento livre",
      "Leg press 45°",
      "Cadeira extensora",
      "Mesa flexora",
      "Elevação pélvica",
      "Panturrilha em pé",
    ],
  },
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "AL";
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function reorderExercises(exercises: BuilderExercise[]) {
  return exercises.map((exercise, index) => ({
    ...exercise,
    position: index + 1,
  }));
}

export default function WorkoutBuilder() {
  const navigate = useNavigate();
  const { user, profile, loading, isTeam, landingPath } = useAuth();

  const [step, setStep] = useState<BuilderStep>(1);
  const [studentQuery, setStudentQuery] = useState("");
  const [students, setStudents] = useState<WorkoutStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentError, setStudentError] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<WorkoutStudent | null>(null);

  const [plan, setPlan] = useState<WorkoutPlanDraft>(DEFAULT_PLAN);
  const [library, setLibrary] = useState<ExerciseLibraryItem[]>(
    FALLBACK_EXERCISE_LIBRARY,
  );
  const [libraryQuery, setLibraryQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState("Todos");
  const [exercises, setExercises] = useState<BuilderExercise[]>([]);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [completed, setCompleted] = useState(false);

  const staffLabel = profile?.role === "reception" ? "RECEPÇÃO" : "PROFESSOR";

  useEffect(() => {
    if (!user || !isTeam) return;

    void loadExerciseLibrary().then(setLibrary);
    void loadWorkoutTemplates(user.id).then(setTemplates);
  }, [isTeam, user?.id]);

  useEffect(() => {
    if (!user || !isTeam) return;

    const timer = window.setTimeout(async () => {
      setStudentsLoading(true);
      setStudentError("");
      try {
        const result = await searchWorkoutStudents(studentQuery);
        setStudents(result);
      } catch (error) {
        setStudentError(
          error instanceof Error ? error.message : "Não foi possível buscar alunos.",
        );
      } finally {
        setStudentsLoading(false);
      }
    }, 280);

    return () => window.clearTimeout(timer);
  }, [isTeam, studentQuery, user?.id]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!user || !selectedStudent) return;
    const key = `accqua-workout-draft:${user.id}:${selectedStudent.id}`;
    const timer = window.setTimeout(() => {
      localStorage.setItem(
        key,
        JSON.stringify({ plan, exercises, updatedAt: new Date().toISOString() }),
      );
    }, 450);
    return () => window.clearTimeout(timer);
  }, [exercises, plan, selectedStudent, user]);

  const groups = useMemo(() => {
    const values = [...new Set(library.map((item) => item.muscleGroup))];
    return ["Todos", ...values.sort((a, b) => a.localeCompare(b, "pt-BR"))];
  }, [library]);

  const filteredLibrary = useMemo(() => {
    const query = normalize(libraryQuery.trim());
    return library.filter((item) => {
      const matchesGroup = activeGroup === "Todos" || item.muscleGroup === activeGroup;
      const matchesQuery =
        !query ||
        normalize(`${item.name} ${item.muscleGroup} ${item.equipment}`).includes(query);
      return matchesGroup && matchesQuery;
    });
  }, [activeGroup, library, libraryQuery]);

  const canReview = Boolean(
    selectedStudent && plan.name.trim() && exercises.length > 0,
  );

  const volumeLabel = useMemo(() => {
    if (exercises.length <= 5) return "Volume enxuto";
    if (exercises.length <= 8) return "Volume equilibrado";
    return "Volume alto";
  }, [exercises.length]);

  if (loading) return <LoadingSplash />;
  if (!user) return <Navigate to="/login" replace />;
  if (landingPath !== "/menu-teste") return <Navigate to={landingPath} replace />;
  if (!isTeam) return <Navigate to="/menu-teste" replace />;

  const selectStudent = (student: WorkoutStudent) => {
    setSelectedStudent(student);
    setCompleted(false);

    const key = `accqua-workout-draft:${user.id}:${student.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as {
          plan?: WorkoutPlanDraft;
          exercises?: BuilderExercise[];
        };
        if (parsed.plan) setPlan(parsed.plan);
        if (Array.isArray(parsed.exercises)) {
          setExercises(reorderExercises(parsed.exercises));
        }
        setToast("Rascunho recuperado para este aluno.");
      } catch {
        localStorage.removeItem(key);
      }
    } else {
      setPlan(DEFAULT_PLAN);
      setExercises([]);
    }

    setStep(2);
  };

  const toggleWeekDay = (day: number) => {
    setPlan((current) => ({
      ...current,
      weekDays: current.weekDays.includes(day)
        ? current.weekDays.filter((value) => value !== day)
        : [...current.weekDays, day],
    }));
  };

  const addExercise = (item: ExerciseLibraryItem) => {
    setExercises((current) => {
      const next = [...current, createBuilderExercise(item, current.length + 1)];
      return reorderExercises(next);
    });
    setToast(`${item.name} adicionado.`);
  };

  const applyPreset = (preset: Preset) => {
    const chosen = preset.exercises
      .map((name) => library.find((item) => item.name === name))
      .filter(Boolean) as ExerciseLibraryItem[];

    setExercises(chosen.map((item, index) => createBuilderExercise(item, index + 1)));
    setPlan((current) => ({
      ...current,
      focus: current.focus || preset.label,
    }));
    setToast(`${preset.label} aplicado. Você ainda pode editar tudo.`);
  };

  const updateExercise = (
    draftId: string,
    patch: Partial<BuilderExercise>,
  ) => {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.draftId === draftId ? { ...exercise, ...patch } : exercise,
      ),
    );
  };

  const removeExercise = (draftId: string) => {
    setExercises((current) =>
      reorderExercises(current.filter((exercise) => exercise.draftId !== draftId)),
    );
  };

  const moveExercise = (index: number, direction: -1 | 1) => {
    setExercises((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return reorderExercises(next);
    });
  };

  const applyTemplate = (template: WorkoutTemplate) => {
    setPlan({
      name: template.name,
      focus: template.focus,
      notes: template.notes,
      reviewAt: "",
      weekDays: template.weekDays,
    });
    setExercises(
      reorderExercises(
        template.exercises.map((exercise, index) => ({
          ...exercise,
          draftId: `${exercise.slug}-${Date.now()}-${index}`,
        })),
      ),
    );
    setTemplatesOpen(false);
    setStep(2);
    setToast("Modelo aplicado. Revise antes de publicar.");
  };

  const validateWorkout = () => {
    if (!selectedStudent) {
      setToast("Escolha um aluno.");
      return false;
    }
    if (!plan.name.trim()) {
      setToast("Dê um nome para o treino.");
      return false;
    }
    if (!exercises.length) {
      setToast("Adicione ao menos um exercício.");
      return false;
    }
    return true;
  };

  const saveDraft = async () => {
    if (!validateWorkout() || !selectedStudent) return;
    setSaving(true);
    try {
      await saveStudentWorkout({
        studentId: selectedStudent.id,
        staffId: user.id,
        plan,
        exercises,
        activate: false,
      });
      setToast("Rascunho salvo no cadastro do aluno.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  };

  const saveTemplate = async () => {
    if (!validateWorkout()) return;
    setSaving(true);
    try {
      await saveWorkoutTemplate({
        staffId: user.id,
        plan,
        exercises,
      });
      setTemplates(await loadWorkoutTemplates(user.id));
      setToast("Modelo salvo para reutilizar com outros alunos.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Não foi possível salvar o modelo.");
    } finally {
      setSaving(false);
    }
  };

  const publishWorkout = async () => {
    if (!validateWorkout() || !selectedStudent) return;
    setSaving(true);
    try {
      await saveStudentWorkout({
        studentId: selectedStudent.id,
        staffId: user.id,
        plan,
        exercises,
        activate: true,
      });
      localStorage.removeItem(
        `accqua-workout-draft:${user.id}:${selectedStudent.id}`,
      );
      setCompleted(true);
      setToast("Treino publicado para o aluno.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Não foi possível publicar.");
    } finally {
      setSaving(false);
    }
  };

  const startAnother = () => {
    setSelectedStudent(null);
    setStudentQuery("");
    setPlan(DEFAULT_PLAN);
    setExercises([]);
    setCompleted(false);
    setStep(1);
  };

  return (
    <div className="builder-screen">
      <div className="builder-background" aria-hidden="true">
        <span className="builder-background-glow" />
        <span className="builder-background-grid" />
      </div>

      <main className="builder-shell">
        <header className="builder-header">
          <button
            type="button"
            className="builder-icon-button"
            onClick={() => navigate("/menu-teste")}
            aria-label="Voltar ao menu"
          >
            <BuilderBackIcon />
          </button>

          <div className="builder-brand">
            <AccquaLogo compact />
            <div>
              <span>{staffLabel}</span>
              <strong>Montador de treino</strong>
            </div>
          </div>

          <button
            type="button"
            className="builder-template-button"
            onClick={() => setTemplatesOpen(true)}
          >
            <BuilderTemplateIcon />
            <span>Modelos</span>
          </button>
        </header>

        <section className="builder-progress" aria-label="Etapas do montador">
          {[
            { value: 1, label: "Aluno", icon: BuilderStudentIcon },
            { value: 2, label: "Treino", icon: BuilderDumbbellIcon },
            { value: 3, label: "Revisar", icon: BuilderCheckIcon },
          ].map((item, index) => {
            const StepIcon = item.icon;
            const active = step === item.value;
            const done = step > item.value;
            return (
              <div className="builder-progress-item" key={item.value}>
                <button
                  type="button"
                  className={`${active ? "is-active" : ""} ${done ? "is-done" : ""}`}
                  onClick={() => {
                    if (item.value === 1) setStep(1);
                    if (item.value === 2 && selectedStudent) setStep(2);
                    if (item.value === 3 && canReview) setStep(3);
                  }}
                >
                  <span>{done ? <BuilderCheckIcon size={18} /> : <StepIcon size={19} />}</span>
                  <strong>{item.label}</strong>
                </button>
                {index < 2 ? <i className={done ? "is-done" : ""} /> : null}
              </div>
            );
          })}
        </section>

        {completed && selectedStudent ? (
          <section className="builder-success-card">
            <span className="builder-success-icon">
              <BuilderCheckIcon size={34} />
            </span>
            <small>TREINO PUBLICADO</small>
            <h1>Pronto para {selectedStudent.fullName.split(/\s+/)[0]}</h1>
            <p>
              O plano já está ativo e aparecerá automaticamente na aba Meu treino do aluno.
            </p>
            <div>
              <button type="button" onClick={startAnother}>
                Montar para outro aluno
              </button>
              <button type="button" onClick={() => navigate("/menu-teste")}>
                Voltar ao menu
              </button>
            </div>
          </section>
        ) : null}

        {!completed && step === 1 ? (
          <section className="builder-step builder-student-step">
            <div className="builder-step-heading">
              <span>1</span>
              <div>
                <h1>Para quem é o treino?</h1>
                <p>Busque por nome, sobrenome, CPF, RG, telefone ou código de matrícula.</p>
              </div>
            </div>

            <label className="builder-search-field">
              <BuilderSearchIcon />
              <input
                value={studentQuery}
                onChange={(event) => setStudentQuery(event.target.value)}
                placeholder="Ex.: Ana Souza, CPF ou matrícula"
                autoComplete="off"
              />
              {studentQuery ? (
                <button type="button" onClick={() => setStudentQuery("")}>
                  <BuilderCloseIcon size={18} />
                </button>
              ) : null}
            </label>

            <div className="builder-search-help">
              <BuilderLightIcon size={20} />
              <span>
                Digite qualquer parte do nome. A busca também encontra CPF sem pontuação e matrícula.
              </span>
            </div>

            <div className="builder-student-list">
              {studentsLoading ? (
                <div className="builder-list-state">
                  <span className="builder-spinner" />
                  <p>Buscando alunos...</p>
                </div>
              ) : null}

              {!studentsLoading && studentError ? (
                <div className="builder-list-state is-error">
                  <strong>Não conseguimos abrir a lista</strong>
                  <p>{studentError}</p>
                </div>
              ) : null}

              {!studentsLoading && !studentError && !students.length ? (
                <div className="builder-list-state">
                  <BuilderStudentIcon size={31} />
                  <strong>Nenhum aluno encontrado</strong>
                  <p>Confira a escrita ou tente CPF, RG ou matrícula.</p>
                </div>
              ) : null}

              {!studentsLoading && !studentError
                ? students.map((student) => (
                    <button
                      type="button"
                      className="builder-student-card"
                      key={student.id}
                      onClick={() => selectStudent(student)}
                    >
                      <span className="builder-student-avatar">
                        {initials(student.fullName)}
                      </span>
                      <span className="builder-student-copy">
                        <strong>{student.fullName}</strong>
                        <small>
                          CPF {formatStudentDocument(student.cpf)}
                          {student.registrationCode
                            ? ` · Matrícula ${student.registrationCode}`
                            : ""}
                        </small>
                        {student.objective ? <em>{student.objective}</em> : null}
                      </span>
                      <span className="builder-student-status">
                        <i />
                        {student.status === "active" || student.status === "ativo"
                          ? "Ativo"
                          : "Cadastro"}
                      </span>
                      <BuilderChevronIcon />
                    </button>
                  ))
                : null}
            </div>
          </section>
        ) : null}

        {!completed && step === 2 && selectedStudent ? (
          <section className="builder-step builder-workout-step">
            <article className="builder-selected-student">
              <span className="builder-student-avatar">{initials(selectedStudent.fullName)}</span>
              <div>
                <small>ALUNO SELECIONADO</small>
                <strong>{selectedStudent.fullName}</strong>
                <span>
                  {selectedStudent.registrationCode
                    ? `Matrícula ${selectedStudent.registrationCode}`
                    : `CPF ${formatStudentDocument(selectedStudent.cpf)}`}
                </span>
              </div>
              <button type="button" onClick={() => setStep(1)}>
                Trocar
              </button>
            </article>

            <article className="builder-form-card">
              <div className="builder-card-title">
                <span><BuilderDumbbellIcon /></span>
                <div>
                  <small>IDENTIFICAÇÃO</small>
                  <h2>Dados do treino</h2>
                </div>
              </div>

              <div className="builder-form-grid">
                <label>
                  <span>Nome do treino</span>
                  <input
                    value={plan.name}
                    onChange={(event) =>
                      setPlan((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="Treino A"
                  />
                </label>
                <label>
                  <span>Foco principal</span>
                  <input
                    value={plan.focus}
                    onChange={(event) =>
                      setPlan((current) => ({ ...current, focus: event.target.value }))
                    }
                    placeholder="Hipertrofia, adaptação..."
                  />
                </label>
                <label>
                  <span>Revisar em</span>
                  <input
                    type="date"
                    value={plan.reviewAt}
                    onChange={(event) =>
                      setPlan((current) => ({ ...current, reviewAt: event.target.value }))
                    }
                  />
                </label>
              </div>

              <div className="builder-days-field">
                <span>Dias recomendados</span>
                <div>
                  {WEEK_DAYS.map((day) => (
                    <button
                      type="button"
                      key={day.value}
                      className={plan.weekDays.includes(day.value) ? "is-active" : ""}
                      onClick={() => toggleWeekDay(day.value)}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="builder-notes-field">
                <span>Orientação geral para o aluno</span>
                <textarea
                  value={plan.notes}
                  onChange={(event) =>
                    setPlan((current) => ({ ...current, notes: event.target.value }))
                  }
                  placeholder="Ex.: controlar a execução, avisar se sentir dor e registrar as cargas."
                />
              </label>
            </article>

            <article className="builder-help-card">
              <div>
                <BuilderLightIcon />
                <span>
                  <small>AJUDA PARA MONTAGEM</small>
                  <strong>{volumeLabel}</strong>
                </span>
              </div>
              <p>
                Para alunos iniciantes, 5 a 8 exercícios bem orientados costumam ser mais fáceis de aprender e acompanhar. Compostos podem usar 75–90s de descanso.
              </p>
              <div className="builder-presets">
                {PRESETS.map((preset) => (
                  <button type="button" key={preset.label} onClick={() => applyPreset(preset)}>
                    <strong>{preset.label}</strong>
                    <span>{preset.description}</span>
                  </button>
                ))}
              </div>
            </article>

            <article className="builder-selected-exercises-card">
              <div className="builder-section-header">
                <div>
                  <small>ORDEM DO TREINO</small>
                  <h2>Exercícios escolhidos</h2>
                </div>
                <span>{exercises.length} exercícios</span>
              </div>

              {!exercises.length ? (
                <div className="builder-empty-exercises">
                  <BuilderDumbbellIcon size={31} />
                  <strong>O treino ainda está vazio</strong>
                  <p>Use a biblioteca logo abaixo ou aplique uma estrutura pronta.</p>
                </div>
              ) : null}

              <div className="builder-selected-exercises">
                {exercises.map((exercise, index) => {
                  const expanded = expandedExercise === exercise.draftId;
                  return (
                    <div className={`builder-exercise-editor ${expanded ? "is-expanded" : ""}`} key={exercise.draftId}>
                      <div className="builder-exercise-editor-main">
                        <span className="builder-exercise-position">{index + 1}</span>
                        <div className="builder-exercise-editor-copy">
                          <strong>{exercise.name}</strong>
                          <span>
                            {exercise.sets} × {exercise.repsMin}
                            {exercise.repsMax !== exercise.repsMin
                              ? `–${exercise.repsMax}`
                              : ""}
                            {` · ${exercise.restSeconds}s`}
                          </span>
                        </div>
                        <div className="builder-exercise-order">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveExercise(index, -1)}
                            aria-label="Subir exercício"
                          >
                            <BuilderUpIcon />
                          </button>
                          <button
                            type="button"
                            disabled={index === exercises.length - 1}
                            onClick={() => moveExercise(index, 1)}
                            aria-label="Descer exercício"
                          >
                            <BuilderDownIcon />
                          </button>
                        </div>
                        <button
                          type="button"
                          className="builder-expand-exercise"
                          onClick={() =>
                            setExpandedExercise(expanded ? null : exercise.draftId)
                          }
                        >
                          Editar
                          <BuilderChevronIcon />
                        </button>
                      </div>

                      {expanded ? (
                        <div className="builder-exercise-editor-details">
                          <div className="builder-number-control">
                            <span>Séries</span>
                            <div>
                              <button
                                type="button"
                                onClick={() =>
                                  updateExercise(exercise.draftId, {
                                    sets: Math.max(1, exercise.sets - 1),
                                  })
                                }
                              >
                                <BuilderMinusIcon />
                              </button>
                              <strong>{exercise.sets}</strong>
                              <button
                                type="button"
                                onClick={() =>
                                  updateExercise(exercise.draftId, {
                                    sets: Math.min(10, exercise.sets + 1),
                                  })
                                }
                              >
                                <BuilderPlusIcon />
                              </button>
                            </div>
                          </div>

                          <label>
                            <span>Repetições</span>
                            <div className="builder-inline-inputs">
                              <input
                                type="number"
                                min="1"
                                value={exercise.repsMin}
                                onChange={(event) =>
                                  updateExercise(exercise.draftId, {
                                    repsMin: Math.max(1, Number(event.target.value)),
                                  })
                                }
                              />
                              <i>até</i>
                              <input
                                type="number"
                                min="1"
                                value={exercise.repsMax}
                                onChange={(event) =>
                                  updateExercise(exercise.draftId, {
                                    repsMax: Math.max(1, Number(event.target.value)),
                                  })
                                }
                              />
                            </div>
                          </label>

                          <label>
                            <span>Descanso</span>
                            <select
                              value={exercise.restSeconds}
                              onChange={(event) =>
                                updateExercise(exercise.draftId, {
                                  restSeconds: Number(event.target.value),
                                })
                              }
                            >
                              {[30, 45, 60, 75, 90, 120, 150].map((seconds) => (
                                <option key={seconds} value={seconds}>
                                  {seconds} segundos
                                </option>
                              ))}
                            </select>
                          </label>

                          <label>
                            <span>Carga inicial (kg)</span>
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={exercise.initialLoadKg}
                              onChange={(event) =>
                                updateExercise(exercise.draftId, {
                                  initialLoadKg: Math.max(0, Number(event.target.value)),
                                })
                              }
                            />
                          </label>

                          <label className="builder-exercise-notes">
                            <span>Orientação específica</span>
                            <textarea
                              value={exercise.notes}
                              onChange={(event) =>
                                updateExercise(exercise.draftId, {
                                  notes: event.target.value,
                                })
                              }
                              placeholder={exercise.beginnerTip}
                            />
                          </label>

                          <div className="builder-technique-tip">
                            <BuilderLightIcon size={19} />
                            <span>{exercise.beginnerTip}</span>
                          </div>

                          <button
                            type="button"
                            className="builder-remove-exercise"
                            onClick={() => removeExercise(exercise.draftId)}
                          >
                            <BuilderTrashIcon />
                            Remover exercício
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="builder-library-card">
              <div className="builder-section-header">
                <div>
                  <small>BIBLIOTECA</small>
                  <h2>Adicionar exercícios</h2>
                </div>
                <span>{filteredLibrary.length} encontrados</span>
              </div>

              <label className="builder-search-field is-compact">
                <BuilderSearchIcon />
                <input
                  value={libraryQuery}
                  onChange={(event) => setLibraryQuery(event.target.value)}
                  placeholder="Buscar exercício ou aparelho"
                />
              </label>

              <div className="builder-group-chips">
                {groups.map((group) => (
                  <button
                    type="button"
                    key={group}
                    className={activeGroup === group ? "is-active" : ""}
                    onClick={() => setActiveGroup(group)}
                  >
                    {group}
                  </button>
                ))}
              </div>

              <div className="builder-library-list">
                {filteredLibrary.map((item) => (
                  <div className="builder-library-item" key={item.slug}>
                    <span className="builder-library-icon">
                      <BuilderDumbbellIcon />
                    </span>
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.muscleGroup} · {item.equipment}</span>
                    </div>
                    <button type="button" onClick={() => addExercise(item)}>
                      <BuilderPlusIcon />
                      Adicionar
                    </button>
                  </div>
                ))}
              </div>
            </article>

            <div className="builder-step-actions">
              <button type="button" className="is-secondary" onClick={saveDraft} disabled={saving}>
                <BuilderSaveIcon />
                Salvar rascunho
              </button>
              <button
                type="button"
                className="is-primary"
                disabled={!canReview || saving}
                onClick={() => setStep(3)}
              >
                Revisar treino
                <BuilderChevronIcon />
              </button>
            </div>
          </section>
        ) : null}

        {!completed && step === 3 && selectedStudent ? (
          <section className="builder-step builder-review-step">
            <div className="builder-step-heading">
              <span>3</span>
              <div>
                <h1>Revise antes de publicar</h1>
                <p>Confira o aluno, a ordem e as orientações. O treino ativo anterior será arquivado.</p>
              </div>
            </div>

            <article className="builder-review-summary">
              <div className="builder-review-student">
                <span className="builder-student-avatar">{initials(selectedStudent.fullName)}</span>
                <div>
                  <small>ALUNO</small>
                  <strong>{selectedStudent.fullName}</strong>
                  <span>
                    {selectedStudent.registrationCode
                      ? `Matrícula ${selectedStudent.registrationCode}`
                      : `CPF ${formatStudentDocument(selectedStudent.cpf)}`}
                  </span>
                </div>
              </div>

              <div className="builder-review-plan">
                <span>
                  <small>PLANO</small>
                  <strong>{plan.name}</strong>
                </span>
                <span>
                  <small>FOCO</small>
                  <strong>{plan.focus || "Não informado"}</strong>
                </span>
                <span>
                  <small>EXERCÍCIOS</small>
                  <strong>{exercises.length}</strong>
                </span>
                <span>
                  <small>REVISÃO</small>
                  <strong>{plan.reviewAt ? new Date(`${plan.reviewAt}T12:00:00`).toLocaleDateString("pt-BR") : "Sem data"}</strong>
                </span>
              </div>
            </article>

            <article className="builder-review-exercises">
              <div className="builder-section-header">
                <div>
                  <small>ORDEM FINAL</small>
                  <h2>Exercícios do treino</h2>
                </div>
                <button type="button" onClick={() => setStep(2)}>Editar</button>
              </div>

              {exercises.map((exercise, index) => (
                <div key={exercise.draftId}>
                  <span>{index + 1}</span>
                  <div>
                    <strong>{exercise.name}</strong>
                    <small>{exercise.muscleGroup} · {exercise.equipment}</small>
                  </div>
                  <b>
                    {exercise.sets} × {exercise.repsMin}
                    {exercise.repsMax !== exercise.repsMin ? `–${exercise.repsMax}` : ""}
                    <small>{exercise.restSeconds}s descanso</small>
                  </b>
                </div>
              ))}
            </article>

            {plan.notes ? (
              <article className="builder-review-note">
                <BuilderLightIcon />
                <div>
                  <small>ORIENTAÇÃO AO ALUNO</small>
                  <p>{plan.notes}</p>
                </div>
              </article>
            ) : null}

            <div className="builder-publish-actions">
              <button type="button" className="is-ghost" onClick={() => setStep(2)} disabled={saving}>
                Voltar e editar
              </button>
              <button type="button" className="is-template" onClick={saveTemplate} disabled={saving}>
                <BuilderTemplateIcon />
                Salvar como modelo
              </button>
              <button type="button" className="is-publish" onClick={publishWorkout} disabled={saving}>
                {saving ? <span className="builder-spinner" /> : <BuilderCheckIcon />}
                Publicar para o aluno
              </button>
            </div>
          </section>
        ) : null}
      </main>

      {templatesOpen ? (
        <div className="builder-drawer-backdrop" onMouseDown={() => setTemplatesOpen(false)}>
          <aside className="builder-template-drawer" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <div>
                <small>BIBLIOTECA DO PROFESSOR</small>
                <h2>Modelos salvos</h2>
              </div>
              <button type="button" onClick={() => setTemplatesOpen(false)}>
                <BuilderCloseIcon />
              </button>
            </header>

            {!templates.length ? (
              <div className="builder-template-empty">
                <BuilderTemplateIcon size={33} />
                <strong>Nenhum modelo salvo</strong>
                <p>Monte um treino e use “Salvar como modelo” na revisão.</p>
              </div>
            ) : (
              <div className="builder-template-list">
                {templates.map((template) => (
                  <button type="button" key={template.id} onClick={() => applyTemplate(template)}>
                    <span><BuilderTemplateIcon /></span>
                    <div>
                      <strong>{template.name}</strong>
                      <small>{template.focus || "Sem foco informado"}</small>
                      <em>{template.exercises.length} exercícios</em>
                    </div>
                    <BuilderChevronIcon />
                  </button>
                ))}
              </div>
            )}
          </aside>
        </div>
      ) : null}

      {toast ? <div className="builder-toast" role="status">{toast}</div> : null}
    </div>
  );
}
