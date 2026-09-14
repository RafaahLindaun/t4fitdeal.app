import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "../auth/AuthProvider";
import { loadAccquaRanking } from "../lib/ranking";
import { currentRankingPeriod } from "../lib/rankingPeriod";
import { getTrainingPartnerStatus, requestTrainingPartner } from "../lib/trainingPartners";
import { supabase } from "../lib/supabase";

type WorkoutExercise = {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  position: number;
};

type RankingWorkout = {
  id: string;
  name: string;
  split: string;
  exerciseCount: number;
  exercises: WorkoutExercise[];
};

function ArrowLeft() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>;
}

function Check() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>;
}

function positionFromButton(button: HTMLElement) {
  const rowPosition = button.querySelector<HTMLElement>(".ranking-row-position")?.textContent?.trim();
  if (rowPosition) return Number(rowPosition) || 0;
  const match = button.className.match(/is-position-(\d+)/);
  return match ? Number(match[1]) : 0;
}

async function loadRankingWorkout(studentId: string): Promise<RankingWorkout | null> {
  const { data, error } = await supabase.rpc("get_ranking_active_workout_v1_7_1", { p_student_id: studentId });
  if (error) throw error;
  if (!data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? "Treino atual"),
    split: String(row.split ?? "—"),
    exerciseCount: Math.max(0, Number(row.exerciseCount ?? 0)),
    exercises: Array.isArray(row.exercises) ? row.exercises.map((item) => {
      const exercise = item && typeof item === "object" ? item as Record<string, unknown> : {};
      return {
        id: String(exercise.id ?? ""),
        name: String(exercise.name ?? "Exercício"),
        muscleGroup: String(exercise.muscleGroup ?? ""),
        equipment: String(exercise.equipment ?? ""),
        sets: Math.max(0, Number(exercise.sets ?? 0)),
        repsMin: Math.max(0, Number(exercise.repsMin ?? 0)),
        repsMax: Math.max(0, Number(exercise.repsMax ?? 0)),
        position: Math.max(0, Number(exercise.position ?? 0)),
      };
    }) : [],
  };
}

function repsLabel(exercise: WorkoutExercise) {
  if (!exercise.sets) return exercise.repsMin || exercise.repsMax ? `${exercise.repsMin || exercise.repsMax} reps` : "—";
  const reps = exercise.repsMin && exercise.repsMax && exercise.repsMin !== exercise.repsMax
    ? `${exercise.repsMin}–${exercise.repsMax}`
    : `${exercise.repsMin || exercise.repsMax || "—"}`;
  return `${exercise.sets}×${reps}`;
}

export default function RankingProfileEnhancements171() {
  const location = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const reduceMotion = Boolean(useReducedMotion());
  const [selectedId, setSelectedId] = useState("");
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [workoutOpen, setWorkoutOpen] = useState(false);
  const period = currentRankingPeriod(new Date());
  const active = location.pathname === "/ranking" && Boolean(user?.id);

  const rankingQuery = useQuery({
    queryKey: ["ranking", "monthly", "1.5.6", user?.id, period.key],
    queryFn: loadAccquaRanking,
    enabled: active,
    staleTime: 20_000,
  });
  const entries = rankingQuery.data ?? [];
  const selectedEntry = useMemo(() => entries.find((entry) => entry.studentId === selectedId) ?? null, [entries, selectedId]);
  const isSelf = selectedId === user?.id;

  useEffect(() => {
    if (!active) { setSelectedId(""); return; }
    const capture = (event: MouseEvent) => {
      const button = (event.target as HTMLElement | null)?.closest<HTMLElement>(".ranking-podium-card, .ranking-row");
      if (!button) return;
      const position = positionFromButton(button);
      const entry = entries.find((item) => item.position === position);
      if (entry) setSelectedId(entry.studentId);
    };
    document.addEventListener("click", capture, true);
    return () => document.removeEventListener("click", capture, true);
  }, [active, entries]);

  useEffect(() => {
    if (!active || !selectedId) { setHost(null); setWorkoutOpen(false); return; }
    let current: HTMLElement | null = null;
    let frame = 0;
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const sheet = document.querySelector<HTMLElement>(".ranking-profile-sheet-165");
        const header = sheet?.querySelector<HTMLElement>(".ranking-profile-header");
        if (!sheet || !header) {
          current?.remove(); current = null; setHost(null); setWorkoutOpen(false); return;
        }
        if (!current?.isConnected) {
          current = document.createElement("div");
          current.className = "ranking-profile-social-actions ranking-profile-social-actions-171";
          header.insertAdjacentElement("afterend", current);
        }
        setHost(current);
      });
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => { cancelAnimationFrame(frame); observer.disconnect(); current?.remove(); };
  }, [active, selectedId]);

  const partnerQuery = useQuery({
    queryKey: ["ranking-partner-status", selectedId],
    queryFn: () => getTrainingPartnerStatus(selectedId),
    enabled: Boolean(host && selectedId && !isSelf),
    staleTime: 10_000,
  });

  const addPartner = useMutation({
    mutationFn: () => requestTrainingPartner(selectedId),
    onSuccess: async () => {
      toast.success("Convite de parceria enviado.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["ranking-partner-status", selectedId] }),
        queryClient.invalidateQueries({ queryKey: ["training-partners"] }),
        queryClient.invalidateQueries({ queryKey: ["training-partner-count"] }),
      ]);
    },
    onError: () => toast.error("Não foi possível enviar o convite de parceria."),
  });

  const workoutQuery = useQuery({
    queryKey: ["ranking-active-workout", selectedId],
    queryFn: () => loadRankingWorkout(selectedId),
    enabled: workoutOpen && Boolean(selectedId),
    staleTime: 20_000,
  });

  const relationship = isSelf ? "self" : partnerQuery.data ?? "none";
  const firstAction = relationship === "accepted" || relationship === "self"
    ? <button type="button" className="ranking-profile-partner-state is-added" disabled><Check/> {relationship === "self" ? "Seu perfil" : "Adicionado"}</button>
    : relationship === "outgoing_pending"
      ? <button type="button" className="ranking-profile-partner-state" disabled>Convite enviado</button>
      : relationship === "incoming_pending"
        ? <button type="button" className="ranking-profile-partner-state" disabled>Convite recebido</button>
        : <button type="button" className="ranking-profile-partner-state" disabled={addPartner.isPending} onClick={() => addPartner.mutate()}>{addPartner.isPending ? "Enviando..." : "Adicionar parceiro"}</button>;

  const workout = workoutQuery.data;

  return <>
    {host ? createPortal(<>{firstAction}<button type="button" className="ranking-profile-workout-button" onClick={() => setWorkoutOpen(true)}>Ver treino</button></>, host) : null}

    {typeof document !== "undefined" ? createPortal(
      <AnimatePresence>
        {workoutOpen ? (
          <motion.div className="ranking-workout-modal-backdrop" role="presentation" initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setWorkoutOpen(false)}>
            <motion.section className="ranking-workout-modal" role="dialog" aria-modal="true" aria-label={`Treino de ${selectedEntry?.firstName ?? "aluno"}`} initial={reduceMotion ? false : { opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .985 }} transition={{ duration: reduceMotion ? 0 : .2 }} onClick={(event) => event.stopPropagation()}>
              <header className="ranking-workout-modal-header"><button type="button" className="ranking-workout-modal-back" aria-label="Voltar ao perfil do ranking" onClick={() => setWorkoutOpen(false)}><ArrowLeft/></button><div><small>TREINO ATUAL</small><h2>Treino de {isSelf ? "você" : selectedEntry?.firstName ?? "aluno"}</h2></div></header>
              {workoutQuery.isLoading ? <div className="ranking-workout-loading"><span className="ranking-workout-skeleton"/><span className="ranking-workout-skeleton"/><span className="ranking-workout-skeleton"/></div> : workoutQuery.isError ? <div className="ranking-workout-empty"><strong>Não foi possível carregar o treino</strong><p>Tente novamente em instantes.</p></div> : !workout ? <div className="ranking-workout-empty"><strong>Sem treino publicado</strong><p>Este aluno ainda não tem um programa ativo.</p></div> : <><p className="ranking-workout-modal-meta">Divisão · {workout.split} · {workout.exerciseCount} exercício{workout.exerciseCount === 1 ? "" : "s"}</p><div className="ranking-workout-exercises">{workout.exercises.map((exercise) => <article key={exercise.id} className="ranking-workout-exercise"><div><strong title={exercise.name}>{exercise.name}</strong><small title={[exercise.muscleGroup, exercise.equipment].filter(Boolean).join(" · ")}>{[exercise.muscleGroup, exercise.equipment].filter(Boolean).join(" · ") || "Exercício"}</small></div><span>{repsLabel(exercise)}</span></article>)}</div></>}
            </motion.section>
          </motion.div>
        ) : null}
      </AnimatePresence>,
      document.body,
    ) : null}
  </>;
}
