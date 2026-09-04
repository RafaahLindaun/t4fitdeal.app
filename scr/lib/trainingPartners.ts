import { isSupabaseConfigured, supabase } from "./supabase";

export type TrainingPartner = {
  id: string;
  firstName: string;
  objective: string;
  avatarUrl: string;
  addedAt: string;
};

type Row = Record<string, unknown>;
const text = (value: unknown) => String(value ?? "").trim();

export async function loadMyTrainingPartners(): Promise<TrainingPartner[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.rpc("get_my_accqua_training_partners_v1_6_5");
  if (error) throw error;
  return (Array.isArray(data) ? data : [])
    .map((raw) => {
      const row = raw as Row;
      return {
        id: text(row.student_id),
        firstName: text(row.first_name) || "Aluno ACCQUA",
        objective: text(row.objective),
        avatarUrl: text(row.avatar_url),
        addedAt: text(row.added_at),
      } satisfies TrainingPartner;
    })
    .filter((item) => Boolean(item.id));
}

export async function loadMyTrainingPartnerCount(): Promise<number> {
  if (!isSupabaseConfigured) return 0;
  const { data, error } = await supabase.rpc("get_my_accqua_training_partner_count_v1_6_5");
  if (error) throw error;
  const value = Number(data ?? 0);
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

export async function isTrainingPartner(partnerId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !partnerId) return false;
  const { data, error } = await supabase.rpc("accqua_is_training_partner_v1_6_5", {
    p_partner_id: partnerId,
  });
  if (error) throw error;
  return Boolean(data);
}

export async function addTrainingPartner(partnerId: string): Promise<void> {
  if (!partnerId) throw new Error("Aluno inválido.");
  const { error } = await supabase.rpc("accqua_add_training_partner_v1_6_5", {
    p_partner_id: partnerId,
  });
  if (error) throw error;
}

export async function removeTrainingPartner(partnerId: string): Promise<void> {
  if (!partnerId) return;
  const { error } = await supabase.rpc("accqua_remove_training_partner_v1_6_5", {
    p_partner_id: partnerId,
  });
  if (error) throw error;
}
