import { supabase } from "./supabase";

export type AccessModeSummary = { mode: string; label: string; total: number };

function labelForMode(mode: string) {
  const normalized = mode.trim().toLowerCase();
  if (["matricula", "membership", "mensalidade"].includes(normalized)) return "Matrícula";
  if (["gympass", "wellhub"].includes(normalized)) return "Gympass / Wellhub";
  if (normalized === "totalpass") return "TotalPass";
  return normalized.replace(/[_-]+/g, " ").replace(/(^|\s)\p{L}/gu, (letter) => letter.toLocaleUpperCase("pt-BR"));
}

export async function loadAccessModeSummary(): Promise<AccessModeSummary[]> {
  const { data, error } = await supabase.rpc("get_accqua_access_mode_summary_v1_5_5");
  if (error) throw error;
  return ((data ?? []) as Array<{ access_mode?: unknown; total?: unknown }>).map((row) => {
    const mode = String(row.access_mode ?? "matricula").trim() || "matricula";
    return { mode, label: labelForMode(mode), total: Math.max(0, Number(row.total ?? 0)) };
  });
}
