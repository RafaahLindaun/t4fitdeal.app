import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import confetti from "canvas-confetti";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import LoadingSplash from "../components/LoadingSplash";
import { performHaptic } from "../lib/appFeedback";
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
  WorkoutRepeatIcon,
  WorkoutWeightIcon,
} from "../components/WorkoutIcons";
import {
  finishWorkoutSession,
  loadAssignedWorkout,
  saveCompletedSet,
  startWorkoutSession,
  type WorkoutExerciseRecord,
  type WorkoutPlanRecord,
} from "../lib/workout";
import {
  loadActiveWorkoutCardioPrescription,
  type CardioPrescription,
} from "../lib/cardio";
import "./treino.css";

const ARTBOARD_WIDTH = 450;
const ARTBOARD_HEIGHT = 844;

type ViewState = "loading" | "empty" | "ready" | "error";
type ChangeDirection = "next" | "previous";

type SessionState = {
  id: string;
  local: boolean;
} | null;

type RestAction =
  | {
      kind: "set";
      exerciseId: string;
      nextSet: number;
    }
  | {
      kind: "exercise";
      targetIndex: number;
    }
  | null;

type SetDraft = { loadKg: number; reps: number };

function setDraftKey(exerciseId: string, setNumber: number) {
  return `${exerciseId}:${setNumber}`;
}

function RestProgressRing({ remaining, total }: { remaining: number; total: number }) {
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;
  const stroke = remaining <= 5 ? "#ff5b57" : remaining <= 10 ? "#ff9f43" : "#ffd11e";
  return (
    <svg className="workout-rest-progress-svg" viewBox="0 0 160 160" aria-hidden="true">
      <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="6" />
      <motion.circle
        cx="80" cy="80" r={radius} fill="none" strokeWidth="6" strokeLinecap="round"
        strokeDasharray={circumference} initial={false}
        animate={{ strokeDashoffset: circumference * (1 - progress), stroke }}
        transition={{ duration: 0.85, ease: "linear" }}
        style={{ transformOrigin: "80px 80px", transform: "rotate(-90deg)" }}
      />
    </svg>
  );
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function planDisplayName(name: string) {
  const clean = name.trim();
  if (!clean) return "TREINO";
  return clean.toUpperCase();
}

function formatRestTime(seconds: number) {
  const safe = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safe / 60);
  const remaining = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(
    remaining,
  ).padStart(2, "0")}`;
}

export default function Treino() {
  const navigate = useNavigate();
  const {
    user,
    profile,
    loading: authLoading,
    landingPath,
  } = useAuth();

  const [viewState, setViewState] =
    useState<ViewState>("loading");
  const [plan, setPlan] =
    useState<WorkoutPlanRecord | null>(null);
  const [exercises, setExercises] = useState<
    WorkoutExerciseRecord[]
  >([]);
  const [cardioPrescription, setCardioPrescription] =
    useState<CardioPrescription | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [setCursor, setSetCursor] = useState<
    Record<string, number>
  >({});
  const [setDrafts, setSetDrafts] = useState<Record<string, SetDraft>>({});
  const [completedSets, setCompletedSets] = useState<
    Record<string, boolean>
  >({});
  const [restRemaining, setRestRemaining] = useState(0);
  const [restTotal, setRestTotal] = useState(0);
  const [restAction, setRestAction] =
    useState<RestAction>(null);
  const [seriesMotion, setSeriesMotion] = useState<
    "up" | "down" | null
  >(null);
  const [changePosition, setChangePosition] = useState(1);
  const [session, setSession] =
    useState<SessionState>(null);
  const [sessionStartedAt, setSessionStartedAt] =
    useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [titleExpanded, setTitleExpanded] = useState(false);
  const [finishMessage, setFinishMessage] =
    useState("");
  const [toast, setToast] = useState("");
  const [changeDirection, setChangeDirection] =
    useState<ChangeDirection>("next");
  const [changingExercise, setChangingExercise] =
    useState(false);
  const [changeLabel, setChangeLabel] = useState("");

  const sessionPromise = useRef<
    Promise<NonNullable<SessionState>> | null
  >(null);
  const changeTimer = useRef<number | null>(null);
  const restActionTimer = useRef<number | null>(null);
  const seriesMotionTimer = useRef<number | null>(null);
  const finishRedirectTimer = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();

  const current = exercises[exerciseIndex];
  const nextExercise = exercises[exerciseIndex + 1];

  const loadWorkout = async () => {
    if (!user) return;

    setViewState("loading");
    setErrorMessage("");

    const result = await loadAssignedWorkout(user.id);

    if (result.status === "ready") {
      setPlan(result.plan);
      setExercises(result.exercises);
      setExerciseIndex(0);
      setSetDrafts(
        Object.fromEntries(
          result.exercises.flatMap((exercise) =>
            Array.from({ length: exercise.sets }, (_, index) => [
              setDraftKey(exercise.id, index + 1),
              { loadKg: exercise.initialLoadKg, reps: exercise.repsMax } satisfies SetDraft,
            ]),
          ),
        ),
      );
      setSetCursor(
        Object.fromEntries(
          result.exercises.map((exercise) => [
            exercise.id,
            1,
          ]),
        ),
      );
      setCompletedSets({});
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
  };

  useEffect(() => {
    if (!user) return;
    void loadWorkout();
    void loadActiveWorkoutCardioPrescription(user.id).then(
      setCardioPrescription,
    );
  }, [user?.id]);

  useEffect(() => {
    const syncScale = () => {
      const viewport = window.visualViewport;
      const width =
        viewport?.width ?? window.innerWidth;
      const height =
        viewport?.height ?? window.innerHeight;

      const scale = Math.min(
        (width - 8) / ARTBOARD_WIDTH,
        (height - 8) / ARTBOARD_HEIGHT,
        1.08,
      );

      document.documentElement.style.setProperty(
        "--workout-viewport-height",
        `${Math.round(height)}px`,
      );
      document.documentElement.style.setProperty(
        "--workout-artboard-scale",
        String(Math.max(0.55, scale)),
      );
    };

    syncScale();
    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", syncScale);
    window.addEventListener("resize", syncScale);
    window.addEventListener(
      "orientationchange",
      syncScale,
    );

    return () => {
      viewport?.removeEventListener(
        "resize",
        syncScale,
      );
      window.removeEventListener("resize", syncScale);
      window.removeEventListener(
        "orientationchange",
        syncScale,
      );
    };
  }, []);

  useEffect(() => {
    if (restRemaining <= 0) return;
    const timer = window.setInterval(() => {
      setRestRemaining((remaining) =>
        Math.max(0, remaining - 1),
      );
    }, 1000);
    return () => window.clearInterval(timer);
  }, [restRemaining]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(
      () => setToast(""),
      2200,
    );
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(
    () => () => {
      if (changeTimer.current) {
        window.clearTimeout(changeTimer.current);
      }
      if (restActionTimer.current) {
        window.clearTimeout(restActionTimer.current);
      }
      if (seriesMotionTimer.current) {
        window.clearTimeout(seriesMotionTimer.current);
      }
      if (finishRedirectTimer.current) {
        window.clearTimeout(finishRedirectTimer.current);
      }
    },
    [],
  );

  const currentSet = current
    ? setCursor[current.id] ?? 1
    : 1;
  const currentDraft = current
    ? setDrafts[setDraftKey(current.id, currentSet)] ?? {
        loadKg: current.initialLoadKg,
        reps: current.repsMax,
      }
    : { loadKg: 0, reps: 0 };
  const currentLoad = currentDraft.loadKg;
  const currentReps = currentDraft.reps;

  const totalSetCount = useMemo(
    () =>
      exercises.reduce(
        (total, exercise) => total + exercise.sets,
        0,
      ),
    [exercises],
  );

  const completedSetCount = useMemo(
    () =>
      Object.values(completedSets).filter(Boolean)
        .length,
    [completedSets],
  );

  const completedExerciseCount = useMemo(
    () =>
      exercises.filter((exercise) =>
        Array.from(
          { length: exercise.sets },
          (_, index) =>
            completedSets[`${exercise.id}:${index + 1}`],
        ).every(Boolean),
      ).length,
    [completedSets, exercises],
  );

  const completionPercentage = useMemo(
    () =>
      totalSetCount
        ? Math.round(
            (completedSetCount / totalSetCount) *
              100,
          )
        : 0,
    [completedSetCount, totalSetCount],
  );

  if (authLoading) return <LoadingSplash />;
  if (!user) return <Navigate to="/login" replace />;
  if (landingPath !== "/menu-teste") {
    return <Navigate to={landingPath} replace />;
  }
  if (viewState === "loading") {
    return <LoadingSplash />;
  }

  const ensureSession = async () => {
    if (session) return session;
    if (sessionPromise.current) {
      return await sessionPromise.current;
    }

    const promise = startWorkoutSession(
      user.id,
      plan?.id ?? null,
    );

    sessionPromise.current = promise;
    const created = await promise;
    sessionPromise.current = null;
    setSession(created);
    setSessionStartedAt((started) => started ?? Date.now());
    return created;
  };

  const chooseSet = (delta: number) => {
    if (!current || restRemaining > 0 || seriesMotion) return;

    const motion = delta > 0 ? "up" : "down";
    setSeriesMotion(motion);

    window.setTimeout(() => {
      setSetCursor((previous) => ({
        ...previous,
        [current.id]: clamp(
          (previous[current.id] ?? 1) + delta,
          1,
          current.sets,
        ),
      }));
    }, 105);

    if (seriesMotionTimer.current) {
      window.clearTimeout(seriesMotionTimer.current);
    }
    seriesMotionTimer.current = window.setTimeout(
      () => setSeriesMotion(null),
      360,
    );
  };

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

  const goToExercise = (
    index: number,
    direction?: ChangeDirection,
  ) => {
    const target = clamp(
      index,
      0,
      Math.max(0, exercises.length - 1),
    );

    if (target === exerciseIndex || changingExercise) return;

    const nextDirection =
      direction ??
      (target > exerciseIndex ? "next" : "previous");
    const targetExercise = exercises[target];

    setChangeDirection(nextDirection);
    setChangeLabel(targetExercise?.name ?? "Próximo exercício");
    setChangePosition(target + 1);
    setChangingExercise(true);
    setRestRemaining(0);
    setRestTotal(0);
    setRestAction(null);
    if (restActionTimer.current) {
      window.clearTimeout(restActionTimer.current);
      restActionTimer.current = null;
    }

    if (changeTimer.current) {
      window.clearTimeout(changeTimer.current);
    }

    changeTimer.current = window.setTimeout(() => {
      setExerciseIndex(target);
      window.setTimeout(() => {
        setChangingExercise(false);
        setChangeLabel("");
      }, 470);
    }, 390);
  };

  const finishWorkout = async (
    updatedCompletedCount = completedSetCount,
  ) => {
    if (!plan || busy) return;

    setBusy(true);
    try {
      const activeSession = await ensureSession();
      const startedAt = sessionStartedAt ?? Date.now();
      const durationSeconds = Math.max(
        1,
        Math.round((Date.now() - startedAt) / 1000),
      );
      const percentage = totalSetCount
        ? Math.round((updatedCompletedCount / totalSetCount) * 100)
        : 0;

      const result = await finishWorkoutSession({
        userId: user.id,
        planId: plan.id,
        sessionId: activeSession.id,
        localSession: activeSession.local,
        simpleWorkout: false,
        completionPercentage: percentage,
        durationSeconds,
        completedSets: updatedCompletedCount,
        totalSets: totalSetCount,
      });

      if (result.validForRanking) {
        setFinishMessage(
          "Treino concluído, salvo no seu perfil e registrado no ranking da academia.",
        );
      } else if (result.saved) {
        setFinishMessage(
          "Treino salvo no seu histórico. Para pontuar no ranking, complete pelo menos 70% do plano.",
        );
      } else {
        setFinishMessage(
          "O treino terminou, mas o banco ainda não confirmou o registro. Toque em concluir novamente antes de sair.",
        );
      }

      if (cardioPrescription?.timing === "after" && result.saved) {
        setFinishMessage((message) =>
          `${message} Abrindo agora o cardio indicado pelo professor.`,
        );
      }

      if (result.saved) {
        performHaptic(user.id, [55, 28, 70]);
        if (!reduceMotion) {
          confetti({ particleCount: 90, spread: 74, startVelocity: 34, origin: { y: 0.72 }, disableForReducedMotion: true });
        }
      }
      setFinishOpen(true);

      if (cardioPrescription?.timing === "after" && result.saved) {
        if (finishRedirectTimer.current) {
          window.clearTimeout(finishRedirectTimer.current);
        }
        finishRedirectTimer.current = window.setTimeout(
          () => navigate("/cardio"),
          1600,
        );
      }
    } catch {
      setFinishMessage(
        "Não conseguimos confirmar o registro deste treino. Tente concluir novamente antes de sair.",
      );
      setFinishOpen(true);
    } finally {
      setBusy(false);
    }
  };

  const completeRestAction = (
    action: RestAction = restAction,
  ) => {
    if (!action) return;

    if (restActionTimer.current) {
      window.clearTimeout(restActionTimer.current);
      restActionTimer.current = null;
    }

    const finishedNaturally = restRemaining <= 1;
    setRestRemaining(0);
    setRestTotal(0);
    setRestAction(null);

    if (finishedNaturally) performHaptic(user.id, [72, 28, 72]);

    if (action.kind === "set") {
      setSetCursor((previous) => ({
        ...previous,
        [action.exerciseId]: action.nextSet,
      }));
      setToast(`Descanso concluído. Série ${action.nextSet} liberada.`);
      return;
    }

    goToExercise(action.targetIndex, "next");
  };

  const startRest = (
    seconds: number,
    action: Exclude<RestAction, null>,
  ) => {
    const duration = Math.max(0, Math.round(seconds));

    if (duration <= 0) {
      completeRestAction(action);
      return;
    }

    if (restActionTimer.current) {
      window.clearTimeout(restActionTimer.current);
    }

    setRestTotal(duration);
    setRestRemaining(duration);
    setRestAction(action);

    restActionTimer.current = window.setTimeout(
      () => completeRestAction(action),
      duration * 1000,
    );
  };

  const concludeSet = async () => {
    if (!current || busy || restRemaining > 0) return;
    setBusy(true);
    const completedKey = setDraftKey(current.id, currentSet);
    const wasCompleted = Boolean(completedSets[completedKey]);
    try {
      const activeSession = await ensureSession();
      await saveCompletedSet({
        sessionId: activeSession.id,
        localSession: activeSession.local,
        exerciseId: current.id,
        simpleExercise: false,
        setNumber: currentSet,
        loadKg: currentLoad,
        reps: currentReps,
      });
      const updatedCompletedCount = wasCompleted ? completedSetCount : completedSetCount + 1;
      setCompletedSets((previous) => ({ ...previous, [completedKey]: true }));
      performHaptic(user.id, [32]);
      const isFinalSet = currentSet === current.sets && exerciseIndex === exercises.length - 1;
      if (!reduceMotion && !isFinalSet) {
        confetti({ particleCount: 16, spread: 42, startVelocity: 18, scalar: 0.65, origin: { x: 0.5, y: 0.82 }, disableForReducedMotion: true });
      }
      if (currentSet < current.sets) {
        setToast(`Série ${currentSet}/${current.sets} concluída. Descanso iniciado.`);
        startRest(current.restSeconds, { kind: "set", exerciseId: current.id, nextSet: currentSet + 1 });
        return;
      }
      if (exerciseIndex < exercises.length - 1) {
        setToast(`${current.name} concluído. Descanso iniciado.`);
        startRest(current.restSeconds, { kind: "exercise", targetIndex: exerciseIndex + 1 });
        return;
      }
      await finishWorkout(updatedCompletedCount);
    } catch {
      setToast("Não foi possível salvar esta série. Confira sua conexão e tente novamente.");
    } finally {
      setBusy(false);
    }
  };

  if (viewState === "empty") {
    return (
      <div className="workout-screen">
        <div className="workout-background" />
        <main className="workout-empty-shell">
          <header className="workout-empty-header">
            <button
              type="button"
              className="workout-round-button"
              onClick={() => navigate("/menu-teste")}
              aria-label="Voltar"
            >
              <WorkoutBackIcon />
            </button>

            <div className="workout-header-brand">
              <span className="workout-header-logo-crop">
                <img
                  src="/accqua-logo-header.png"
                  alt="Accqua Sports"
                />
              </span>
              <i />
              <strong>MEU TREINO</strong>
            </div>

            <div className="workout-topbar-actions">
              <button
                type="button"
                className="workout-mode-switch-button"
                onClick={() => navigate("/cardio")}
                aria-label="Ir para cardio"
                title="Ir para cardio"
              >
                <CardioSwapIcon />
                <small>CARDIO</small>
              </button>

              <button
                type="button"
                className="workout-round-button calendar"
                onClick={() => setCalendarOpen(true)}
                aria-label="Calendário"
              >
                <WorkoutCalendarIcon />
              </button>
            </div>
          </header>

          <section className="workout-empty-card">
            <div className="workout-empty-icon">
              <WorkoutRefreshIcon size={35} />
            </div>
            <span>EM BREVE</span>
            <h1>
              Seu professor ainda não liberou seu treino
            </h1>
            <p>
              Assim que o professor criar e ativar seu
              plano, exercícios, séries, repetições,
              cargas, GIFs, vídeos ou links aparecerão
              automaticamente aqui.
            </p>

            {errorMessage ? (
              <div className="workout-empty-note">
                {errorMessage}
              </div>
            ) : null}

            <button
              type="button"
              className="workout-empty-primary"
              onClick={() => void loadWorkout()}
            >
              Verificar novamente
            </button>
            <button
              type="button"
              className="workout-empty-secondary"
              onClick={() => navigate("/menu-teste")}
            >
              Voltar ao menu
            </button>

            <small>
              A equipe ACCQUA foi avisada de que seu treino ainda precisa ser montado.
            </small>
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
            <button
              type="button"
              className="workout-empty-primary"
              onClick={() => void loadWorkout()}
            >
              Tentar novamente
            </button>
            <button
              type="button"
              className="workout-empty-secondary"
              onClick={() => navigate("/menu-teste")}
            >
              Voltar ao menu
            </button>
          </section>
        </main>
      </div>
    );
  }

  if (!current || !plan) {
    return <LoadingSplash />;
  }

  return (
    <div className="workout-screen">
      <div className="workout-background" />

      <main className="workout-artboard">
        <header className="workout-topbar">
          <motion.button
            type="button"
            className="workout-round-button"
            onClick={() => setExitOpen(true)}
            whileTap={{ scale: 0.9 }}
            aria-label="Voltar"
          >
            <WorkoutBackIcon />
          </motion.button>

          <div className="workout-header-brand">
            <span className="workout-header-logo-crop">
              <img
                src="/accqua-logo-header.png"
                alt="Accqua Sports"
              />
            </span>
            <i />
            <motion.button
              type="button"
              className="workout-plan-title-button"
              onClick={() => setTitleExpanded((value) => !value)}
              whileTap={{ scale: 0.97 }}
              aria-expanded={titleExpanded}
              title={plan.name}
            >
              <strong>{planDisplayName(plan.name)}</strong>
            </motion.button>
            {titleExpanded ? (
              <div className="workout-plan-title-expanded" role="status">
                {planDisplayName(plan.name)}
              </div>
            ) : null}
          </div>

          <div className="workout-topbar-actions">
            <button
              type="button"
              className="workout-mode-switch-button"
              onClick={() => navigate("/cardio")}
              aria-label="Ir para cardio"
              title="Ir para cardio"
            >
              <CardioSwapIcon />
              <small>CARDIO</small>
            </button>

            <motion.button
              type="button"
              className="workout-pause-button"
              onClick={() => setExitOpen(true)}
              whileTap={{ scale: 0.94 }}
              aria-label="Pausar ou sair do treino"
            >
              PAUSAR
            </motion.button>

            <motion.button
              type="button"
              className="workout-round-button calendar"
              onClick={() => setCalendarOpen(true)}
              whileTap={{ scale: 0.9 }}
              aria-label="Abrir calendário de treinos"
            >
              <WorkoutCalendarIcon />
            </motion.button>
          </div>
        </header>

        <nav
          className="workout-exercise-dots"
          aria-label="Exercícios do treino"
        >
          {exercises.map((exercise, index) => (
            <button
              type="button"
              key={exercise.id}
              className={index === exerciseIndex ? "active" : ""}
              onClick={() => goToExercise(index)}
              aria-label={`Abrir ${exercise.name}`}
              title={exercise.name}
            />
          ))}
        </nav>

        <motion.div
          className={`workout-exercise-stage ${
            changingExercise ? "changing" : ""
          } direction-${changeDirection}`}
          key={current.id}
          initial={reduceMotion ? false : { x: changeDirection === "next" ? 30 : -30, opacity: 0.72 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
          drag={reduceMotion ? false : "x"}
          dragDirectionLock
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.16}
          onDragEnd={(_, info) => {
            if (Math.abs(info.offset.x) < 72 || changingExercise || restRemaining > 0) return;
            if (info.offset.x < 0 && exerciseIndex < exercises.length - 1) {
              goToExercise(exerciseIndex + 1, "next");
            } else if (info.offset.x > 0 && exerciseIndex > 0) {
              goToExercise(exerciseIndex - 1, "previous");
            }
          }}
        >
          <section className="workout-title-row">
            <div>
              <h1>{current.name}</h1>
              <p>
                {current.equipment ||
                  current.muscleGroup ||
                  "Exercício"}
              </p>
            </div>
            <strong className="workout-general-progress">
              <span>EXERCÍCIO</span>
              <b>{exerciseIndex + 1}</b>
              <small>de {exercises.length}</small>
            </strong>
          </section>

          <WorkoutMedia exercise={current} />

          <section
            className={`workout-series-control ${
              restRemaining > 0 ? "is-resting" : ""
            }`}
          >
            <motion.button
              type="button"
              className="workout-series-button"
              whileTap={{ scale: 0.86 }}
              onClick={() => chooseSet(-1)}
              disabled={
                currentSet <= 1 ||
                restRemaining > 0 ||
                Boolean(seriesMotion)
              }
              aria-label="Série anterior"
            >
              <WorkoutMinusIcon />
            </motion.button>

            <div
              className={`workout-series-ring ${
                restRemaining > 0 ? "rest-mode" : ""
              } ${
                seriesMotion ? `motion-${seriesMotion}` : ""
              }`}
              style={
                {
                  "--series-progress": `${
                    restRemaining > 0 && restTotal > 0
                      ? (restRemaining / restTotal) * 360
                      : (currentSet / current.sets) * 360
                  }deg`,
                } as CSSProperties
              }
            >
              {restRemaining > 0 ? (
                <>
                  <RestProgressRing remaining={restRemaining} total={restTotal} />
                  <div className="workout-rest-content">
                    <span>SÉRIE {currentSet}/{current.sets} CONCLUÍDA</span>
                    <strong>{formatRestTime(restRemaining)}</strong>
                    <small>
                      {restAction?.kind === "set"
                        ? "DESCANSO"
                        : "ANTES DO PRÓXIMO EXERCÍCIO"}
                    </small>
                    <motion.button
                      type="button"
                      onClick={() => completeRestAction()}
                      whileTap={{ scale: 0.92 }}
                    >
                      Pular descanso
                    </motion.button>
                  </div>
                </>
              ) : (
                <div className="workout-series-content">
                  <span>SÉRIE</span>
                  <strong>
                    {currentSet}
                    <small>/{current.sets}</small>
                  </strong>
                </div>
              )}
            </div>

            <motion.button
              type="button"
              className="workout-series-button workout-series-complete-button"
              whileTap={{ scale: 0.86 }}
              onClick={() => void concludeSet()}
              disabled={
                busy ||
                restRemaining > 0
              }
              aria-label="Concluir série e iniciar descanso"
            >
              <WorkoutPlusIcon />
            </motion.button>
          </section>

          <section className="workout-metrics">
            <article className="workout-editable-metric">
              <WorkoutRepeatIcon />
              <div>
                <span>Repetições</span>
                <label>
                  <input
                    type="number"
                    min="0"
                    max="999"
                    inputMode="numeric"
                    value={currentReps}
                    disabled={restRemaining > 0 || busy}
                    aria-label={`Repetições realizadas na série ${currentSet}`}
                    onChange={(event) =>
                      updateCurrentDraft({
                        reps: Math.max(0, Number(event.target.value) || 0),
                      })
                    }
                  />
                  <small>reps</small>
                </label>
              </div>
            </article>

            <article className="workout-editable-metric">
              <WorkoutWeightIcon />
              <div>
                <span>Carga</span>
                <label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    inputMode="decimal"
                    value={currentLoad}
                    disabled={restRemaining > 0 || busy}
                    aria-label={`Carga realizada na série ${currentSet}`}
                    onChange={(event) =>
                      updateCurrentDraft({
                        loadKg: Math.max(0, Number(event.target.value) || 0),
                      })
                    }
                  />
                  <small>kg</small>
                </label>
              </div>
            </article>

            <article className="workout-series-metric">
              <WorkoutCheckIcon />
              <div>
                <span>Séries</span>
                <strong>{currentSet}/{current.sets}</strong>
              </div>
            </article>
          </section>

          {nextExercise ? (
            <motion.button
              type="button"
              className="workout-next-card"
              onClick={() => goToExercise(exerciseIndex + 1, "next")}
              whileTap={{ scale: 0.985 }}
            >
              <div className="workout-next-copy">
                <span>Próximo exercício</span>
                <strong>{nextExercise.name}</strong>
                <small>{nextExercise.equipment || nextExercise.muscleGroup}</small>
              </div>
              <WorkoutMedia exercise={nextExercise} compact />
              <motion.span
                className="workout-next-button"
                whileTap={{ scale: 0.82 }}
              >
                <WorkoutNextIcon />
              </motion.span>
            </motion.button>
          ) : (
            <div className="workout-next-card workout-last-exercise-note">
              <div className="workout-next-copy">
                <span>Último exercício</span>
                <strong>Conclua a última série</strong>
                <small>O botão abaixo finalizará o treino.</small>
              </div>
              <div className="workout-next-finish-icon">
                <WorkoutCheckIcon />
              </div>
            </div>
          )}

          <motion.button
            type="button"
            whileTap={{ scale: 0.975 }}
            className={`workout-conclude-button ${
              restRemaining > 0 ? "is-resting" : ""
            }`}
            onClick={() => void concludeSet()}
            disabled={busy || restRemaining > 0}
          >
            <span>
              {busy
                ? "Salvando..."
                : restRemaining > 0
                  ? "Descanso em andamento"
                  : exerciseIndex === exercises.length - 1 &&
                      currentSet === current.sets
                    ? "Finalizar treino"
                    : "Concluir série"}
            </span>
            <i>
              <WorkoutCheckIcon />
            </i>
          </motion.button>
        </motion.div>
      </main>

      {changingExercise ? (
        <div
          className={`workout-change-banner direction-${changeDirection}`}
          role="status"
        >
          <div className="workout-change-logo">
            <img
              src="/accqua-logo-header.png"
              alt=""
              aria-hidden="true"
            />
            <i />
          </div>
          <span>
            {changeDirection === "next"
              ? "PRÓXIMO EXERCÍCIO"
              : "EXERCÍCIO ANTERIOR"}
          </span>

          {exercises[changePosition - 1] ? (
            <div className="workout-change-preview">
              <WorkoutMedia
                exercise={exercises[changePosition - 1]}
                compact
              />
            </div>
          ) : null}

          <strong>{changeLabel}</strong>
          <small>
            {changePosition} DE {exercises.length}
          </small>
          <b />
        </div>
      ) : null}

      <WorkoutCalendarSheet
        open={calendarOpen}
        userId={user.id}
        plan={plan}
        exercises={exercises}
        currentExerciseIndex={exerciseIndex}
        completedExerciseCount={completedExerciseCount}
        onClose={() => setCalendarOpen(false)}
        onSelectExercise={(index) => goToExercise(index)}
      />

      {exitOpen ? (
        <div
          className="workout-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Pausar ou sair do treino"
        >
          <section className="workout-modal workout-exit-modal">
            <span className="workout-modal-kicker">PAUSAR TREINO</span>
            <h2>Quer sair agora?</h2>
            <p>
              As séries já confirmadas continuam salvas. Séries ainda não
              confirmadas não entram no histórico.
            </p>
            <motion.button
              type="button"
              className="workout-modal-primary"
              onClick={() => {
                setExitOpen(false);
                navigate("/menu-teste");
              }}
              whileTap={{ scale: 0.97 }}
            >
              Pausar e sair
            </motion.button>
            <motion.button
              type="button"
              className="workout-modal-secondary"
              onClick={() => setExitOpen(false)}
              whileTap={{ scale: 0.97 }}
            >
              Continuar treino
            </motion.button>
          </section>
        </div>
      ) : null}

      {finishOpen ? (
        <div
          className="workout-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Treino concluído"
        >
          <section className="workout-modal finish-modal">
            <div className="workout-finish-check">
              <WorkoutCheckIcon size={35} />
            </div>
            <span className="workout-modal-kicker">
              TREINO CONCLUÍDO
            </span>
            <h2>
              Bom trabalho,{" "}
              {profile?.fullName?.split(" ")[0] || "Aluno"}!
            </h2>
            <p>{finishMessage}</p>
            <div className="workout-finish-stats">
              <div>
                <span>Conclusão</span>
                <strong>{completionPercentage}%</strong>
              </div>
              <div>
                <span>Séries</span>
                <strong>
                  {completedSetCount}/{totalSetCount}
                </strong>
              </div>
            </div>
            <button
              type="button"
              className="workout-modal-primary"
              onClick={() => {
                if (finishRedirectTimer.current) {
                  window.clearTimeout(finishRedirectTimer.current);
                }
                navigate(
                  cardioPrescription?.timing === "after"
                    ? "/cardio"
                    : "/menu-teste",
                );
              }}
            >
              {cardioPrescription?.timing === "after"
                ? "Continuar no cardio"
                : "Voltar ao menu"}
            </button>
          </section>
        </div>
      ) : null}

      {toast ? (
        <motion.div
          className="workout-toast"
          role="status"
          initial={reduceMotion ? false : { y: 18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 12, opacity: 0 }}
        >
          {toast}
        </motion.div>
      ) : null}
    </div>
  );
}
