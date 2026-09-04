import { isSupabaseConfigured, supabase } from "./supabase";

export type TrainingPartnerStatus = "" | "outgoing_pending" | "incoming_pending" | "accepted" | "declined";

export type TrainingPartner = {
  id: string;
  fullName: string;
  objective: string;
  avatarUrl: string;
  relationId: string;
  relationStatus: TrainingPartnerStatus;
  relationDirection: "" | "incoming" | "outgoing";
};

type Row = Record<string, unknown>;
const text = (value: unknown) => String(value ?? "").trim();

export async function loadTrainingPartners(): Promise<TrainingPartner[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.rpc("list_accqua_training_partners_v1_6_4");
  if (error) throw error;
  return (Array.isArray(data) ? data : []).map((raw) => {
    const row = raw as Row;
    const status = text(row.relation_status) as TrainingPartnerStatus;
    const direction = text(row.relation_direction);
    return {
      id: text(row.student_id),
      fullName: text(row.full_name) || "Aluno ACCQUA",
      objective: text(row.objective),
      avatarUrl: text(row.avatar_url),
      relationId: text(row.relation_id),
      relationStatus: ["outgoing_pending", "incoming_pending", "accepted", "declined"].includes(status) ? status : "",
      relationDirection: direction === "incoming" || direction === "outgoing" ? direction : "",
    };
  }).filter((item) => Boolean(item.id));
}

export async function requestTrainingPartner(partnerId: string) {
  if (!partnerId) throw new Error("Aluno inválido.");
  const { data, error } = await supabase.rpc("request_accqua_training_partner_v1_6_4", { p_partner_id: partnerId });
  if (error) throw error;
  return String(data ?? "");
}

export async function respondTrainingPartner(relationId: string, accept: boolean) {
  if (!relationId) throw new Error("Pedido inválido.");
  const { data, error } = await supabase.rpc("respond_accqua_training_partner_v1_6_4", {
    p_relation_id: relationId,
    p_accept: accept,
  });
  if (error) throw error;
  return Boolean(data);
}

export async function callTrainingPartner(partnerId: string) {
  if (!partnerId) throw new Error("Parceiro inválido.");
  const { data, error } = await supabase.rpc("call_accqua_training_partner_v1_6_4", { p_partner_id: partnerId });
  if (error) throw error;
  return String(data ?? "");
}
