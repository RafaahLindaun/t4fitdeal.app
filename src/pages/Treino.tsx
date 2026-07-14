import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import LoadingSplash from "../components/LoadingSplash";
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
  getSimpleWorkout,
  loadAssignedWorkout,
  saveCompletedSet,
  startWorkoutSession,
  type WorkoutExerciseRecord,
  type WorkoutPlanRecord,
} from "../lib/workout";
import "./treino.css";

const ARTBOARD_WIDTH = 450;
const ARTBOARD_HEIGHT = 844;

type ViewState = "loading" | "empty" | "ready" | "error";

type SessionState = {
  id: string;
  local: boolean;
} | null;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function planDisplayName(name: string) {
  const clean = name.trim();
  if (!clean) return "TREINO";
  return clean.toUpperCase();
}

function formatReviewDate(value: string) {
  if (!value) return "Sem data de revisão";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR").format(date);
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
  const [session, setSession] =
    useState<SessionState>(null);
  const [sessionStartedAt, setSessionStartedAt] =
    useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [loadOpen, setLoadOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [finishMessage, setFinishMessage] =
    useState("");
  const [toast, setToast] = useState("");

  const sessionPromise = useRef<
    Promise<NonNullable<SessionState>> | null
  >(null);

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

  const useSimpleWorkout = () => {
    const simple = getSimpleWorkout();
    setPlan(simple.plan);
    setExercises(simple.exercises);
    setLoads(
      Object.fromEntries(
        simple.exercises.map((exercise) => [
          exercise.id,
          exercise.initialLoadKg,
        ]),
      ),
    );
    setSetCursor(
      Object.fromEntries(
        simple.exercises.map((exercise) => [
          exercise.id,
          1,
        ]),
      ),
    );
    setCompletedSets({});
    setExerciseIndex(0);
    setSession(null);
    setSessionStartedAt(null);
    sessionPromise.current = null;
    setViewState("ready");
  };

  const ensureSession = async () => {
    if (session) return session;
    if (sessionPromise.current) {
      return await sessionPromise.current;
    }

    const promise = startWorkoutSession(
      user.id,
      plan?.isSimple ? null : plan?.id ?? null,
    );

    sessionPromise.current = promise;
    const created = await promise;
    sessionPromise.current = null;
    setSession(created);
    setSessionStartedAt((started) => started ?? Date.now());
    return created;
  };

  const chooseSet = (delta: number) => {
    if (!current) return;

    setSetCursor((previous) => ({
      ...previous,
      [current.id]: clamp(
        (previous[current.id] ?? 1) + delta,
        1,
        current.sets,
      ),
    }));
  };

  const chooseLoad = (delta: number) => {
    if (!current) return;
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
  };

  const goToExercise = (index: number) => {
    const target = clamp(
      index,
      0,
      Math.max(0, exercises.length - 1),
    );
    setExerciseIndex(target);
    setRestRemaining(0);
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
      sessionId: activeSession.id,
      localSession: activeSession.local,
      simpleWorkout: plan.isSimple,
      completionPercentage: percentage,
      durationSeconds,
    });

    setBusy(false);

    if (plan.isSimple) {
      setFinishMessage(
        "Treino simples concluído. Ele não substitui o treino do professor e não pontua no ranking.",
      );
    } else if (result.validForRanking) {
      setFinishMessage(
        "Treino concluído e registrado no ranking da academia.",
      );
    } else if (result.saved) {
      setFinishMessage(
        "Treino salvo. Para pontuar no ranking, complete pelo menos 70% do plano e treine por 15 minutos.",
      );
    } else {
      setFinishMessage(
        "O treino foi concluído neste aparelho, mas não conseguimos salvar no Supabase.",
      );
    }

    setFinishOpen(true);
  };

  const concludeSet = async () => {
    if (!current || busy) return;

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
      simpleExercise: current.isSimple,
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

    setRestRemaining(current.restSeconds);
    setBusy(false);

    if (currentSet < current.sets) {
      setSetCursor((previous) => ({
        ...previous,
        [current.id]: currentSet + 1,
      }));
      setToast(
        `Série ${currentSet} concluída. Descanse ${current.restSeconds}s.`,
      );
      return;
    }

    if (exerciseIndex < exercises.length - 1) {
      setToast(
        `${current.name} concluído. Próximo exercício liberado.`,
      );
      window.setTimeout(
        () => goToExercise(exerciseIndex + 1),
        320,
      );
      return;
    }

    await finishWorkout(updatedCompletedCount);
  };

  const leaveFinishedWorkout = () => {
    setFinishOpen(false);
    navigate("/menu-teste");
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
              <img
                src="/accqua-logo-text.png"
                alt="Accqua Sports Academia"
              />
              <span />
              <strong>MEU TREINO</strong>
            </div>

            <button
              type="button"
              className="workout-round-button calendar"
              onClick={() => setPlanOpen(true)}
              aria-label="Informações"
            >
              <WorkoutCalendarIcon />
            </button>
          </header>

          <section className="workout-empty-card">
            <div className="workout-empty-icon">
              <WorkoutRefreshIcon size={35} />
            </div>
            <span>EM BREVE</span>
            <h1>
              Seu professor ainda não liberou seu
              treino
            </h1>
            <p>
              Assim que o professor criar e ativar seu
              plano, todos os exercícios, séries,
              repetições, cargas, GIFs, vídeos ou links
              aparecerão automaticamente aqui.
            </p>

            {errorMessage ? (
              <div className="workout-empty-note">
                {errorMessage}
              </div>
            ) : null}

            <button
              type="button"
              className="workout-empty-primary"
              onClick={useSimpleWorkout}
            >
              Fazer um treino simples
            </button>
            <button
              type="button"
              className="workout-empty-secondary"
              onClick={() => navigate("/menu-teste")}
            >
              Voltar ao menu
            </button>

            <small>
              O treino simples é opcional, não substitui
              o plano do professor e não pontua no
              ranking.
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
            <div className="workout-empty-icon error">
              !
            </div>
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
            <img
              src="/accqua-logo-text.png"
              alt="Accqua Sports Academia"
            />
            <span />
            <strong>{planDisplayName(plan.name)}</strong>
          </div>

          <button
            type="button"
            className="workout-round-button calendar"
            onClick={() => setPlanOpen(true)}
            aria-label="Informações do treino"
          >
            <WorkoutCalendarIcon />
          </button>
        </header>

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

        <section className="workout-series-control">
          <button
            type="button"
            className="workout-series-button"
            onClick={() => chooseSet(-1)}
            disabled={currentSet <= 1}
            aria-label="Série anterior"
          >
            <WorkoutMinusIcon />
          </button>

          <div
            className="workout-series-ring"
            style={
              {
                "--series-progress": `${
                  (currentSet / current.sets) * 360
                }deg`,
              } as React.CSSProperties
            }
          >
            <div>
              <span>SÉRIE</span>
              <strong>
                {currentSet}
                <small>/{current.sets}</small>
              </strong>
            </div>
          </div>

          <button
            type="button"
            className="workout-series-button"
            onClick={() => chooseSet(1)}
            disabled={currentSet >= current.sets}
            aria-label="Próxima série"
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
            className="workout-load-card"
            onClick={() => setLoadOpen(true)}
          >
            <WorkoutWeightIcon />
            <div>
              <span>Carga</span>
              <strong>
                {currentLoad % 1 === 0
                  ? currentLoad.toFixed(0)
                  : currentLoad.toFixed(1)}{" "}
                kg
              </strong>
            </div>
            <WorkoutCrownIcon />
          </button>

          <article>
            <WorkoutStopwatchIcon />
            <div>
              <span>Descanso</span>
              <strong>
                {restRemaining > 0
                  ? `${restRemaining}s`
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
              ? goToExercise(exerciseIndex + 1)
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
          className="workout-conclude-button"
          onClick={() => void concludeSet()}
          disabled={busy}
        >
          <span>
            {busy ? "Salvando..." : "Concluir série"}
          </span>
          <i>
            <WorkoutCheckIcon />
          </i>
        </button>
      </main>

      {planOpen ? (
        <div
          className="workout-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Informações do treino"
        >
          <section className="workout-modal">
            <button
              type="button"
              className="workout-modal-close"
              onClick={() => setPlanOpen(false)}
            >
              ×
            </button>
            <span className="workout-modal-kicker">
              SEU PLANO
            </span>
            <h2>{plan.name}</h2>
            <div className="workout-plan-details">
              <div>
                <span>Foco</span>
                <strong>
                  {plan.focus || "Definido pelo professor"}
                </strong>
              </div>
              <div>
                <span>Versão</span>
                <strong>{plan.version}</strong>
              </div>
              <div>
                <span>Revisão</span>
                <strong>
                  {formatReviewDate(plan.reviewAt)}
                </strong>
              </div>
              <div>
                <span>Exercícios</span>
                <strong>{exercises.length}</strong>
              </div>
            </div>
            {plan.notes ? <p>{plan.notes}</p> : null}
            {plan.isSimple ? (
              <div className="workout-modal-warning">
                Este é um treino simples e não conta para o
                ranking.
              </div>
            ) : null}
            <button
              type="button"
              className="workout-modal-primary"
              onClick={() => setPlanOpen(false)}
            >
              Continuar treino
            </button>
          </section>
        </div>
      ) : null}

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
            >
              ×
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
              <label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={currentLoad}
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
                <span>kg</span>
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
            <h2>Bom trabalho, {profile?.fullName?.split(" ")[0] || "Aluno"}!</h2>
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
              onClick={leaveFinishedWorkout}
            >
              Voltar ao menu
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
