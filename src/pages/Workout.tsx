import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AppShell, { Card } from "../components/AppShell";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icon";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import type { WorkoutExercise, WorkoutPlan } from "../lib/types";

function ExerciseMedia({ exercise }: { exercise: WorkoutExercise }) {
  const source = exercise.media_url || "/exercise-demo.gif";
  if (exercise.media_type === "video" || /\.(mp4|webm|mov)(\?|$)/i.test(source)) {
    return <video className="exercise-media" src={source} controls playsInline loop/>;
  }
  return <img className="exercise-media" src={source} alt={`Demonstração de ${exercise.name}`}/>;
}

export default function Workout() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [setNumber, setSetNumber] = useState(1);
  const [loadKg, setLoadKg] = useState(0);
  const [repsDone, setRepsDone] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [completedSets, setCompletedSets] = useState<Set<string>>(new Set());
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    if (!user) return;
    void (async () => {
      setLoading(true);
      const { data: currentPlan } = await supabase.from("workout_plans").select("*").eq("student_id", user.id).eq("is_active", true).order("version", { ascending: false }).limit(1).maybeSingle();
      if (currentPlan) {
        const { data: rows } = await supabase.from("workout_exercises").select("*").eq("plan_id", currentPlan.id).order("position");
        setPlan(currentPlan as WorkoutPlan);
        setExercises((rows || []) as WorkoutExercise[]);
      } else {
        setPlan(null); setExercises([]);
      }
      setLoading(false);
    })();
  }, [user]);

  const exercise = exercises[index];
  useEffect(() => {
    if (!exercise) return;
    setSetNumber(1);
    setLoadKg(Number(exercise.initial_load_kg || 0));
    setRepsDone(exercise.reps_min || 8);
  }, [exercise?.id]);

  const totalSets = useMemo(() => exercises.reduce((sum, item) => sum + Number(item.sets || 0), 0), [exercises]);
  const completion = totalSets ? Math.round((completedSets.size / totalSets) * 100) : 0;

  async function ensureSession() {
    if (sessionId) return sessionId;
    if (!user || !plan) return null;
    const { data, error } = await supabase.from("workout_sessions").insert({ user_id: user.id, plan_id: plan.id, started_at: new Date(startedAt.current).toISOString() }).select("id").single();
    if (error) throw error;
    setSessionId(data.id);
    return data.id as string;
  }

  async function completeSet() {
    if (!exercise || !plan) return;
    setSaving(true);
    try {
      const currentSession = await ensureSession();
      if (!currentSession) return;
      await supabase.from("workout_set_logs").upsert({
        session_id: currentSession, workout_exercise_id: exercise.id, set_number: setNumber,
        load_kg: loadKg, reps: repsDone, completed_at: new Date().toISOString(),
      }, { onConflict: "session_id,workout_exercise_id,set_number" });
      const key = `${exercise.id}:${setNumber}`;
      const nextCompleted = new Set(completedSets); nextCompleted.add(key); setCompletedSets(nextCompleted);
      if (setNumber < exercise.sets) setSetNumber((value) => value + 1);
      else if (index < exercises.length - 1) setIndex((value) => value + 1);
      else await finishWorkout(nextCompleted, currentSession);
    } finally { setSaving(false); }
  }

  async function finishWorkout(currentCompleted = completedSets, existingSession?: string | null) {
    if (!existingSession && !sessionId && !plan) return;
    const currentSession = existingSession || sessionId || await ensureSession();
    if (!currentSession) return;
    const pct = totalSets ? Math.round((currentCompleted.size / totalSets) * 100) : 0;
    const durationSeconds = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
    const { error } = await supabase.rpc("complete_workout_session", {
      p_session_id: currentSession, p_completion_percentage: pct, p_duration_seconds: durationSeconds,
    });
    if (error) await supabase.from("workout_sessions").update({ completed_at: new Date().toISOString(), completion_percentage: pct, duration_seconds: durationSeconds }).eq("id", currentSession);
    setFinished(true);
  }

  if (loading) return <AppShell title="Meu treino" back><div className="skeleton hero"/><div className="skeleton card-line"/></AppShell>;
  if (!plan) return <AppShell title="Meu treino" back><EmptyState icon="dumbbell" title="Seu treino ainda não foi liberado" text="Assim que seu professor montar e publicar o plano, ele aparecerá aqui automaticamente." action={<Link className="button outline" to="/personal">Conhecer professores</Link>}/></AppShell>;
  if (!exercise) return <AppShell title="Meu treino" back><EmptyState icon="warning" title="Treino sem exercícios" text="O plano foi criado, mas ainda não possui exercícios. Avise seu professor."/></AppShell>;
  if (finished) return <AppShell title="Treino concluído" back><div className="finish-card card"><span><Icon name="trophy" size={48}/></span><h1>Treino finalizado!</h1><p>{completion >= 70 ? "Sua atividade foi registrada e poderá contar no ranking do mês." : "Treino salvo. Para pontuar no ranking, conclua pelo menos 70% das séries e respeite o tempo mínimo."}</p><Link className="button primary" to="/ranking">Ver ranking</Link></div></AppShell>;

  return <AppShell title={`${plan.name}${plan.focus ? ` · ${plan.focus}` : ""}`} back right={<div className="header-actions"><Link className="mode-chip" to="/cardio"><Icon name="heart"/><span>Cardio</span></Link><button className="icon-button"><Icon name="calendar"/></button></div>}>
    <div className="story-progress">{exercises.map((item, itemIndex) => <i key={item.id} className={itemIndex < index ? "done" : itemIndex === index ? "current" : ""}/>)}</div>
    <div className="exercise-heading"><div><h1>{exercise.name}</h1><p>{exercise.equipment || exercise.muscle_group}</p></div><strong>{index + 1}<small>/{exercises.length}</small></strong></div>
    <div className="exercise-media-wrap"><ExerciseMedia exercise={exercise}/><span className="media-badge">{exercise.media_type.toUpperCase()}</span></div>
    <div className="series-control"><button onClick={() => setSetNumber(Math.max(1, setNumber - 1))}><Icon name="minus"/></button><div><small>SÉRIE</small><strong>{setNumber}<em>/{exercise.sets}</em></strong><div className="set-dots">{Array.from({ length: exercise.sets }, (_, i) => <i key={i} className={i + 1 <= setNumber ? "active" : ""}/>)}</div></div><button onClick={() => setSetNumber(Math.min(exercise.sets, setNumber + 1))}><Icon name="plus"/></button></div>
    <div className="workout-info-grid"><Card><small>REPETIÇÕES</small><strong>{exercise.reps_min}–{exercise.reps_max}</strong><div className="mini-stepper"><button onClick={()=>setRepsDone(Math.max(1,repsDone-1))}>−</button><span>{repsDone}</span><button onClick={()=>setRepsDone(repsDone+1)}>+</button></div></Card><Card><small>CARGA</small><strong>{loadKg} kg <Icon name="crown"/></strong><div className="mini-stepper"><button onClick={()=>setLoadKg(Math.max(0,loadKg-1))}>−</button><input type="number" value={loadKg} onChange={(e)=>setLoadKg(Number(e.target.value)||0)}/><button onClick={()=>setLoadKg(loadKg+1)}>+</button></div></Card><Card><small>DESCANSO</small><strong>{exercise.rest_seconds}s</strong><Icon name="clock"/></Card></div>
    {exercise.notes && <div className="notice info"><Icon name="info"/><span>{exercise.notes}</span></div>}
    {index < exercises.length - 1 && <Card className="next-exercise"><div><small>Próximo exercício</small><strong>{exercises[index + 1].name}</strong><span>{exercises[index + 1].equipment}</span></div><button onClick={() => setIndex(index + 1)}><Icon name="next"/></button></Card>}
    <button className="button primary large sticky-action" onClick={completeSet} disabled={saving}><span>{saving ? "Salvando..." : setNumber === exercise.sets ? index === exercises.length - 1 ? "Concluir treino" : "Concluir exercício" : "Concluir série"}</span><Icon name="check"/></button>
  </AppShell>;
}
