import { isSupabaseConfigured, supabase } from "./supabase";
import { loadResolvedAvatarsByUserIds } from "./profileAvatar";

export type RankingEntry = {
  studentId: string;
  firstName: string;
  avatarUrl: string;
  points: number;
  workoutDays: number;
  cardioOnlyDays: number;
  totalDurationSeconds: number;
  lastActivityDate: string;
  position: number;
  workoutsToLeader: number;
};

export type RankingPrize = {
  id: string;
  period: string;
  name: string;
  description: string;
  imageUrl: string;
  createdBy: string;
  createdAt: string;
};

function mapEntry(row: Record<string, unknown>): RankingEntry {
  return {
    studentId: String(row.student_id ?? row.user_id ?? ""),
    firstName: String(row.first_name ?? row.student_name ?? "Aluno").split(/\s+/)[0] || "Aluno",
    avatarUrl: String(row.avatar_url ?? ""),
    points: Math.max(0, Number(row.monthly_workout_count ?? row.workout_count ?? row.ranking_points ?? row.points ?? 0)),
    workoutDays: Math.max(0, Number(row.workout_days ?? 0)),
    cardioOnlyDays: Math.max(0, Number(row.cardio_only_days ?? 0)),
    totalDurationSeconds: Math.max(0, Number(row.total_duration_seconds ?? 0)),
    lastActivityDate: String(row.last_activity_date ?? ""),
    position: Math.max(1, Number(row.posicao ?? row.position ?? 1)),
    workoutsToLeader: Math.max(0, Number(row.treinos_para_lider ?? row.workouts_to_leader ?? 0)),
  };
}

export function rankingPeriodKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

export function nextRankingPeriodKey(date = new Date()) {
  return rankingPeriodKey(new Date(date.getFullYear(), date.getMonth() + 1, 1));
}

export function daysUntilRankingReset(date = new Date()) {
  const next = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.max(0, Math.ceil((next.getTime() - today.getTime()) / 86_400_000));
}

export async function loadAccquaRanking(): Promise<RankingEntry[]> {
  if (!isSupabaseConfigured) return [];
  const v153 = await supabase.rpc("get_accqua_monthly_ranking_v1_5_3");
  const monthlyRpcV97 = v153.error ? await supabase.rpc("get_accqua_monthly_workout_ranking_v9_7") : v153;
  const monthlyRpc = monthlyRpcV97.error ? await supabase.rpc("get_accqua_monthly_ranking_v9_6") : monthlyRpcV97;
  const newestRpc = monthlyRpc.error ? await supabase.rpc("get_accqua_ranking_v9_6") : monthlyRpc;
  const rpc = newestRpc.error ? await supabase.rpc("get_accqua_ranking_v9_4") : newestRpc;

  let entries: RankingEntry[] = [];
  if (!rpc.error && Array.isArray(rpc.data)) {
    entries = rpc.data.map((row) => mapEntry(row as Record<string, unknown>));
  } else {
    const previousRpc = await supabase.rpc("get_accqua_ranking_v8_9");
    if (!previousRpc.error && Array.isArray(previousRpc.data)) {
      entries = previousRpc.data.map((row) => mapEntry(row as Record<string, unknown>));
    } else {
      const fallback = await supabase.from("accqua_ranking_v9_2").select("*").order("ranking_points", { ascending: false }).limit(100);
      if (fallback.error) {
        const legacy = await supabase.from("accqua_ranking_v8_5").select("*").order("ranking_points", { ascending: false }).limit(100);
        if (legacy.error) return [];
        entries = (legacy.data ?? []).map((row) => mapEntry(row as Record<string, unknown>));
      } else {
        entries = (fallback.data ?? []).map((row) => mapEntry(row as Record<string, unknown>));
      }
    }
  }

  const avatarMap = await loadResolvedAvatarsByUserIds(entries.map((entry) => entry.studentId));
  const sorted = entries
    .map((entry) => ({ ...entry, avatarUrl: avatarMap.get(entry.studentId) || entry.avatarUrl }))
    .sort((a, b) => a.position - b.position || b.points - a.points || a.firstName.localeCompare(b.firstName, "pt-BR"));
  const leader = sorted[0]?.points ?? 0;
  return sorted.map((entry, index) => ({
    ...entry,
    position: Number.isFinite(entry.position) ? entry.position : index + 1,
    workoutsToLeader: Math.max(0, entry.workoutsToLeader || leader - entry.points),
  }));
}

function mapPrize(row: Record<string, unknown> | null): RankingPrize | null {
  if (!row) return null;
  return {
    id: String(row.id ?? ""),
    period: String(row.periodo ?? ""),
    name: String(row.nome_premio ?? "").trim(),
    description: String(row.descricao ?? "").trim(),
    imageUrl: String(row.imagem_url ?? "").trim(),
    createdBy: String(row.criado_por ?? ""),
    createdAt: String(row.created_at ?? ""),
  };
}

export async function loadRankingPrize(period = rankingPeriodKey()): Promise<RankingPrize | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.from("ranking_premios").select("*").eq("periodo", period).maybeSingle();
  if (error) return null;
  return mapPrize((data ?? null) as Record<string, unknown> | null);
}

export async function saveRankingPrize(input: { period: string; name: string; description: string; imageUrl: string }) {
  const user = await supabase.auth.getUser();
  const payload = {
    periodo: input.period,
    nome_premio: input.name.trim(),
    descricao: input.description.trim() || null,
    imagem_url: input.imageUrl.trim() || null,
    criado_por: user.data.user?.id ?? null,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from("ranking_premios").upsert(payload, { onConflict: "periodo" }).select("*").single();
  if (error) throw error;
  return mapPrize(data as Record<string, unknown>);
}

export type RankingProfileSummary = {
  studentId: string;
  memberSince: string;
  ageYears: number | null;
  totalWorkouts: number;
  currentSplit: string;
};

export async function loadRankingProfileSummary(studentId: string): Promise<RankingProfileSummary | null> {
  if (!isSupabaseConfigured || !studentId) return null;
  const newestResponse = await supabase.rpc("get_accqua_ranking_profile_summary_v9_7", { p_student_id: studentId });
  const response = newestResponse.error ? await supabase.rpc("get_accqua_ranking_profile_summary_v9_6", { p_student_id: studentId }) : newestResponse;
  if (response.error || !response.data) return null;
  const raw = (Array.isArray(response.data) ? response.data[0] : response.data) as Record<string, unknown> | undefined;
  if (!raw) return null;
  const rawAge = Number(raw.age_years);
  return {
    studentId: String(raw.student_id ?? studentId),
    memberSince: String(raw.member_since ?? ""),
    ageYears: Number.isFinite(rawAge) && rawAge >= 0 ? rawAge : null,
    totalWorkouts: Math.max(0, Number(raw.total_workouts ?? 0)),
    currentSplit: String(raw.current_split ?? "Não informado"),
  };
}

export async function loadRankingPrizeName(): Promise<string> {
  const monthly = await loadRankingPrize();
  if (monthly?.name) return monthly.name;
  const { data, error } = await supabase.from("ranking_config").select("nome_premio").limit(1).maybeSingle();
  if (error) return "";
  return String((data as { nome_premio?: unknown } | null)?.nome_premio ?? "").trim();
}
