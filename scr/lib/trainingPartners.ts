import { isSupabaseConfigured, supabase } from "./supabase";

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
const status = (value: unknown): TrainingPartnerStatus => {
  const normalized = text(value);
  if (normalized === "accepted" || normalized === "incoming_pending" || normalized === "outgoing_pending") return normalized;
  return "none";
};

export async function loadMyTrainingPartners(): Promise<TrainingPartner[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.rpc("get_my_accqua_training_partners_v1_6_5_7");
  if (error) throw error;
  return (Array.isArray(data) ? data : [])
    .map((raw) => {
      const row = raw as Row;
      const relationship = status(row.relationship_status);
      return {
        id: text(row.student_id),
        firstName: text(row.first_name) || "Aluno ACCQUA",
        objective: text(row.objective),
        avatarUrl: text(row.avatar_url),
        status: relationship === "none" ? "outgoing_pending" : relationship,
        direction: text(row.direction) === "incoming" ? "incoming" : "outgoing",
        addedAt: text(row.added_at),
      } satisfies TrainingPartner;
    })
    .filter((item) => Boolean(item.id));
}

export async function searchTrainingPartnerCandidates(query = ""): Promise<TrainingPartnerCandidate[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.rpc("search_accqua_training_partner_candidates_v1_6_5_7", {
    p_query: query.trim(),
  });
  if (error) throw error;
  return (Array.isArray(data) ? data : [])
    .map((raw) => {
      const row = raw as Row;
      return {
        id: text(row.student_id),
        firstName: text(row.first_name) || "Aluno ACCQUA",
        objective: text(row.objective),
        avatarUrl: text(row.avatar_url),
        status: status(row.relationship_status),
      } satisfies TrainingPartnerCandidate;
    })
    .filter((item) => Boolean(item.id));
}

export async function loadMyTrainingPartnerCount(): Promise<number> {
  if (!isSupabaseConfigured) return 0;
  const { data, error } = await supabase.rpc("get_my_accqua_training_partner_count_v1_6_5_7");
  if (error) throw error;
  const value = Number(data ?? 0);
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

export async function getTrainingPartnerStatus(partnerId: string): Promise<TrainingPartnerStatus> {
  if (!isSupabaseConfigured || !partnerId) return "none";
  const { data, error } = await supabase.rpc("accqua_training_partner_status_v1_6_5_7", {
    p_partner_id: partnerId,
  });
  if (error) throw error;
  return status(data);
}

export async function isTrainingPartner(partnerId: string): Promise<boolean> {
  const relationship = await getTrainingPartnerStatus(partnerId);
  return relationship === "accepted" || relationship === "outgoing_pending";
}

export async function requestTrainingPartner(partnerId: string): Promise<TrainingPartnerStatus> {
  if (!partnerId) throw new Error("Aluno inválido.");
  const { data, error } = await supabase.rpc("accqua_request_training_partner_v1_6_5_7", {
    p_partner_id: partnerId,
  });
  if (error) throw error;
  return status(data);
}

// Compatibilidade com chamadas antigas do Ranking: agora adicionar significa enviar convite.
export async function addTrainingPartner(partnerId: string): Promise<void> {
  await requestTrainingPartner(partnerId);
}

export async function acceptTrainingPartner(requesterId: string): Promise<void> {
  const { error } = await supabase.rpc("accqua_accept_training_partner_v1_6_5_7", {
    p_requester_id: requesterId,
  });
  if (error) throw error;
}

export async function declineTrainingPartner(requesterId: string): Promise<void> {
  const { error } = await supabase.rpc("accqua_decline_training_partner_v1_6_5_7", {
    p_requester_id: requesterId,
  });
  if (error) throw error;
}

export async function callTrainingPartner(partnerId: string): Promise<void> {
  const { error } = await supabase.rpc("accqua_call_training_partner_v1_6_5_7", {
    p_partner_id: partnerId,
  });
  if (error) throw error;
}

export async function removeTrainingPartner(partnerId: string): Promise<void> {
  if (!partnerId) return;
  const { error } = await supabase.rpc("accqua_remove_training_partner_v1_6_5_7", {
    p_partner_id: partnerId,
  });
  if (error) throw error;
}
