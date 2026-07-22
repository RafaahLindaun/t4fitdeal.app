import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Navigate,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import AccquaLogo from "../components/AccquaLogo";
import LoadingSplash from "../components/LoadingSplash";
import {
  AdminBackIcon,
  AdminCalendarIcon,
  AdminCardioIcon,
  AdminCheckIcon,
  AdminChevronIcon,
  AdminCloseIcon,
  AdminDownIcon,
  AdminDumbbellIcon,
  AdminInfoIcon,
  AdminLayersIcon,
  AdminLinkIcon,
  AdminMinusIcon,
  AdminPlusIcon,
  AdminSparkIcon,
  AdminTargetIcon,
  AdminSaveIcon,
  AdminSearchIcon,
  AdminTrashIcon,
  AdminUpIcon,
  AdminWarningIcon,
} from "../components/AdminIcons";
import {
  FALLBACK_EXERCISE_LIBRARY,
  createBuilderExercise,
  getWorkoutStudentById,
  loadAdminProgramTemplates,
  loadExerciseLibrary,
  publishAdminProgram,
  saveAdminProgramTemplate,
  type AdminCardioPrescription,
  type AdminProgramTemplate,
  type AdminRoutine,
  type BuilderExercise,
  type ExerciseLibraryItem,
  type WorkoutStudent,
} from "../lib/admin";
import "./admin-workout-builder.css";

type SplitCode =
  | "FULL"
  | "AB"
  | "ABC"
  | "ABCD"
  | "ABCDE"
  | "ABCDF"
  | "ABCDEF"
  | "PERSONALIZADO";


type GuideGoal =
  | "hipertrofia"
  | "emagrecimento"
  | "condicionamento"
  | "forca"
  | "saude";

type GuideLevel = "iniciante" | "intermediario" | "avancado";

type BuilderStep = "programa" | "rotina" | "exercicios" | "cardio";

const SPLIT_OPTIONS: Array<{
  code: SplitCode;
  title: string;
  count: number;
}> = [
  { code: "FULL", title: "Full Body", count: 1 },
  { code: "AB", title: "AB", count: 2 },
  { code: "ABC", title: "ABC", count: 3 },
  { code: "ABCD", title: "ABCD", count: 4 },
  { code: "ABCDE", title: "ABCDE", count: 5 },
  { code: "ABCDF", title: "ABCDF", count: 5 },
  { code: "ABCDEF", title: "ABCDEF", count: 6 },
  { code: "PERSONALIZADO", title: "Personalizado", count: 1 },
];

const DAY_LABELS = [
  { value: 1, label: "S", name: "Segunda" },
  { value: 2, label: "T", name: "Terça" },
  { value: 3, label: "Q", name: "Quarta" },
  { value: 4, label: "Q", name: "Quinta" },
  { value: 5, label: "S", name: "Sexta" },
  { value: 6, label: "S", name: "Sábado" },
  { value: 0, label: "D", name: "Domingo" },
];

const DEFAULT_SCHEDULES: Record<string, number[][]> = {
  FULL: [[1, 3, 5]],
  AB: [[1, 4], [2, 5]],
  ABC: [[1, 4], [2, 5], [3, 6]],
  ABCD: [[1], [2], [4], [5]],
  ABCDE: [[1], [2], [3], [4], [5]],
  ABCDF: [[1], [2], [3], [4], [5]],
  ABCDEF: [[1], [2], [3], [4], [5], [6]],
  PERSONALIZADO: [[1, 3, 5]],
};

const DEFAULT_CARDIO: AdminCardioPrescription = {
  enabled: false,
  activityType: "treadmill",
  timing: "after",
  durationMinutes: 20,
  speedKmh: 0,
  calories: 0,
  notes: "",
};


const GUIDE_GOALS: Array<{
  value: GuideGoal;
  label: string;
  description: string;
}> = [
  {
    value: "hipertrofia",
    label: "Hipertrofia",
    description: "Volume moderado, repetições controladas e progressão de carga.",
  },
  {
    value: "emagrecimento",
    label: "Emagrecimento",
    description: "Sessões dinâmicas, pausas menores e cardio complementar.",
  },
  {
    value: "condicionamento",
    label: "Condicionamento",
    description: "Resistência, movimentos globais e recuperação curta.",
  },
  {
    value: "forca",
    label: "Força",
    description: "Menos repetições, mais descanso e foco nos exercícios básicos.",
  },
  {
    value: "saude",
    label: "Saúde e adaptação",
    description: "Estrutura simples, execução segura e evolução gradual.",
  },
];

const GUIDE_LEVELS: Array<{
  value: GuideLevel;
  label: string;
  description: string;
}> = [
  {
    value: "iniciante",
    label: "Iniciante",
    description: "Menos exercícios e maior atenção à técnica.",
  },
  {
    value: "intermediario",
    label: "Intermediário",
    description: "Volume equilibrado e mais variações.",
  },
  {
    value: "avancado",
    label: "Avançado",
    description: "Mais volume e divisão muscular específica.",
  },
];

const GUIDE_GROUPS: Record<string, string[][]> = {
  FULL: [
    [
      "Peitoral",
      "Costas",
      "Quadríceps",
      "Posterior de coxa",
      "Ombros",
      "Abdômen",
    ],
  ],
  AB: [
    ["Peitoral", "Costas", "Ombros", "Bíceps", "Tríceps"],
    [
      "Quadríceps",
      "Posterior de coxa",
      "Glúteos",
      "Panturrilhas",
      "Abdômen",
    ],
  ],
  ABC: [
    ["Peitoral", "Ombros", "Tríceps"],
    ["Costas", "Bíceps", "Abdômen"],
    [
      "Quadríceps",
      "Posterior de coxa",
      "Glúteos",
      "Panturrilhas",
    ],
  ],
  ABCD: [
    ["Peitoral", "Tríceps"],
    ["Costas", "Bíceps"],
    [
      "Quadríceps",
      "Posterior de coxa",
      "Glúteos",
      "Panturrilhas",
    ],
    ["Ombros", "Abdômen"],
  ],
  ABCDE: [
    ["Peitoral"],
    ["Costas"],
    ["Quadríceps", "Posterior de coxa", "Glúteos"],
    ["Ombros", "Abdômen"],
    ["Bíceps", "Tríceps", "Panturrilhas"],
  ],
  ABCDEF: [
    ["Peitoral", "Tríceps"],
    ["Costas", "Bíceps"],
    ["Quadríceps"],
    ["Ombros", "Abdômen"],
    ["Posterior de coxa", "Glúteos"],
    ["Bíceps", "Tríceps", "Panturrilhas"],
  ],
};

function createRoutines(code: SplitCode, count?: number): AdminRoutine[] {
  const selected =
    SPLIT_OPTIONS.find((option) => option.code === code) ??
    SPLIT_OPTIONS[0];
  const total = Math.max(1, Math.min(6, count ?? selected.count));
  const schedule = DEFAULT_SCHEDULES[code] ?? DEFAULT_SCHEDULES.PERSONALIZADO;

  return Array.from({ length: total }, (_, index) => {
    const routineCode =
      code === "ABCDF"
        ? ["A", "B", "C", "D", "F"][index]
        : String.fromCharCode(65 + index);
    return {
      code: routineCode,
      name:
        code === "FULL" && index === 0
          ? "Treino Full Body"
          : `Treino ${routineCode}`,
      focus: "",
      weekDays: schedule[index] ?? [],
      exercises: [],
    };
  });
}


function splitForDays(days: number): SplitCode {
  if (days <= 1) return "FULL";
  if (days === 2) return "AB";
  if (days === 3) return "ABC";
  if (days === 4) return "ABCD";
  if (days === 5) return "ABCDE";
  return "ABCDEF";
}

function guideParameters(goal: GuideGoal, level: GuideLevel) {
  const base = {
    sets: level === "avancado" ? 4 : 3,
    repsMin: 8,
    repsMax: 12,
    restSeconds: 75,
  };

  if (goal === "emagrecimento") {
    return {
      ...base,
      sets: 3,
      repsMin: 12,
      repsMax: 15,
      restSeconds: 45,
    };
  }

  if (goal === "condicionamento") {
    return {
      ...base,
      sets: 3,
      repsMin: 12,
      repsMax: 20,
      restSeconds: 40,
    };
  }

  if (goal === "forca") {
    return {
      ...base,
      sets: level === "iniciante" ? 3 : 4,
      repsMin: 4,
      repsMax: 8,
      restSeconds: 120,
    };
  }

  if (goal === "saude") {
    return {
      ...base,
      sets: 3,
      repsMin: 10,
      repsMax: 15,
      restSeconds: 60,
    };
  }

  return base;
}

function createGuidedRoutines(
  code: SplitCode,
  library: ExerciseLibraryItem[],
  goal: GuideGoal,
  level: GuideLevel,
): AdminRoutine[] {
  const routines = createRoutines(code);
  const groups =
    GUIDE_GROUPS[code] ??
    GUIDE_GROUPS.FULL;
  const targetExercises =
    level === "iniciante" ? 5 : level === "intermediario" ? 6 : 7;
  const parameters = guideParameters(goal, level);
  const used = new Set<string>();

  return routines.map((routine, routineIndex) => {
    const routineGroups = groups[routineIndex] ?? groups[0] ?? [];
    const selected: ExerciseLibraryItem[] = [];

    routineGroups.forEach((group) => {
      const candidates = library.filter(
        (item) =>
          item.muscleGroup === group &&
          !used.has(item.slug),
      );
      const quantity =
        routineGroups.length <= 2
          ? 3
          : routineGroups.length <= 3
            ? 2
            : 1;

      candidates.slice(0, quantity).forEach((item) => {
        used.add(item.slug);
        selected.push(item);
      });
    });

    library
      .filter((item) => !used.has(item.slug))
      .slice(0, Math.max(0, targetExercises - selected.length))
      .forEach((item) => {
        used.add(item.slug);
        selected.push(item);
      });

    return {
      ...routine,
      focus: routineGroups.join(", "),
      exercises: selected
        .slice(0, targetExercises)
        .map((item, index) => ({
          ...createBuilderExercise(item, index + 1),
          sets: parameters.sets,
          repsMin: parameters.repsMin,
          repsMax: parameters.repsMax,
          restSeconds: parameters.restSeconds,
        })),
    };
  });
}

function goalFromObjective(objective: string): GuideGoal {
  const value = normalize(objective);

  if (value.includes("emagrec")) return "emagrecimento";
  if (value.includes("condicion")) return "condicionamento";
  if (value.includes("forca")) return "forca";
  if (
    value.includes("saude") ||
    value.includes("qualidade") ||
    value.includes("adapt")
  ) {
    return "saude";
  }

  return "hipertrofia";
}

function reorder(exercises: BuilderExercise[]) {
  return exercises.map((exercise, index) => ({
    ...exercise,
    position: index + 1,
  }));
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

type ExerciseGifProps = {
  slug: string;
  name: string;
  mediaUrl: string;
  className?: string;
};

function ExerciseGif({
  slug,
  name,
  mediaUrl,
  className = "",
}: ExerciseGifProps) {
  const defaultSource = `/gifs/${slug}.gif`;
  const [source, setSource] = useState(mediaUrl || defaultSource);

  useEffect(() => {
    setSource(mediaUrl || defaultSource);
  }, [defaultSource, mediaUrl]);

  return (
    <img
      className={className}
      src={source}
      alt={`Demonstração de ${name}`}
      loading="lazy"
      draggable={false}
      onError={() => {
        if (source !== defaultSource) {
          setSource(defaultSource);
          return;
        }
        setSource("/gifs/exercise-placeholder.gif");
      }}
    />
  );
}

export default function AdminWorkoutBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get("student") ?? "";
  const returnStudentId =
    searchParams.get("returnStudent") ?? studentId;
  const { user, profile, loading, landingPath } = useAuth();

  const [student, setStudent] = useState<WorkoutStudent | null>(null);
  const [studentLoading, setStudentLoading] = useState(true);
  const [library, setLibrary] = useState<ExerciseLibraryItem[]>(
    FALLBACK_EXERCISE_LIBRARY,
  );
  const [templates, setTemplates] = useState<AdminProgramTemplate[]>([]);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideGoal, setGuideGoal] =
    useState<GuideGoal>("hipertrofia");
  const [guideLevel, setGuideLevel] =
    useState<GuideLevel>("iniciante");
  const [guideDays, setGuideDays] = useState(3);

  const [programName, setProgramName] = useState("Treino personalizado");
  const [splitCode, setSplitCode] = useState<SplitCode>("ABC");
  const [programNotes, setProgramNotes] = useState("");
  const [reviewAt, setReviewAt] = useState("");
  const [routines, setRoutines] = useState<AdminRoutine[]>(
    createRoutines("ABC"),
  );
  const [activeRoutineIndex, setActiveRoutineIndex] = useState(0);
  const [activeGroup, setActiveGroup] = useState("Todos");
  const [libraryQuery, setLibraryQuery] = useState("");
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [cardio, setCardio] = useState(DEFAULT_CARDIO);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [mobileStep, setMobileStep] = useState<BuilderStep>(
    "rotina",
  );
  const [checklistOpen, setChecklistOpen] = useState(true);

  const programSectionRef = useRef<HTMLElement>(null);
  const routineSectionRef = useRef<HTMLElement>(null);
  const librarySectionRef = useRef<HTMLElement>(null);
  const cardioSectionRef = useRef<HTMLElement>(null);

  const canManageStudents =
    profile?.role === "professor" || profile?.role === "reception";

  useEffect(() => {
    if (!user || !canManageStudents) return;

    void Promise.all([
      getWorkoutStudentById(studentId),
      loadExerciseLibrary(),
      loadAdminProgramTemplates(user.id),
    ]).then(([studentResult, libraryResult, templateResult]) => {
      setStudent(studentResult);
      setLibrary(libraryResult);
      setTemplates(templateResult);

      if (studentResult) {
        setGuideGoal(goalFromObjective(studentResult.objective));
      }

      setStudentLoading(false);
    });
  }, [canManageStudents, studentId, user?.id]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!user || !student) return;
    const key = `accqua-program-draft:${user.id}:${student.id}`;
    const timer = window.setTimeout(() => {
      localStorage.setItem(
        key,
        JSON.stringify({
          programName,
          splitCode,
          programNotes,
          reviewAt,
          routines,
          cardio,
          updatedAt: new Date().toISOString(),
        }),
      );
    }, 500);

    return () => window.clearTimeout(timer);
  }, [
    cardio,
    programName,
    programNotes,
    reviewAt,
    routines,
    splitCode,
    student,
    user,
  ]);

  useEffect(() => {
    if (!user || !student) return;
    const key = `accqua-program-draft:${user.id}:${student.id}`;
    const raw = localStorage.getItem(key);
    if (!raw) return;

    try {
      const saved = JSON.parse(raw) as {
        programName?: string;
        splitCode?: SplitCode;
        programNotes?: string;
        reviewAt?: string;
        routines?: AdminRoutine[];
        cardio?: AdminCardioPrescription;
      };

      if (saved.programName) setProgramName(saved.programName);
      if (saved.splitCode) setSplitCode(saved.splitCode);
      if (saved.programNotes !== undefined) {
        setProgramNotes(saved.programNotes);
      }
      if (saved.reviewAt !== undefined) setReviewAt(saved.reviewAt);
      if (Array.isArray(saved.routines) && saved.routines.length) {
        setRoutines(
          saved.routines.map((routine) => ({
            ...routine,
            exercises: reorder(routine.exercises ?? []),
          })),
        );
      }
      if (saved.cardio) setCardio(saved.cardio);
      setToast("Rascunho recuperado.");
    } catch {
      localStorage.removeItem(key);
    }
  }, [student?.id, user?.id]);

  const activeRoutine =
    routines[activeRoutineIndex] ?? routines[0] ?? createRoutines("FULL")[0];

  const groups = useMemo(() => {
    const values = Array.from(
      new Set<string>(library.map((item) => item.muscleGroup)),
    );
    return [
      "Todos",
      ...values.sort((a, b) => a.localeCompare(b, "pt-BR")),
    ];
  }, [library]);

  const filteredLibrary = useMemo(() => {
    const query = normalize(libraryQuery.trim());

    return library.filter((item) => {
      const groupMatch =
        activeGroup === "Todos" || item.muscleGroup === activeGroup;
      const searchMatch =
        !query ||
        normalize(
          `${item.name} ${item.muscleGroup} ${item.equipment}`,
        ).includes(query);
      return groupMatch && searchMatch;
    });
  }, [activeGroup, library, libraryQuery]);

  const totalExercises = useMemo(
    () =>
      routines.reduce(
        (total, routine) => total + routine.exercises.length,
        0,
      ),
    [routines],
  );

  const linkedProfessorReady = Boolean(
    student?.linkedProfessorId &&
      (profile?.role === "reception" ||
        student.linkedProfessorId === user?.id),
  );

  const routinesConfigured = routines.every(
    (routine) =>
      Boolean(routine.name.trim()) &&
      routine.weekDays.length > 0,
  );

  const everyRoutineHasContent =
    (totalExercises === 0 && cardio.enabled) ||
    routines.every((routine) => routine.exercises.length > 0);

  const hasTrainingContent =
    (totalExercises > 0 || cardio.enabled) &&
    everyRoutineHasContent;

  const exerciseParametersValid = routines.every((routine) =>
    routine.exercises.every(
      (exercise) =>
        exercise.sets > 0 &&
        exercise.repsMin > 0 &&
        exercise.repsMax >= exercise.repsMin &&
        exercise.restSeconds >= 15,
    ),
  );

  const readinessItems = useMemo(
    () => [
      {
        key: "link",
        label: "Professor responsável",
        detail: linkedProfessorReady
          ? student?.linkedProfessorName || "Vínculo confirmado"
          : "Vincule o aluno ao professor principal",
        done: linkedProfessorReady,
        required: true,
        step: "programa" as BuilderStep,
      },
      {
        key: "program",
        label: "Programa identificado",
        detail: programName.trim()
          ? programName
          : "Dê um nome ao programa",
        done: Boolean(programName.trim()),
        required: true,
        step: "programa" as BuilderStep,
      },
      {
        key: "routines",
        label: "Rotinas e dias",
        detail: routinesConfigured
          ? `${routines.length} rotina${
              routines.length === 1 ? "" : "s"
            } configurada${routines.length === 1 ? "" : "s"}`
          : "Defina nome e dias de cada rotina",
        done: routinesConfigured,
        required: true,
        step: "rotina" as BuilderStep,
      },
      {
        key: "content",
        label: "Exercícios ou cardio",
        detail: hasTrainingContent
          ? `${totalExercises} exercício${
              totalExercises === 1 ? "" : "s"
            }${cardio.enabled ? " + cardio" : ""}`
          : totalExercises > 0
            ? "Adicione exercícios em todas as rotinas"
            : "Adicione exercícios ou uma prescrição de cardio",
        done: hasTrainingContent,
        required: true,
        step: totalExercises
          ? ("cardio" as BuilderStep)
          : ("exercicios" as BuilderStep),
      },
      {
        key: "parameters",
        label: "Parâmetros revisados",
        detail: exerciseParametersValid
          ? "Séries, repetições e descanso válidos"
          : "Revise séries, repetições e descanso",
        done: exerciseParametersValid,
        required: true,
        step: "exercicios" as BuilderStep,
      },
      {
        key: "review",
        label: "Data de revisão",
        detail: reviewAt
          ? new Date(`${reviewAt}T12:00:00`).toLocaleDateString(
              "pt-BR",
            )
          : "Recomendado, mas opcional",
        done: Boolean(reviewAt),
        required: false,
        step: "programa" as BuilderStep,
      },
    ],
    [
      cardio.enabled,
      everyRoutineHasContent,
      exerciseParametersValid,
      hasTrainingContent,
      linkedProfessorReady,
      programName,
      reviewAt,
      routines.length,
      routinesConfigured,
      student?.linkedProfessorName,
      totalExercises,
    ],
  );

  const requiredReadiness = readinessItems.filter(
    (item) => item.required,
  );
  const completedRequired = requiredReadiness.filter(
    (item) => item.done,
  ).length;
  const completionPercent = Math.round(
    (completedRequired / Math.max(requiredReadiness.length, 1)) * 100,
  );
  const nextReadinessIssue = requiredReadiness.find(
    (item) => !item.done,
  );

  if (loading || studentLoading) return <LoadingSplash />;
  if (!user) return <Navigate to="/login" replace />;
  if (landingPath !== "/menu-teste") {
    return <Navigate to={landingPath} replace />;
  }
  if (!canManageStudents) return <Navigate to="/menu-teste" replace />;
  if (!student) return <Navigate to="/area-accqua" replace />;
  if (
    !["active", "ativo"].includes(student.status.trim().toLowerCase())
  ) {
    return <Navigate to="/area-accqua" replace />;
  }
  if (
    profile?.role === "professor" &&
    student.linkedProfessorId &&
    student.linkedProfessorId !== user.id
  ) {
    return (
      <Navigate
        to={`/area-accqua?student=${student.id}`}
        replace
      />
    );
  }

  const returnToStudent = () => {
    navigate(
      returnStudentId
        ? `/area-accqua?student=${returnStudentId}`
        : "/area-accqua",
    );
  };

  const showBuilderSection = (step: BuilderStep) => {
    const target = {
      programa: programSectionRef.current,
      rotina: routineSectionRef.current,
      exercicios: librarySectionRef.current,
      cardio: cardioSectionRef.current,
    }[step];

    setMobileStep(step);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const goToNextReadinessIssue = () => {
    if (!nextReadinessIssue) {
      setToast("O programa está pronto para publicar.");
      return;
    }

    setChecklistOpen(true);
    showBuilderSection(nextReadinessIssue.step);
    setToast(nextReadinessIssue.detail);
  };

  const applyGuidedPlan = () => {
    if (
      totalExercises > 0 &&
      !window.confirm(
        "O assistente substituirá as rotinas e exercícios atuais. Continuar?",
      )
    ) {
      return;
    }

    const nextSplit = splitForDays(guideDays);
    const nextRoutines = createGuidedRoutines(
      nextSplit,
      library,
      guideGoal,
      guideLevel,
    );
    const goalLabel =
      GUIDE_GOALS.find((item) => item.value === guideGoal)?.label ??
      "Treino";

    const reviewDate = new Date();
    reviewDate.setDate(
      reviewDate.getDate() +
        (guideLevel === "iniciante" ? 35 : 42),
    );

    setSplitCode(nextSplit);
    setProgramName(`${goalLabel} ${nextSplit}`);
    setRoutines(nextRoutines);
    setActiveRoutineIndex(0);
    setExpandedExercise(null);
    setReviewAt(reviewDate.toISOString().slice(0, 10));
    setProgramNotes(
      `Estrutura sugerida para ${goalLabel.toLowerCase()}, nível ${
        GUIDE_LEVELS.find((item) => item.value === guideLevel)?.label ??
        guideLevel
      }. Revise exercícios, cargas e limitações antes de publicar.`,
    );

    if (
      guideGoal === "emagrecimento" ||
      guideGoal === "condicionamento"
    ) {
      setCardio({
        ...DEFAULT_CARDIO,
        enabled: true,
        durationMinutes: guideGoal === "emagrecimento" ? 30 : 20,
      });
    }

    setGuideOpen(false);
    setMobileStep("rotina");
    window.setTimeout(
      () =>
        routineSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      80,
    );
    setToast(
      "Sugestão criada. Revise todos os itens antes de publicar.",
    );
  };

  const updateRoutine = (
    routineIndex: number,
    patch: Partial<AdminRoutine>,
  ) => {
    setRoutines((current) =>
      current.map((routine, index) =>
        index === routineIndex ? { ...routine, ...patch } : routine,
      ),
    );
  };

  const changeSplit = (nextCode: SplitCode) => {
    const existingExercises = totalExercises > 0;
    if (
      existingExercises &&
      !window.confirm(
        "Trocar a divisão recriará as rotinas e removerá os exercícios adicionados. Continuar?",
      )
    ) {
      return;
    }

    const nextRoutines = createRoutines(nextCode);
    setSplitCode(nextCode);
    setRoutines(nextRoutines);
    setActiveRoutineIndex(0);
    setExpandedExercise(null);
    setProgramName(
      nextCode === "FULL"
        ? "Treino Full Body"
        : nextCode === "PERSONALIZADO"
          ? "Treino personalizado"
          : `Treino ${nextCode}`,
    );
  };

  const addCustomRoutine = () => {
    if (routines.length >= 6) {
      setToast("O limite é de seis rotinas, de A até F.");
      return;
    }

    const code = String.fromCharCode(65 + routines.length);
    setRoutines((current) => [
      ...current,
      {
        code,
        name: `Treino ${code}`,
        focus: "",
        weekDays: [],
        exercises: [],
      },
    ]);
    setSplitCode("PERSONALIZADO");
    setActiveRoutineIndex(routines.length);
  };

  const removeRoutine = (routineIndex: number) => {
    if (routines.length <= 1) {
      setToast("O programa precisa ter pelo menos uma rotina.");
      return;
    }

    const next = routines
      .filter((_, index) => index !== routineIndex)
      .map((routine, index) => ({
        ...routine,
        code: String.fromCharCode(65 + index),
        name:
          routine.name.match(/^Treino [A-F]$/)
            ? `Treino ${String.fromCharCode(65 + index)}`
            : routine.name,
      }));

    setRoutines(next);
    setSplitCode("PERSONALIZADO");
    setActiveRoutineIndex((current) =>
      Math.max(0, Math.min(current, next.length - 1)),
    );
  };

  const addExercise = (item: ExerciseLibraryItem) => {
    const exercise = createBuilderExercise(
      item,
      activeRoutine.exercises.length + 1,
    );

    updateRoutine(activeRoutineIndex, {
      exercises: [...activeRoutine.exercises, exercise],
    });
    setExpandedExercise(exercise.draftId);
    setToast(`${item.name} adicionado ao treino ${activeRoutine.code}.`);
  };

  const updateExercise = (
    draftId: string,
    patch: Partial<BuilderExercise>,
  ) => {
    updateRoutine(activeRoutineIndex, {
      exercises: activeRoutine.exercises.map((exercise) =>
        exercise.draftId === draftId
          ? { ...exercise, ...patch }
          : exercise,
      ),
    });
  };

  const removeExercise = (draftId: string) => {
    updateRoutine(activeRoutineIndex, {
      exercises: reorder(
        activeRoutine.exercises.filter(
          (exercise) => exercise.draftId !== draftId,
        ),
      ),
    });
    setExpandedExercise(null);
  };

  const moveExercise = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= activeRoutine.exercises.length) return;

    const next = [...activeRoutine.exercises];
    [next[index], next[target]] = [next[target], next[index]];

    updateRoutine(activeRoutineIndex, {
      exercises: reorder(next),
    });
  };

  const toggleWeekDay = (day: number) => {
    const exists = activeRoutine.weekDays.includes(day);
    updateRoutine(activeRoutineIndex, {
      weekDays: exists
        ? activeRoutine.weekDays.filter((value) => value !== day)
        : [...activeRoutine.weekDays, day].sort((a, b) => a - b),
    });
  };

  const publish = async () => {
    if (saving) return;

    if (nextReadinessIssue) {
      showBuilderSection(nextReadinessIssue.step);
      setChecklistOpen(true);
      setToast(nextReadinessIssue.detail);
      return;
    }

    const validRoutines = routines.filter(
      (routine) => routine.exercises.length > 0,
    );

    setSaving(true);

    try {
      await publishAdminProgram({
        studentId: student.id,
        staffId: user.id,
        programName,
        splitCode,
        notes: programNotes,
        reviewAt,
        routines: validRoutines,
        cardio: cardio.enabled ? cardio : null,
      });

      localStorage.removeItem(
        `accqua-program-draft:${user.id}:${student.id}`,
      );
      setToast("Treino publicado para o aluno.");
      window.setTimeout(returnToStudent, 900);
    } catch (error) {
      setToast(
        error instanceof Error
          ? error.message
          : "Não foi possível publicar o treino.",
      );
    } finally {
      setSaving(false);
    }
  };

  const saveTemplate = async () => {
    if (saving) return;
    setSaving(true);

    try {
      const id = await saveAdminProgramTemplate(user.id, {
        name: programName || `Modelo ${splitCode}`,
        splitCode,
        payload: {
          programName,
          notes: programNotes,
          reviewAt,
          routines,
          cardio: cardio.enabled ? cardio : null,
        },
      });

      setTemplates((current) => [
        {
          id,
          name: programName || `Modelo ${splitCode}`,
          splitCode,
          payload: {
            programName,
            notes: programNotes,
            reviewAt,
            routines,
            cardio: cardio.enabled ? cardio : null,
          },
          createdAt: new Date().toISOString(),
        },
        ...current,
      ]);
      setToast("Modelo de treino salvo.");
    } catch (error) {
      setToast(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o modelo.",
      );
    } finally {
      setSaving(false);
    }
  };

  const applyTemplate = (template: AdminProgramTemplate) => {
    setProgramName(template.payload.programName);
    setSplitCode(
      (template.splitCode as SplitCode) || "PERSONALIZADO",
    );
    setProgramNotes(template.payload.notes);
    setReviewAt(template.payload.reviewAt);
    setRoutines(
      template.payload.routines.map((routine) => ({
        ...routine,
        exercises: reorder(
          routine.exercises.map((exercise) => ({
            ...exercise,
            draftId: `${exercise.slug}-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 8)}`,
          })),
        ),
      })),
    );
    setCardio(template.payload.cardio ?? DEFAULT_CARDIO);
    setActiveRoutineIndex(0);
    setTemplatesOpen(false);
    setToast("Modelo aplicado.");
  };

  return (
    <div className="admin-builder-screen">
      <div className="admin-builder-background" aria-hidden="true" />

      <main className="admin-builder-shell">
        <header className="admin-builder-header">
          <button
            type="button"
            onClick={returnToStudent}
            aria-label="Voltar"
          >
            <AdminBackIcon />
          </button>

          <div className="admin-builder-brand">
            <AccquaLogo compact />
            <div>
              <small>MONTADOR COMPLETO</small>
              <strong>{student.fullName}</strong>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setTemplatesOpen(true)}
            aria-label="Modelos salvos"
          >
            <AdminLayersIcon />
          </button>
        </header>

        <nav
          className="admin-builder-step-nav"
          aria-label="Etapas do montador"
        >
          {[
            ["programa", "1", "Programa"],
            ["rotina", "2", "Rotinas"],
            ["exercicios", "3", "Exercícios"],
            ["cardio", "4", "Cardio"],
          ].map(([value, number, label]) => (
            <button
              type="button"
              key={value}
              className={mobileStep === value ? "is-active" : ""}
              onClick={() =>
                showBuilderSection(value as BuilderStep)
              }
            >
              <span>{number}</span>
              <strong>{label}</strong>
            </button>
          ))}
        </nav>

        <section className="admin-builder-readiness">
          <button
            type="button"
            className="admin-builder-readiness-summary"
            onClick={() => setChecklistOpen((current) => !current)}
            aria-expanded={checklistOpen}
          >
            <span className="admin-builder-readiness-score">
              <b>{completionPercent}%</b>
              <i>
                <em style={{ width: `${completionPercent}%` }} />
              </i>
            </span>

            <span className="admin-builder-readiness-copy">
              <small>PREPARAÇÃO DO PROGRAMA</small>
              <strong>
                {nextReadinessIssue
                  ? "Ainda existem itens para revisar"
                  : "Pronto para publicar"}
              </strong>
              <p>
                {nextReadinessIssue?.detail ||
                  "Todos os itens obrigatórios foram concluídos."}
              </p>
            </span>

            <AdminChevronIcon
              className={checklistOpen ? "is-open" : ""}
            />
          </button>

          {checklistOpen ? (
            <div className="admin-builder-readiness-list">
              {readinessItems.map((item) => (
                <button
                  type="button"
                  key={item.key}
                  className={item.done ? "is-done" : "is-pending"}
                  onClick={() => showBuilderSection(item.step)}
                >
                  <span>
                    {item.done ? (
                      <AdminCheckIcon size={16} />
                    ) : item.required ? (
                      <AdminWarningIcon size={16} />
                    ) : (
                      <AdminInfoIcon size={16} />
                    )}
                  </span>
                  <div>
                    <strong>{item.label}</strong>
                    <small>{item.detail}</small>
                  </div>
                  {!item.required ? <em>Opcional</em> : null}
                </button>
              ))}

              <button
                type="button"
                className="admin-builder-next-issue"
                onClick={goToNextReadinessIssue}
              >
                <AdminTargetIcon size={18} />
                {nextReadinessIssue
                  ? "Ir para a próxima pendência"
                  : "Programa pronto"}
              </button>
            </div>
          ) : null}
        </section>

        <section
          ref={programSectionRef}
          className="admin-builder-program-card admin-builder-anchor"
        >
          <div className="admin-builder-program-heading">
            <span>
              <AdminDumbbellIcon size={25} />
            </span>
            <div>
              <small>PROGRAMA DO ALUNO</small>
              <h1>{programName}</h1>
              <p>
                {routines.length} rotina{routines.length === 1 ? "" : "s"} ·{" "}
                {totalExercises} exercício
                {totalExercises === 1 ? "" : "s"}
              </p>
            </div>
            <button
              type="button"
              className="admin-builder-guide-button"
              onClick={() => setGuideOpen(true)}
            >
              <AdminSparkIcon size={18} />
              <span>Montagem guiada</span>
            </button>
          </div>

          <div
            className={`admin-builder-link-status ${
              linkedProfessorReady ? "is-ready" : "is-warning"
            }`}
          >
            <AdminLinkIcon size={18} />
            <div>
              <strong>
                {student.linkedProfessorName ||
                  "Professor principal não definido"}
              </strong>
              <small>
                {linkedProfessorReady
                  ? "Vínculo confirmado para esta montagem."
                  : "Volte ao perfil e defina o responsável antes de publicar."}
              </small>
            </div>
          </div>

          <div className="admin-builder-program-fields">
            <label className="is-wide">
              <span>Nome do programa</span>
              <input
                value={programName}
                onChange={(event) => setProgramName(event.target.value)}
                placeholder="Ex.: Hipertrofia ABC"
              />
            </label>

            <label>
              <span>Revisão</span>
              <input
                type="date"
                value={reviewAt}
                onChange={(event) => setReviewAt(event.target.value)}
              />
            </label>

            <label>
              <span>Divisão</span>
              <select
                value={splitCode}
                onChange={(event) =>
                  changeSplit(event.target.value as SplitCode)
                }
              >
                {SPLIT_OPTIONS.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="is-wide">
              <span>Orientação geral ao aluno</span>
              <textarea
                value={programNotes}
                onChange={(event) =>
                  setProgramNotes(event.target.value)
                }
                placeholder="Observações, limitações, progressão, recomendações..."
              />
            </label>
          </div>
        </section>

        <section
          ref={routineSectionRef}
          className="admin-builder-routines admin-builder-anchor"
        >
          <div className="admin-builder-routine-tabs">
            {routines.map((routine, index) => (
              <button
                type="button"
                key={`${routine.code}-${index}`}
                className={[
                  activeRoutineIndex === index ? "is-active" : "",
                  !routine.weekDays.length ||
                  !routine.exercises.length
                    ? "is-incomplete"
                    : "is-ready",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => {
                  setActiveRoutineIndex(index);
                  setExpandedExercise(null);
                }}
              >
                <span>{routine.code}</span>
                <small>{routine.exercises.length}</small>
              </button>
            ))}

            {routines.length < 6 ? (
              <button
                type="button"
                className="is-add"
                onClick={addCustomRoutine}
              >
                <AdminPlusIcon />
              </button>
            ) : null}
          </div>

          <article className="admin-builder-routine-card">
            <header>
              <div>
                <small>ROTINA {activeRoutine.code}</small>
                <h2>{activeRoutine.name}</h2>
              </div>

              {routines.length > 1 ? (
                <button
                  type="button"
                  className="admin-builder-remove-routine"
                  onClick={() => removeRoutine(activeRoutineIndex)}
                  aria-label="Remover rotina"
                >
                  <AdminTrashIcon />
                </button>
              ) : null}
            </header>

            <div className="admin-builder-routine-fields">
              <label>
                <span>Nome</span>
                <input
                  value={activeRoutine.name}
                  onChange={(event) =>
                    updateRoutine(activeRoutineIndex, {
                      name: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                <span>Foco muscular</span>
                <input
                  value={activeRoutine.focus}
                  onChange={(event) =>
                    updateRoutine(activeRoutineIndex, {
                      focus: event.target.value,
                    })
                  }
                  placeholder="Ex.: Peitoral e tríceps"
                />
              </label>
            </div>

            <div className="admin-builder-week-days">
              <span>
                <AdminCalendarIcon size={18} />
                Dias da semana
              </span>

              <div>
                {DAY_LABELS.map((day) => (
                  <button
                    type="button"
                    key={day.value}
                    className={
                      activeRoutine.weekDays.includes(day.value)
                        ? "is-active"
                        : ""
                    }
                    onClick={() => toggleWeekDay(day.value)}
                    title={day.name}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          </article>
        </section>

        <section className="admin-builder-selected">
          <header>
            <div>
              <small>EXERCÍCIOS DA ROTINA {activeRoutine.code}</small>
              <h2>
                {activeRoutine.exercises.length
                  ? `${activeRoutine.exercises.length} adicionados`
                  : "Nenhum exercício"}
              </h2>
            </div>
            <span>{activeRoutine.focus || "Foco não informado"}</span>
          </header>

          {!activeRoutine.exercises.length ? (
            <div className="admin-builder-empty">
              <AdminDumbbellIcon size={29} />
              <strong>Adicione exercícios abaixo</strong>
              <p>
                Use os filtros musculares ou pesquise pelo nome/aparelho.
              </p>
            </div>
          ) : (
            <div className="admin-builder-exercise-list">
              {activeRoutine.exercises.map((exercise, index) => {
                const expanded =
                  expandedExercise === exercise.draftId;

                return (
                  <article
                    className={`admin-builder-exercise ${
                      expanded ? "is-expanded" : ""
                    }`}
                    key={exercise.draftId}
                  >
                    <div
                      className="admin-builder-exercise-summary"
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        setExpandedExercise(
                          expanded ? null : exercise.draftId,
                        )
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setExpandedExercise(
                            expanded ? null : exercise.draftId,
                          );
                        }
                      }}
                    >
                      <span className="admin-builder-selected-gif">
                        <ExerciseGif
                          slug={exercise.slug}
                          name={exercise.name}
                          mediaUrl={exercise.mediaUrl}
                        />
                        <b>{index + 1}</b>
                      </span>

                      <span className="admin-builder-exercise-copy">
                        <strong>{exercise.name}</strong>
                        <small>
                          {exercise.muscleGroup} · {exercise.equipment}
                        </small>
                        <b>
                          {exercise.sets} séries · {exercise.repsMin}
                          {exercise.repsMax !== exercise.repsMin
                            ? `–${exercise.repsMax}`
                            : ""}{" "}
                          rep · {exercise.restSeconds}s
                        </b>
                      </span>

                      <span className="admin-builder-exercise-controls">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            moveExercise(index, -1);
                          }}
                          disabled={index === 0}
                          aria-label="Subir exercício"
                        >
                          <AdminUpIcon />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            moveExercise(index, 1);
                          }}
                          disabled={
                            index === activeRoutine.exercises.length - 1
                          }
                          aria-label="Descer exercício"
                        >
                          <AdminDownIcon />
                        </button>
                      </span>

                      <AdminChevronIcon />
                    </div>

                    {expanded ? (
                      <div className="admin-builder-exercise-editor">
                        <div className="admin-builder-exercise-gif-editor">
                          <ExerciseGif
                            slug={exercise.slug}
                            name={exercise.name}
                            mediaUrl={exercise.mediaUrl}
                          />
                          <label>
                            <span>GIF ou vídeo demonstrativo</span>
                            <input
                              value={exercise.mediaUrl}
                              onChange={(event) =>
                                updateExercise(exercise.draftId, {
                                  mediaUrl: event.target.value,
                                })
                              }
                              placeholder={`/gifs/${exercise.slug}.gif`}
                            />
                            <small>
                              O aluno verá essa demonstração no treino.
                            </small>
                          </label>
                        </div>

                        <div className="admin-builder-number-fields">
                          <label>
                            <span>Séries</span>
                            <input
                              type="number"
                              min="1"
                              max="12"
                              value={exercise.sets}
                              onChange={(event) =>
                                updateExercise(exercise.draftId, {
                                  sets: Math.max(
                                    1,
                                    Number(event.target.value) || 1,
                                  ),
                                })
                              }
                            />
                          </label>

                          <label>
                            <span>Reps mín.</span>
                            <input
                              type="number"
                              min="1"
                              value={exercise.repsMin}
                              onChange={(event) =>
                                updateExercise(exercise.draftId, {
                                  repsMin: Math.max(
                                    1,
                                    Number(event.target.value) || 1,
                                  ),
                                })
                              }
                            />
                          </label>

                          <label>
                            <span>Reps máx.</span>
                            <input
                              type="number"
                              min="1"
                              value={exercise.repsMax}
                              onChange={(event) =>
                                updateExercise(exercise.draftId, {
                                  repsMax: Math.max(
                                    1,
                                    Number(event.target.value) || 1,
                                  ),
                                })
                              }
                            />
                          </label>

                          <label>
                            <span>Descanso</span>
                            <div>
                              <input
                                type="number"
                                min="15"
                                value={exercise.restSeconds}
                                onChange={(event) =>
                                  updateExercise(exercise.draftId, {
                                    restSeconds: Math.max(
                                      15,
                                      Number(event.target.value) || 15,
                                    ),
                                  })
                                }
                              />
                              <small>s</small>
                            </div>
                          </label>

                          <label>
                            <span>Carga inicial</span>
                            <div>
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={exercise.initialLoadKg}
                                onChange={(event) =>
                                  updateExercise(exercise.draftId, {
                                    initialLoadKg: Math.max(
                                      0,
                                      Number(event.target.value) || 0,
                                    ),
                                  })
                                }
                              />
                              <small>kg</small>
                            </div>
                          </label>
                        </div>

                        <label className="admin-builder-exercise-note">
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

                        <div className="admin-builder-tip">
                          <AdminInfoIcon />
                          <span>{exercise.beginnerTip}</span>
                        </div>

                        <button
                          type="button"
                          className="admin-builder-delete-exercise"
                          onClick={() =>
                            removeExercise(exercise.draftId)
                          }
                        >
                          <AdminTrashIcon />
                          Remover exercício
                        </button>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section
          ref={librarySectionRef}
          className="admin-builder-library admin-builder-anchor"
        >
          <header>
            <div>
              <small>BIBLIOTECA COMPLETA</small>
              <h2>Todos os grupos musculares</h2>
            </div>
            <span>{filteredLibrary.length} exercícios</span>
          </header>

          <label className="admin-builder-search">
            <AdminSearchIcon />
            <input
              value={libraryQuery}
              onChange={(event) =>
                setLibraryQuery(event.target.value)
              }
              placeholder="Buscar exercício ou aparelho"
            />
            {libraryQuery ? (
              <button
                type="button"
                onClick={() => setLibraryQuery("")}
              >
                <AdminCloseIcon size={17} />
              </button>
            ) : (
              <span />
            )}
          </label>

          <div className="admin-builder-groups">
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

          <div className="admin-builder-library-list">
            {filteredLibrary.map((item) => (
              <article key={item.slug}>
                <span className="admin-builder-library-gif">
                  <ExerciseGif
                    slug={item.slug}
                    name={item.name}
                    mediaUrl={item.mediaUrl}
                  />
                  <i>GIF</i>
                </span>
                <div>
                  <strong>{item.name}</strong>
                  <small>
                    {item.muscleGroup} · {item.equipment}
                  </small>
                </div>
                <button type="button" onClick={() => addExercise(item)}>
                  <AdminPlusIcon size={18} />
                  Adicionar
                </button>
              </article>
            ))}
          </div>
        </section>

        <section
          ref={cardioSectionRef}
          className="admin-builder-cardio admin-builder-anchor"
        >
          <button
            type="button"
            className="admin-builder-cardio-toggle"
            onClick={() =>
              setCardio((current) => ({
                ...current,
                enabled: !current.enabled,
              }))
            }
          >
            <span>
              <AdminCardioIcon size={24} />
            </span>
            <div>
              <small>CARDIO OPCIONAL</small>
              <strong>Adicionar cardio ao programa</strong>
              <p>
                A prescrição aparecerá dentro da aba Cardio do aluno.
              </p>
            </div>
            <i className={cardio.enabled ? "is-active" : ""}>
              <b />
            </i>
          </button>

          {cardio.enabled ? (
            <div className="admin-builder-cardio-fields">
              <label>
                <span>Modalidade</span>
                <select
                  value={cardio.activityType}
                  onChange={(event) =>
                    setCardio({
                      ...cardio,
                      activityType: event.target
                        .value as AdminCardioPrescription["activityType"],
                    })
                  }
                >
                  <option value="treadmill">Esteira</option>
                  <option value="spinning">Spinning</option>
                  <option value="elliptical">Elíptico</option>
                  <option value="stairs">Escada</option>
                  <option value="rowing">Remo</option>
                  <option value="walk">Caminhada</option>
                  <option value="swim">Natação</option>
                </select>
              </label>

              <label>
                <span>Quando fazer</span>
                <select
                  value={cardio.timing}
                  onChange={(event) =>
                    setCardio({
                      ...cardio,
                      timing: event.target
                        .value as AdminCardioPrescription["timing"],
                    })
                  }
                >
                  <option value="before">Antes do treino</option>
                  <option value="after">Depois do treino</option>
                  <option value="anytime">Quando quiser</option>
                </select>
              </label>

              <label>
                <span>Duração</span>
                <div>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={cardio.durationMinutes}
                    onChange={(event) =>
                      setCardio({
                        ...cardio,
                        durationMinutes: Math.max(
                          5,
                          Number(event.target.value) || 5,
                        ),
                      })
                    }
                  />
                  <small>min</small>
                </div>
              </label>

              <label>
                <span>Velocidade</span>
                <div>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={cardio.speedKmh}
                    onChange={(event) =>
                      setCardio({
                        ...cardio,
                        speedKmh: Math.max(
                          0,
                          Number(event.target.value) || 0,
                        ),
                      })
                    }
                  />
                  <small>km/h</small>
                </div>
              </label>

              <label>
                <span>Meta calorias</span>
                <div>
                  <input
                    type="number"
                    min="0"
                    value={cardio.calories}
                    onChange={(event) =>
                      setCardio({
                        ...cardio,
                        calories: Math.max(
                          0,
                          Number(event.target.value) || 0,
                        ),
                      })
                    }
                  />
                  <small>kcal</small>
                </div>
              </label>

              <label className="is-wide">
                <span>Orientação do cardio</span>
                <textarea
                  value={cardio.notes}
                  onChange={(event) =>
                    setCardio({
                      ...cardio,
                      notes: event.target.value,
                    })
                  }
                />
              </label>
            </div>
          ) : null}
        </section>

        <footer className="admin-builder-footer">
          <div className="admin-builder-footer-summary">
            <span>
              <strong>{completionPercent}%</strong>
              <small>
                {nextReadinessIssue
                  ? `${requiredReadiness.length - completedRequired} pendência${
                      requiredReadiness.length - completedRequired === 1
                        ? ""
                        : "s"
                    }`
                  : "Pronto"}
              </small>
            </span>
            <i>
              {routines.length} rotina{routines.length === 1 ? "" : "s"} ·{" "}
              {totalExercises} exercício
              {totalExercises === 1 ? "" : "s"}
            </i>
          </div>

          <div className="admin-builder-footer-actions">
            <button
              type="button"
              className="is-template"
              onClick={() => void saveTemplate()}
              disabled={saving}
            >
              <AdminSaveIcon />
              <span>Salvar modelo</span>
            </button>

            <button
              type="button"
              className="is-publish"
              onClick={() => void publish()}
              disabled={saving}
            >
              <AdminCheckIcon />
              <span>
                {saving ? "Publicando..." : "Publicar para o aluno"}
              </span>
            </button>
          </div>
        </footer>
      </main>

      {guideOpen ? (
        <div
          className="admin-builder-drawer-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setGuideOpen(false);
            }
          }}
        >
          <aside className="admin-builder-guide-sheet">
            <span className="admin-builder-drawer-handle" />

            <header>
              <div>
                <small>ASSISTENTE DE MONTAGEM</small>
                <h2>Crie uma base para revisar</h2>
                <p>
                  O assistente prepara divisão, dias e exercícios.
                  A decisão final continua sendo do professor.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGuideOpen(false)}
              >
                <AdminCloseIcon />
              </button>
            </header>

            <section>
              <span className="admin-builder-guide-number">1</span>
              <div>
                <strong>Objetivo principal</strong>
                <small>
                  Objetivo cadastrado: {student.objective || "não informado"}
                </small>
              </div>
            </section>

            <div className="admin-builder-guide-options">
              {GUIDE_GOALS.map((goal) => (
                <button
                  type="button"
                  key={goal.value}
                  className={
                    guideGoal === goal.value ? "is-active" : ""
                  }
                  onClick={() => setGuideGoal(goal.value)}
                >
                  <AdminTargetIcon size={20} />
                  <div>
                    <strong>{goal.label}</strong>
                    <small>{goal.description}</small>
                  </div>
                  {guideGoal === goal.value ? (
                    <AdminCheckIcon size={17} />
                  ) : null}
                </button>
              ))}
            </div>

            <section>
              <span className="admin-builder-guide-number">2</span>
              <div>
                <strong>Nível atual</strong>
                <small>
                  Ajusta volume inicial; o professor deve revisar.
                </small>
              </div>
            </section>

            <div className="admin-builder-level-options">
              {GUIDE_LEVELS.map((level) => (
                <button
                  type="button"
                  key={level.value}
                  className={
                    guideLevel === level.value ? "is-active" : ""
                  }
                  onClick={() => setGuideLevel(level.value)}
                >
                  <strong>{level.label}</strong>
                  <small>{level.description}</small>
                </button>
              ))}
            </div>

            <section>
              <span className="admin-builder-guide-number">3</span>
              <div>
                <strong>Dias disponíveis</strong>
                <small>
                  A divisão será sugerida conforme a frequência.
                </small>
              </div>
            </section>

            <div className="admin-builder-days-options">
              {[1, 2, 3, 4, 5, 6].map((day) => (
                <button
                  type="button"
                  key={day}
                  className={guideDays === day ? "is-active" : ""}
                  onClick={() => setGuideDays(day)}
                >
                  <strong>{day}</strong>
                  <small>dia{day === 1 ? "" : "s"}</small>
                </button>
              ))}
            </div>

            <div className="admin-builder-guide-preview">
              <AdminSparkIcon size={23} />
              <div>
                <small>SUGESTÃO</small>
                <strong>
                  {splitForDays(guideDays)} ·{" "}
                  {GUIDE_GOALS.find(
                    (item) => item.value === guideGoal,
                  )?.label}
                </strong>
                <p>
                  Exercícios com GIF, parâmetros iniciais e data de
                  revisão serão preenchidos para conferência.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="admin-builder-apply-guide"
              onClick={applyGuidedPlan}
            >
              <AdminSparkIcon />
              Gerar estrutura para revisar
            </button>
          </aside>
        </div>
      ) : null}

      {templatesOpen ? (
        <div
          className="admin-builder-drawer-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setTemplatesOpen(false);
            }
          }}
        >
          <aside className="admin-builder-drawer">
            <span className="admin-builder-drawer-handle" />
            <header>
              <div>
                <small>MODELOS SALVOS</small>
                <h2>Biblioteca da equipe</h2>
              </div>
              <button
                type="button"
                onClick={() => setTemplatesOpen(false)}
              >
                <AdminCloseIcon />
              </button>
            </header>

            {!templates.length ? (
              <div className="admin-builder-template-empty">
                <AdminLayersIcon size={31} />
                <strong>Nenhum modelo salvo</strong>
                <p>
                  Monte um treino e toque em “Salvar modelo”.
                </p>
              </div>
            ) : (
              <div className="admin-builder-template-list">
                {templates.map((template) => (
                  <button
                    type="button"
                    key={template.id}
                    onClick={() => applyTemplate(template)}
                  >
                    <span>
                      <AdminLayersIcon />
                    </span>
                    <div>
                      <strong>{template.name}</strong>
                      <small>
                        {template.splitCode} ·{" "}
                        {template.payload.routines.length} rotinas
                      </small>
                    </div>
                    <AdminChevronIcon />
                  </button>
                ))}
              </div>
            )}
          </aside>
        </div>
      ) : null}

      {toast ? (
        <div className="admin-builder-toast" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
