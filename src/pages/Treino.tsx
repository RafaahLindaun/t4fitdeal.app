import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import confetti from "canvas-confetti";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import LoadingSplash from "../components/LoadingSplash";
import { CardioSwapIcon } from "../components/CardioIcons";
import WorkoutCalendarSheet from "../components/WorkoutCalendarSheet";
import WorkoutMedia from "../components/WorkoutMedia";
import {
  WorkoutBackIcon,
  WorkoutCalendarIcon,
  WorkoutCheckIcon,
  WorkoutMinusIcon,
  WorkoutNextIcon,
  WorkoutPlusIcon,
  WorkoutRefreshIcon,
} from "../components/WorkoutIcons";
import {
  finishWorkoutSession,
  loadAssignedWorkout,
  saveCompletedSet,
  startWorkoutSession,
  type SessionStartResult,
  type WorkoutExerciseRecord,
  type WorkoutPlanRecord,
} from "../lib/workout";
import {
  loadActiveWorkoutCardioPrescription,
  type CardioPrescription,
} from "../lib/cardio";
import {
  loadLastSeriesExecution,
  playRestFinishedTone,
  resolveLoadStep,
  upsertSeriesExecution,
  vibrate,
} from "../lib/seriesExecution";
import {
  useExercicioSession,
  type ExercisePhase,
} from "../hooks/useExercicioSession";
import "./treino.css";

const ARTBOARD_WIDTH = 450;
const ARTBOARD_HEIGHT = 844;
const RING_RADIUS = 72;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

type ViewState = "loading" | "empty" | "ready" | "error";
type ChangeDirection = "next" | "previous";
type SetDraft = { loadKg: number; reps: number };

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function setDraftKey(exerciseId: string, setNumber: number) {
  return `${exerciseId}:${setNumber}`;
}

function planDisplayName(name: string) {
  const clean = name.trim();
  return clean ? clean.toUpperCase() : "TREINO";
}

function formatRestTime(seconds: number) {
  const safe = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(safe / 60);
  const remaining = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}

function ringColor(remaining: number) {
  if (remaining <= 0) return "#ff4d4f";
  if (remaining >= 5) return "#ffd11e";
  const ratio = clamp(remaining / 5, 0, 1);
  const from = [255, 77, 79];
  const to = [255, 209, 30];
  const mixed = from.map((value, index) => Math.round(value + (to[index]! - value) * ratio));
  return `rgb(${mixed[0]}, ${mixed[1]}, ${mixed[2]})`;
}

const RestTimerHero = memo(function RestTimerHero({
  totalSeconds,
  endsAt,
  onFinished,
  reducedMotion,
}: {
  totalSeconds: number;
  endsAt: number;
  onFinished: () => void;
  reducedMotion: boolean;
}) {
  const [remainingMs, setRemainingMs] = useState(() => Math.max(0, endsAt - Date.now()));
  const finishedRef = useRef(false);

  useEffect(() => {
    finishedRef.current = false;
    let frame = 0;
    let lastRenderedSecond = -1;

    const update = () => {
      const next = Math.max(0, endsAt - Date.now());
      const second = Math.ceil(next / 1000);
      if (second !== lastRenderedSecond || next === 0) {
        lastRenderedSecond = second;
        setRemainingMs(next);
      }
      if (next <= 0) {
        if (!finishedRef.current) {
          finishedRef.current = true;
          onFinished();
        }
        return;
      }
      frame = window.requestAnimationFrame(update);
    };

    update();
    return () => window.cancelAnimationFrame(frame);
  }, [endsAt, onFinished]);

  const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const progress = totalSeconds > 0 ? clamp(remainingMs / (totalSeconds * 1000), 0, 1) : 0;
  const dashOffset = RING_CIRCUMFERENCE * (1 - progress);

  return (
    <div className="workout-series-ring rest-mode workout-hero-ring" aria-live="polite">
      <svg className="workout-rest-progress-svg" viewBox="0 0 160 160" aria-hidden="true">
        <circle cx="80" cy="80" r={RING_RADIUS} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="6" />
        <motion.circle
          cx="80"
          cy="80"
          r={RING_RADIUS}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          animate={{
            strokeDashoffset: dashOffset,
            stroke: ringColor(remainingSeconds),
          }}
          transition={{ duration: reducedMotion ? 0 : 0.22, ease: "linear" }}
          style={{ transformOrigin: "80px 80px", transform: "rotate(-90deg)", willChange: "stroke-dashoffset" }}
        />
      </svg>
      <div className="workout-rest-content">
        <span>DESCANSO</span>
        <strong>{formatRestTime(remainingSeconds)}</strong>
        <small>PRÓXIMO: CONFIRMAR SÉRIE</small>
      </div>
    </div>
  );
});

function StaticHero({ eyebrow, value, detail }: { eyebrow: string; value: string; detail: string }) {
  return (
    <div className="workout-series-ring workout-hero-ring">
      <div className="workout-series-content">
        <span>{eyebrow}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </div>
  );
}

function ExerciseHero({
  phase,
  setNumber,
  totalSets,
  onRestFinished,
  reducedMotion,
}: {
  phase: ExercisePhase;
  setNumber: number;
  totalSets: number;
  onRestFinished: () => void;
  reducedMotion: boolean;
}) {
  const transition = reducedMotion
    ? { duration: 0 }
    : { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] as const };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={phase.value}
        className="workout-hero-state"
        initial={reducedMotion ? false : { opacity: 0, scale: 0.94, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.96, y: -6 }}
        transition={transition}
      >
        {phase.value === "executando_serie" ? (
          <StaticHero eyebrow="SÉRIE" value={`${setNumber}/${totalSets}`} detail="EM EXECUÇÃO" />
        ) : null}
        {phase.value === "descanso" ? (
          <RestTimerHero
            totalSeconds={phase.totalSeconds}
            endsAt={phase.endsAt}
            onFinished={onRestFinished}
            reducedMotion={reducedMotion}
          />
        ) : null}
        {phase.value === "confirmando_serie" ? (
          <StaticHero eyebrow="DESCANSO FINALIZADO" value={`${setNumber}/${totalSets}`} detail="CONFIRME A SÉRIE" />
        ) : null}
        {phase.value === "proxima_serie" ? (
          <StaticHero eyebrow="REGISTRADO" value="✓" detail="PREPARANDO PRÓXIMA SÉRIE" />
        ) : null}
        {phase.value === "fim_exercicio" ? (
          <StaticHero eyebrow="EXERCÍCIO" value="✓" detail="CONCLUÍDO" />
        ) : null}
      </motion.div>
    </AnimatePresence>
  );
}

function DragValueSlider({
  label,
  value,
  min,
  max,
  step,
  suffix,
  disabled,
  onChange,
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  disabled: boolean;
  onChange: (next: number) => void;
  onCommit: () => void;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const lastTick = useRef(value);
  const range = Math.max(step, max - min);
  const percentage = clamp(((value - min) / range) * 100, 0, 100);

  useEffect(() => {
    lastTick.current = value;
  }, [value]);

  const setFromClientX = (clientX: number) => {
    if (disabled || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = clamp((clientX - rect.left) / Math.max(1, rect.width), 0, 1);
    const raw = min + ratio * (max - min);
    const snapped = clamp(Math.round((raw - min) / step) * step + min, min, max);
    const decimals = step < 1 ? 2 : 0;
    const next = Number(snapped.toFixed(decimals));
    if (next !== lastTick.current) {
      lastTick.current = next;
      vibrate(10);
      onChange(next);
    }
  };

  const nudge = (direction: number) => {
    if (disabled) return;
    const next = clamp(Number((value + direction * step).toFixed(step < 1 ? 2 : 0)), min, max);
    if (next === value) return;
    vibrate(10);
    onChange(next);
    window.setTimeout(onCommit, 0);
  };

  return (
    <article className={`workout-drag-metric ${disabled ? "is-disabled" : ""}`}>
      <div className="workout-drag-metric-heading">
        <span>{label}</span>
        <strong>
          {Number.isInteger(value) ? value : value.toFixed(2)}
          <small>{suffix}</small>
        </strong>
      </div>
      <div className="workout-drag-slider" ref={trackRef}>
        <div className="workout-drag-slider-fill" style={{ width: `${percentage}%` }} />
        <motion.div
          className="workout-drag-slider-thumb"
          style={{ left: `${percentage}%` }}
          drag={disabled ? false : "x"}
          dragConstraints={trackRef}
          dragElastic={0}
          dragMomentum={false}
          dragSnapToOrigin
          onDrag={(_, info) => setFromClientX(info.point.x)}
          onDragEnd={() => onCommit()}
          tabIndex={disabled ? -1 : 0}
          role="slider"
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={`${value} ${suffix}`}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight" || event.key === "ArrowUp") {
              event.preventDefault();
              nudge(1);
            }
            if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
              event.preventDefault();
              nudge(-1);
            }
          }}
        />
      </div>
    </article>
  );
}

function burstFromButton(button: HTMLButtonElement | null, reducedMotion: boolean) {
  if (!button || reducedMotion) return;
  const rect = button.getBoundingClientRect();
  const origin = {
    x: clamp((rect.left + rect.width / 2) / window.innerWidth, 0, 1),
    y: clamp((rect.top + rect.height / 2) / window.innerHeight, 0, 1),
  };
  const end = Date.now() + 600;
  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 90,
      spread: 56,
      startVelocity: 22,
      gravity: 1.15,
      scalar: 0.62,
      ticks: 42,
      origin,
      zIndex: 90,
      disableForReducedMotion: true,
    });
    if (Date.now() < end) window.requestAnimationFrame(frame);
  };
  frame();
}

export default function Treino() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, landingPath } = useAuth();
  const [viewState, setViewState] = useState<ViewState>("loading");
  const [plan, setPlan] = useState<WorkoutPlanRecord | null>(null);
  const [exercises, setExercises] = useState<WorkoutExerciseRecord[]>([]);
  const [cardioPrescription, setCardioPrescription] = useState<CardioPrescription | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [setDrafts, setSetDrafts] = useState<Record<string, SetDraft>>({});
  const [completedSets, setCompletedSets] = useState<Record<string, boolean>>({});
  const [session, setSession] = useState<SessionStartResult | null>(null);
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [titleExpanded, setTitleExpanded] = useState(false);
  const [finishMessage, setFinishMessage] = useState("");
  const [toast, setToast] = useState("");
  const [changeDirection, setChangeDirection] = useState<ChangeDirection>("next");
  const [changingExercise, setChangingExercise] = useState(false);
  const [changeLabel, setChangeLabel] = useState("");
  const [changePosition, setChangePosition] = useState(1);

  const sessionPromise = useRef<Promise<SessionStartResult> | null>(null);
  const changeTimer = useRef<number | null>(null);
  const finishRedirectTimer = useRef<number | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);
  const reduceMotion = Boolean(useReducedMotion());

  const current = exercises[exerciseIndex];
  const nextExercise = exercises[exerciseIndex + 1];
  const audioEnabled = useMemo(() => {
    try { return window.localStorage.getItem("accqua_workout_audio") === "1"; } catch { return false; }
  }, []);

  const ensureSession = useCallback(async () => {
    if (!user) throw new Error("Sessão do aluno indisponível.");
    if (session) return session;
    if (sessionPromise.current) return await sessionPromise.current;
    const promise = startWorkoutSession(user.id, plan?.id ?? null);
    sessionPromise.current = promise;
    try {
      const created = await promise;
      setSession(created);
      setSessionStartedAt((started) => started ?? Date.now());
      return created;
    } finally {
      sessionPromise.current = null;
    }
  }, [plan?.id, session, user]);

  const handleNaturalRestFinished = useCallback(() => {
    vibrate([200, 100, 200]);
    playRestFinishedTone(audioEnabled);
  }, [audioEnabled]);

  const exerciseSession = useExercicioSession({
    exerciseId: current?.id ?? null,
    totalSets: current?.sets ?? 1,
    restSeconds: current?.restSeconds ?? 0,
    onNaturalRestFinished: handleNaturalRestFinished,
  });

  const currentSet = exerciseSession.setNumber;
  const currentDraft = current
    ? setDrafts[setDraftKey(current.id, currentSet)] ?? { loadKg: current.initialLoadKg, reps: current.repsMax }
    : { loadKg: 0, reps: 0 };

  const totalSetCount = useMemo(
    () => exercises.reduce((total, exercise) => total + exercise.sets, 0),
    [exercises],
  );
  const completedSetCount = useMemo(
    () => Object.values(completedSets).filter(Boolean).length,
    [completedSets],
  );
  const completedExerciseCount = useMemo(
    () => exercises.filter((exercise) =>
      Array.from({ length: exercise.sets }, (_, index) => completedSets[setDraftKey(exercise.id, index + 1)]).every(Boolean),
    ).length,
    [completedSets, exercises],
  );
  const completionPercentage = totalSetCount
    ? Math.round((completedSetCount / totalSetCount) * 100)
    : 0;
  const generalProgress = exercises.length ? ((exerciseIndex + 1) / exercises.length) * 100 : 0;

  const loadWorkout = useCallback(async () => {
    if (!user) return;
    setViewState("loading");
    setErrorMessage("");
    const result = await loadAssignedWorkout(user.id);
    if (result.status === "ready") {
      setPlan(result.plan);
      setExercises(result.exercises);
      setExerciseIndex(0);
      setCompletedSets({});
      setSetDrafts(Object.fromEntries(result.exercises.flatMap((exercise) =>
        Array.from({ length: exercise.sets }, (_, index) => [
          setDraftKey(exercise.id, index + 1),
          { loadKg: exercise.initialLoadKg, reps: exercise.repsMax } satisfies SetDraft,
        ]),
      )));
      setViewState("ready");
      return;
    }
    if (result.status === "empty") {
      setPlan(null);
      setExercises([]);
      setErrorMessage(result.reason ?? "");
      setViewState("empty");
      return;
    }
    setPlan(null);
    setExercises([]);
    setErrorMessage(result.reason);
    setViewState("error");
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void loadWorkout();
    void loadActiveWorkoutCardioPrescription(user.id).then(setCardioPrescription);
  }, [loadWorkout, user]);

  useEffect(() => {
    if (!user || !current || current.isSimple) return;
    let active = true;
    void loadLastSeriesExecution(user.id, current.id)
      .then((last) => {
        if (!active || !last) return;
        setSetDrafts((previous) => {
          const next = { ...previous };
          for (let set = 1; set <= current.sets; set += 1) {
            next[setDraftKey(current.id, set)] = { reps: last.reps, loadKg: last.loadKg };
          }
          return next;
        });
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [current?.id, user?.id]);

  useEffect(() => {
    const syncScale = () => {
      const viewport = window.visualViewport;
      const width = viewport?.width ?? window.innerWidth;
      const height = viewport?.height ?? window.innerHeight;
      const scale = Math.min((width - 8) / ARTBOARD_WIDTH, (height - 8) / ARTBOARD_HEIGHT, 1.08);
      document.documentElement.style.setProperty("--workout-viewport-height", `${Math.round(height)}px`);
      document.documentElement.style.setProperty("--workout-artboard-scale", String(Math.max(0.55, scale)));
    };
    syncScale();
    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", syncScale);
    window.addEventListener("resize", syncScale);
    window.addEventListener("orientationchange", syncScale);
    return () => {
      viewport?.removeEventListener("resize", syncScale);
      window.removeEventListener("resize", syncScale);
      window.removeEventListener("orientationchange", syncScale);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => () => {
    if (changeTimer.current) window.clearTimeout(changeTimer.current);
    if (finishRedirectTimer.current) window.clearTimeout(finishRedirectTimer.current);
  }, []);

  const updateCurrentDraft = (patch: Partial<SetDraft>) => {
    if (!current) return;
    const key = setDraftKey(current.id, currentSet);
    setSetDrafts((previous) => ({
      ...previous,
      [key]: {
        loadKg: previous[key]?.loadKg ?? current.initialLoadKg,
        reps: previous[key]?.reps ?? current.repsMax,
        ...patch,
      },
    }));
  };

  const persistCurrentDraft = async () => {
    if (!user || !current || busy) return;
    try {
      const activeSession = await ensureSession();
      await upsertSeriesExecution({
        userId: user.id,
        sessionId: activeSession.id,
        exerciseId: current.id,
        setNumber: currentSet,
        reps: currentDraft.reps,
        loadKg: currentDraft.loadKg,
        completedAt: null,
      });
    } catch {
      setToast("Não foi possível sincronizar carga e repetições agora.");
    }
  };

  const goToExercise = (index: number, direction?: ChangeDirection) => {
    const target = clamp(index, 0, Math.max(0, exercises.length - 1));
    if (target === exerciseIndex || changingExercise || exerciseSession.phase.value === "descanso") return;
    const nextDirection = direction ?? (target > exerciseIndex ? "next" : "previous");
    const targetExercise = exercises[target];
    setChangeDirection(nextDirection);
    setChangeLabel(targetExercise?.name ?? "Próximo exercício");
    setChangePosition(target + 1);
    setChangingExercise(true);
    if (changeTimer.current) window.clearTimeout(changeTimer.current);
    changeTimer.current = window.setTimeout(() => {
      setExerciseIndex(target);
      window.setTimeout(() => {
        setChangingExercise(false);
        setChangeLabel("");
      }, 420);
    }, 300);
  };

  const finishWorkout = async () => {
    if (!user || !plan || busy) return;
    setBusy(true);
    try {
      const activeSession = await ensureSession();
      const startedAt = sessionStartedAt ?? Date.now();
      const durationSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
      const result = await finishWorkoutSession({
        userId: user.id,
        planId: plan.id,
        sessionId: activeSession.id,
        localSession: activeSession.local,
        simpleWorkout: false,
        completionPercentage,
        durationSeconds,
        completedSets: completedSetCount,
        totalSets: totalSetCount,
      });

      setFinishMessage(result.validForRanking
        ? "Treino concluído, salvo no seu perfil e registrado no ranking da academia."
        : result.saved
          ? "Treino salvo no seu histórico. Para pontuar no ranking, complete pelo menos 70% do plano."
          : "O treino terminou, mas o banco ainda não confirmou o registro. Toque em concluir novamente antes de sair.");

      if (result.saved) {
        vibrate([55, 28, 70]);
        if (!reduceMotion) confetti({ particleCount: 80, spread: 70, startVelocity: 32, origin: { y: 0.72 }, zIndex: 90, disableForReducedMotion: true });
      }
      setFinishOpen(true);

      if (cardioPrescription?.timing === "after" && result.saved) {
        if (finishRedirectTimer.current) window.clearTimeout(finishRedirectTimer.current);
        finishRedirectTimer.current = window.setTimeout(() => navigate("/cardio"), 1600);
      }
    } catch {
      setFinishMessage("Não conseguimos confirmar o registro deste treino. Tente concluir novamente antes de sair.");
      setFinishOpen(true);
    } finally {
      setBusy(false);
    }
  };

  const confirmCurrentSeries = async () => {
    if (!user || !current || busy || exerciseSession.phase.value !== "confirmando_serie") return;
    setBusy(true);
    try {
      const activeSession = await ensureSession();
      const completedAt = new Date().toISOString();
      await upsertSeriesExecution({
        userId: user.id,
        sessionId: activeSession.id,
        exerciseId: current.id,
        setNumber: currentSet,
        reps: currentDraft.reps,
        loadKg: currentDraft.loadKg,
        completedAt,
      });
      await saveCompletedSet({
        sessionId: activeSession.id,
        localSession: activeSession.local,
        exerciseId: current.id,
        simpleExercise: current.isSimple,
        setNumber: currentSet,
        loadKg: currentDraft.loadKg,
        reps: currentDraft.reps,
      });
      setCompletedSets((previous) => ({ ...previous, [setDraftKey(current.id, currentSet)]: true }));
      vibrate(32);
      burstFromButton(confirmButtonRef.current, reduceMotion);
      setToast(`Série ${currentSet}/${current.sets} registrada: ${currentDraft.reps} reps · ${currentDraft.loadKg} kg.`);
      exerciseSession.confirmSuccess();
    } catch {
      setToast("Não foi possível salvar esta série. Confira sua conexão e tente novamente.");
    } finally {
      setBusy(false);
    }
  };

  if (authLoading) return <LoadingSplash />;
  if (!user) return <Navigate to="/login" replace />;
  if (landingPath !== "/menu-teste") return <Navigate to={landingPath} replace />;
  if (viewState === "loading") return <LoadingSplash />;

  if (viewState === "empty") {
    return (
      <div className="workout-screen">
        <div className="workout-background" />
        <main className="workout-empty-shell">
          <header className="workout-empty-header">
            <button type="button" className="workout-round-button" onClick={() => navigate("/menu-teste")} aria-label="Voltar"><WorkoutBackIcon /></button>
            <div className="workout-header-brand"><span className="workout-header-logo-crop"><img src="/accqua-logo-header.png" alt="Accqua Sports" /></span><i /><strong>MEU TREINO</strong></div>
            <div className="workout-topbar-actions">
              <button type="button" className="workout-mode-switch-button" onClick={() => navigate("/cardio")} aria-label="Ir para cardio"><CardioSwapIcon /><small>CARDIO</small></button>
              <button type="button" className="workout-round-button calendar" onClick={() => setCalendarOpen(true)} aria-label="Calendário"><WorkoutCalendarIcon /></button>
            </div>
          </header>
          <section className="workout-empty-card">
            <div className="workout-empty-icon"><WorkoutRefreshIcon size={35} /></div>
            <span>EM BREVE</span>
            <h1>Seu professor ainda não liberou seu treino</h1>
            <p>Assim que o professor criar e ativar seu plano, exercícios, séries, repetições, cargas, GIFs, vídeos ou links aparecerão automaticamente aqui.</p>
            {errorMessage ? <div className="workout-empty-note">{errorMessage}</div> : null}
            <button type="button" className="workout-empty-primary" onClick={() => void loadWorkout()}>Verificar novamente</button>
            <button type="button" className="workout-empty-secondary" onClick={() => navigate("/menu-teste")}>Voltar ao menu</button>
          </section>
        </main>
      </div>
    );
  }

  if (viewState === "error") {
    return (
      <div className="workout-screen">
        <div className="workout-background" />
        <main className="workout-empty-shell">
          <section className="workout-empty-card">
            <div className="workout-empty-icon error">!</div>
            <span>ERRO DE CARREGAMENTO</span>
            <h1>Não conseguimos abrir seu treino</h1>
            <p>{errorMessage}</p>
            <button type="button" className="workout-empty-primary" onClick={() => void loadWorkout()}>Tentar novamente</button>
            <button type="button" className="workout-empty-secondary" onClick={() => navigate("/menu-teste")}>Voltar ao menu</button>
          </section>
        </main>
      </div>
    );
  }

  if (!current || !plan) return <LoadingSplash />;

  const loadStep = resolveLoadStep(current.equipment);
  const loadMax = Math.max(100, Math.ceil((Math.max(current.initialLoadKg, currentDraft.loadKg) * 3 + 20) / loadStep) * loadStep);
  const repsMax = Math.max(30, current.repsMax + 10, currentDraft.reps + 5);
  const phase = exerciseSession.phase.value;

  const handlePrimaryAction = () => {
    if (phase === "executando_serie") {
      exerciseSession.startRest();
      return;
    }
    if (phase === "descanso") {
      vibrate(10);
      exerciseSession.finishRest(false);
      return;
    }
    if (phase === "confirmando_serie") {
      void confirmCurrentSeries();
      return;
    }
    if (phase === "fim_exercicio") {
      if (nextExercise) goToExercise(exerciseIndex + 1, "next");
      else void finishWorkout();
    }
  };

  const primaryLabel = busy
    ? "Salvando..."
    : phase === "executando_serie"
      ? "Finalizei a série · Iniciar descanso"
      : phase === "descanso"
        ? "Pular descanso"
        : phase === "confirmando_serie"
          ? "Concluir série"
          : phase === "proxima_serie"
            ? "Preparando próxima série..."
            : nextExercise
              ? "Próximo exercício"
              : "Finalizar treino";

  return (
    <div className="workout-screen">
      <div className="workout-background" />
      <main className="workout-artboard">
        <div className="workout-overall-progress" aria-label={`Exercício ${exerciseIndex + 1} de ${exercises.length}`}>
          <motion.span layout animate={{ width: `${generalProgress}%` }} transition={{ duration: reduceMotion ? 0 : 0.25 }} />
        </div>

        <header className="workout-topbar">
          <motion.button type="button" className="workout-round-button" onClick={() => setExitOpen(true)} whileTap={reduceMotion ? undefined : { scale: 0.9 }} aria-label="Voltar com confirmação"><WorkoutBackIcon /></motion.button>
          <div className="workout-header-brand">
            <span className="workout-header-logo-crop"><img src="/accqua-logo-header.png" alt="Accqua Sports" /></span><i />
            <motion.button type="button" className="workout-plan-title-button" onClick={() => setTitleExpanded((value) => !value)} whileTap={reduceMotion ? undefined : { scale: 0.97 }} aria-expanded={titleExpanded} title={plan.name}>
              <strong>{planDisplayName(plan.name)}</strong>
            </motion.button>
            {titleExpanded ? <div className="workout-plan-title-expanded" role="status">{planDisplayName(plan.name)}</div> : null}
          </div>
          <div className="workout-topbar-actions">
            <button type="button" className="workout-mode-switch-button" onClick={() => navigate("/cardio")} aria-label="Ir para cardio"><CardioSwapIcon /><small>CARDIO</small></button>
            <motion.button type="button" className="workout-pause-button" onClick={() => setExitOpen(true)} whileTap={reduceMotion ? undefined : { scale: 0.94 }} aria-label="Pausar ou sair do treino">PAUSAR</motion.button>
            <motion.button type="button" className="workout-round-button calendar" onClick={() => setCalendarOpen(true)} whileTap={reduceMotion ? undefined : { scale: 0.9 }} aria-label="Abrir calendário de treinos"><WorkoutCalendarIcon /></motion.button>
          </div>
        </header>

        <nav className="workout-exercise-dots" aria-label="Exercícios do treino">
          {exercises.map((exercise, index) => <button type="button" key={exercise.id} className={index === exerciseIndex ? "active" : ""} onClick={() => goToExercise(index)} aria-label={`Abrir ${exercise.name}`} title={exercise.name} />)}
        </nav>

        <motion.div
          className={`workout-exercise-stage ${changingExercise ? "changing" : ""} direction-${changeDirection}`}
          key={current.id}
          initial={reduceMotion ? false : { x: changeDirection === "next" ? 30 : -30, opacity: 0.72 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.2, 0.8, 0.2, 1] }}
          drag={reduceMotion || phase === "descanso" ? false : "x"}
          dragDirectionLock
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.16}
          onDragEnd={(_, info) => {
            if (Math.abs(info.offset.x) < 72 || changingExercise) return;
            if (info.offset.x < 0 && exerciseIndex < exercises.length - 1) goToExercise(exerciseIndex + 1, "next");
            else if (info.offset.x > 0 && exerciseIndex > 0) goToExercise(exerciseIndex - 1, "previous");
          }}
        >
          <section className="workout-title-row">
            <div><h1>{current.name}</h1><p>{current.equipment || current.muscleGroup || "Exercício"}</p></div>
            <strong className="workout-general-progress"><span>EXERCÍCIO</span><b>{exerciseIndex + 1}</b><small>de {exercises.length}</small></strong>
          </section>

          <WorkoutMedia exercise={current} />

          <section className={`workout-series-control ${phase === "descanso" ? "is-resting" : ""}`}>
            <motion.button
              type="button"
              className="workout-series-button"
              whileTap={reduceMotion ? undefined : { scale: 0.9 }}
              onClick={() => { vibrate(10); exerciseSession.adjustRest(-15); }}
              disabled={phase !== "descanso"}
              aria-label="Reduzir descanso em 15 segundos"
            ><WorkoutMinusIcon /></motion.button>

            <ExerciseHero phase={exerciseSession.phase} setNumber={currentSet} totalSets={current.sets} onRestFinished={() => exerciseSession.finishRest(true)} reducedMotion={reduceMotion} />

            <motion.button
              type="button"
              className="workout-series-button"
              whileTap={reduceMotion ? undefined : { scale: 0.9 }}
              onClick={() => { vibrate(10); exerciseSession.adjustRest(15); }}
              disabled={phase !== "descanso"}
              aria-label="Aumentar descanso em 15 segundos"
            ><WorkoutPlusIcon /></motion.button>
          </section>

          <section className="workout-slider-grid" aria-label="Registro da série atual">
            <DragValueSlider
              label={`Repetições · série ${currentSet}`}
              value={currentDraft.reps}
              min={1}
              max={repsMax}
              step={1}
              suffix="reps"
              disabled={!exerciseSession.canEditValues || busy}
              onChange={(reps) => updateCurrentDraft({ reps })}
              onCommit={() => void persistCurrentDraft()}
            />
            <DragValueSlider
              label={`Carga · série ${currentSet}`}
              value={currentDraft.loadKg}
              min={0}
              max={loadMax}
              step={loadStep}
              suffix="kg"
              disabled={!exerciseSession.canEditValues || busy}
              onChange={(loadKg) => updateCurrentDraft({ loadKg })}
              onCommit={() => void persistCurrentDraft()}
            />
            <article className="workout-series-metric"><WorkoutCheckIcon /><div><span>Séries</span><strong>{currentSet}/{current.sets}</strong></div></article>
          </section>

          {nextExercise ? (
            <motion.button type="button" className="workout-next-card" onClick={() => goToExercise(exerciseIndex + 1, "next")} whileTap={reduceMotion ? undefined : { scale: 0.985 }} aria-label={`Abrir próximo exercício: ${nextExercise.name}`}>
              <div className="workout-next-copy"><span>Próximo exercício</span><strong>{nextExercise.name}</strong><small>{nextExercise.equipment || nextExercise.muscleGroup}</small></div>
              <WorkoutMedia exercise={nextExercise} compact />
              <motion.span className="workout-next-button" whileTap={reduceMotion ? undefined : { scale: 0.82 }}><WorkoutNextIcon /></motion.span>
            </motion.button>
          ) : (
            <div className="workout-next-card workout-last-exercise-note"><div className="workout-next-copy"><span>Último exercício</span><strong>Finalize todas as séries</strong><small>Depois, use o único botão abaixo para concluir o treino.</small></div><div className="workout-next-finish-icon"><WorkoutCheckIcon /></div></div>
          )}

          <motion.button
            ref={confirmButtonRef}
            type="button"
            whileTap={reduceMotion ? undefined : { scale: 0.975 }}
            className={`workout-conclude-button ${phase === "descanso" ? "is-resting" : ""}`}
            onClick={handlePrimaryAction}
            disabled={busy || phase === "proxima_serie"}
            aria-label={primaryLabel}
          ><span>{primaryLabel}</span><i><WorkoutCheckIcon /></i></motion.button>
        </motion.div>
      </main>

      {changingExercise ? (
        <div className={`workout-change-banner direction-${changeDirection}`} role="status">
          <div className="workout-change-logo"><img src="/accqua-logo-header.png" alt="" aria-hidden="true" /><i /></div>
          <span>{changeDirection === "next" ? "PRÓXIMO EXERCÍCIO" : "EXERCÍCIO ANTERIOR"}</span>
          {exercises[changePosition - 1] ? <div className="workout-change-preview"><WorkoutMedia exercise={exercises[changePosition - 1]!} compact /></div> : null}
          <strong>{changeLabel}</strong><small>{changePosition} DE {exercises.length}</small><b />
        </div>
      ) : null}

      <WorkoutCalendarSheet open={calendarOpen} userId={user.id} plan={plan} exercises={exercises} currentExerciseIndex={exerciseIndex} completedExerciseCount={completedExerciseCount} onClose={() => setCalendarOpen(false)} onSelectExercise={(index) => goToExercise(index)} />

      <AlertDialog.Root open={exitOpen} onOpenChange={setExitOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="workout-modal-overlay" />
          <AlertDialog.Content className="workout-modal workout-exit-modal">
            <span className="workout-modal-kicker">PAUSAR TREINO</span>
            <AlertDialog.Title asChild><h2>Quer sair agora?</h2></AlertDialog.Title>
            <AlertDialog.Description asChild><p>As séries já confirmadas continuam salvas. Ajustes ainda não confirmados podem ficar como rascunho, mas não entram no histórico concluído.</p></AlertDialog.Description>
            <AlertDialog.Action asChild><motion.button type="button" className="workout-modal-primary" onClick={() => navigate("/menu-teste")} whileTap={reduceMotion ? undefined : { scale: 0.97 }}>Pausar e sair</motion.button></AlertDialog.Action>
            <AlertDialog.Cancel asChild><motion.button type="button" className="workout-modal-secondary" whileTap={reduceMotion ? undefined : { scale: 0.97 }}>Continuar treino</motion.button></AlertDialog.Cancel>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>

      {finishOpen ? (
        <div className="workout-modal-overlay" role="dialog" aria-modal="true" aria-label="Treino concluído">
          <section className="workout-modal finish-modal">
            <div className="workout-finish-check"><WorkoutCheckIcon size={35} /></div>
            <span className="workout-modal-kicker">TREINO CONCLUÍDO</span>
            <h2>Bom trabalho, {profile?.fullName?.split(" ")[0] || "Aluno"}!</h2>
            <p>{finishMessage}</p>
            <div className="workout-finish-stats"><div><span>Conclusão</span><strong>{completionPercentage}%</strong></div><div><span>Séries</span><strong>{completedSetCount}/{totalSetCount}</strong></div></div>
            <button type="button" className="workout-modal-primary" onClick={() => { if (finishRedirectTimer.current) window.clearTimeout(finishRedirectTimer.current); navigate(cardioPrescription?.timing === "after" ? "/cardio" : "/menu-teste"); }}>{cardioPrescription?.timing === "after" ? "Continuar no cardio" : "Voltar ao menu"}</button>
          </section>
        </div>
      ) : null}

      <AnimatePresence>
        {toast ? (
          <motion.div className="workout-toast" role="status" aria-live="polite" aria-atomic="true" initial={reduceMotion ? false : { y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={reduceMotion ? { opacity: 0 } : { y: 12, opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.18 }}>
            {toast}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
