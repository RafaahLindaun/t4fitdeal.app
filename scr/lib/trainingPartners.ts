import { isSupabaseConfigured, supabase } from "./supabase";

export type TrainingPartner = {
  id: string;
  fullName: string;
  objective: string;
  avatarUrl: string;
  inviteStatus: "" | "pending" | "accepted" | "declined";
};

type Row = Record<string, unknown>;
const text = (value: unknown) => String(value ?? "").trim();

export async function loadTrainingPartners(): Promise<TrainingPartner[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.rpc("list_accqua_training_partners_v1_6_3");
  if (error) throw error;
  return (Array.isArray(data) ? data : []).map((raw) => {
    const row = raw as Row;
    const status = text(row.invite_status);
    return {
      id: text(row.student_id),
      fullName: text(row.full_name) || "Aluno ACCQUA",
      objective: text(row.objective),
      avatarUrl: text(row.avatar_url),
      inviteStatus: ["pending", "accepted", "declined"].includes(status)
        ? status as TrainingPartner["inviteStatus"]
        : "",
    };
  }).filter((item) => Boolean(item.id));
}

export async function inviteTrainingPartner(partnerId: string) {
  if (!partnerId) throw new Error("Aluno inválido.");
  const { data, error } = await supabase.functions.invoke("send-training-partner-invite-v163", {
    body: { partnerId },
  });
  if (error) throw error;
  if (!data?.ok) throw new Error(String(data?.message ?? "Não foi possível enviar o convite."));
  return true;
}
