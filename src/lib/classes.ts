import { isSupabaseConfigured, supabase } from "./supabase";

export type ClassWeekday = "dom" | "seg" | "ter" | "qua" | "qui" | "sex" | "sab";
export type ClassReservationStatus = "reservado" | "presente" | "faltou" | "cancelado";

export const CLASS_WEEKDAYS: Array<{ value: ClassWeekday; short: string; label: string }> = [
  { value: "dom", short: "Dom", label: "Domingo" },
  { value: "seg", short: "Seg", label: "Segunda" },
  { value: "ter", short: "Ter", label: "Terça" },
  { value: "qua", short: "Qua", label: "Quarta" },
  { value: "qui", short: "Qui", label: "Quinta" },
  { value: "sex", short: "Sex", label: "Sexta" },
  { value: "sab", short: "Sáb", label: "Sábado" },
];

export type ClassType = {
  id: string;
  name: string;
  description: string;
  requiresMembership: boolean;
  acceptsGympass: boolean;
  icon: string;
  accentColor: string;
  active: boolean;
};

export type ClassSchedule = {
  id: string;
  classTypeId: string;
  professorId: string;
  weekday: ClassWeekday;
  startTime: string;
  endTime: string;
  location: string;
  capacity: number;
  active: boolean;
};

export type ClassProfessor = {
  id: string;
  fullName: string;
  email: string;
};

export type ClassAgendaItem = {
  scheduleId: string;
  classTypeId: string;
  name: string;
  description: string;
  requiresMembership: boolean;
  acceptsGympass: boolean;
  icon: string;
  accentColor: string;
  date: string;
  weekday: ClassWeekday;
  startTime: string;
  endTime: string;
  location: string;
  professorId: string;
  professorName: string;
  capacity: number;
  reservedCount: number;
  remainingSpots: number;
  myReservationId: string;
  myStatus: ClassReservationStatus | "";
  canReserve: boolean;
  blockReason: string;
  membershipActive: boolean;
  gympassNumber: string;
};

export type MyClassReservation = {
  reservationId: string;
  scheduleId: string;
  classTypeId: string;
  name: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  professorName: string;
  status: ClassReservationStatus;
  reservedAt: string;
};

export type StaffClassReservation = {
  reservationId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  gympassNumber: string;
  membershipValidUntil: string;
  status: ClassReservationStatus;
  reservedAt: string;
};

export type AddClassScheduleInput = {
  classTypeId: string;
  weekdays: ClassWeekday[];
  startTime: string;
  endTime: string;
  location: string;
  professorId: string;
  capacity: number;
};

export type UpdateClassTypeInput = {
  name: string;
  description: string;
  requiresMembership: boolean;
  acceptsGympass: boolean;
  icon: string;
  accentColor: string;
  active: boolean;
};

export type StudentMembershipSnapshot = {
  id: string;
  gympassNumber: string;
  membershipValidUntil: string;
};

const text = (value: unknown) => String(value ?? "").trim();
const bool = (value: unknown) => value === true || String(value ?? "").toLowerCase() === "true";
const numberValue = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function localDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function classDateTime(date: string, time: string) {
  const normalizedTime = time.slice(0, 8) || "00:00:00";
  return new Date(`${date}T${normalizedTime}-03:00`);
}

export function classRequirementLabel(requiresMembership: boolean, acceptsGympass: boolean) {
  if (requiresMembership && acceptsGympass) return "Matrícula ativa ou Gympass";
  if (requiresMembership) return "Necessário matrícula ativa";
  if (acceptsGympass) return "Aceita Gympass";
  return "Reserva livre para alunos";
}

export function classBlockMessage(reason: string) {
  const normalized = reason.trim().toLowerCase();
  if (normalized === "full") return "Lotado";
  if (normalized === "already_reserved") return "Vaga já reservada";
  if (normalized === "membership_required") {
    return "Sua matrícula está inativa — regularize na recepção pra marcar essa aula";
  }
  if (normalized === "membership_or_gympass_required") {
    return "Sua matrícula está inativa e não há Gympass informado — atualize o Perfil ou fale com a recepção";
  }
  if (normalized === "gympass_required") {
    return "Informe seu número do Gympass no Perfil para reservar";
  }
  if (normalized === "class_type_inactive") return "Esta modalidade está indisponível";
  return "Esta aula não está disponível para reserva agora";
}

function mapAgendaRow(row: Record<string, unknown>): ClassAgendaItem {
  return {
    scheduleId: text(row.horario_aula_id),
    classTypeId: text(row.tipo_aula_id),
    name: text(row.nome) || "Aula ACCQUA",
    description: text(row.descricao),
    requiresMembership: bool(row.requer_matricula),
    acceptsGympass: bool(row.requer_gympass),
    icon: text(row.icone),
    accentColor: text(row.cor_destaque),
    date: text(row.data_aula).slice(0, 10),
    weekday: text(row.dia_semana) as ClassWeekday,
    startTime: text(row.hora_inicio),
    endTime: text(row.hora_fim),
    location: text(row.local),
    professorId: text(row.professor_id),
    professorName: text(row.professor_nome) || "Equipe ACCQUA",
    capacity: Math.max(0, numberValue(row.capacidade_maxima)),
    reservedCount: Math.max(0, numberValue(row.reservados)),
    remainingSpots: Math.max(0, numberValue(row.vagas_restantes)),
    myReservationId: text(row.minha_reserva_id),
    myStatus: text(row.meu_status) as ClassReservationStatus | "",
    canReserve: bool(row.pode_reservar),
    blockReason: text(row.motivo_bloqueio),
    membershipActive: bool(row.matricula_ativa),
    gympassNumber: text(row.numero_gympass),
  };
}

export async function loadClassAgenda(startDate = localDateKey(), days = 7): Promise<ClassAgendaItem[]> {
  if (!isSupabaseConfigured) return [];
  const response = await supabase.rpc("get_accqua_classes_agenda", {
    p_start_date: startDate,
    p_days: Math.max(1, Math.min(31, days)),
  });
  if (response.error) throw new Error(response.error.message);
  return Array.isArray(response.data)
    ? response.data.map((row) => mapAgendaRow(row as Record<string, unknown>))
    : [];
}

function friendlyReservationError(message: string) {
  const normalized = message.toUpperCase();
  if (normalized.includes("ACCQUA_CLASS_FULL")) return "Essa aula acabou de lotar.";
  if (normalized.includes("MEMBERSHIP_OR_GYMPASS_REQUIRED")) {
    return "Sua matrícula está inativa e não há Gympass informado no Perfil.";
  }
  if (normalized.includes("MEMBERSHIP_REQUIRED")) return "Sua matrícula está inativa. Regularize na recepção para reservar.";
  if (normalized.includes("GYMPASS_REQUIRED")) return "Informe seu número do Gympass no Perfil para reservar.";
  if (normalized.includes("CLASS_PAST_DATE")) return "Essa aula já passou.";
  if (normalized.includes("CLASS_INACTIVE")) return "Essa aula não está mais disponível.";
  return message || "Não foi possível reservar a vaga.";
}

export async function reserveClass(scheduleId: string, date: string) {
  const response = await supabase.rpc("reserve_accqua_class", {
    p_horario_aula_id: scheduleId,
    p_data_aula: date,
  });
  if (response.error) throw new Error(friendlyReservationError(response.error.message));
  const row = Array.isArray(response.data) ? response.data[0] : response.data;
  return row as Record<string, unknown> | null;
}

export async function cancelMyClass(reservationId: string) {
  const response = await supabase.rpc("cancel_my_accqua_class", { p_reserva_id: reservationId });
  if (response.error) throw new Error(response.error.message);
  return response.data === true;
}

export function subscribeToClassAgenda(onChange: () => void) {
  const channel = supabase
    .channel(`accqua-classes-${Math.random().toString(36).slice(2)}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "reservas_aula" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "horarios_aula" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "tipos_aula" }, onChange)
    .subscribe();
  return () => { void supabase.removeChannel(channel); };
}

export async function loadMyClasses(): Promise<MyClassReservation[]> {
  if (!isSupabaseConfigured) return [];
  const response = await supabase.rpc("get_my_accqua_classes");
  if (response.error) return [];
  return ((response.data ?? []) as Record<string, unknown>[]).map((row) => ({
    reservationId: text(row.reserva_id),
    scheduleId: text(row.horario_aula_id),
    classTypeId: text(row.tipo_aula_id),
    name: text(row.nome) || "Aula ACCQUA",
    description: text(row.descricao),
    date: text(row.data_aula).slice(0, 10),
    startTime: text(row.hora_inicio),
    endTime: text(row.hora_fim),
    location: text(row.local),
    professorName: text(row.professor_nome) || "Equipe ACCQUA",
    status: (text(row.status) || "reservado") as ClassReservationStatus,
    reservedAt: text(row.reservado_em),
  }));
}

function mapClassType(row: Record<string, unknown>): ClassType {
  return {
    id: text(row.id),
    name: text(row.nome),
    description: text(row.descricao),
    requiresMembership: bool(row.requer_matricula),
    acceptsGympass: bool(row.requer_gympass),
    icon: text(row.icone),
    accentColor: text(row.cor_destaque) || "#F2C230",
    active: row.ativo !== false,
  };
}

function mapSchedule(row: Record<string, unknown>): ClassSchedule {
  return {
    id: text(row.id),
    classTypeId: text(row.tipo_aula_id),
    professorId: text(row.professor_id),
    weekday: text(row.dia_semana) as ClassWeekday,
    startTime: text(row.hora_inicio),
    endTime: text(row.hora_fim),
    location: text(row.local),
    capacity: Math.max(1, numberValue(row.capacidade_maxima) || 20),
    active: row.ativo !== false,
  };
}

export async function loadClassManagement() {
  const [typesResponse, schedulesResponse, professors] = await Promise.all([
    supabase.from("tipos_aula").select("*").order("created_at", { ascending: true }),
    supabase.from("horarios_aula").select("*").order("hora_inicio", { ascending: true }),
    loadClassProfessors(),
  ]);
  if (typesResponse.error) throw new Error(typesResponse.error.message);
  if (schedulesResponse.error) throw new Error(schedulesResponse.error.message);
  return {
    types: ((typesResponse.data ?? []) as Record<string, unknown>[]).map(mapClassType),
    schedules: ((schedulesResponse.data ?? []) as Record<string, unknown>[]).map(mapSchedule),
    professors,
  };
}

export async function loadClassProfessors(): Promise<ClassProfessor[]> {
  const response = await supabase.rpc("list_accqua_class_professors");
  if (response.error) return [];
  return ((response.data ?? []) as Record<string, unknown>[]).map((row) => ({
    id: text(row.id),
    fullName: text(row.full_name) || "Professor ACCQUA",
    email: text(row.email),
  }));
}

export async function createClassType(input: Omit<UpdateClassTypeInput, "active">) {
  const response = await supabase
    .from("tipos_aula")
    .insert({
      nome: input.name.trim(),
      descricao: input.description.trim() || null,
      requer_matricula: input.requiresMembership,
      requer_gympass: input.acceptsGympass,
      icone: input.icon.trim() || "users",
      cor_destaque: input.accentColor.trim() || "#F2C230",
      ativo: true,
    })
    .select("*")
    .single();
  if (response.error) throw new Error(response.error.message);
  return mapClassType(response.data as Record<string, unknown>);
}

export async function updateClassType(id: string, input: UpdateClassTypeInput) {
  const response = await supabase
    .from("tipos_aula")
    .update({
      nome: input.name.trim(),
      descricao: input.description.trim() || null,
      requer_matricula: input.requiresMembership,
      requer_gympass: input.acceptsGympass,
      icone: input.icon.trim() || "users",
      cor_destaque: input.accentColor.trim() || "#F2C230",
      ativo: input.active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (response.error) throw new Error(response.error.message);
  return mapClassType(response.data as Record<string, unknown>);
}

export async function addClassSchedules(input: AddClassScheduleInput) {
  if (!input.weekdays.length) throw new Error("Selecione pelo menos um dia da semana.");
  const payload = input.weekdays.map((weekday) => ({
    tipo_aula_id: input.classTypeId,
    professor_id: input.professorId || null,
    dia_semana: weekday,
    hora_inicio: input.startTime,
    hora_fim: input.endTime,
    local: input.location.trim() || null,
    capacidade_maxima: Math.max(1, Math.round(input.capacity || 20)),
    ativo: true,
  }));
  const response = await supabase.from("horarios_aula").insert(payload).select("*");
  if (response.error) throw new Error(response.error.message);
  return ((response.data ?? []) as Record<string, unknown>[]).map(mapSchedule);
}

export async function updateClassSchedule(id: string, input: Omit<AddClassScheduleInput, "weekdays"> & { weekday: ClassWeekday; active: boolean }) {
  const response = await supabase
    .from("horarios_aula")
    .update({
      tipo_aula_id: input.classTypeId,
      professor_id: input.professorId || null,
      dia_semana: input.weekday,
      hora_inicio: input.startTime,
      hora_fim: input.endTime,
      local: input.location.trim() || null,
      capacidade_maxima: Math.max(1, Math.round(input.capacity || 20)),
      ativo: input.active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (response.error) throw new Error(response.error.message);
  return mapSchedule(response.data as Record<string, unknown>);
}

export async function setClassScheduleActive(id: string, active: boolean) {
  const response = await supabase
    .from("horarios_aula")
    .update({ ativo: active, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (response.error) throw new Error(response.error.message);
}

export async function loadStaffClassReservations(scheduleId: string, date: string): Promise<StaffClassReservation[]> {
  const response = await supabase.rpc("list_accqua_class_reservations", {
    p_horario_aula_id: scheduleId,
    p_data_aula: date,
  });
  if (response.error) throw new Error(response.error.message);
  return ((response.data ?? []) as Record<string, unknown>[]).map((row) => ({
    reservationId: text(row.reserva_id),
    studentId: text(row.aluno_id),
    studentName: text(row.aluno_nome) || "Aluno sem nome",
    studentEmail: text(row.aluno_email),
    gympassNumber: text(row.numero_gympass),
    membershipValidUntil: text(row.matricula_valida_ate).slice(0, 10),
    status: text(row.status) as ClassReservationStatus,
    reservedAt: text(row.reservado_em),
  }));
}

export async function updateClassReservationStatus(reservationId: string, status: "presente" | "faltou" | "reservado") {
  const response = await supabase
    .from("reservas_aula")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", reservationId);
  if (response.error) throw new Error(response.error.message);
}

export async function loadStudentsMembership(studentIds: string[]): Promise<Map<string, StudentMembershipSnapshot>> {
  if (!studentIds.length) return new Map();
  const response = await supabase.rpc("get_accqua_students_membership", { p_student_ids: studentIds });
  if (response.error) return new Map();
  return new Map(
    ((response.data ?? []) as Record<string, unknown>[]).map((row) => [
      text(row.id),
      {
        id: text(row.id),
        gympassNumber: text(row.numero_gympass),
        membershipValidUntil: text(row.matricula_valida_ate).slice(0, 10),
      },
    ]),
  );
}

export async function updateMyGympass(number: string) {
  const response = await supabase.rpc("update_my_accqua_gympass", { p_numero_gympass: number.trim() });
  if (response.error) throw new Error(response.error.message);
}

export async function updateStudentGympass(studentId: string, number: string) {
  const response = await supabase.rpc("update_accqua_student_gympass", {
    p_student_id: studentId,
    p_numero_gympass: number.trim(),
  });
  if (response.error) throw new Error(response.error.message);
}
