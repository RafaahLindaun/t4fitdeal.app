import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import clsx from "clsx";
import { useDrag } from "@use-gesture/react";
import { Drawer } from "vaul";
import { toast as notify } from "sonner";
import {
  Navigate,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import LoadingSplash from "../components/LoadingSplash";
import AccquaLogo from "../components/AccquaLogo";
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
  calculateStudentAge,
  createBuilderExercise,
  createExerciseLibraryItem,
  getWorkoutStudentById,
  loadAdminProgramTemplates,
  loadExerciseLibrary,
  loadStudentActivityHistory,
  loadWorkoutTemplates,
  markStudentWorkoutAlertsRead,
  publishAdminProgram,
  setStudentProfessorLink,
  saveAdminProgramTemplate,
  type AdminCardioPrescription,
  type AdminProgramTemplate,
  type AdminRoutine,
  type BuilderExercise,
  type CreateExerciseLibraryInput,
  type ExerciseLibraryItem,
  type StudentActivitySummary,
  type WorkoutStudent,
  type WorkoutTemplate,
} from "../lib/admin";
import { buildMediaCandidates } from "../lib/workout";
import {
  inferExerciseMediaKind,
  loadExerciseMediaManifest,
  matchExerciseMediaFiles,
  vimeoEmbedUrl,
  youtubeEmbedUrl,
} from "../lib/exerciseMedia";
import { loadRankingProfileSummary, type RankingProfileSummary } from "../lib/ranking";
import "./admin-workout-builder.css";
import "./admin-workout-builder-v10.css";
import "./admin-workout-builder-v11.css";

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

const BUILDER_STEPS: Array<{
  key: BuilderStep;
  number: number;
  label: string;
}> = [
  { key: "programa", number: 1, label: "Programa" },
  { key: "rotina", number: 2, label: "Dias" },
  { key: "exercicios", number: 3, label: "Exercícios" },
  { key: "cardio", number: 4, label: "Cardio" },
];

type CustomExerciseDraft = CreateExerciseLibraryInput;

type BuiltInPreset = {
  code: Exclude<SplitCode, "PERSONALIZADO">;
  title: string;
  subtitle: string;
  goal: GuideGoal;
  level: GuideLevel;
};

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

const DEFAULT_CUSTOM_EXERCISE: CustomExerciseDraft = {
  name: "",
  muscleGroup: "Outros",
  equipment: "",
  mediaUrl: "",
  beginnerTip: "Priorize a execução segura antes de aumentar a carga.",
  defaultSets: 3,
  defaultRepsMin: 10,
  defaultRepsMax: 12,
  defaultRestSeconds: 60,
};

type PrescriptionPreset = {
  key: "hipertrofia" | "forca" | "resistencia";
  label: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
};

const PRESCRIPTION_PRESETS: PrescriptionPreset[] = [
  { key: "hipertrofia", label: "Hipertrofia", sets: 4, repsMin: 8, repsMax: 12, restSeconds: 60 },
  { key: "forca", label: "Força", sets: 5, repsMin: 5, repsMax: 5, restSeconds: 120 },
  { key: "resistencia", label: "Resistência", sets: 3, repsMin: 15, repsMax: 20, restSeconds: 45 },
];

const BUILT_IN_PRESETS: BuiltInPreset[] = [
  {
    code: "FULL",
    title: "Adaptação Full Body",
    subtitle: "Treino geral para uma rotina simples e segura.",
    goal: "saude",
    level: "iniciante",
  },
  {
    code: "AB",
    title: "Adaptação AB",
    subtitle: "Superior e inferior, simples para começar.",
    goal: "saude",
    level: "iniciante",
  },
  {
    code: "ABC",
    title: "Hipertrofia ABC",
    subtitle: "Peito/tríceps, costas/bíceps e pernas.",
    goal: "hipertrofia",
    level: "intermediario",
  },
  {
    code: "ABCD",
    title: "Intermediário ABCD",
    subtitle: "Quatro rotinas com volume equilibrado.",
    goal: "hipertrofia",
    level: "intermediario",
  },
  {
    code: "ABCDE",
    title: "Avançado ABCDE",
    subtitle: "Cinco dias com foco muscular específico.",
    goal: "hipertrofia",
    level: "avancado",
  },
  {
    code: "ABCDEF",
    title: "Avançado ABCDEF",
    subtitle: "Seis rotinas para maior frequência semanal.",
    goal: "hipertrofia",
    level: "avancado",
  },
];


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
  manifestFiles?: string[];
  className?: string;
};

function ExerciseGif({
  slug,
  name,
  mediaUrl,
  manifestFiles = [],
  className = "",
}: ExerciseGifProps) {
  const candidates = useMemo(() => {
    const manifestMatches = matchExerciseMediaFiles(manifestFiles, { mediaUrl, slug, name });
    return [...new Set([
      ...manifestMatches,
      ...buildMediaCandidates(mediaUrl || `/gifs/${slug}.gif`, name || slug),
    ])];
  }, [manifestFiles, mediaUrl, name, slug]);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSourceIndex(0);
    setFailed(false);
  }, [candidates.join("|")]);

  const source = candidates[sourceIndex] ?? "";
  const kind = inferExerciseMediaKind(source);
  const tryNext = () => {
    const next = sourceIndex + 1;
    if (next < candidates.length) {
      setSourceIndex(next);
      return;
    }
    setFailed(true);
  };

  if (failed || !source) {
    return (
      <span
        className={`${className} admin-builder-gif-name-fallback`}
        role="img"
        aria-label={`Mídia indisponível para ${name}`}
      >
        <small>EXERCÍCIO</small>
        <strong>{name}</strong>
      </span>
    );
  }

  if (kind === "video") {
    return (
      <video
        className={className}
        src={source}
        muted
        autoPlay
        loop
        playsInline
        preload="metadata"
        onError={tryNext}
        aria-label={`Demonstração de ${name}`}
      />
    );
  }

  if (kind === "youtube" || kind === "vimeo") {
    const embed = kind === "youtube" ? youtubeEmbedUrl(source) : vimeoEmbedUrl(source);
    if (embed) {
      return (
        <iframe
          className={className}
          src={embed}
          title={`Demonstração de ${name}`}
          loading="lazy"
          allow="autoplay; encrypted-media; picture-in-picture"
        />
      );
    }
  }

  if (kind === "link") {
    return (
      <a
        className={`${className} admin-builder-media-link`}
        href={source}
        target="_blank"
        rel="noreferrer"
        aria-label={`Abrir mídia de ${name}`}
      >
        <small>URL</small>
        <strong>{name}</strong>
      </a>
    );
  }

  if (kind === "object") {
    return (
      <object
        className={className}
        data={source}
        aria-label={`Demonstração de ${name}`}
      >
        <a href={source} target="_blank" rel="noreferrer">Abrir mídia</a>
      </object>
    );
  }

  return (
    <img
      className={className}
      src={source}
      alt={`Demonstração de ${name}`}
      loading="lazy"
      draggable={false}
      onError={tryNext}
    />
  );
}

type SwipeToRemoveProps = {
  children: ReactNode;
  label: string;
  onRemove: () => void;
};

function SwipeToRemove({ children, label, onRemove }: SwipeToRemoveProps) {
  const [offset, setOffset] = useState(0);

  const bind = useDrag(
    ({ movement: [movementX], last, cancel }) => {
      if (movementX > 18) {
        cancel();
        setOffset(0);
        return;
      }

      const next = Math.max(-116, Math.min(0, movementX));
      if (!last) {
        setOffset(next);
        return;
      }

      setOffset(next <= -54 ? -108 : 0);
    },
    {
      axis: "x",
      filterTaps: true,
      bounds: { left: -116, right: 0 },
      rubberband: true,
    },
  );

  const close = () => setOffset(0);

  return (
    <div className={clsx("admin-builder-swipe", offset < 0 && "is-open")}>
      <button
        type="button"
        className="admin-builder-swipe-delete accqua-pressable"
        onClick={() => {
          close();
          onRemove();
        }}
        aria-label={`Remover ${label}`}
      >
        <AdminTrashIcon size={21} />
        <span>Remover</span>
      </button>

      <div
        {...bind()}
        className="admin-builder-swipe-content"
        style={{ transform: `translateX(${offset}px)`, touchAction: "pan-y" }}
      >
        {children}
      </div>
    </div>
  );
}

type ReorderGestureHandleProps = {
  index: number;
  total: number;
  label: string;
  onMove: (direction: -1 | 1) => void;
};

function ReorderGestureHandle({
  index,
  total,
  label,
  onMove,
}: ReorderGestureHandleProps) {
  const [dragging, setDragging] = useState(false);
  const bind = useDrag(
    ({ first, last, movement: [, movementY] }) => {
      if (first) setDragging(true);
      if (!last) return;
      setDragging(false);
      if (Math.abs(movementY) < 34) return;
      if (movementY < 0 && index > 0) onMove(-1);
      if (movementY > 0 && index < total - 1) onMove(1);
    },
    { axis: "y", filterTaps: true },
  );

  return (
    <button
      {...bind()}
      type="button"
      className={clsx("admin-builder-reorder-handle", "accqua-pressable", dragging && "is-dragging")}
      aria-label={`Arrastar para reordenar ${label}`}
      title="Arraste para cima ou para baixo"
      onClick={(event) => event.stopPropagation()}
      style={{ touchAction: "none" }}
    >
      <span aria-hidden="true">≡</span>
    </button>
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
  const [mediaManifest, setMediaManifest] = useState<string[]>([]);
  const [templates, setTemplates] = useState<AdminProgramTemplate[]>([]);
  const [legacyTemplates, setLegacyTemplates] = useState<WorkoutTemplate[]>([]);
  const [studentSummary, setStudentSummary] = useState<RankingProfileSummary | null>(null);
  const [studentActivities, setStudentActivities] = useState<StudentActivitySummary[]>([]);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [studentSheetOpen, setStudentSheetOpen] = useState(false);
  const [librarySheetOpen, setLibrarySheetOpen] = useState(false);
  const [templateNameOpen, setTemplateNameOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);
  const [customExerciseOpen, setCustomExerciseOpen] = useState(false);
  const [customExerciseSaving, setCustomExerciseSaving] = useState(false);
  const [customExercise, setCustomExercise] =
    useState<CustomExerciseDraft>(DEFAULT_CUSTOM_EXERCISE);
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
    "programa",
  );
  const [checklistOpen, setChecklistOpen] = useState(true);
  const [saveAttempted, setSaveAttempted] = useState(false);
  const [recentlyAddedExercise, setRecentlyAddedExercise] = useState<{
    draftId: string;
    name: string;
    routineCode: string;
  } | null>(null);

  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const desktopSearchRef = useRef<HTMLInputElement>(null);
  const programSectionRef = useRef<HTMLElement>(null);
  const routineSectionRef = useRef<HTMLElement>(null);
  const selectedSectionRef = useRef<HTMLElement>(null);
  const librarySectionRef = useRef<HTMLElement>(null);
  const cardioSectionRef = useRef<HTMLElement>(null);

  const canManageStudents =
    profile?.role === "professor" ||
    profile?.role === "reception" ||
    profile?.role === "admin";

  useEffect(() => {
    if (!user || !canManageStudents) return;

    let cancelled = false;
    setStudentLoading(true);

    const loadBuilder = async () => {
      try {
        const [
          studentResult,
          libraryResult,
          templateResult,
          legacyTemplateResult,
          summaryResult,
          activityResult,
          mediaManifestResult,
        ] = await Promise.all([
          getWorkoutStudentById(studentId),
          loadExerciseLibrary(),
          loadAdminProgramTemplates(user.id),
          loadWorkoutTemplates(user.id),
          loadRankingProfileSummary(studentId),
          loadStudentActivityHistory(studentId),
          loadExerciseMediaManifest(),
        ]);

        let resolvedStudent = studentResult;
        const resolvedStatus = studentResult?.status.trim().toLowerCase();

        if (
          studentResult &&
          ["active", "ativo", "approved"].includes(resolvedStatus ?? "") &&
          studentResult.linkedProfessorId !== user.id
        ) {
          try {
            resolvedStudent = await setStudentProfessorLink(
              studentResult.id,
              user.id,
            );
          } catch {
            resolvedStudent = studentResult;
          }
        }

        if (cancelled) return;

        setStudent(resolvedStudent);
        setLibrary(libraryResult);
        setTemplates(templateResult);
        setLegacyTemplates(legacyTemplateResult);
        setStudentSummary(summaryResult);
        setStudentActivities(activityResult);
        setMediaManifest(mediaManifestResult);

        if (resolvedStudent) {
          setGuideGoal(goalFromObjective(resolvedStudent.objective));
          void markStudentWorkoutAlertsRead(resolvedStudent.id);
        }
      } catch (error) {
        if (!cancelled) {
          setToast(
            error instanceof Error
              ? error.message
              : "Não foi possível abrir o montador de treino.",
          );
        }
      } finally {
        if (!cancelled) setStudentLoading(false);
      }
    };

    void loadBuilder();

    return () => {
      cancelled = true;
    };
  }, [canManageStudents, studentId, user?.id]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!toast) return;
    notify(toast, { id: "accqua-builder-feedback" });
  }, [toast]);

  useEffect(() => {
    if (!recentlyAddedExercise) return;
    const timer = window.setTimeout(() => setRecentlyAddedExercise(null), 2400);
    return () => window.clearTimeout(timer);
  }, [recentlyAddedExercise?.draftId]);

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

  useEffect(() => {
    const handleKeyboardShortcuts = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditing = Boolean(
        target?.closest("input, textarea, select, [contenteditable='true']"),
      );

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        const input = window.matchMedia("(min-width: 1024px)").matches
          ? desktopSearchRef.current
          : mobileSearchRef.current;
        input?.focus();
        input?.select();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        document.querySelector<HTMLButtonElement>(".admin-builder-footer .is-publish")?.click();
        return;
      }

      if (isEditing || event.metaKey || event.ctrlKey || event.altKey) return;
      const routineNumber = Number(event.key);
      if (routineNumber >= 1 && routineNumber <= routines.length) {
        setActiveRoutineIndex(routineNumber - 1);
        setExpandedExercise(null);
        setMobileStep("rotina");
      }
    };

    window.addEventListener("keydown", handleKeyboardShortcuts);
    return () => window.removeEventListener("keydown", handleKeyboardShortcuts);
  }, [routines.length]);

  const activeRoutine =
    routines[activeRoutineIndex] ?? routines[0] ?? createRoutines("FULL")[0];

  const activeStepMeta =
    BUILDER_STEPS.find((step) => step.key === mobileStep) ?? BUILDER_STEPS[0];

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

  const estimatedMinutes = useMemo(() => {
    const exerciseSeconds = routines.reduce((programTotal, routine) => {
      return programTotal + routine.exercises.reduce((routineTotal, exercise) => {
        const sets = Math.max(1, exercise.sets);
        const executionSeconds = sets * 45;
        const restSeconds = Math.max(0, sets - 1) * Math.max(15, exercise.restSeconds);
        return routineTotal + executionSeconds + restSeconds;
      }, 0);
    }, 0);
    const cardioSeconds = cardio.enabled ? Math.max(0, cardio.durationMinutes) * 60 : 0;
    return Math.max(0, Math.round((exerciseSeconds + cardioSeconds) / 60));
  }, [cardio.durationMinutes, cardio.enabled, routines]);

  const recentWorkoutCount = useMemo(
    () => studentActivities.filter((activity) => activity.kind === "workout").length,
    [studentActivities],
  );

  const studentAge = student ? calculateStudentAge(student.birthDate) : null;

  const studentMemberTime = useMemo(() => {
    const value = studentSummary?.memberSince;
    if (!value) return "Não disponível";
    const start = new Date(value);
    if (Number.isNaN(start.getTime())) return "Não disponível";
    const now = new Date();
    let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    if (now.getDate() < start.getDate()) months -= 1;
    months = Math.max(0, months);
    if (months < 1) return "Menos de 1 mês";
    if (months < 12) return `${months} ${months === 1 ? "mês" : "meses"}`;
    const years = Math.floor(months / 12);
    const rest = months % 12;
    return rest ? `${years} ${years === 1 ? "ano" : "anos"} e ${rest} ${rest === 1 ? "mês" : "meses"}` : `${years} ${years === 1 ? "ano" : "anos"}`;
  }, [studentSummary?.memberSince]);

  const linkedProfessorReady = Boolean(
    student?.linkedProfessorId &&
      student.linkedProfessorId === user?.id,
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
        label: "Responsável pelo aluno",
        detail: linkedProfessorReady
          ? "Vinculado à sua conta"
          : "Volte ao perfil e toque em Vincular a mim",
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
    !["active", "ativo", "approved"].includes(student.status.trim().toLowerCase())
  ) {
    return <Navigate to="/area-accqua" replace />;
  }
  const returnToStudent = () => {
    navigate(
      returnStudentId
        ? `/area-accqua?student=${returnStudentId}`
        : "/area-accqua",
    );
  };

  const showBuilderSection = (step: BuilderStep) => {
    setMobileStep(step);

    if (
      step === "exercicios" &&
      activeRoutine.exercises.length === 0 &&
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 1023px)").matches
    ) {
      setLibrarySheetOpen(true);
      return;
    }

    const target = {
      programa: programSectionRef.current,
      rotina: routineSectionRef.current,
      exercicios:
        activeRoutine.exercises.length > 0
          ? selectedSectionRef.current
          : librarySectionRef.current,
      cardio: cardioSectionRef.current,
    }[step];

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
    setMobileStep("exercicios");
    setRecentlyAddedExercise({
      draftId: exercise.draftId,
      name: item.name,
      routineCode: activeRoutine.code,
    });
    setToast(`✓ ${item.name} foi adicionado ao treino ${activeRoutine.code}.`);
  };

  const openCustomExercise = () => {
    setCustomExercise({
      ...DEFAULT_CUSTOM_EXERCISE,
      muscleGroup: activeGroup === "Todos" ? "Outros" : activeGroup,
    });
    setCustomExerciseOpen(true);
  };

  const addCustomExercise = async () => {
    if (customExerciseSaving) return;
    if (!customExercise.name.trim()) {
      setToast("Informe o nome do exercício.");
      return;
    }

    setCustomExerciseSaving(true);

    try {
      const item = await createExerciseLibraryItem(customExercise);

      setLibrary((current) => {
        const withoutSame = current.filter(
          (exercise) => exercise.slug !== item.slug,
        );
        return [...withoutSame, item].sort((a, b) =>
          `${a.muscleGroup}-${a.name}`.localeCompare(
            `${b.muscleGroup}-${b.name}`,
            "pt-BR",
          ),
        );
      });
      addExercise(item);
      setCustomExerciseOpen(false);
      setCustomExercise(DEFAULT_CUSTOM_EXERCISE);
      setToast("Exercício salvo na biblioteca da equipe e adicionado ao treino.");
    } catch (error) {
      setToast(
        error instanceof Error
          ? error.message
          : "Não foi possível criar o exercício.",
      );
    } finally {
      setCustomExerciseSaving(false);
    }
  };

  const applyBuiltInPreset = (preset: BuiltInPreset) => {
    if (totalExercises > 0 && !window.confirm(
      "Aplicar o modelo substituirá as rotinas e exercícios atuais. Continuar?",
    )) {
      return;
    }

    const nextRoutines = createGuidedRoutines(
      preset.code,
      library,
      preset.goal,
      preset.level,
    );
    const reviewDate = new Date();
    reviewDate.setDate(reviewDate.getDate() + 42);

    setSplitCode(preset.code);
    setProgramName(preset.title);
    setProgramNotes(
      `${preset.subtitle} Revise cargas, limitações e observações individuais antes de salvar.`,
    );
    setReviewAt(reviewDate.toISOString().slice(0, 10));
    setRoutines(nextRoutines);
    setActiveRoutineIndex(0);
    setExpandedExercise(null);
    setTemplatesOpen(false);
    setMobileStep("rotina");
    setToast("Modelo pronto aplicado. Revise antes de salvar.");
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

  const applyPrescriptionPreset = (
    draftId: string,
    preset: PrescriptionPreset,
  ) => {
    updateExercise(draftId, {
      sets: preset.sets,
      repsMin: preset.repsMin,
      repsMax: preset.repsMax,
      restSeconds: preset.restSeconds,
    });
    setToast(`${preset.label} aplicado a este exercício.`);
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
      setSaveAttempted(true);
      showBuilderSection(nextReadinessIssue.step);
      setChecklistOpen(true);
      setToast(`Antes de salvar: ${nextReadinessIssue.detail}.`);
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

  const openTemplateName = () => {
    if (!totalExercises) {
      setToast("Adicione pelo menos um exercício antes de salvar o modelo.");
      return;
    }

    setTemplateName(programName.trim() || `Modelo ${splitCode}`);
    setTemplateNameOpen(true);
  };

  const saveTemplate = async () => {
    if (saving) return;

    const cleanTemplateName = templateName.trim();
    if (!cleanTemplateName) {
      setToast("Digite um nome para o treino rápido.");
      return;
    }

    setSaving(true);

    try {
      const id = await saveAdminProgramTemplate(user.id, {
        name: cleanTemplateName,
        splitCode,
        payload: {
          programName: cleanTemplateName,
          notes: programNotes,
          reviewAt,
          routines,
          cardio: cardio.enabled ? cardio : null,
        },
      });

      setTemplates((current) => [
        {
          id,
          name: cleanTemplateName,
          splitCode,
          payload: {
            programName: cleanTemplateName,
            notes: programNotes,
            reviewAt,
            routines,
            cardio: cardio.enabled ? cardio : null,
          },
          createdAt: new Date().toISOString(),
        },
        ...current,
      ]);
      setTemplateNameOpen(false);
      setToast(`Modelo “${cleanTemplateName}” salvo no treino rápido.`);
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

  const openExerciseLibrary = () => {
    setMobileStep("exercicios");

    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
      setLibrarySheetOpen(true);
      return;
    }

    librarySectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => desktopSearchRef.current?.focus(), 180);
  };


  return (
    <div className="admin-builder-screen">
      <div className="admin-builder-background" aria-hidden="true" />

      <main className="admin-builder-shell">
        <header className="admin-builder-header">
          <button
            type="button"
            className="admin-builder-top-button"
            onClick={returnToStudent}
            aria-label="Voltar"
          >
            <AdminBackIcon />
          </button>

          <div className="admin-builder-brand admin-v10-brand">
            <AccquaLogo compact />
            <strong>MONTAR TREINO</strong>
          </div>

          <button
            type="button"
            className="admin-builder-top-button is-models"
            onClick={() => setTemplatesOpen(true)}
            aria-label="Modelos salvos"
            title="Modelos salvos"
          >
            <AdminLayersIcon />
          </button>
        </header>

        <div className="admin-builder-guided-sticky">
          <section className="admin-builder-context-bar" aria-live="polite">
            <div>
              <small>ETAPA {activeStepMeta.number} DE {BUILDER_STEPS.length} · {activeStepMeta.label.toUpperCase()}</small>
              <strong>Montando treino {activeRoutine.code} para {student.fullName}</strong>
            </div>
            <span>{completionPercent}%</span>
          </section>

          <div className="admin-builder-mobile-tools">
            <div className="admin-builder-mobile-routines" aria-label="Dias do treino">
              {routines.map((routine, index) => {
                const selected = activeRoutineIndex === index;
                const filled = routine.exercises.length > 0;
                return (
                  <button
                    type="button"
                    key={`mobile-${routine.code}-${index}`}
                    className={[selected ? "is-active" : "", filled ? "has-content" : "is-empty"].filter(Boolean).join(" ")}
                    aria-pressed={selected}
                    onClick={() => {
                      setActiveRoutineIndex(index);
                      setExpandedExercise(null);
                      setMobileStep("rotina");
                    }}
                  >
                    <span>{routine.code}</span>
                    <small>{filled ? `${routine.exercises.length} ✓` : "vazio"}</small>
                  </button>
                );
              })}
            </div>

            <div className="admin-builder-mobile-actions" aria-label="Atalhos do montador">
              <button
                type="button"
                className="accqua-pressable"
                onClick={() => setStudentSheetOpen(true)}
              >
                <AdminInfoIcon size={17} />
                Aluno
              </button>
              <button
                type="button"
                className="accqua-pressable"
                onClick={openExerciseLibrary}
              >
                <AdminSearchIcon size={17} />
                Biblioteca
              </button>
              <button
                type="button"
                className="accqua-pressable"
                onClick={() => setTemplatesOpen(true)}
              >
                <AdminLayersIcon size={17} />
                Modelos
              </button>
            </div>

            <label className="admin-builder-mobile-search">
              <AdminSearchIcon size={19} />
              <input
                ref={mobileSearchRef}
                value={libraryQuery}
                onFocus={() => setMobileStep("exercicios")}
                onChange={(event) => {
                  setLibraryQuery(event.target.value);
                  setMobileStep("exercicios");
                }}
                placeholder={`Buscar exercício para o treino ${activeRoutine.code}`}
              />
              {libraryQuery ? (
                <button type="button" onClick={() => setLibraryQuery("")} aria-label="Limpar busca">
                  <AdminCloseIcon size={17} />
                </button>
              ) : null}
            </label>

            {libraryQuery ? (
              <div className="admin-builder-mobile-search-results" role="listbox" aria-label="Resultados da busca de exercícios">
                {filteredLibrary.slice(0, 3).map((item) => (
                  <button type="button" key={`mobile-result-${item.slug}`} onClick={() => addExercise(item)}>
                    <span>
                      <strong>{item.name}</strong>
                      <small>{item.muscleGroup}{item.equipment ? ` · ${item.equipment}` : ""}</small>
                    </span>
                    <b><AdminPlusIcon size={16} />Adicionar</b>
                  </button>
                ))}
                {!filteredLibrary.length ? (
                  <p>Nenhum exercício encontrado. Tente outro nome ou abra a biblioteca completa.</p>
                ) : null}
                <button type="button" className="is-browse" onClick={openExerciseLibrary}>
                  <AdminSearchIcon size={16} /> Ver biblioteca completa
                </button>
              </div>
            ) : null}

            {recentlyAddedExercise ? (
              <div className="admin-builder-add-confirmation" role="status">
                <AdminCheckIcon size={18} />
                <span>
                  <strong>{recentlyAddedExercise.name} adicionado</strong>
                  <small>Treino {recentlyAddedExercise.routineCode} · ajuste séries e repetições no card.</small>
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <nav
          className="admin-builder-step-nav"
          aria-label="Etapas do montador"
        >
          {BUILDER_STEPS.map((step) => (
            <button
              type="button"
              key={step.key}
              className={mobileStep === step.key ? "is-active" : ""}
              aria-pressed={mobileStep === step.key}
              onClick={() => showBuilderSection(step.key)}
            >
              <span>{step.number}</span>
              <strong>{step.label}</strong>
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
                {linkedProfessorReady
                  ? "Vinculado à sua conta"
                  : student.linkedProfessorName || "Responsável não definido"}
              </strong>
              <small>
                {linkedProfessorReady
                  ? "Você está responsável por este aluno e pode salvar o treino."
                  : "Volte ao perfil e toque em Vincular a mim antes de salvar."}
              </small>
            </div>
          </div>

          <div className="admin-builder-split-start">
            <div>
              <small>1. ESCOLHA A DIVISÃO</small>
              <strong>Quantos treinos diferentes o aluno terá?</strong>
              <p>Comece por Full Body, AB, ABC, ABCD, ABCDE ou ABCDEF.</p>
            </div>
            <div className="admin-builder-split-options">
              {SPLIT_OPTIONS.filter(
                (option) => option.code !== "PERSONALIZADO" && option.code !== "ABCDF",
              ).map((option) => (
                <button
                  type="button"
                  key={option.code}
                  className={splitCode === option.code ? "is-active" : ""}
                  aria-pressed={splitCode === option.code}
                  onClick={() => {
                    setMobileStep("rotina");
                    changeSplit(option.code);
                  }}
                >
                  <strong>{option.code === "FULL" ? "FULL" : option.code}</strong>
                  <small>{option.count} rotina{option.count === 1 ? "" : "s"}</small>
                  {splitCode === option.code ? <AdminCheckIcon size={15} /> : null}
                </button>
              ))}
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

            <label className="is-wide">
              <span>Observação final para este aluno</span>
              <textarea
                value={programNotes}
                onChange={(event) =>
                  setProgramNotes(event.target.value)
                }
                placeholder="Mensagem final, limitações, progressão e recomendações que aparecerão para este aluno..."
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
                aria-pressed={activeRoutineIndex === index}
                onClick={() => {
                  setActiveRoutineIndex(index);
                  setExpandedExercise(null);
                  setMobileStep("rotina");
                }}
              >
                <span>{routine.code}</span>
                <small>{routine.exercises.length ? `${routine.exercises.length} ✓` : "vazio"}</small>
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
                    aria-pressed={activeRoutine.weekDays.includes(day.value)}
                    onClick={() => {
                      toggleWeekDay(day.value);
                      setMobileStep("rotina");
                    }}
                    title={day.name}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          </article>
        </section>

        <section ref={selectedSectionRef} className="admin-builder-selected admin-builder-anchor">
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

          {activeRoutine.exercises.length ? (
            <div className="admin-builder-swipe-hint">
              Deslize um exercício para a esquerda para remover.
            </div>
          ) : null}

          {!activeRoutine.exercises.length ? (
            <div className="admin-builder-empty">
              <AdminDumbbellIcon size={29} />
              <strong>Treino {activeRoutine.code} ainda está vazio</strong>
              <p>Busque um exercício pelo nome ou abra a biblioteca completa para adicionar o primeiro.</p>
              <button type="button" onClick={openExerciseLibrary}>
                <AdminSearchIcon size={18} /> Buscar exercícios
              </button>
            </div>
          ) : (
            <div className="admin-builder-exercise-list">
              {activeRoutine.exercises.map((exercise, index) => {
                const expanded =
                  expandedExercise === exercise.draftId;

                return (
                  <SwipeToRemove
                    key={exercise.draftId}
                    label={exercise.name}
                    onRemove={() => {
                      removeExercise(exercise.draftId);
                      setToast(`${exercise.name} removido da rotina.`);
                    }}
                  >
                    <article
                      className={`admin-builder-exercise ${
                        expanded ? "is-expanded" : ""
                      } ${recentlyAddedExercise?.draftId === exercise.draftId ? "is-just-added" : ""}`}
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
                          manifestFiles={mediaManifest}
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

                      <span className="admin-builder-quick-tune" onClick={(event) => event.stopPropagation()}>
                        <span>
                          <small>Séries</small>
                          <button type="button" onClick={() => updateExercise(exercise.draftId, { sets: Math.max(1, exercise.sets - 1) })} aria-label="Diminuir séries"><AdminMinusIcon size={16} /></button>
                          <b>{exercise.sets}</b>
                          <button type="button" onClick={() => updateExercise(exercise.draftId, { sets: exercise.sets + 1 })} aria-label="Aumentar séries"><AdminPlusIcon size={16} /></button>
                        </span>
                        <span>
                          <small>Reps</small>
                          <button type="button" onClick={() => updateExercise(exercise.draftId, { repsMin: Math.max(1, exercise.repsMin - 1), repsMax: Math.max(1, exercise.repsMax - 1) })} aria-label="Diminuir repetições"><AdminMinusIcon size={16} /></button>
                          <b>{exercise.repsMin}{exercise.repsMax !== exercise.repsMin ? `–${exercise.repsMax}` : ""}</b>
                          <button type="button" onClick={() => updateExercise(exercise.draftId, { repsMin: exercise.repsMin + 1, repsMax: exercise.repsMax + 1 })} aria-label="Aumentar repetições"><AdminPlusIcon size={16} /></button>
                        </span>
                      </span>

                      <ReorderGestureHandle
                        index={index}
                        total={activeRoutine.exercises.length}
                        label={exercise.name}
                        onMove={(direction) => moveExercise(index, direction)}
                      />

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
                            manifestFiles={mediaManifest}
                          />
                          <label>
                            <span>Mídia demonstrativa</span>
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

                        <div className="admin-builder-exercise-data-fields">
                          <label className="is-wide">
                            <span>Nome para este aluno</span>
                            <input
                              value={exercise.name}
                              onChange={(event) =>
                                updateExercise(exercise.draftId, {
                                  name: event.target.value,
                                })
                              }
                            />
                          </label>

                          <label>
                            <span>Grupo muscular</span>
                            <input
                              value={exercise.muscleGroup}
                              onChange={(event) =>
                                updateExercise(exercise.draftId, {
                                  muscleGroup: event.target.value,
                                  category: event.target.value,
                                })
                              }
                            />
                          </label>

                          <label>
                            <span>Aparelho</span>
                            <input
                              value={exercise.equipment}
                              onChange={(event) =>
                                updateExercise(exercise.draftId, {
                                  equipment: event.target.value,
                                })
                              }
                            />
                          </label>

                          <label className="is-wide">
                            <span>Informação de execução</span>
                            <textarea
                              value={exercise.beginnerTip}
                              onChange={(event) =>
                                updateExercise(exercise.draftId, {
                                  beginnerTip: event.target.value,
                                })
                              }
                            />
                          </label>
                        </div>

                        <div className="admin-builder-presets" aria-label="Prescrições rápidas">
                          <span>Prescrição rápida</span>
                          <div>
                            {PRESCRIPTION_PRESETS.map((preset) => (
                              <button
                                type="button"
                                key={preset.key}
                                className="accqua-pressable"
                                onClick={() => applyPrescriptionPreset(exercise.draftId, preset)}
                              >
                                <strong>{preset.label}</strong>
                                <small>
                                  {preset.sets}×{preset.repsMin}
                                  {preset.repsMax !== preset.repsMin ? `–${preset.repsMax}` : ""}
                                  {` · ${preset.restSeconds}s`}
                                </small>
                              </button>
                            ))}
                          </div>
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
                          <span>Observação somente para este aluno</span>
                          <textarea
                            value={exercise.notes}
                            onChange={(event) =>
                              updateExercise(exercise.draftId, {
                                notes: event.target.value,
                              })
                            }
                            placeholder="Ex.: reduzir amplitude, não aumentar carga, atenção ao joelho..."
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
                  </SwipeToRemove>
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
            <div className="admin-builder-library-header-actions">
              <span>{filteredLibrary.length} exercício{filteredLibrary.length === 1 ? "" : "s"}{mediaManifest.length ? ` · ${mediaManifest.length} mídias` : ""}</span>
              <button
                type="button"
                className="admin-builder-library-add-compact"
                onClick={openCustomExercise}
                aria-label="Adicionar novo exercício à biblioteca"
                title="Novo exercício"
              >
                <AdminPlusIcon size={18} />
              </button>
            </div>
          </header>

          <label className="admin-builder-search">
            <AdminSearchIcon />
            <input
              ref={desktopSearchRef}
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
                aria-pressed={activeGroup === group}
                onClick={() => {
                  setActiveGroup(group);
                  setMobileStep("exercicios");
                }}
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
                    manifestFiles={mediaManifest}
                  />
                  <i>MÍDIA</i>
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
            aria-pressed={cardio.enabled}
            onClick={() => {
              setMobileStep("cardio");
              setCardio((current) => ({
                ...current,
                enabled: !current.enabled,
              }));
            }}
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

        <aside className="admin-builder-desktop-aside">
          <section className="admin-builder-student-summary">
            <header>
              <span className={`admin-builder-student-avatar ${student.avatarUrl ? "has-photo" : ""}`}>
                {student.avatarUrl ? <img src={student.avatarUrl} alt={`Foto de ${student.fullName}`} /> : student.fullName.slice(0, 2).toUpperCase()}
              </span>
              <div><small>ALUNO</small><h2>{student.fullName}</h2><p>{student.objective || "Objetivo não informado"}</p></div>
            </header>
            <div className="admin-builder-student-metrics">
              <article><small>Idade</small><strong>{studentAge !== null ? `${studentAge} anos` : "—"}</strong></article>
              <article><small>Tempo no app</small><strong>{studentMemberTime}</strong></article>
              <article><small>Treinos totais</small><strong>{studentSummary?.totalWorkouts ?? recentWorkoutCount}</strong></article>
              <article><small>Histórico recente</small><strong>{recentWorkoutCount} treino{recentWorkoutCount === 1 ? "" : "s"}</strong></article>
            </div>
          </section>

          <section className="admin-builder-aside-templates">
            <header><div><small>MODELOS SALVOS</small><h2>Aplicar rapidamente</h2></div><button type="button" onClick={() => setTemplatesOpen(true)}>Ver todos</button></header>
            <div>
              {templates.slice(0, 4).map((template) => (
                <button type="button" key={template.id} onClick={() => applyTemplate(template)}>
                  <AdminLayersIcon size={19} />
                  <span><strong>{template.name}</strong><small>{template.splitCode}</small></span>
                  <AdminChevronIcon size={17} />
                </button>
              ))}
              {legacyTemplates.slice(0, 3).map((template) => (
                <article key={template.id}>
                  <AdminDumbbellIcon size={18} />
                  <span><strong>{template.name}</strong><small>{template.focus || "Modelo simples"}</small></span>
                </article>
              ))}
              {!templates.length && !legacyTemplates.length ? <p>Nenhum modelo salvo ainda.</p> : null}
            </div>
          </section>
        </aside>

        <footer className="admin-builder-footer">
          {saveAttempted && nextReadinessIssue ? (
            <div className="admin-builder-save-warning" role="alert">
              <AdminWarningIcon size={20} />
              <span>
                <strong>Falta concluir: {nextReadinessIssue.label}</strong>
                <small>{nextReadinessIssue.detail}</small>
              </span>
              <button type="button" onClick={() => showBuilderSection(nextReadinessIssue.step)}>Ir para etapa</button>
            </div>
          ) : null}
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
              {totalExercises === 1 ? "" : "s"} · ~{estimatedMinutes} min
            </i>
          </div>

          <div className="admin-builder-footer-actions">
            <button
              type="button"
              className="is-template"
              onClick={openTemplateName}
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
                {saving ? "Salvando..." : "Salvar treino do aluno"}
              </span>
            </button>
          </div>
        </footer>
      </main>

      <Drawer.Root open={librarySheetOpen} onOpenChange={setLibrarySheetOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="admin-v11-library-overlay" />
          <Drawer.Content className="admin-v11-library-drawer" aria-describedby="admin-v11-library-description">
            <div className="admin-v11-library-handle" aria-hidden="true" />

            <div className="admin-v11-library-heading">
              <div>
                <small>BIBLIOTECA DE EXERCÍCIOS</small>
                <Drawer.Title>Adicionar ao treino {activeRoutine.code}</Drawer.Title>
                <Drawer.Description id="admin-v11-library-description">
                  Busque, filtre e adicione sem sair da montagem.
                </Drawer.Description>
              </div>
              <Drawer.Close asChild>
                <button type="button" className="admin-v11-library-close" aria-label="Fechar biblioteca">
                  <AdminCloseIcon />
                </button>
              </Drawer.Close>
            </div>

            <label className="admin-v11-library-search">
              <AdminSearchIcon size={20} />
              <input
                value={libraryQuery}
                onChange={(event) => setLibraryQuery(event.target.value)}
                placeholder="Buscar exercício ou aparelho"
              />
              {libraryQuery ? (
                <button type="button" onClick={() => setLibraryQuery("")} aria-label="Limpar busca">
                  <AdminCloseIcon size={17} />
                </button>
              ) : null}
            </label>

            <div className="admin-v11-library-groups" aria-label="Grupos musculares">
              {groups.map((group) => (
                <button
                  type="button"
                  key={`drawer-${group}`}
                  className={activeGroup === group ? "is-active" : ""}
                  aria-pressed={activeGroup === group}
                  onClick={() => setActiveGroup(group)}
                >
                  {group}
                </button>
              ))}
            </div>

            <div className="admin-v11-library-count">
              <span>{filteredLibrary.length} exercício{filteredLibrary.length === 1 ? "" : "s"}{mediaManifest.length ? ` · ${mediaManifest.length} mídias` : ""}</span>
              <button
                type="button"
                className="admin-builder-library-add-compact"
                onClick={() => { setLibrarySheetOpen(false); openCustomExercise(); }}
                aria-label="Adicionar novo exercício à biblioteca"
              >
                <AdminPlusIcon size={18} />
              </button>
            </div>

            <div className="admin-v11-library-results">
              {filteredLibrary.map((item) => (
                <article key={`drawer-item-${item.slug}`}>
                  <span className="admin-builder-library-gif">
                    <ExerciseGif slug={item.slug} name={item.name} mediaUrl={item.mediaUrl} manifestFiles={mediaManifest} />
                  </span>
                  <div>
                    <strong>{item.name}</strong>
                    <small>{item.muscleGroup}{item.equipment ? ` · ${item.equipment}` : ""}</small>
                  </div>
                  <button
                    type="button"
                    className="accqua-pressable"
                    onClick={() => addExercise(item)}
                    aria-label={`Adicionar ${item.name} ao treino ${activeRoutine.code}`}
                  >
                    <AdminPlusIcon size={18} />
                    <span>Adicionar</span>
                  </button>
                </article>
              ))}

              {!filteredLibrary.length ? (
                <div className="admin-v11-library-empty">
                  <AdminSearchIcon size={24} />
                  <strong>Nenhum exercício encontrado</strong>
                  <small>Tente outro nome, aparelho ou grupo muscular.</small>
                </div>
              ) : null}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      <Drawer.Root open={studentSheetOpen} onOpenChange={setStudentSheetOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="admin-v10-drawer-overlay" />
          <Drawer.Content className="admin-v10-drawer-content" aria-describedby="admin-v10-student-sheet-description">
            <div className="admin-v10-drawer-handle" aria-hidden="true" />
            <Drawer.Title className="admin-v10-drawer-title">{student.fullName}</Drawer.Title>
            <Drawer.Description id="admin-v10-student-sheet-description" className="admin-v10-drawer-description">
              Resumo do aluno enquanto você monta o treino {activeRoutine.code}.
            </Drawer.Description>

            <div className="admin-v10-student-sheet">
              <span className={clsx("admin-builder-student-avatar", student.avatarUrl && "has-photo")}>
                {student.avatarUrl ? (
                  <img src={student.avatarUrl} alt={`Foto de ${student.fullName}`} />
                ) : (
                  student.fullName.slice(0, 2).toUpperCase()
                )}
              </span>
              <div>
                <small>OBJETIVO</small>
                <strong>{student.objective || "Não informado"}</strong>
              </div>
            </div>

            <div className="admin-v10-student-sheet-metrics">
              <article><small>Idade</small><strong>{studentAge !== null ? `${studentAge} anos` : "—"}</strong></article>
              <article><small>Tempo no app</small><strong>{studentMemberTime}</strong></article>
              <article><small>Treinos totais</small><strong>{studentSummary?.totalWorkouts ?? recentWorkoutCount}</strong></article>
              <article><small>Divisão</small><strong>{splitCode}</strong></article>
            </div>

            <Drawer.Close asChild>
              <button type="button" className="admin-v10-drawer-close accqua-pressable">Voltar ao treino</button>
            </Drawer.Close>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

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
                  aria-pressed={guideGoal === goal.value}
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
                  aria-pressed={guideLevel === level.value}
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
                  aria-pressed={guideDays === day}
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

      {templateNameOpen ? (
        <div
          className="admin-builder-drawer-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setTemplateNameOpen(false);
            }
          }}
        >
          <aside className="admin-builder-template-name-sheet">
            <span className="admin-builder-drawer-handle" />
            <header>
              <div>
                <small>SALVAR NO TREINO RÁPIDO</small>
                <h2>Dê um nome ao modelo</h2>
                <p>Esse nome aparecerá na biblioteca para usar com outros alunos.</p>
              </div>
              <button
                type="button"
                onClick={() => setTemplateNameOpen(false)}
                disabled={saving}
              >
                <AdminCloseIcon />
              </button>
            </header>

            <label>
              <span>Nome do treino</span>
              <input
                value={templateName}
                onChange={(event) => setTemplateName(event.target.value)}
                placeholder={`Ex.: ${splitCode} hipertrofia iniciante`}
                maxLength={80}
                autoFocus
              />
            </label>

            <div className="admin-builder-template-name-summary">
              <AdminLayersIcon size={22} />
              <div>
                <strong>{splitCode}</strong>
                <small>
                  {routines.length} rotina{routines.length === 1 ? "" : "s"} · {totalExercises} exercício
                  {totalExercises === 1 ? "" : "s"}
                </small>
              </div>
            </div>

            <button
              type="button"
              className="admin-builder-template-name-save"
              onClick={() => void saveTemplate()}
              disabled={saving || !templateName.trim()}
            >
              <AdminSaveIcon />
              {saving ? "Salvando..." : "Salvar no treino rápido"}
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

            <section className="admin-builder-built-in-presets">
              <div>
                <small>MODELOS PRONTOS</small>
                <strong>Comece com uma estrutura já montada</strong>
              </div>
              <div>
                {BUILT_IN_PRESETS.map((preset) => (
                  <button
                    type="button"
                    key={preset.code}
                    onClick={() => applyBuiltInPreset(preset)}
                  >
                    <span>{preset.code}</span>
                    <div>
                      <strong>{preset.title}</strong>
                      <small>{preset.subtitle}</small>
                    </div>
                    <AdminChevronIcon />
                  </button>
                ))}
              </div>
            </section>

            <div className="admin-builder-saved-label">
              <small>MODELOS SALVOS PELA EQUIPE</small>
            </div>

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

      {customExerciseOpen ? (
        <div
          className="admin-builder-drawer-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !customExerciseSaving) {
              setCustomExerciseOpen(false);
            }
          }}
        >
          <aside className="admin-builder-custom-sheet">
            <span className="admin-builder-drawer-handle" />
            <header>
              <div>
                <small>NOVO EXERCÍCIO</small>
                <h2>Criar durante a montagem</h2>
                <p>Adicione ao treino e, se desejar, salve na biblioteca da equipe.</p>
              </div>
              <button
                type="button"
                onClick={() => setCustomExerciseOpen(false)}
                disabled={customExerciseSaving}
              >
                <AdminCloseIcon />
              </button>
            </header>

            <div className="admin-builder-custom-fields">
              <label className="is-wide">
                <span>Nome do exercício</span>
                <input
                  value={customExercise.name}
                  onChange={(event) =>
                    setCustomExercise({ ...customExercise, name: event.target.value })
                  }
                  placeholder="Ex.: Remada na máquina articulada"
                  autoFocus
                />
              </label>

              <label>
                <span>Grupo muscular</span>
                <input
                  value={customExercise.muscleGroup}
                  onChange={(event) =>
                    setCustomExercise({
                      ...customExercise,
                      muscleGroup: event.target.value,
                    })
                  }
                  list="accqua-muscle-groups"
                />
                <datalist id="accqua-muscle-groups">
                  {groups.filter((group) => group !== "Todos").map((group) => (
                    <option key={group} value={group} />
                  ))}
                </datalist>
              </label>

              <label>
                <span>Aparelho ou material</span>
                <input
                  value={customExercise.equipment}
                  onChange={(event) =>
                    setCustomExercise({
                      ...customExercise,
                      equipment: event.target.value,
                    })
                  }
                  placeholder="Máquina, halteres, polia..."
                />
              </label>

              <label className="is-wide">
                <span>GIF ou vídeo</span>
                <input
                  value={customExercise.mediaUrl}
                  onChange={(event) =>
                    setCustomExercise({
                      ...customExercise,
                      mediaUrl: event.target.value,
                    })
                  }
                  placeholder="/gifs/meu-exercicio.gif ou URL"
                />
                <small>Aceita GIF/GIF, imagens, MP4/WebM/MOV e URLs. Arquivos de public/gifs são indexados automaticamente no build.</small>
              </label>

              <label className="is-wide">
                <span>Informação de execução</span>
                <textarea
                  value={customExercise.beginnerTip}
                  onChange={(event) =>
                    setCustomExercise({
                      ...customExercise,
                      beginnerTip: event.target.value,
                    })
                  }
                />
              </label>

              <div className="admin-builder-custom-numbers is-wide">
                <label>
                  <span>Séries</span>
                  <input
                    type="number"
                    min="1"
                    value={customExercise.defaultSets}
                    onChange={(event) =>
                      setCustomExercise({
                        ...customExercise,
                        defaultSets: Math.max(1, Number(event.target.value) || 1),
                      })
                    }
                  />
                </label>
                <label>
                  <span>Reps mín.</span>
                  <input
                    type="number"
                    min="1"
                    value={customExercise.defaultRepsMin}
                    onChange={(event) =>
                      setCustomExercise({
                        ...customExercise,
                        defaultRepsMin: Math.max(1, Number(event.target.value) || 1),
                      })
                    }
                  />
                </label>
                <label>
                  <span>Reps máx.</span>
                  <input
                    type="number"
                    min="1"
                    value={customExercise.defaultRepsMax}
                    onChange={(event) =>
                      setCustomExercise({
                        ...customExercise,
                        defaultRepsMax: Math.max(1, Number(event.target.value) || 1),
                      })
                    }
                  />
                </label>
                <label>
                  <span>Descanso</span>
                  <input
                    type="number"
                    min="15"
                    value={customExercise.defaultRestSeconds}
                    onChange={(event) =>
                      setCustomExercise({
                        ...customExercise,
                        defaultRestSeconds: Math.max(15, Number(event.target.value) || 15),
                      })
                    }
                  />
                </label>
              </div>

              <div className="admin-builder-custom-persist is-wide">
                <AdminCheckIcon size={18} />
                <span>
                  <strong>Salvo na biblioteca da equipe</strong>
                  <small>Ao confirmar, o exercício é gravado no Supabase e ficará disponível nas próximas montagens.</small>
                </span>
              </div>
            </div>

            <button
              type="button"
              className="admin-builder-create-exercise"
              onClick={() => void addCustomExercise()}
              disabled={customExerciseSaving || !customExercise.name.trim()}
            >
              <AdminPlusIcon />
              {customExerciseSaving ? "Salvando..." : "Criar e adicionar ao treino"}
            </button>
          </aside>
        </div>
      ) : null}

    </div>
  );
}
