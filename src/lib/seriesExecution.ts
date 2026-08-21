import { isSupabaseConfigured, supabase } from "./supabase";

export type LastSeriesExecution = {
  reps: number;
  loadKg: number;
  completedAt: string;
};

export async function loadLastSeriesExecution(userId: string, exerciseId: string): Promise<LastSeriesExecution | null> {
  if (!isSupabaseConfigured || !userId || !exerciseId || exerciseId.startsWith("simple-")) return null;

  const { data, error } = await supabase
    .from("serie_execucoes")
    .select("reps_executadas,carga_executada_kg,concluida_em")
    .eq("aluno_id", userId)
    .eq("exercicio_id", exerciseId)
    .not("concluida_em", "is", null)
    .order("concluida_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data?.concluida_em) return null;

  return {
    reps: Number(data.reps_executadas ?? 0),
    loadKg: Number(data.carga_executada_kg ?? 0),
    completedAt: String(data.concluida_em),
  };
}

export async function upsertSeriesExecution(input: {
  userId: string;
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  reps: number;
  loadKg: number;
  completedAt?: string | null;
}) {
  if (!isSupabaseConfigured || input.sessionId.startsWith("local-session-") || input.exerciseId.startsWith("simple-")) return;

  const { error } = await supabase.from("serie_execucoes").upsert(
    {
      aluno_id: input.userId,
      sessao_id: input.sessionId,
      exercicio_id: input.exerciseId,
      serie_numero: input.setNumber,
      reps_executadas: input.reps,
      carga_executada_kg: input.loadKg,
      concluida_em: input.completedAt ?? null,
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: "sessao_id,exercicio_id,serie_numero" },
  );

  if (error) throw new Error(error.message);
}

export function resolveLoadStep(equipment: string) {
  const value = equipment.toLowerCase();
  if (value.includes("halter") || value.includes("barra") || value.includes("anilha") || value.includes("livre")) {
    return 1.25;
  }
  return 2.5;
}

export function vibrate(pattern: number | number[], enabled = true) {
  if (!enabled || typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  try { navigator.vibrate(pattern); } catch { /* progressive enhancement */ }
}

export function playRestFinishedTone(enabled: boolean) {
  if (!enabled || typeof window === "undefined") return;
  try {
    const Ctor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const context = new Ctor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.07, context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.14);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.15);
    oscillator.addEventListener("ended", () => void context.close(), { once: true });
  } catch { /* audio permission may block */ }
}
