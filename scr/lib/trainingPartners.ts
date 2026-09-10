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

// Build 1.6.5.9: a funcionalidade Parceiros de treino foi retirada do produto.
// As assinaturas permanecem temporariamente para compatibilidade com componentes
// antigos que ainda possam existir no bundle, mas nenhuma delas acessa o banco.
export async function loadMyTrainingPartners(): Promise<TrainingPartner[]> {
  return [];
}

export async function searchTrainingPartnerCandidates(_query = ""): Promise<TrainingPartnerCandidate[]> {
  return [];
}

export async function loadMyTrainingPartnerCount(): Promise<number> {
  return 0;
}

export async function getTrainingPartnerStatus(_partnerId: string): Promise<TrainingPartnerStatus> {
  return "none";
}

export async function isTrainingPartner(_partnerId: string): Promise<boolean> {
  return false;
}

export async function requestTrainingPartner(_partnerId: string): Promise<TrainingPartnerStatus> {
  return "none";
}

export async function addTrainingPartner(_partnerId: string): Promise<void> {
  return;
}

export async function acceptTrainingPartner(_requesterId: string): Promise<void> {
  return;
}

export async function declineTrainingPartner(_requesterId: string): Promise<void> {
  return;
}

export async function callTrainingPartner(_partnerId: string): Promise<void> {
  return;
}

export async function removeTrainingPartner(_partnerId: string): Promise<void> {
  return;
}
