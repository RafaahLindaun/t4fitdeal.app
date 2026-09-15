import { supabase } from "./supabase";

export type TrainingPartnerStatus =
  | "none"
  | "outgoing_pending"
  | "incoming_pending"
  | "accepted";

export type TrainingPartner = {
  id: string;
  firstName: string;
  objective: string;
  avatarUrl: string;
  status: Exclude<TrainingPartnerStatus, "none">;
  direction: "incoming" | "outgoing";
  addedAt: string;
};

export type TrainingPartnerCandidate = {
  id: string;
  firstName: string;
  objective: string;
  avatarUrl: string;
  status: TrainingPartnerStatus;
};

type Row = Record<string, unknown>;
const text = (value: unknown) => String(value ?? "").trim();

function statusOf(value: unknown): TrainingPartnerStatus {
  const status = text(value).toLowerCase();
  if (status === "accepted" || status === "parceiro") return "accepted";
  if (status === "incoming_pending") return "incoming_pending";
  if (status === "outgoing_pending" || status === "pending") return "outgoing_pending";
  return "none";
}

function throwIfError(error: { message?: string } | null) {
  if (error) throw new Error(error.message || "Não foi possível atualizar seus parceiros agora.");
}

export async function loadMyTrainingPartners(): Promise<TrainingPartner[]> {
  const { data, error } = await supabase.rpc("get_my_accqua_training_partners_v1_6_5_7");
  throwIfError(error);
  return (Array.isArray(data) ? data : []).map((item) => {
    const row = item as Row;
    const status = statusOf(row.relationship_status);
    return {
      id: text(row.student_id),
      firstName: text(row.first_name) || "Aluno",
      objective: text(row.objective),
      avatarUrl: text(row.avatar_url),
      status: status === "none" ? "outgoing_pending" : status,
      direction: text(row.direction) === "incoming" ? "incoming" : "outgoing",
      addedAt: text(row.added_at),
    };
  });
}

export async function searchTrainingPartnerCandidates(query = ""): Promise<TrainingPartnerCandidate[]> {
  const { data, error } = await supabase.rpc("search_accqua_training_partner_candidates_v1_6_5_7", { p_query: query.trim() });
  throwIfError(error);
  return (Array.isArray(data) ? data : []).map((item) => {
    const row = item as Row;
    return {
      id: text(row.student_id),
      firstName: text(row.first_name) || "Aluno",
      objective: text(row.objective),
      avatarUrl: text(row.avatar_url),
      status: statusOf(row.relationship_status),
    };
  });
}

export async function loadMyTrainingPartnerCount(): Promise<number> {
  const { data, error } = await supabase.rpc("get_my_accqua_training_partner_count_v1_6_5_7");
  throwIfError(error);
  const value = Number(Array.isArray(data) ? data[0] : data);
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export async function getTrainingPartnerStatus(partnerId: string): Promise<TrainingPartnerStatus> {
  const { data, error } = await supabase.rpc("accqua_training_partner_status_v1_6_5_7", { p_partner_id: partnerId });
  throwIfError(error);
  return statusOf(data);
}

export async function isTrainingPartner(partnerId: string): Promise<boolean> {
  return (await getTrainingPartnerStatus(partnerId)) === "accepted";
}

export async function requestTrainingPartner(partnerId: string): Promise<TrainingPartnerStatus> {
  const { data, error } = await supabase.rpc("accqua_request_training_partner_v1_6_5_7", { p_partner_id: partnerId });
  throwIfError(error);
  return statusOf(data);
}

export async function addTrainingPartner(partnerId: string): Promise<void> {
  await requestTrainingPartner(partnerId);
}

export async function acceptTrainingPartner(requesterId: string): Promise<void> {
  const { error } = await supabase.rpc("accqua_accept_training_partner_v1_6_5_7", { p_requester_id: requesterId });
  throwIfError(error);
}

export async function declineTrainingPartner(requesterId: string): Promise<void> {
  const { error } = await supabase.rpc("accqua_decline_training_partner_v1_6_5_7", { p_requester_id: requesterId });
  throwIfError(error);
}

export async function callTrainingPartner(partnerId: string): Promise<void> {
  const { data, error } = await supabase.rpc("accqua_call_training_partner_v1_6_5_7", { p_partner_id: partnerId });
  throwIfError(error);
  if (data === false) throw new Error("Só parceiros aceitos podem ser chamados para treinar.");
}

export async function removeTrainingPartner(partnerId: string): Promise<void> {
  const { error } = await supabase.rpc("accqua_remove_training_partner_v1_6_5_7", { p_partner_id: partnerId });
  throwIfError(error);
}
