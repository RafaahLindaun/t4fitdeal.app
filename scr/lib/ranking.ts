import { isSupabaseConfigured, supabase } from "./supabase";
import { loadResolvedAvatarsByUserIds } from "./profileAvatar";

export type RankingEntry = {
  studentId: string;
  firstName: string;
  avatarUrl: string;
  /** Build 1.5.6: pontos do ranking = dias treinados válidos no mês. */
  points: number;
  workoutDays: number;
  cardioOnlyDays: number;
  totalDurationSeconds: number;
  lastActivityDate: string;
  position: number;
  daysToLeader: number;
  /** Compatibilidade temporária com componentes antigos. Mesmo valor de daysToLeader. */
  workoutsToLeader: number;
};

export type RankingPrize = {
  id: string;
  period: string;
  name: string;
  description: string;
  imageUrl: string;
};

type Row = Record<string, unknown>;
const t = (value: unknown) => String(value ?? "").trim();
const n = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

function mapEntry(row: Row, index = 0): RankingEntry {
  const points = Math.max(
    0,
    n(
      row.dias_treinados ??
        row.monthly_workout_count ??
        row.workout_days ??
        row.workout_count ??
        row.ranking_points ??
        row.points,
    ),
  );
  const daysToLeader = Math.max(
    0,
    Math.round(n(row.dias_para_lider ?? row.treinos_para_lider)),
  );
  return {
    studentId: t(row.student_id ?? row.user_id),
    firstName: t(row.first_name ?? row.student_name ?? "Aluno").split(/\s+/)[0] || "Aluno",
    avatarUrl: t(row.avatar_url),
    points,
    workoutDays: Math.max(0, n(row.workout_days ?? row.dias_treinados ?? points)),
    cardioOnlyDays: Math.max(0, n(row.cardio_only_days)),
    totalDurationSeconds: Math.max(0, n(row.total_duration_seconds)),
    lastActivityDate: t(row.last_activity_date),
    position: Math.max(1, Math.round(n(row.posicao) || index + 1)),
    daysToLeader,
    workoutsToLeader: daysToLeader,
  };
}

function withDerivedPositions(entries: RankingEntry[]) {
  const sorted = [...entries].sort(
    (a, b) =>
      b.points - a.points ||
      a.lastActivityDate.localeCompare(b.lastActivityDate) ||
      a.firstName.localeCompare(b.firstName, "pt-BR"),
  );
  const leader = sorted[0]?.points ?? 0;
  let previousPoints: number | null = null;
  let previousRank = 0;
  return sorted.map((entry, index) => {
    const rank = previousPoints === entry.points ? previousRank : index + 1;
    previousPoints = entry.points;
    previousRank = rank;
    const daysToLeader = Math.max(0, entry.daysToLeader || leader - entry.points);
    return {
      ...entry,
      position: entry.position > 0 ? entry.position : rank,
      daysToLeader,
      workoutsToLeader: daysToLeader,
    };
  });
}

export async function loadAccquaRanking(): Promise<RankingEntry[]> {
  if (!isSupabaseConfigured) return [];

  // Build 1.5.6: fonte única compartilhada entre aluno e Staff.
  // A RPC conta no máximo um ponto por dia e só aceita o dia com lastro de
  // presença em aula OU matrícula válida naquela data.
  const v156 = await supabase.rpc("get_accqua_monthly_ranking_v1_5_6");
  let entries: RankingEntry[] = [];

  if (!v156.error && Array.isArray(v156.data)) {
    entries = v156.data.map((row, index) => mapEntry(row as Row, index));
  } else {
    // Fallback preservado apenas para ambientes ainda sem a migration 1.5.6.
    const v153 = await supabase.rpc("get_accqua_monthly_ranking_v1_5_3");
    if (!v153.error && Array.isArray(v153.data)) {
      entries = v153.data.map((row, index) => mapEntry(row as Row, index));
    } else {
      const monthlyRpcV97 = await supabase.rpc("get_accqua_monthly_workout_ranking_v9_7");
      const monthlyRpc = monthlyRpcV97.error
        ? await supabase.rpc("get_accqua_monthly_ranking_v9_6")
        : monthlyRpcV97;
      const newestRpc = monthlyRpc.error
        ? await supabase.rpc("get_accqua_ranking_v9_6")
        : monthlyRpc;
      const rpc = newestRpc.error
        ? await supabase.rpc("get_accqua_ranking_v9_4")
        : newestRpc;

      if (!rpc.error && Array.isArray(rpc.data)) {
        entries = rpc.data.map((row, index) => mapEntry(row as Row, index));
      } else {
        const previousRpc = await supabase.rpc("get_accqua_ranking_v8_9");
        if (!previousRpc.error && Array.isArray(previousRpc.data)) {
          entries = previousRpc.data.map((row, index) => mapEntry(row as Row, index));
        } else {
          const fallback = await supabase
            .from("accqua_ranking_v9_2")
            .select("*")
            .order("ranking_points", { ascending: false })
            .limit(100);
          if (fallback.error) return [];
          entries = (fallback.data ?? []).map((row, index) => mapEntry(row as Row, index));
        }
      }
    }
  }

  const avatarMap = await loadResolvedAvatarsByUserIds(entries.map((entry) => entry.studentId));
  return withDerivedPositions(
    entries.map((entry) => ({
      ...entry,
      avatarUrl: avatarMap.get(entry.studentId) || entry.avatarUrl,
    })),
  );
}

export function rankingPeriodKey(value = new Date()) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-01`;
}

export function nextRankingPeriodKey(value = new Date()) {
  return rankingPeriodKey(new Date(value.getFullYear(), value.getMonth() + 1, 1));
}

export function rankingPeriodLabel(period: string) {
  const date = new Date(`${period.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return period;
  const label = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date);
  return label.replace(/^./, (letter) => letter.toLocaleUpperCase("pt-BR"));
}

export async function loadRankingPrize(period = rankingPeriodKey()): Promise<RankingPrize | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from("ranking_premios")
    .select("id,periodo,nome_premio,descricao,imagem_url")
    .eq("periodo", period)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as Row;
  return {
    id: t(row.id),
    period: t(row.periodo),
    name: t(row.nome_premio),
    description: t(row.descricao),
    imageUrl: t(row.imagem_url),
  };
}

export async function saveRankingPrize(input: Omit<RankingPrize, "id">) {
  const { data: auth } = await supabase.auth.getUser();
  const payload = {
    periodo: input.period,
    nome_premio: input.name.trim(),
    descricao: input.description.trim() || null,
    imagem_url: input.imageUrl.trim() || null,
    criado_por: auth.user?.id ?? null,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("ranking_premios")
    .upsert(payload, { onConflict: "periodo" })
    .select("id")
    .single();
  if (error) throw error;
  return t(data?.id);
}

export type RankingProfileSummary = {
  studentId: string;
  memberSince: string;
  ageYears: number | null;
  totalWorkouts: number;
  currentSplit: string;
  objective: string;
};

export async function loadRankingProfileSummary(studentId: string): Promise<RankingProfileSummary | null> {
  if (!isSupabaseConfigured || !studentId) return null;
  const v163 = await supabase.rpc("get_accqua_ranking_profile_summary_v1_6_3", { p_student_id: studentId });
  const newestResponse = v163.error
    ? await supabase.rpc("get_accqua_ranking_profile_summary_v9_7", { p_student_id: studentId })
    : v163;
  const response = newestResponse.error
    ? await supabase.rpc("get_accqua_ranking_profile_summary_v9_6", { p_student_id: studentId })
    : newestResponse;
  if (response.error || !response.data) return null;
  const raw = (Array.isArray(response.data) ? response.data[0] : response.data) as Row | undefined;
  if (!raw) return null;
  const rawAge = Number(raw.age_years);
  return {
    studentId: t(raw.student_id) || studentId,
    memberSince: t(raw.member_since),
    ageYears: Number.isFinite(rawAge) && rawAge >= 0 ? rawAge : null,
    totalWorkouts: Math.max(0, Number(raw.total_workouts ?? 0)),
    currentSplit: t(raw.current_split) || "Não informado",
    objective: t(raw.objective),
  };
}

export async function loadRankingPrizeName(): Promise<string> {
  const current = await loadRankingPrize();
  if (current?.name) return current.name;
  const { data, error } = await supabase.from("ranking_config").select("nome_premio").limit(1).maybeSingle();
  if (error) return "";
  return t((data as { nome_premio?: unknown } | null)?.nome_premio);
}
