import { supabase } from "./supabase";
import type { AdminCardioPrescription, AdminRoutine } from "./admin";

export type WorkoutDraftOrigin = "manual" | "assistente_guiado" | "ia_descricao";

export type WorkoutBuilderDraft = {
  programName: string;
  splitCode: string;
  programNotes: string;
  reviewAt: string;
  routines: AdminRoutine[];
  cardio: AdminCardioPrescription;
  origin: WorkoutDraftOrigin;
  updatedAt: string;
  aiInterpretation?: {
    objective?: string;
    level?: string;
    restrictions?: string[];
    preferences?: string[];
    days?: number;
  };
};

export async function generateWorkoutDraftWithAI(studentId: string, description: string): Promise<WorkoutBuilderDraft> {
  const clean = description.trim();
  if (!studentId || !clean) throw new Error("Descreva o aluno antes de gerar a sugestão.");
  const { data, error } = await supabase.functions.invoke("generate-workout-ai-v155", {
    body: { studentId, description: clean },
  });
  if (error) throw error;
  if (!data?.catalogValidated || !Array.isArray(data?.routines) || !data.routines.length) {
    throw new Error("A IA não conseguiu montar um rascunho seguro com a Biblioteca atual.");
  }
  return {
    programName: String(data.programName || "Treino sugerido pela IA"),
    splitCode: String(data.splitCode || "PERSONALIZADO"),
    programNotes: String(data.programNotes || "Revise a sugestão antes de publicar."),
    reviewAt: String(data.reviewAt || ""),
    routines: data.routines as AdminRoutine[],
    cardio: data.cardio as AdminCardioPrescription,
    origin: "ia_descricao",
    updatedAt: new Date().toISOString(),
    aiInterpretation: data.interpretation ?? undefined,
  };
}

export function workoutDraftStorageKey(staffId: string, studentId: string) {
  return `accqua-program-draft:${staffId}:${studentId}`;
}

export function storeWorkoutBuilderDraft(staffId: string, studentId: string, draft: WorkoutBuilderDraft) {
  localStorage.setItem(workoutDraftStorageKey(staffId, studentId), JSON.stringify(draft));
}

export function clearWorkoutBuilderDraft(staffId: string, studentId: string) {
  localStorage.removeItem(workoutDraftStorageKey(staffId, studentId));
}
