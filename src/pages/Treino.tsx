import { useEffect, useMemo, useState } from "react";
import AppShell, { SmallIconButton } from "../components/AppShell";
import { Panel, SectionTitle, Stat } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import { getStudentWorkout, saveWorkoutSession } from "../lib/data";
import type { WorkoutExercise, WorkoutPlan } from "../types";

export default function Treino() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [index, setIndex] = useState(0);
  const [completedSets, setCompletedSets] = useState<number[]>([]);
  const current = exercises[index];

  useEffect(() => {
    if (!user) return;
    getStudentWorkout(user.id).then((result) => {
      setPlan(result.plan);
      setExercises(result.exercises);
      setCompletedSets(new Array(result.exercises.length).fill(0));
    });
  }, [user]);

  const currentSets = completedSets[index] || 0;
  const totalSets = current?.sets || 0;
  const progress = useMemo(() => {
    if (!exercises.length) return 0;
    const total = exercises.reduce((sum, item) => sum + (item.sets || 0), 0);
    const done = completedSets.reduce((sum, item) => sum + item, 0);
    return Math.round((done / Math.max(total, 1)) * 100);
  }, [completedSets, exercises]);

  const updateSets = (delta: number) => {
    setCompletedSets((prev) => {
      const next = [...prev];
      const max = exercises[index]?.sets || 0;
      next[index] = Math.min(max, Math.max(0, (next[index] || 0) + delta));
      return next;
    });
  };

  const concludeExercise = async () => {
    const isLast = index >= exercises.length - 1;
    if (!isLast) {
      setIndex((v) => v + 1);
      return;
    }
    if (user && plan) {
      await saveWorkoutSession({
        student_id: user.id,
        plan_id: plan.id,
        completed_at: new Date().toISOString(),
        valid_for_ranking: true,
        completion_percentage: progress,
      });
      alert("Treino registrado no ranking.");
    }
  };

  if (!current) {
    return (
      <AppShell title="Meu treino" subtitle="Aguardando treino do professor.">
        <Panel>
          <p>Seu professor ainda não liberou um treino para você.</p>
        </Panel>
      </AppShell>
    );
  }

  return (
    <AppShell title="Meu treino" subtitle={`${plan?.name || "Treino A"} • Accqua Sports`} action={<div className="flex gap-8"><SmallIconButton to="/cardio" label="Modo cardio" icon="cardio" /><SmallIconButton label="Calendário" icon="calendar" /></div>}>
      <Panel>
        <SectionTitle title={current.name} hint={current.notes || "Siga a técnica passada pelo professor."} />
        <div className="workout-media">
          {current.media_url ? <img src={current.media_url} alt={current.name} /> : <div className="media-placeholder">GIF do exercício</div>}
        </div>
        <div className="stats-grid three">
          <Stat label="Séries" value={`${currentSets}/${totalSets}`} />
          <Stat label="Repetições" value={`${current.reps_min || 8} a ${current.reps_max || 12}`} />
          <Stat label="Carga" value={current.load_label || "Definida pelo professor"} />
        </div>
        <div className="rest-chip">Descanso sugerido: {current.rest_seconds || 60}s</div>
        <div className="workout-actions">
          <button className="secondary-btn small" onClick={() => updateSets(-1)}>- Série</button>
          <button className="primary-btn" onClick={() => updateSets(1)}>Concluir série</button>
          <button className="ghost-btn small" onClick={concludeExercise}>{index < exercises.length - 1 ? "Próximo exercício" : "Finalizar treino"}</button>
        </div>
      </Panel>

      <Panel>
        <SectionTitle title="Próximo exercício" />
        <div className="story-card">
          <strong>{exercises[index + 1]?.name || "Fim do treino"}</strong>
          <span>{exercises[index + 1] ? `${exercises[index + 1].sets} séries` : "Bom trabalho hoje."}</span>
        </div>
      </Panel>

      <Panel>
        <SectionTitle title="Progresso do treino" />
        <div className="stats-grid two">
          <Stat label="Exercício" value={`${index + 1}/${exercises.length}`} />
          <Stat label="Conclusão" value={`${progress}%`} />
        </div>
      </Panel>
    </AppShell>
  );
}
