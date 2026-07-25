import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  WorkoutCrownIcon,
  WorkoutMinusIcon,
  WorkoutNextIcon,
  WorkoutPlusIcon,
  WorkoutRefreshIcon,
  WorkoutRepeatIcon,
  WorkoutStopwatchIcon,
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
  const [loads, setLoads] = useState<
    Record<string, number>
  >({});
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
  const [loadMotion, setLoadMotion] = useState<
    "up" | "down" | null
  >(null);
  const [changePosition, setChangePosition] = useState(1);
  const [session, setSession] =
    useState<SessionState>(null);
  const [sessionStartedAt, setSessionStartedAt] =
    useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [loadOpen, setLoadOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
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
  const loadMotionTimer = useRef<number | null>(null);
  const finishRedirectTimer = useRef<number | null>(null);

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
      setLoads(
        Object.fromEntries(
          result.exercises.map((exercise) => [
            exercise.id,
            exercise.initialLoadKg,
          ]),
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
      if (loadMotionTimer.current) {
        window.clearTimeout(loadMotionTimer.current);
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
  const currentLoad = current
    ? loads[current.id] ?? current.initialLoadKg
    : 0;

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

  const chooseLoad = (delta: number) => {
    if (!current || loadMotion) return;

    const motion = delta > 0 ? "up" : "down";
    setLoadMotion(motion);

    window.setTimeout(() => {
      setLoads((previous) => ({
        ...previous,
        [current.id]: Math.max(
          0,
          Number(
            (
              (previous[current.id] ??
                current.initialLoadKg) + delta
            ).toFixed(1),
          ),
        ),
      }));
    }, 110);

    if (loadMotionTimer.current) {
      window.clearTimeout(loadMotionTimer.current);
    }
    loadMotionTimer.current = window.setTimeout(
      () => setLoadMotion(null),
      360,
    );
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
    if (!plan) return;

    setBusy(true);
    const activeSession = await ensureSession();
    const startedAt =
      sessionStartedAt ?? Date.now();
    const durationSeconds = Math.max(
      1,
      Math.round((Date.now() - startedAt) / 1000),
    );
    const percentage = totalSetCount
      ? Math.round(
          (updatedCompletedCount / totalSetCount) *
            100,
        )
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

    setBusy(false);

    if (result.validForRanking) {
      setFinishMessage(
        "Treino concluído e registrado no ranking da academia.",
      );
    } else if (result.saved) {
      setFinishMessage(
        "Treino salvo. Para pontuar no ranking, complete pelo menos 70% do plano.",
      );
    } else {
      setFinishMessage(
        "O treino foi concluído, mas não conseguimos salvar no seu histórico. Tente novamente antes de sair.",
      );
    }

    if (cardioPrescription?.timing === "after") {
      setFinishMessage((message) =>
        `${message} Abrindo agora o cardio indicado pelo professor.`,
      );
    }

    setFinishOpen(true);

    if (cardioPrescription?.timing === "after") {
      if (finishRedirectTimer.current) {
        window.clearTimeout(finishRedirectTimer.current);
      }
      finishRedirectTimer.current = window.setTimeout(
        () => navigate("/cardio"),
        1600,
      );
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

    setRestRemaining(0);
    setRestTotal(0);
    setRestAction(null);

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
    const activeSession = await ensureSession();
    const completedKey = `${current.id}:${currentSet}`;
    const wasCompleted = Boolean(
      completedSets[completedKey],
    );

    await saveCompletedSet({
      sessionId: activeSession.id,
      localSession: activeSession.local,
      exerciseId: current.id,
      simpleExercise: false,
      setNumber: currentSet,
      loadKg: currentLoad,
      reps: current.repsMax,
    });

    const updatedCompletedCount = wasCompleted
      ? completedSetCount
      : completedSetCount + 1;

    setCompletedSets((previous) => ({
      ...previous,
      [completedKey]: true,
    }));

    setBusy(false);

    if (currentSet < current.sets) {
      setToast(
        `Série ${currentSet} concluída. O descanso começou automaticamente.`,
      );
      startRest(current.restSeconds, {
        kind: "set",
        exerciseId: current.id,
        nextSet: currentSet + 1,
      });
      return;
    }

    performHaptic(user?.id ?? "", [42, 24, 42]);

    if (exerciseIndex < exercises.length - 1) {
      setToast(
        `${current.name} concluído. Descanse antes do próximo exercício.`,
      );
      startRest(current.restSeconds, {
        kind: "exercise",
        targetIndex: exerciseIndex + 1,
      });
      return;
    }

    await finishWorkout(updatedCompletedCount);
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
                  src="/accqua-logo-oficial.png"
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
          <button
            type="button"
            className="workout-round-button"
            onClick={() => navigate("/menu-teste")}
            aria-label="Voltar ao menu"
          >
            <WorkoutBackIcon />
          </button>

          <div className="workout-header-brand">
            <span className="workout-header-logo-crop">
              <img
                src="/accqua-logo-oficial.png"
                alt="Accqua Sports"
              />
            </span>
            <i />
            <strong>{planDisplayName(plan.name)}</strong>
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
              aria-label="Abrir calendário de treinos"
            >
              <WorkoutCalendarIcon />
            </button>
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

        <div
          className={`workout-exercise-stage ${
            changingExercise ? "changing" : ""
          } direction-${changeDirection}`}
          key={current.id}
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
            <strong>
              <b>{exerciseIndex + 1}</b>/
              {exercises.length}
            </strong>
          </section>

          <WorkoutMedia exercise={current} />

          <section
            className={`workout-series-control ${
              restRemaining > 0 ? "is-resting" : ""
            }`}
          >
            <button
              type="button"
              className="workout-series-button"
              onClick={() => chooseSet(-1)}
              disabled={
                currentSet <= 1 ||
                restRemaining > 0 ||
                Boolean(seriesMotion)
              }
              aria-label="Série anterior"
            >
              <WorkoutMinusIcon />
            </button>

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
                } as React.CSSProperties
              }
            >
              {restRemaining > 0 ? (
                <div className="workout-rest-content">
                  <span>DESCANSO</span>
                  <strong>{formatRestTime(restRemaining)}</strong>
                  <small>
                    {restAction?.kind === "set"
                      ? `PRÓXIMA SÉRIE ${restAction.nextSet}/${current.sets}`
                      : "DEPOIS: PRÓXIMO EXERCÍCIO"}
                  </small>
                  <button
                    type="button"
                    onClick={() => completeRestAction()}
                  >
                    Pular descanso
                  </button>
                </div>
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

            <button
              type="button"
              className="workout-series-button workout-series-complete-button"
              onClick={() => void concludeSet()}
              disabled={
                busy ||
                restRemaining > 0
              }
              aria-label="Concluir série e iniciar descanso"
            >
              <WorkoutPlusIcon />
            </button>
          </section>

          <section className="workout-metrics">
            <article>
              <WorkoutRepeatIcon />
              <div>
                <span>Repetições</span>
                <strong>
                  {current.repsMin}–{current.repsMax}
                </strong>
              </div>
            </article>

            <button
              type="button"
              className={`workout-load-card ${
                loadMotion ? `motion-${loadMotion}` : ""
              }`}
              onClick={() => setLoadOpen(true)}
            >
              <WorkoutWeightIcon />
              <div className="workout-load-copy">
                <span>Carga</span>
                <strong className="workout-load-value">
                  <b>
                    {currentLoad % 1 === 0
                      ? currentLoad.toFixed(0)
                      : currentLoad.toFixed(1)}
                  </b>
                  <small>kg</small>
                </strong>
              </div>
              <WorkoutCrownIcon className="workout-load-crown" />
            </button>

            <article>
              <WorkoutStopwatchIcon />
              <div>
                <span>Descanso</span>
                <strong>
                  {restRemaining > 0
                    ? formatRestTime(restRemaining)
                    : `${current.restSeconds}s`}
                </strong>
              </div>
            </article>
          </section>

          <button
            type="button"
            className="workout-next-card"
            onClick={() =>
              nextExercise
                ? goToExercise(exerciseIndex + 1, "next")
                : setToast("Este é o último exercício.")
            }
          >
            <div className="workout-next-copy">
              <span>Próximo exercício</span>
              <strong>
                {nextExercise
                  ? nextExercise.name
                  : "Finalizar treino"}
              </strong>
              <small>
                {nextExercise
                  ? nextExercise.equipment ||
                    nextExercise.muscleGroup
                  : "Você chegou ao final"}
              </small>
            </div>

            {nextExercise ? (
              <WorkoutMedia
                exercise={nextExercise}
                compact
              />
            ) : (
              <div className="workout-next-finish-icon">
                <WorkoutCheckIcon />
              </div>
            )}

            <span className="workout-next-button">
              <WorkoutNextIcon />
            </span>
          </button>

          <button
            type="button"
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
                  : "Concluir série"}
            </span>
            <i>
              <WorkoutCheckIcon />
            </i>
          </button>
        </div>
      </main>

      {changingExercise ? (
        <div
          className={`workout-change-banner direction-${changeDirection}`}
          role="status"
        >
          <div className="workout-change-logo">
            <img
              src="/accqua-logo-oficial.png"
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

      {loadOpen ? (
        <div
          className="workout-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Ajustar carga"
        >
          <section className="workout-modal load-modal">
            <button
              type="button"
              className="workout-modal-close"
              onClick={() => setLoadOpen(false)}
              aria-label="Fechar ajuste de carga"
            >
              <span className="workout-close-icon" aria-hidden="true" />
            </button>
            <span className="workout-modal-kicker">
              CARGA DA SÉRIE
            </span>
            <h2>{current.name}</h2>
            <div className="workout-load-editor">
              <button
                type="button"
                onClick={() => chooseLoad(-1)}
              >
                <WorkoutMinusIcon />
              </button>
              <label
                className={`workout-load-editor-value ${
                  loadMotion ? `motion-${loadMotion}` : ""
                }`}
              >
                <span className="workout-load-editor-number">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={currentLoad}
                    aria-label="Carga em quilogramas"
                    onChange={(event) =>
                      setLoads((previous) => ({
                        ...previous,
                        [current.id]: Math.max(
                          0,
                          Number(event.target.value) || 0,
                        ),
                      }))
                    }
                  />
                </span>
                <span className="workout-load-editor-unit">kg</span>
              </label>
              <button
                type="button"
                onClick={() => chooseLoad(1)}
              >
                <WorkoutPlusIcon />
              </button>
            </div>
            <p>
              A carga registrada será salva junto com a
              série concluída.
            </p>
            <button
              type="button"
              className="workout-modal-primary"
              onClick={() => setLoadOpen(false)}
            >
              Usar esta carga
            </button>
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
        <div className="workout-toast" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
