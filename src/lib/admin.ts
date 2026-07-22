import { isSupabaseConfigured, supabase } from "./supabase";

export type WorkoutStudent = {
  id: string;
  fullName: string;
  cpf: string;
  rg: string;
  registrationCode: string;
  email: string;
  phone: string;
  emergencyPhone: string;
  birthDate: string;
  objective: string;
  role: string;
  status: string;
  linkedProfessorId: string;
  linkedProfessorName: string;
  linkedProfessorEmail: string;
  hasActiveWorkout: boolean;
  activeWorkoutCount: number;
  workoutUpdatedAt: string;
  reviewAt: string;
  programCode: string;
};

export type ExerciseLibraryItem = {
  id: string;
  slug: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  category: string;
  mediaUrl: string;
  beginnerTip: string;
  defaultSets: number;
  defaultRepsMin: number;
  defaultRepsMax: number;
  defaultRestSeconds: number;
};

export type BuilderExercise = ExerciseLibraryItem & {
  draftId: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
  initialLoadKg: number;
  notes: string;
  position: number;
};

export type WorkoutPlanDraft = {
  name: string;
  focus: string;
  notes: string;
  reviewAt: string;
  weekDays: number[];
};

export type WorkoutTemplate = {
  id: string;
  name: string;
  focus: string;
  notes: string;
  weekDays: number[];
  createdAt: string;
  exercises: BuilderExercise[];
};


export type StudentAccessStatus =
  | "pending"
  | "active"
  | "inactive"
  | "blocked";

export type StudentAccessUpdateResult = {
  status: StudentAccessStatus;
  accessMode: string;
  alreadyAuthorized: boolean;
};

export type StudentProfileUpdate = {
  fullName: string;
  cpf: string;
  rg: string;
  registrationCode: string;
  email: string;
  phone: string;
  emergencyPhone: string;
  birthDate: string;
  objective: string;
};


export type AdminProfessor = {
  id: string;
  fullName: string;
  email: string;
  activeStudents: number;
};

export type AdminRoutine = {
  code: string;
  name: string;
  focus: string;
  weekDays: number[];
  exercises: BuilderExercise[];
};

export type AdminCardioPrescription = {
  enabled: boolean;
  activityType:
    | "treadmill"
    | "spinning"
    | "elliptical"
    | "stairs"
    | "rowing"
    | "walk"
    | "swim";
  timing: "before" | "after" | "anytime";
  durationMinutes: number;
  speedKmh: number;
  calories: number;
  notes: string;
};

export type PublishAdminProgramInput = {
  studentId: string;
  staffId: string;
  programName: string;
  splitCode: string;
  notes: string;
  reviewAt: string;
  routines: AdminRoutine[];
  cardio: AdminCardioPrescription | null;
};

export type AdminProgramTemplate = {
  id: string;
  name: string;
  splitCode: string;
  payload: {
    programName: string;
    notes: string;
    reviewAt: string;
    routines: AdminRoutine[];
    cardio: AdminCardioPrescription | null;
  };
  createdAt: string;
};

export type SaveWorkoutInput = {
  studentId: string;
  staffId: string;
  plan: WorkoutPlanDraft;
  exercises: BuilderExercise[];
  activate: boolean;
};

const cleanDigits = (value: unknown) => String(value ?? "").replace(/\D/g, "");

const normalizeText = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const slugify = (value: unknown) =>
  normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const createLibraryExercise = (
  name: string,
  muscleGroup: string,
  equipment: string,
  options: Partial<ExerciseLibraryItem> = {},
): ExerciseLibraryItem => {
  const slug = options.slug || slugify(name);
  return {
    id: options.id || `catalog-${slug}`,
    slug,
    name,
    muscleGroup,
    category: options.category || muscleGroup,
    equipment,
    mediaUrl: options.mediaUrl || `/gifs/${slug}.gif`,
    beginnerTip:
      options.beginnerTip ||
      "Priorize a execução, use uma carga confortável e aumente somente quando o movimento estiver estável.",
    defaultSets: options.defaultSets ?? 3,
    defaultRepsMin: options.defaultRepsMin ?? 10,
    defaultRepsMax: options.defaultRepsMax ?? 12,
    defaultRestSeconds: options.defaultRestSeconds ?? 60,
  };
};

export const FALLBACK_EXERCISE_LIBRARY: ExerciseLibraryItem[] = [
  createLibraryExercise("Supino reto com barra", "Peitoral", "Barra e banco", {
    defaultRepsMin: 8,
    defaultRepsMax: 12,
    defaultRestSeconds: 90,
    beginnerTip: "Mantenha as escápulas apoiadas, pés firmes e não deixe os cotovelos abrirem demais.",
  }),
  createLibraryExercise("Supino inclinado com halteres", "Peitoral", "Halteres e banco", {
    mediaUrl: "/gifs/crucifixo-inclinado-com-halteres.gif",
    defaultRepsMin: 8,
    defaultRepsMax: 12,
    defaultRestSeconds: 90,
  }),
  createLibraryExercise("Crucifixo na máquina", "Peitoral", "Máquina", {
    defaultRepsMin: 12,
    defaultRepsMax: 15,
  }),
  createLibraryExercise("Crossover na polia", "Peitoral", "Polia", {
    defaultRepsMin: 12,
    defaultRepsMax: 15,
  }),
  createLibraryExercise("Flexão de braço", "Peitoral", "Peso corporal", {
    mediaUrl: "/gifs/flexao-de-braco-tradicional.gif",
    defaultRepsMin: 8,
    defaultRepsMax: 15,
    beginnerTip: "Apoie os joelhos quando necessário e mantenha cabeça, tronco e quadril alinhados.",
  }),
  createLibraryExercise("Puxada frontal", "Costas", "Polia alta", {
    defaultRepsMin: 10,
    defaultRepsMax: 12,
    defaultRestSeconds: 75,
    beginnerTip: "Puxe os cotovelos para baixo, sem levar a barra atrás da cabeça.",
  }),
  createLibraryExercise("Remada baixa", "Costas", "Polia baixa", {
    defaultRepsMin: 10,
    defaultRepsMax: 12,
    defaultRestSeconds: 75,
  }),
  createLibraryExercise("Remada unilateral com halter", "Costas", "Halter e banco", {
    defaultRepsMin: 10,
    defaultRepsMax: 12,
    defaultRestSeconds: 75,
  }),
  createLibraryExercise("Remada curvada com barra", "Costas", "Barra", {
    defaultRepsMin: 8,
    defaultRepsMax: 12,
    defaultRestSeconds: 90,
  }),
  createLibraryExercise("Pullover na polia", "Costas", "Polia", {
    defaultRepsMin: 12,
    defaultRepsMax: 15,
  }),
  createLibraryExercise("Desenvolvimento com halteres", "Ombros", "Halteres", {
    mediaUrl: "/gifs/desenvolvimento-com-halteres.gif",
    defaultRepsMin: 8,
    defaultRepsMax: 12,
    defaultRestSeconds: 75,
  }),
  createLibraryExercise("Elevação lateral", "Ombros", "Halteres", {
    mediaUrl: "/gifs/elevacao-lateral.GIF",
    defaultRepsMin: 12,
    defaultRepsMax: 15,
    beginnerTip: "Use pouca carga, cotovelos levemente flexionados e não ultrapasse muito a linha dos ombros.",
  }),
  createLibraryExercise("Elevação frontal", "Ombros", "Halteres", {
    defaultRepsMin: 10,
    defaultRepsMax: 15,
  }),
  createLibraryExercise("Crucifixo invertido", "Ombros", "Máquina ou halteres", {
    defaultRepsMin: 12,
    defaultRepsMax: 15,
  }),
  createLibraryExercise("Rosca direta", "Bíceps", "Barra", {
    defaultRepsMin: 10,
    defaultRepsMax: 12,
  }),
  createLibraryExercise("Rosca alternada", "Bíceps", "Halteres", {
    defaultRepsMin: 10,
    defaultRepsMax: 12,
  }),
  createLibraryExercise("Rosca martelo", "Bíceps", "Halteres", {
    defaultRepsMin: 10,
    defaultRepsMax: 12,
  }),
  createLibraryExercise("Rosca inclinada", "Bíceps", "Halteres e banco", {
    mediaUrl: "/gifs/rosca-banco-inclinado-unilateral.gif",
    defaultRepsMin: 10,
    defaultRepsMax: 12,
  }),
  createLibraryExercise("Rosca Scott", "Bíceps", "Banco Scott", {
    defaultRepsMin: 10,
    defaultRepsMax: 12,
  }),
  createLibraryExercise("Tríceps pulley", "Tríceps", "Polia", {
    defaultRepsMin: 10,
    defaultRepsMax: 15,
  }),
  createLibraryExercise("Tríceps francês", "Tríceps", "Halter", {
    defaultRepsMin: 10,
    defaultRepsMax: 12,
  }),
  createLibraryExercise("Tríceps testa", "Tríceps", "Barra", {
    defaultRepsMin: 8,
    defaultRepsMax: 12,
    defaultRestSeconds: 75,
  }),
  createLibraryExercise("Mergulho no banco", "Tríceps", "Banco", {
    defaultRepsMin: 8,
    defaultRepsMax: 15,
  }),
  createLibraryExercise("Agachamento livre", "Quadríceps", "Barra ou peso corporal", {
    mediaUrl: "/gifs/agachamento-livre.gif",
    defaultRepsMin: 8,
    defaultRepsMax: 12,
    defaultRestSeconds: 90,
    beginnerTip: "Comece com peso corporal, joelhos acompanhando a direção dos pés e amplitude confortável.",
  }),
  createLibraryExercise("Leg press 45°", "Quadríceps", "Leg press", {
    defaultRepsMin: 10,
    defaultRepsMax: 15,
    defaultRestSeconds: 90,
  }),
  createLibraryExercise("Cadeira extensora", "Quadríceps", "Máquina", {
    mediaUrl: "/gifs/cadeira-extensora.GIF",
    defaultRepsMin: 12,
    defaultRepsMax: 15,
  }),
  createLibraryExercise("Afundo", "Quadríceps", "Halteres ou peso corporal", {
    defaultRepsMin: 8,
    defaultRepsMax: 12,
    defaultRestSeconds: 75,
  }),
  createLibraryExercise("Agachamento Hack", "Quadríceps", "Máquina Hack", {
    defaultRepsMin: 8,
    defaultRepsMax: 12,
    defaultRestSeconds: 90,
  }),
  createLibraryExercise("Mesa flexora", "Posterior de coxa", "Máquina", {
    defaultRepsMin: 10,
    defaultRepsMax: 15,
  }),
  createLibraryExercise("Cadeira flexora", "Posterior de coxa", "Máquina", {
    defaultRepsMin: 10,
    defaultRepsMax: 15,
  }),
  createLibraryExercise("Stiff com barra", "Posterior de coxa", "Barra", {
    defaultRepsMin: 8,
    defaultRepsMax: 12,
    defaultRestSeconds: 90,
    beginnerTip: "Mantenha a coluna neutra e leve o quadril para trás; a amplitude termina antes de perder a postura.",
  }),
  createLibraryExercise("Levantamento terra romeno", "Posterior de coxa", "Halteres", {
    defaultRepsMin: 8,
    defaultRepsMax: 12,
    defaultRestSeconds: 90,
  }),
  createLibraryExercise("Elevação pélvica", "Glúteos", "Barra ou máquina", {
    defaultRepsMin: 8,
    defaultRepsMax: 15,
    defaultRestSeconds: 90,
  }),
  createLibraryExercise("Glúteo na polia", "Glúteos", "Polia", {
    defaultRepsMin: 12,
    defaultRepsMax: 15,
  }),
  createLibraryExercise("Cadeira abdutora", "Glúteos", "Máquina", {
    defaultRepsMin: 12,
    defaultRepsMax: 20,
  }),
  createLibraryExercise("Passada caminhando", "Glúteos", "Halteres", {
    defaultRepsMin: 8,
    defaultRepsMax: 12,
    defaultRestSeconds: 75,
  }),
  createLibraryExercise("Panturrilha em pé", "Panturrilhas", "Máquina ou step", {
    defaultRepsMin: 12,
    defaultRepsMax: 20,
  }),
  createLibraryExercise("Panturrilha sentada", "Panturrilhas", "Máquina", {
    defaultRepsMin: 12,
    defaultRepsMax: 20,
  }),
  createLibraryExercise("Prancha", "Abdômen", "Peso corporal", {
    defaultSets: 3,
    defaultRepsMin: 30,
    defaultRepsMax: 45,
    defaultRestSeconds: 45,
    beginnerTip: "Conte o tempo em segundos, contraia abdômen e glúteos e evite deixar o quadril cair.",
  }),
  createLibraryExercise("Abdominal na máquina", "Abdômen", "Máquina", {
    defaultRepsMin: 12,
    defaultRepsMax: 20,
  }),
  createLibraryExercise("Elevação de pernas", "Abdômen", "Banco ou solo", {
    defaultRepsMin: 10,
    defaultRepsMax: 15,
  }),
  createLibraryExercise("Dead bug", "Abdômen", "Peso corporal", {
    defaultRepsMin: 8,
    defaultRepsMax: 12,
    beginnerTip: "Mantenha a lombar apoiada e mova braço e perna opostos sem perder o controle do tronco.",
  }),
  createLibraryExercise("Mobilidade de quadril", "Mobilidade", "Peso corporal", {
    defaultSets: 2,
    defaultRepsMin: 8,
    defaultRepsMax: 10,
    defaultRestSeconds: 30,
  }),
  createLibraryExercise("Mobilidade torácica", "Mobilidade", "Peso corporal", {
    defaultSets: 2,
    defaultRepsMin: 8,
    defaultRepsMax: 10,
    defaultRestSeconds: 30,
  }),
  createLibraryExercise("Supino declinado", "Peitoral", "Barra e banco", {
    defaultRepsMin: 8,
    defaultRepsMax: 12,
    defaultRestSeconds: 90,
  }),
  createLibraryExercise("Peck deck", "Peitoral", "Máquina", {
    defaultRepsMin: 10,
    defaultRepsMax: 15,
  }),
  createLibraryExercise("Barra fixa", "Costas", "Barra fixa", {
    defaultRepsMin: 5,
    defaultRepsMax: 12,
    defaultRestSeconds: 90,
  }),
  createLibraryExercise("Pulldown unilateral", "Costas", "Polia alta", {
    defaultRepsMin: 10,
    defaultRepsMax: 12,
  }),
  createLibraryExercise("Face pull", "Ombros", "Polia e corda", {
    defaultRepsMin: 12,
    defaultRepsMax: 15,
  }),
  createLibraryExercise("Remada alta", "Trapézio", "Barra ou polia", {
    defaultRepsMin: 10,
    defaultRepsMax: 12,
  }),
  createLibraryExercise("Encolhimento com halteres", "Trapézio", "Halteres", {
    defaultRepsMin: 10,
    defaultRepsMax: 15,
  }),
  createLibraryExercise("Encolhimento com barra", "Trapézio", "Barra", {
    defaultRepsMin: 10,
    defaultRepsMax: 15,
  }),
  createLibraryExercise("Rosca inversa", "Antebraço", "Barra", {
    defaultRepsMin: 10,
    defaultRepsMax: 15,
  }),
  createLibraryExercise("Flexão de punho", "Antebraço", "Halteres ou barra", {
    defaultRepsMin: 12,
    defaultRepsMax: 20,
  }),
  createLibraryExercise("Extensão de punho", "Antebraço", "Halteres ou barra", {
    defaultRepsMin: 12,
    defaultRepsMax: 20,
  }),
  createLibraryExercise("Agachamento búlgaro", "Quadríceps", "Halteres e banco", {
    defaultRepsMin: 8,
    defaultRepsMax: 12,
    defaultRestSeconds: 75,
  }),
  createLibraryExercise("Passada no Smith", "Quadríceps", "Smith", {
    defaultRepsMin: 8,
    defaultRepsMax: 12,
    defaultRestSeconds: 75,
  }),
  createLibraryExercise("Good morning", "Posterior de coxa", "Barra", {
    defaultRepsMin: 8,
    defaultRepsMax: 12,
    defaultRestSeconds: 90,
  }),
  createLibraryExercise("Flexão nórdica", "Posterior de coxa", "Peso corporal", {
    defaultRepsMin: 5,
    defaultRepsMax: 10,
    defaultRestSeconds: 90,
  }),
  createLibraryExercise("Coice na polia", "Glúteos", "Polia", {
    defaultRepsMin: 12,
    defaultRepsMax: 15,
  }),
  createLibraryExercise("Abdução na polia", "Abdutores", "Polia", {
    defaultRepsMin: 12,
    defaultRepsMax: 20,
  }),
  createLibraryExercise("Cadeira abdutora", "Abdutores", "Máquina", {
    defaultRepsMin: 12,
    defaultRepsMax: 20,
  }),
  createLibraryExercise("Cadeira adutora", "Adutores", "Máquina", {
    defaultRepsMin: 12,
    defaultRepsMax: 20,
  }),
  createLibraryExercise("Agachamento sumô", "Adutores", "Halter ou barra", {
    defaultRepsMin: 10,
    defaultRepsMax: 15,
    defaultRestSeconds: 75,
  }),
  createLibraryExercise("Extensão lombar", "Lombar", "Banco romano", {
    defaultRepsMin: 10,
    defaultRepsMax: 15,
  }),
  createLibraryExercise("Superman", "Lombar", "Peso corporal", {
    defaultRepsMin: 10,
    defaultRepsMax: 15,
  }),
  createLibraryExercise("Abdominal oblíquo na polia", "Oblíquos", "Polia", {
    defaultRepsMin: 10,
    defaultRepsMax: 15,
  }),
  createLibraryExercise("Prancha lateral", "Oblíquos", "Peso corporal", {
    defaultRepsMin: 20,
    defaultRepsMax: 45,
    defaultRestSeconds: 45,
  }),
  createLibraryExercise("Burpee", "Condicionamento", "Peso corporal", {
    defaultSets: 3,
    defaultRepsMin: 6,
    defaultRepsMax: 12,
    defaultRestSeconds: 60,
  }),
  createLibraryExercise("Polichinelo", "Condicionamento", "Peso corporal", {
    defaultSets: 3,
    defaultRepsMin: 20,
    defaultRepsMax: 40,
    defaultRestSeconds: 45,
  }),
  createLibraryExercise("Alongamento de cadeia posterior", "Alongamento", "Peso corporal", {
    defaultSets: 2,
    defaultRepsMin: 20,
    defaultRepsMax: 40,
    defaultRestSeconds: 20,
  }),
  createLibraryExercise("Alongamento de peitoral", "Alongamento", "Peso corporal", {
    defaultSets: 2,
    defaultRepsMin: 20,
    defaultRepsMax: 40,
    defaultRestSeconds: 20,
  }),
];

function mapStudent(row: Record<string, unknown>): WorkoutStudent {
  return {
    id: String(row.id ?? ""),
    fullName: String(row.full_name ?? row.nome ?? "Aluno sem nome"),
    cpf: cleanDigits(row.cpf),
    rg: String(row.rg ?? ""),
    registrationCode: String(
      row.registration_code ?? row.codigo_matricula ?? row.matricula ?? "",
    ),
    email: String(row.email ?? ""),
    phone: cleanDigits(row.phone ?? row.telefone),
    emergencyPhone: cleanDigits(
      row.emergency_phone ?? row.telefone_emergencia,
    ),
    birthDate: String(row.birth_date ?? row.data_nascimento ?? ""),
    objective: String(row.objective ?? row.objetivo ?? ""),
    role: String(row.role ?? "student"),
    status: String(row.status ?? "pending"),
    linkedProfessorId: String(
      row.linked_professor_id ?? row.professor_id ?? "",
    ),
    linkedProfessorName: String(
      row.linked_professor_name ?? row.professor_name ?? "",
    ),
    linkedProfessorEmail: String(
      row.linked_professor_email ?? row.professor_email ?? "",
    ),
    hasActiveWorkout: Boolean(
      row.has_active_workout ??
        Number(row.active_workout_count ?? 0) > 0,
    ),
    activeWorkoutCount: Math.max(
      0,
      Number(row.active_workout_count ?? 0),
    ),
    workoutUpdatedAt: String(
      row.workout_updated_at ?? row.last_workout_update ?? "",
    ),
    reviewAt: String(row.review_at ?? ""),
    programCode: String(row.program_code ?? ""),
  };
}

function mapLibraryItem(row: Record<string, unknown>): ExerciseLibraryItem {
  const name = String(row.name ?? row.nome ?? "Exercício");
  const slug = String(row.slug ?? slugify(name));
  return {
    id: String(row.id ?? `library-${slug}`),
    slug,
    name,
    muscleGroup: String(row.muscle_group ?? row.grupo_muscular ?? "Outros"),
    equipment: String(row.equipment ?? row.equipamento ?? ""),
    category: String(row.category ?? row.categoria ?? row.muscle_group ?? "Outros"),
    mediaUrl:
      String(row.media_url ?? row.gif_url ?? row.video_url ?? "") ||
      `/gifs/${slug}.gif`,
    beginnerTip: String(
      row.beginner_tip ??
        row.dica_iniciante ??
        "Priorize a execução antes de aumentar a carga.",
    ),
    defaultSets: Math.max(1, Number(row.default_sets ?? row.series ?? 3)),
    defaultRepsMin: Math.max(1, Number(row.default_reps_min ?? row.reps_min ?? 10)),
    defaultRepsMax: Math.max(1, Number(row.default_reps_max ?? row.reps_max ?? 12)),
    defaultRestSeconds: Math.max(
      15,
      Number(row.default_rest_seconds ?? row.rest_seconds ?? 60),
    ),
  };
}

function mapTemplateExercise(
  row: Record<string, unknown>,
  index: number,
): BuilderExercise {
  const name = String(row.name ?? "Exercício");
  const slug = String(row.slug ?? slugify(name));
  return {
    id: String(row.exercise_library_id ?? row.id ?? `template-${slug}`),
    slug,
    name,
    muscleGroup: String(row.muscle_group ?? "Outros"),
    equipment: String(row.equipment ?? ""),
    category: String(row.category ?? row.muscle_group ?? "Outros"),
    mediaUrl: String(row.media_url ?? ""),
    beginnerTip: String(row.beginner_tip ?? "Priorize uma execução segura."),
    defaultSets: Number(row.sets ?? 3),
    defaultRepsMin: Number(row.reps_min ?? 10),
    defaultRepsMax: Number(row.reps_max ?? 12),
    defaultRestSeconds: Number(row.rest_seconds ?? 60),
    draftId: `template-${String(row.id ?? slug)}-${Date.now()}-${index}`,
    sets: Number(row.sets ?? 3),
    repsMin: Number(row.reps_min ?? 10),
    repsMax: Number(row.reps_max ?? 12),
    restSeconds: Number(row.rest_seconds ?? 60),
    initialLoadKg: Number(row.initial_load_kg ?? 0),
    notes: String(row.notes ?? ""),
    position: index + 1,
  };
}

export function createBuilderExercise(
  item: ExerciseLibraryItem,
  position: number,
): BuilderExercise {
  return {
    ...item,
    draftId: `${item.slug}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sets: item.defaultSets,
    repsMin: item.defaultRepsMin,
    repsMax: item.defaultRepsMax,
    restSeconds: item.defaultRestSeconds,
    initialLoadKg: 0,
    notes: "",
    position,
  };
}

export async function searchWorkoutStudents(query: string): Promise<WorkoutStudent[]> {
  if (!isSupabaseConfigured) return [];

  const clean = query.trim();

  const guidedRpc = await supabase.rpc(
    "search_accqua_students_guided",
    {
      p_query: clean,
      p_limit: 150,
    },
  );

  if (!guidedRpc.error && Array.isArray(guidedRpc.data)) {
    return guidedRpc.data.map((row) =>
      mapStudent(row as Record<string, unknown>),
    );
  }

  const rpc = await supabase.rpc("search_workout_students", {
    p_query: clean,
    p_limit: 100,
  });

  if (!rpc.error && Array.isArray(rpc.data)) {
    return rpc.data.map((row) => mapStudent(row as Record<string, unknown>));
  }

  const response = await supabase
    .from("profiles")
    .select("*")
    .limit(150);

  if (response.error) {
    throw new Error(
      "Não foi possível consultar os alunos. Aplique a nova migration do montador de treino no Supabase.",
    );
  }

  const normalizedQuery = normalizeText(clean);
  const digits = cleanDigits(clean);

  return (response.data ?? [])
    .map((row) => mapStudent(row as Record<string, unknown>))
    .filter((student) => {
      const role = normalizeText(
        (response.data ?? []).find((item) => String(item.id) === student.id)?.role,
      );
      const emailDomain = student.email.toLowerCase().split("@")[1] ?? "";
      if (
        ["professor", "reception", "recepcao", "admin"].includes(role) ||
        emailDomain.includes("professor") ||
        emailDomain.includes("personal") ||
        emailDomain.includes("recepcao") ||
        emailDomain.includes("reception") ||
        emailDomain.includes("admin")
      ) {
        return false;
      }
      if (!normalizedQuery) return true;
      const haystack = normalizeText(
        [
          student.fullName,
          student.cpf,
          student.rg,
          student.registrationCode,
          student.email,
          student.phone,
        ].join(" "),
      );
      return haystack.includes(normalizedQuery) || Boolean(digits && haystack.includes(digits));
    })
    .slice(0, 100);
}

export async function loadExerciseLibrary(): Promise<ExerciseLibraryItem[]> {
  if (!isSupabaseConfigured) return FALLBACK_EXERCISE_LIBRARY;

  const response = await supabase
    .from("exercise_library")
    .select("*")
    .eq("is_active", true)
    .order("muscle_group", { ascending: true })
    .order("name", { ascending: true });

  if (response.error || !response.data?.length) {
    return FALLBACK_EXERCISE_LIBRARY;
  }

  const databaseItems = response.data.map((row) =>
    mapLibraryItem(row as Record<string, unknown>),
  );
  const bySlug = new Map<string, ExerciseLibraryItem>();

  [...FALLBACK_EXERCISE_LIBRARY, ...databaseItems].forEach((item) => {
    bySlug.set(item.slug, item);
  });

  return [...bySlug.values()].sort((a, b) =>
    `${a.muscleGroup}-${a.name}`.localeCompare(`${b.muscleGroup}-${b.name}`, "pt-BR"),
  );
}

export async function loadWorkoutTemplates(staffId: string): Promise<WorkoutTemplate[]> {
  if (!isSupabaseConfigured) return [];

  const templatesResponse = await supabase
    .from("workout_templates")
    .select("*")
    .or(`created_by.eq.${staffId},is_shared.eq.true`)
    .order("updated_at", { ascending: false })
    .limit(30);

  if (templatesResponse.error || !templatesResponse.data?.length) return [];

  const templateIds = templatesResponse.data.map((row) => String(row.id));
  const exercisesResponse = await supabase
    .from("workout_template_exercises")
    .select("*")
    .in("template_id", templateIds)
    .order("position", { ascending: true });

  const exerciseRows = exercisesResponse.data ?? [];

  return templatesResponse.data.map((row) => {
    const record = row as Record<string, unknown>;
    const exercises = exerciseRows
      .filter((exercise) => String(exercise.template_id) === String(record.id))
      .map((exercise, index) =>
        mapTemplateExercise(exercise as Record<string, unknown>, index),
      );

    return {
      id: String(record.id),
      name: String(record.name ?? "Modelo sem nome"),
      focus: String(record.focus ?? ""),
      notes: String(record.notes ?? ""),
      weekDays: Array.isArray(record.week_days)
        ? (record.week_days as number[]).map(Number)
        : [],
      createdAt: String(record.created_at ?? ""),
      exercises,
    };
  });
}

function workoutPayload(input: SaveWorkoutInput) {
  return {
    student_id: input.studentId,
    professor_id: input.staffId,
    created_by: input.staffId,
    name: input.plan.name.trim(),
    focus: input.plan.focus.trim(),
    notes: input.plan.notes.trim(),
    review_at: input.plan.reviewAt || null,
    week_days: input.plan.weekDays,
    is_active: input.activate,
  };
}

function exercisePayload(exercise: BuilderExercise, planId?: string) {
  return {
    ...(planId ? { plan_id: planId } : {}),
    exercise_library_id:
      exercise.id.startsWith("catalog-") || exercise.id.startsWith("library-")
        ? null
        : exercise.id,
    name: exercise.name,
    muscle_group: exercise.muscleGroup,
    equipment: exercise.equipment,
    media_url: exercise.mediaUrl || null,
    media_type: exercise.mediaUrl ? "gif" : "gif",
    sets: Math.max(1, exercise.sets),
    reps_min: Math.max(1, exercise.repsMin),
    reps_max: Math.max(exercise.repsMin, exercise.repsMax),
    rest_seconds: Math.max(15, exercise.restSeconds),
    initial_load_kg: Math.max(0, exercise.initialLoadKg),
    notes: exercise.notes.trim(),
    position: exercise.position,
  };
}

export async function saveStudentWorkout(input: SaveWorkoutInput): Promise<string> {
  if (!isSupabaseConfigured) {
    throw new Error("O Supabase não está configurado.");
  }

  const rpc = await supabase.rpc("publish_student_workout", {
    p_student_id: input.studentId,
    p_plan: workoutPayload(input),
    p_exercises: input.exercises.map((exercise) => exercisePayload(exercise)),
    p_activate: input.activate,
  });

  if (!rpc.error && rpc.data) return String(rpc.data);

  const previousActive = input.activate
    ? await supabase
        .from("workout_plans")
        .select("id")
        .eq("student_id", input.studentId)
        .eq("is_active", true)
    : { data: [] as Array<{ id: string }> };

  if (input.activate) {
    await supabase
      .from("workout_plans")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("student_id", input.studentId)
      .eq("is_active", true);
  }

  const restorePreviousWorkout = async () => {
    const ids = (previousActive.data ?? []).map((row) => String(row.id));
    if (!ids.length) return;
    await supabase
      .from("workout_plans")
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .in("id", ids);
  };

  const latest = await supabase
    .from("workout_plans")
    .select("version")
    .eq("student_id", input.studentId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const version = Number(latest.data?.version ?? 0) + 1;
  const planResponse = await supabase
    .from("workout_plans")
    .insert({ ...workoutPayload(input), version })
    .select("id")
    .single();

  if (planResponse.error || !planResponse.data?.id) {
    await restorePreviousWorkout();
    throw new Error(
      planResponse.error?.message ||
        "Não foi possível salvar o treino. Confira a migration e as permissões do Supabase.",
    );
  }

  const planId = String(planResponse.data.id);
  const exerciseResponse = await supabase
    .from("workout_exercises")
    .insert(input.exercises.map((exercise) => exercisePayload(exercise, planId)));

  if (exerciseResponse.error) {
    await supabase.from("workout_plans").delete().eq("id", planId);
    await restorePreviousWorkout();
    throw new Error("O treino foi criado, mas os exercícios não puderam ser salvos.");
  }

  return planId;
}

export async function saveWorkoutTemplate(input: {
  staffId: string;
  plan: WorkoutPlanDraft;
  exercises: BuilderExercise[];
  shared?: boolean;
}): Promise<string> {
  if (!isSupabaseConfigured) {
    throw new Error("O Supabase não está configurado.");
  }

  const templateResponse = await supabase
    .from("workout_templates")
    .insert({
      created_by: input.staffId,
      name: input.plan.name.trim(),
      focus: input.plan.focus.trim(),
      notes: input.plan.notes.trim(),
      week_days: input.plan.weekDays,
      is_shared: Boolean(input.shared),
    })
    .select("id")
    .single();

  if (templateResponse.error || !templateResponse.data?.id) {
    throw new Error(
      templateResponse.error?.message || "Não foi possível salvar o modelo.",
    );
  }

  const templateId = String(templateResponse.data.id);
  const exerciseResponse = await supabase
    .from("workout_template_exercises")
    .insert(
      input.exercises.map((exercise) => ({
        template_id: templateId,
        ...exercisePayload(exercise),
        category: exercise.category,
        beginner_tip: exercise.beginnerTip,
      })),
    );

  if (exerciseResponse.error) {
    await supabase.from("workout_templates").delete().eq("id", templateId);
    throw new Error("O modelo foi criado, mas os exercícios não puderam ser salvos.");
  }

  return templateId;
}

export function formatStudentDocument(value: string) {
  const digits = cleanDigits(value);
  if (digits.length !== 11) return value || "Não informado";
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function calculateStudentAge(birthDate: string): number | null {
  if (!birthDate) return null;
  const date = new Date(`${birthDate.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDifference = today.getMonth() - date.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < date.getDate())
  ) {
    age -= 1;
  }

  return age >= 0 && age <= 120 ? age : null;
}

export async function getWorkoutStudentById(
  studentId: string,
): Promise<WorkoutStudent | null> {
  if (!isSupabaseConfigured) return null;

  const guidedRpc = await supabase.rpc(
    "get_accqua_student_guided",
    {
      p_student_id: studentId,
    },
  );

  if (!guidedRpc.error && guidedRpc.data) {
    const row = Array.isArray(guidedRpc.data)
      ? guidedRpc.data[0]
      : guidedRpc.data;

    if (row) {
      return mapStudent(row as Record<string, unknown>);
    }
  }

  const rpc = await supabase.rpc("get_accqua_student", {
    p_student_id: studentId,
  });

  if (!rpc.error && rpc.data) {
    const row = Array.isArray(rpc.data) ? rpc.data[0] : rpc.data;
    return row ? mapStudent(row as Record<string, unknown>) : null;
  }

  const response = await supabase
    .from("profiles")
    .select("*")
    .eq("id", studentId)
    .maybeSingle();

  if (response.error || !response.data) return null;
  return mapStudent(response.data as Record<string, unknown>);
}

export async function updateWorkoutStudentProfile(
  studentId: string,
  input: StudentProfileUpdate,
): Promise<WorkoutStudent> {
  if (!isSupabaseConfigured) {
    throw new Error("O Supabase não está configurado.");
  }

  const payload = {
    full_name: input.fullName.trim(),
    cpf: cleanDigits(input.cpf),
    rg: input.rg.trim(),
    registration_code: input.registrationCode.trim(),
    email: input.email.trim().toLowerCase(),
    phone: cleanDigits(input.phone),
    emergency_phone: cleanDigits(input.emergencyPhone),
    birth_date: input.birthDate || null,
    objective: input.objective.trim(),
  };

  const rpc = await supabase.rpc("update_accqua_student_profile", {
    p_student_id: studentId,
    p_profile: payload,
  });

  if (!rpc.error) {
    const refreshed = await getWorkoutStudentById(studentId);
    if (refreshed) return refreshed;
  }

  const response = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", studentId)
    .select("*")
    .single();

  if (response.error || !response.data) {
    throw new Error(
      "Não foi possível salvar o perfil. Execute a migration da Área ACCQUA no Supabase.",
    );
  }

  return mapStudent(response.data as Record<string, unknown>);
}


export async function loadAdminProfessors(): Promise<AdminProfessor[]> {
  if (!isSupabaseConfigured) return [];

  const rpc = await supabase.rpc("list_accqua_professors");

  if (rpc.error || !Array.isArray(rpc.data)) {
    return [];
  }

  return rpc.data.map((row) => {
    const record = row as Record<string, unknown>;
    return {
      id: String(record.id ?? ""),
      fullName: String(
        record.full_name ?? record.nome ?? "Professor",
      ),
      email: String(record.email ?? ""),
      activeStudents: Math.max(
        0,
        Number(record.active_students ?? 0),
      ),
    };
  });
}

export async function setStudentProfessorLink(
  studentId: string,
  professorId: string,
): Promise<WorkoutStudent> {
  if (!isSupabaseConfigured) {
    throw new Error("O Supabase não está configurado.");
  }

  const rpc = await supabase.rpc(
    "set_accqua_student_professor",
    {
      p_student_id: studentId,
      p_professor_id: professorId,
    },
  );

  if (rpc.error) {
    throw new Error(
      String(rpc.error.message ?? "") ||
        "Não foi possível vincular o professor ao aluno.",
    );
  }

  const refreshed = await getWorkoutStudentById(studentId);

  if (!refreshed || refreshed.linkedProfessorId !== professorId) {
    throw new Error(
      "O vínculo não foi confirmado. Execute a migration da Área Guiada.",
    );
  }

  return refreshed;
}

export async function removeStudentProfessorLink(
  studentId: string,
): Promise<WorkoutStudent> {
  if (!isSupabaseConfigured) {
    throw new Error("O Supabase não está configurado.");
  }

  const rpc = await supabase.rpc(
    "remove_accqua_student_professor",
    {
      p_student_id: studentId,
    },
  );

  if (rpc.error) {
    throw new Error(
      String(rpc.error.message ?? "") ||
        "Não foi possível remover o vínculo.",
    );
  }

  const refreshed = await getWorkoutStudentById(studentId);

  if (!refreshed) {
    throw new Error("Não foi possível confirmar o perfil do aluno.");
  }

  return refreshed;
}

export async function setWorkoutStudentAccess(
  studentId: string,
  status: StudentAccessStatus,
): Promise<StudentAccessUpdateResult> {
  if (!isSupabaseConfigured) {
    throw new Error("O Supabase não está configurado.");
  }

  const rpc = await supabase.rpc("set_accqua_student_access", {
    p_student_id: studentId,
    p_status: status,
  });

  if (rpc.error) {
    const technicalMessage = String(rpc.error.message ?? "");

    if (
      technicalMessage.includes("set_accqua_student_access") ||
      technicalMessage.includes("schema cache") ||
      technicalMessage.includes("function") ||
      technicalMessage.includes("accqua_app_access")
    ) {
      throw new Error(
        "Execute a migration 20260722_017_acesso_persistente.sql no Supabase.",
      );
    }

    throw new Error(
      technicalMessage ||
        "Não foi possível alterar o acesso do aluno.",
    );
  }

  const response =
    rpc.data && typeof rpc.data === "object"
      ? (rpc.data as Record<string, unknown>)
      : null;

  const returnedStatus = String(
    response?.status ?? rpc.data ?? status,
  )
    .trim()
    .toLowerCase();

  const normalizedStatus: StudentAccessStatus =
    returnedStatus === "active" ||
    returnedStatus === "pending" ||
    returnedStatus === "inactive" ||
    returnedStatus === "blocked"
      ? returnedStatus
      : status;

  return {
    status: normalizedStatus,
    accessMode: String(response?.access_mode ?? ""),
    alreadyAuthorized: Boolean(
      response?.already_authorized ??
        response?.previously_authorized ??
        false,
    ),
  };
}

function adminExercisePayload(exercise: BuilderExercise) {
  return {
    exercise_library_id:
      exercise.id.startsWith("catalog-") ||
      exercise.id.startsWith("library-")
        ? null
        : exercise.id,
    name: exercise.name,
    muscle_group: exercise.muscleGroup,
    equipment: exercise.equipment,
    media_url: exercise.mediaUrl || null,
    media_type: "gif",
    sets: Math.max(1, Number(exercise.sets) || 1),
    reps_min: Math.max(1, Number(exercise.repsMin) || 1),
    reps_max: Math.max(
      Math.max(1, Number(exercise.repsMin) || 1),
      Number(exercise.repsMax) || 1,
    ),
    rest_seconds: Math.max(15, Number(exercise.restSeconds) || 60),
    initial_load_kg: Math.max(0, Number(exercise.initialLoadKg) || 0),
    notes: exercise.notes.trim(),
    position: exercise.position,
  };
}

export async function publishAdminProgram(
  input: PublishAdminProgramInput,
): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error("O Supabase não está configurado.");
  }

  const routines = input.routines.map((routine, routineIndex) => ({
    code: routine.code,
    name: routine.name,
    focus: routine.focus,
    week_days: routine.weekDays,
    position: routineIndex + 1,
    exercises: routine.exercises.map(adminExercisePayload),
  }));

  const cardio =
    input.cardio?.enabled
      ? {
          activity_type: input.cardio.activityType,
          timing: input.cardio.timing,
          target_duration_minutes: Math.max(
            1,
            Number(input.cardio.durationMinutes) || 20,
          ),
          target_speed_kmh: Math.max(
            0,
            Number(input.cardio.speedKmh) || 0,
          ),
          target_calories: Math.max(
            0,
            Number(input.cardio.calories) || 0,
          ),
          notes: input.cardio.notes.trim(),
        }
      : null;

  const rpc = await supabase.rpc("publish_accqua_training_program", {
    p_student_id: input.studentId,
    p_program: {
      name: input.programName.trim() || `Treino ${input.splitCode}`,
      split_code: input.splitCode,
      notes: input.notes.trim(),
      review_at: input.reviewAt || null,
      created_by: input.staffId,
    },
    p_routines: routines,
    p_cardio: cardio,
  });

  if (rpc.error) {
    throw new Error(
      rpc.error.message ||
        "Não foi possível publicar o treino. Execute a migration da Área ACCQUA.",
    );
  }
}

export async function saveAdminProgramTemplate(
  staffId: string,
  template: Omit<AdminProgramTemplate, "id" | "createdAt">,
): Promise<string> {
  if (!isSupabaseConfigured) {
    const key = `accqua-admin-template:${Date.now()}`;
    localStorage.setItem(key, JSON.stringify(template));
    return key;
  }

  const response = await supabase
    .from("workout_program_templates")
    .insert({
      created_by: staffId,
      name: template.name.trim(),
      split_code: template.splitCode,
      payload: template.payload,
    })
    .select("id")
    .single();

  if (response.error || !response.data) {
    throw new Error("Não foi possível salvar o modelo de treino.");
  }

  return String(response.data.id);
}

export async function loadAdminProgramTemplates(
  staffId: string,
): Promise<AdminProgramTemplate[]> {
  if (!isSupabaseConfigured) {
    return Object.keys(localStorage)
      .filter((key) => key.startsWith("accqua-admin-template:"))
      .map((key) => {
        try {
          const value = JSON.parse(localStorage.getItem(key) || "{}");
          return {
            id: key,
            name: String(value.name ?? "Modelo"),
            splitCode: String(value.splitCode ?? "PERSONALIZADO"),
            payload: value.payload,
            createdAt: "",
          } as AdminProgramTemplate;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as AdminProgramTemplate[];
  }

  const response = await supabase
    .from("workout_program_templates")
    .select("*")
    .eq("created_by", staffId)
    .order("created_at", { ascending: false })
    .limit(40);

  if (response.error) return [];

  return (response.data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name ?? "Modelo"),
    splitCode: String(row.split_code ?? "PERSONALIZADO"),
    payload: row.payload as AdminProgramTemplate["payload"],
    createdAt: String(row.created_at ?? ""),
  }));
}
