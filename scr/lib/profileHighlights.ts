import { supabase } from "./supabase";

export type ProfileHighlights = {
  daysInApp: number;
  memberSince: string;
  objective: string;
  currentSplit: string;
};

export async function loadMyProfileHighlights(): Promise<ProfileHighlights> {
  const { data, error } = await supabase.rpc("get_my_accqua_profile_highlights_v1_6_5_7");
  if (error) throw error;
  const row = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
  const parsedDays = Number(row.daysInApp ?? 0);
  return {
    daysInApp: Number.isFinite(parsedDays) ? Math.max(0, Math.round(parsedDays)) : 0,
    memberSince: String(row.memberSince ?? ""),
    objective: String(row.objective ?? "Não informado").trim() || "Não informado",
    currentSplit: String(row.currentSplit ?? "—").trim() || "—",
  };
}
