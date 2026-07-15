import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import LoadingSplash from "../components/LoadingSplash";
import {
  CardioBikeIcon,
  CardioCheckIcon,
  CardioClockIcon,
  CardioEllipticalIcon,
  CardioGoalIcon,
  CardioHistoryIcon,
  CardioMinusIcon,
  CardioPauseIcon,
  CardioPlayIcon,
  CardioPlusIcon,
  CardioPulseIcon,
  CardioRowingIcon,
  CardioStairsIcon,
  CardioStopIcon,
  CardioSwapIcon,
  CardioSwimIcon,
  CardioTreadmillIcon,
  CardioWalkIcon,
} from "../components/CardioIcons";
import { WorkoutBackIcon } from "../components/WorkoutIcons";
import {
  finishCardioSession,
  loadCardioDashboard,
  saveCardioSnapshot,
  startCardioSession,
  type CardioActivity,
  type CardioPrescription,
  type CardioSessionRecord,
  type CardioSessionStatus,
  type CardioTiming,
} from "../lib/cardio";
import "./cardio.css";

type ActivityOption = {
  key: CardioActivity;
  label: string;
  subtitle: string;
  icon: (props: {
    size?: number;
    className?: string;
  }) => JSX.Element;
};

const activityOptions: ActivityOption[] = [
  {
    key: "treadmill",
    label: "Esteira",
    subtitle: "Pace e distância",
    icon: CardioTreadmillIcon,
  },
  {
    key: "spinning",
    label: "Bike",
    subtitle: "Spinning e cadência",
    icon: CardioBikeIcon,
  },
  {
    key: "elliptical",
    label: "Elíptico",
    subtitle: "Ritmo contínuo",
    icon: CardioEllipticalIcon,
  },
  {
    key: "stairs",
    label: "Escada",
    subtitle: "Degraus por minuto",
    icon: CardioStairsIcon,
  },
  {
    key: "rowing",
    label: "Remo",
    subtitle: "Pace por 500m",
    icon: CardioRowingIcon,
  },
  {
    key: "walk",
    label: "Caminhada",
    subtitle: "Pace e distância",
    icon: CardioWalkIcon,
  },
  {
    key: "swim",
    label: "Nado",
    subtitle: "Pace e voltas",
    icon: CardioSwimIcon,
  },
];

const timingLabels: Record<CardioTiming, string> = {
  before: "Antes do treino",
  after: "Depois do treino",
  anytime: "Quando quiser",
};

const activityDefaults: Record<
  CardioActivity,
  {
    pace: number;
    speed: number;
    cadence: number;
    caloriesPerMinute: number;
  }
> = {
  treadmill: {
    pace: 410,
    speed: 8.8,
    cadence: 0,
    caloriesPerMinute: 8.5,
  },
  spinning: {
    pace: 0,
    speed: 22,
    cadence: 80,
    caloriesPerMinute: 10,
  },
  elliptical: {
    pace: 450,
    speed: 8,
    cadence: 62,
    caloriesPerMinute: 8,
  },
  stairs: {
    pace: 0,
    speed: 0,
    cadence: 60,
    caloriesPerMinute: 10.5,
  },
  rowing: {
    pace: 135,
    speed: 0,
    cadence: 26,
    caloriesPerMinute: 9,
  },
  walk: {
    pace: 600,
    speed: 6,
    cadence: 0,
    caloriesPerMinute: 5,
  },
  swim: {
    pace: 120,
    speed: 0,
    cadence: 0,
    caloriesPerMinute: 8,
  },
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function formatClock(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const remaining = safe % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(
      minutes,
    ).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(
    remaining,
  ).padStart(2, "0")}`;
}

function formatPace(seconds: number) {
  if (!seconds || !Number.isFinite(seconds)) return "—";
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.round(seconds % 60);
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

function activityName(activity: CardioActivity) {
  return (
    activityOptions.find((option) => option.key === activity)?.label ??
    "Cardio"
  );
}

function targetDescription(
  prescription: CardioPrescription | null,
  targetMinutes: number,
) {
  if (!prescription) {
    return `${targetMinutes} min • cardio livre`;
  }

  const parts = [`${prescription.targetDurationMinutes || targetMinutes} min`];

  if (prescription.targetDistance > 0) {
    parts.push(
      `${prescription.targetDistance} ${prescription.distanceUnit}`,
    );
  }

  if (prescription.targetPaceSeconds > 0) {
    parts.push(
      `pace ${formatPace(prescription.targetPaceSeconds)}/${
        prescription.paceUnit
      }`,
    );
  }

  if (prescription.targetLaps > 0) {
    parts.push(`${prescription.targetLaps} voltas`);
  }

  return parts.join(" • ");
}

export default function Cardio() {
  const navigate = useNavigate();
  const {
    user,
    loading: authLoading,
    landingPath,
  } = useAuth();

  const [loading, setLoading] = useState(true);
  const [storageReady, setStorageReady] = useState(true);
  const [storageMessage, setStorageMessage] = useState("");
  const [prescriptions, setPrescriptions] = useState<
    CardioPrescription[]
  >([]);
  const [recentSessions, setRecentSessions] = useState<
    CardioSessionRecord[]
  >([]);

  const [activity, setActivity] =
    useState<CardioActivity>("treadmill");
  const [timing, setTiming] =
    useState<CardioTiming>("anytime");
  const [targetMinutes, setTargetMinutes] = useState(30);
  const [paceSeconds, setPaceSeconds] = useState(
    activityDefaults.treadmill.pace,
  );
  const [speedKmh, setSpeedKmh] = useState(
    activityDefaults.treadmill.speed,
  );
  const [cadenceRpm, setCadenceRpm] = useState(
    activityDefaults.treadmill.cadence,
  );
  const [poolLengthMeters, setPoolLengthMeters] = useState(25);
  const [laps, setLaps] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [status, setStatus] =
    useState<"idle" | CardioSessionStatus>("idle");
  const [session, setSession] =
    useState<CardioSessionRecord | null>(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const targetReachedRef = useRef(false);

  const selectedPrescription = useMemo(
    () =>
      prescriptions.find(
        (prescription) =>
          prescription.activityType === activity &&
          prescription.isActive,
      ) ?? null,
    [activity, prescriptions],
  );

  const applyActivity = useCallback(
    (
      nextActivity: CardioActivity,
      prescription?: CardioPrescription | null,
    ) => {
      const defaults = activityDefaults[nextActivity];

      setActivity(nextActivity);
      setTiming(prescription?.timing ?? "anytime");
      setTargetMinutes(
        clamp(prescription?.targetDurationMinutes || 30, 5, 120),
      );
      setPaceSeconds(
        prescription?.targetPaceSeconds || defaults.pace,
      );
      setSpeedKmh(
        prescription?.targetSpeedKmh || defaults.speed,
      );
      setCadenceRpm(defaults.cadence);
      setPoolLengthMeters(25);
      setLaps(0);
    },
    [],
  );

  useEffect(() => {
    if (!user) return;

    let mounted = true;
    setLoading(true);

    loadCardioDashboard(user.id).then((dashboard) => {
      if (!mounted) return;

      setPrescriptions(dashboard.prescriptions);
      setRecentSessions(dashboard.recentSessions);
      setStorageReady(dashboard.storageReady);
      setStorageMessage(dashboard.message);

      if (dashboard.openSession) {
        const current = dashboard.openSession;
        const defaults = activityDefaults[current.activityType];

        setSession(current);
        setActivity(current.activityType);
        setTiming(current.timing);
        setTargetMinutes(
          clamp(
            Math.round(current.targetDurationSeconds / 60) || 30,
            5,
            120,
          ),
        );
        setPaceSeconds(
          current.averagePaceSeconds || defaults.pace,
        );
        setSpeedKmh(
          current.averageSpeedKmh || defaults.speed,
        );
        setCadenceRpm(
          current.cadenceRpm || defaults.cadence,
        );
        setLaps(current.laps);
        setElapsedSeconds(current.elapsedSeconds);
        setStatus("paused");
        setToast(
          "Sessão anterior recuperada. Toque em retomar para continuar.",
        );
      } else {
        const first = dashboard.prescriptions[0];
        if (first) {
          applyActivity(first.activityType, first);
        }
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [user?.id, applyActivity]);

  useEffect(() => {
    if (status !== "running") return;

    const timer = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const targetSeconds = targetMinutes * 60;
  const progress = clamp(elapsedSeconds / targetSeconds, 0, 1);

  const calculatedSpeed = useMemo(() => {
    if (
      activity === "treadmill" ||
      activity === "walk" ||
      activity === "elliptical"
    ) {
      return paceSeconds > 0 ? 3600 / paceSeconds : speedKmh;
    }

    if (activity === "spinning") return speedKmh;
    return 0;
  }, [activity, paceSeconds, speedKmh]);

  const distanceMeters = useMemo(() => {
    if (activity === "swim") {
      return laps * poolLengthMeters;
    }

    if (activity === "rowing") {
      if (!paceSeconds) return 0;
      return Math.round((elapsedSeconds / paceSeconds) * 500);
    }

    if (activity === "stairs") {
      return Math.round(cadenceRpm * (elapsedSeconds / 60));
    }

    return Math.round(
      calculatedSpeed * (elapsedSeconds / 3600) * 1000,
    );
  }, [
    activity,
    calculatedSpeed,
    cadenceRpm,
    elapsedSeconds,
    laps,
    paceSeconds,
    poolLengthMeters,
  ]);

  const calories = useMemo(
    () =>
      Math.round(
        activityDefaults[activity].caloriesPerMinute *
          (elapsedSeconds / 60),
      ),
    [activity, elapsedSeconds],
  );

  const currentSnapshot = useCallback(
    (nextStatus: CardioSessionStatus) => ({
      elapsedSeconds,
      distanceMeters,
      averagePaceSeconds: paceSeconds,
      averageSpeedKmh: calculatedSpeed,
      cadenceRpm,
      laps,
      calories,
      status: nextStatus,
    }),
    [
      calculatedSpeed,
      cadenceRpm,
      calories,
      distanceMeters,
      elapsedSeconds,
      laps,
      paceSeconds,
    ],
  );

  useEffect(() => {
    if (
      !session ||
      session.local ||
      (status !== "running" && status !== "paused")
    ) {
      return;
    }

    const save = () => {
      void saveCardioSnapshot(
        session,
        currentSnapshot(
          status === "running" ? "running" : "paused",
        ),
      );
    };

    const heartbeat = window.setInterval(save, 15000);
    return () => window.clearInterval(heartbeat);
  }, [session?.id, status, currentSnapshot]);

  useEffect(() => {
    if (
      status !== "running" ||
      elapsedSeconds < targetSeconds ||
      targetReachedRef.current
    ) {
      return;
    }

    targetReachedRef.current = true;
    setToast(
      "Meta de tempo concluída. Você pode continuar ou finalizar.",
    );
  }, [elapsedSeconds, status, targetSeconds]);

  if (authLoading || loading) return <LoadingSplash />;
  if (!user) return <Navigate to="/login" replace />;
  if (landingPath !== "/menu-teste") {
    return <Navigate to={landingPath} replace />;
  }

  const selectActivity = (nextActivity: CardioActivity) => {
    if (status === "running") {
      setToast("Pause ou finalize antes de trocar a modalidade.");
      return;
    }

    const prescription =
      prescriptions.find(
        (item) => item.activityType === nextActivity,
      ) ?? null;

    applyActivity(nextActivity, prescription);
    setSession(null);
    setElapsedSeconds(0);
    setStatus("idle");
    targetReachedRef.current = false;
  };

  const startOrResume = async () => {
    if (busy) return;

    if (status === "paused" && session) {
      setStatus("running");
      await saveCardioSnapshot(
        session,
        currentSnapshot("running"),
      );
      return;
    }

    setBusy(true);

    const created = await startCardioSession({
      userId: user.id,
      prescriptionId: selectedPrescription?.id ?? null,
      activityType: activity,
      timing,
      targetDurationSeconds: targetSeconds,
      targetSnapshot: {
        duration_minutes: targetMinutes,
        pace_seconds: paceSeconds,
        speed_kmh: calculatedSpeed,
        cadence_rpm: cadenceRpm,
        pool_length_meters: poolLengthMeters,
        mode_label: activityName(activity),
      },
      source: selectedPrescription ? "professor" : "free",
    });

    setSession(created);
    setElapsedSeconds(0);
    setLaps(0);
    setStatus("running");
    targetReachedRef.current = false;
    setBusy(false);

    if (created.local) {
      setStorageReady(false);
      setStorageMessage(
        "A tela está funcionando, mas a migration nova precisa ser executada para salvar no Supabase.",
      );
    }
  };

  const pause = async () => {
    if (!session || status !== "running") return;

    setStatus("paused");
    await saveCardioSnapshot(
      session,
      currentSnapshot("paused"),
    );
  };

  const finish = async () => {
    if (!session || busy) return;

    setBusy(true);
    const result = await finishCardioSession(
      session,
      currentSnapshot("completed"),
    );

    setStatus("completed");
    setSaveMessage(
      result.saved
        ? "Cardio registrado no histórico individual do aluno."
        : "Cardio concluído neste aparelho. Execute a migration para salvar no Supabase.",
    );
    setFinishOpen(true);
    setBusy(false);
  };

  const resetSession = () => {
    setSession(null);
    setElapsedSeconds(0);
    setLaps(0);
    setStatus("idle");
    setFinishOpen(false);
    targetReachedRef.current = false;
  };

  const currentOption =
    activityOptions.find((option) => option.key === activity) ??
    activityOptions[0];
  const CurrentIcon = currentOption.icon;

  const paceTitle =
    activity === "spinning"
      ? "Cadência"
      : activity === "stairs"
        ? "Degraus/min"
        : "Pace estimado";

  const paceValue =
    activity === "spinning" || activity === "stairs"
      ? String(cadenceRpm)
      : formatPace(paceSeconds);

  const paceUnit =
    activity === "spinning"
      ? "rpm"
      : activity === "stairs"
        ? "degraus"
        : activity === "rowing"
          ? "min/500m"
          : activity === "swim"
            ? "min/100m"
            : "min/km";

  const readiness =
    status === "running"
      ? "Cardio em andamento"
      : status === "paused"
        ? "Cardio pausado"
        : "Pronto para iniciar";

  return (
    <div className="cardio-screen">
      <div className="cardio-background" />

      <main className="cardio-shell">
        <header className="cardio-topbar">
          <button
            type="button"
            className="cardio-back-button"
            onClick={() => navigate("/menu-teste")}
            aria-label="Voltar"
          >
            <WorkoutBackIcon />
          </button>

          <div className="cardio-header-brand">
            <img
              src="/accqua-logo-header.png"
              alt="Accqua Sports"
            />
            <i />
            <strong>CARDIO</strong>
          </div>

          <div className="cardio-top-actions">
            <button
              type="button"
              onClick={() => navigate("/treino")}
              aria-label="Voltar para musculação"
            >
              <CardioSwapIcon />
              <span>TREINO</span>
            </button>

            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              aria-label="Histórico de cardio"
            >
              <CardioHistoryIcon />
            </button>
          </div>
        </header>

        <section className="cardio-title">
          <h1>{currentOption.label}</h1>
          <p>
            {selectedPrescription
              ? "Cardio guiado pelo professor"
              : "Cardio livre"}
          </p>
        </section>

        <section className="cardio-hero">
          <div className="cardio-hero-badge">
            <CardioPulseIcon />
            <span>CARDIO</span>
          </div>

          {activity === "treadmill" ? (
            <img
              src="/cardio/treadmill-runner.jpg"
              alt="Pessoa correndo na esteira"
            />
          ) : (
            <div className="cardio-hero-icon">
              <CurrentIcon size={150} />
              <strong>{currentOption.label}</strong>
              <small>{currentOption.subtitle}</small>
            </div>
          )}

          {activity === "swim" && status === "running" ? (
            <button
              type="button"
              className="cardio-lap-quick"
              onClick={() => setLaps((value) => value + 1)}
            >
              <CardioPlusIcon />
              Volta {laps + 1}
            </button>
          ) : null}
        </section>

        <section className="cardio-metric-row">
          <article className="cardio-side-metric">
            <span className="cardio-metric-icon flame">♨</span>
            <small>Kcal</small>
            <strong>{calories}</strong>
          </article>

          <div
            className="cardio-time-ring"
            style={
              {
                "--cardio-progress": `${progress * 360}deg`,
              } as CSSProperties
            }
          >
            <div>
              <span>Tempo</span>
              <strong>{formatClock(elapsedSeconds)}</strong>
              <small>min</small>
            </div>
          </div>

          <article className="cardio-side-metric">
            <CardioPulseIcon />
            <small>{paceTitle}</small>
            <strong>{paceValue}</strong>
            <b>{paceUnit}</b>
          </article>
        </section>

        <section className="cardio-time-config">
          <header>
            <CardioClockIcon />
            <strong>Configurar tempo</strong>
          </header>

          <div className="cardio-time-controls">
            <button
              type="button"
              onClick={() =>
                setTargetMinutes((value) => Math.max(5, value - 5))
              }
              disabled={status === "running"}
              aria-label="Diminuir tempo"
            >
              <CardioMinusIcon size={31} />
            </button>

            <div>
              <strong>{String(targetMinutes).padStart(2, "0")}:00</strong>
              <span>minutos</span>
            </div>

            <button
              type="button"
              onClick={() =>
                setTargetMinutes((value) => Math.min(120, value + 5))
              }
              disabled={status === "running"}
              aria-label="Aumentar tempo"
            >
              <CardioPlusIcon size={31} />
            </button>
          </div>

          <div className="cardio-time-slider">
            <span>5:00</span>
            <input
              type="range"
              min="5"
              max="120"
              step="5"
              value={targetMinutes}
              disabled={status === "running"}
              onChange={(event) =>
                setTargetMinutes(Number(event.target.value))
              }
              style={
                {
                  "--slider-progress": `${
                    ((targetMinutes - 5) / 115) * 100
                  }%`,
                } as CSSProperties
              }
            />
            <span>120:00</span>
          </div>

          <p>Ajuste a duração do treino</p>
        </section>

        <button
          type="button"
          className={`cardio-readiness status-${status}`}
          onClick={() => setSettingsOpen(true)}
        >
          <i />
          <span>{readiness}</span>
        </button>

        <section className="cardio-main-actions">
          <button
            type="button"
            className="cardio-start-button"
            onClick={() => void startOrResume()}
            disabled={
              busy ||
              status === "running" ||
              status === "completed"
            }
          >
            <CardioPlayIcon />
            <span>
              {busy
                ? "Preparando..."
                : status === "paused"
                  ? "Retomar cardio"
                  : "Iniciar cardio"}
            </span>
          </button>

          <button
            type="button"
            className="cardio-pause-button"
            onClick={() =>
              status === "running"
                ? void pause()
                : status === "paused"
                  ? void finish()
                  : setToast("Inicie o cardio primeiro.")
            }
            disabled={busy || status === "completed"}
          >
            {status === "paused" ? (
              <CardioStopIcon />
            ) : (
              <CardioPauseIcon />
            )}
            <span>
              {status === "paused"
                ? "Finalizar cardio"
                : "Pausar cardio"}
            </span>
          </button>
        </section>

        <section className="cardio-mode-grid">
          {activityOptions.map((option) => {
            const OptionIcon = option.icon;
            const active = option.key === activity;
            const prescribed = prescriptions.some(
              (item) => item.activityType === option.key,
            );

            return (
              <button
                type="button"
                key={option.key}
                className={`${active ? "active" : ""} ${
                  option.key === "swim" ? "wide" : ""
                }`}
                onClick={() => selectActivity(option.key)}
              >
                <OptionIcon />
                <span>{option.label}</span>
                {prescribed ? <small>PROFESSOR</small> : null}
              </button>
            );
          })}
        </section>

        <section className="cardio-prescription-summary">
          <div>
            <CardioGoalIcon />
            <span>
              {selectedPrescription
                ? selectedPrescription.title
                : "Cardio livre"}
            </span>
          </div>
          <strong>
            {targetDescription(selectedPrescription, targetMinutes)}
          </strong>
          <small>
            {timingLabels[timing]}
            {selectedPrescription?.notes
              ? ` • ${selectedPrescription.notes}`
              : ""}
          </small>
        </section>

        {!storageReady && storageMessage ? (
          <div className="cardio-storage-warning">
            {storageMessage}
          </div>
        ) : null}
      </main>

      {settingsOpen ? (
        <div className="cardio-modal-overlay">
          <button
            type="button"
            className="cardio-modal-backdrop"
            onClick={() => setSettingsOpen(false)}
            aria-label="Fechar configurações"
          />

          <section className="cardio-settings-sheet">
            <header>
              <div>
                <span>CONFIGURAÇÕES</span>
                <h2>{currentOption.label}</h2>
                <p>
                  Ajuste como esta sessão será registrada no histórico.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                aria-label="Fechar"
              >
                <span className="cardio-close-icon" />
              </button>
            </header>

            <div className="cardio-setting-group">
              <strong>Momento do cardio</strong>
              <div className="cardio-segmented">
                {(Object.keys(timingLabels) as CardioTiming[]).map(
                  (item) => (
                    <button
                      type="button"
                      key={item}
                      className={timing === item ? "active" : ""}
                      onClick={() => setTiming(item)}
                    >
                      {timingLabels[item]}
                    </button>
                  ),
                )}
              </div>
            </div>

            {(activity === "spinning" ||
              activity === "stairs" ||
              activity === "elliptical" ||
              activity === "rowing") ? (
              <div className="cardio-setting-group">
                <strong>
                  {activity === "stairs"
                    ? "Degraus por minuto"
                    : activity === "rowing"
                      ? "Remadas por minuto"
                      : "Cadência"}
                </strong>
                <div className="cardio-stepper">
                  <button
                    type="button"
                    onClick={() =>
                      setCadenceRpm((value) => Math.max(20, value - 5))
                    }
                  >
                    <CardioMinusIcon />
                  </button>
                  <span>{cadenceRpm}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setCadenceRpm((value) => Math.min(200, value + 5))
                    }
                  >
                    <CardioPlusIcon />
                  </button>
                </div>
              </div>
            ) : null}

            {activity === "swim" ? (
              <div className="cardio-setting-group">
                <strong>Tamanho da piscina</strong>
                <div className="cardio-segmented two">
                  {[25, 50].map((length) => (
                    <button
                      type="button"
                      key={length}
                      className={
                        poolLengthMeters === length ? "active" : ""
                      }
                      onClick={() => setPoolLengthMeters(length)}
                    >
                      {length} metros
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <button
              type="button"
              className="cardio-settings-confirm"
              onClick={() => setSettingsOpen(false)}
            >
              Salvar configurações
            </button>
          </section>
        </div>
      ) : null}

      {historyOpen ? (
        <div className="cardio-modal-overlay">
          <button
            type="button"
            className="cardio-modal-backdrop"
            onClick={() => setHistoryOpen(false)}
            aria-label="Fechar histórico"
          />

          <section className="cardio-history-sheet">
            <header>
              <div>
                <span>HISTÓRICO INDIVIDUAL</span>
                <h2>Cardios realizados</h2>
                <p>
                  Tudo fica vinculado ao aluno autenticado.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                aria-label="Fechar"
              >
                <span className="cardio-close-icon" />
              </button>
            </header>

            <div className="cardio-history-list">
              {recentSessions.length ? (
                recentSessions.map((item) => {
                  const historyOption =
                    activityOptions.find(
                      (option) =>
                        option.key === item.activityType,
                    ) ?? activityOptions[0];
                  const HistoryIcon = historyOption.icon;

                  return (
                    <article key={item.id}>
                      <i>
                        <HistoryIcon />
                      </i>
                      <div>
                        <strong>{historyOption.label}</strong>
                        <span>
                          {formatClock(item.elapsedSeconds)}
                          {" • "}
                          {item.activityType === "stairs"
                            ? `${Math.round(item.distanceMeters)} degraus`
                            : `${(item.distanceMeters / 1000).toFixed(
                                2,
                              )} km`}
                          {" • "}
                          {item.calories} kcal
                        </span>
                        <small>
                          {item.completedAt
                            ? new Intl.DateTimeFormat("pt-BR", {
                                dateStyle: "short",
                                timeStyle: "short",
                              }).format(
                                new Date(item.completedAt),
                              )
                            : "Sessão concluída"}
                        </small>
                      </div>
                      <CardioCheckIcon />
                    </article>
                  );
                })
              ) : (
                <div className="cardio-history-empty">
                  O primeiro cardio concluído aparecerá aqui.
                </div>
              )}
            </div>
          </section>
        </div>
      ) : null}

      {finishOpen ? (
        <div className="cardio-modal-overlay">
          <section className="cardio-finish-modal">
            <div className="cardio-finish-check">
              <CardioCheckIcon size={34} />
            </div>
            <span>CARDIO CONCLUÍDO</span>
            <h2>Bom trabalho!</h2>
            <p>{saveMessage}</p>

            <div className="cardio-finish-summary">
              <article>
                <span>Tempo</span>
                <strong>{formatClock(elapsedSeconds)}</strong>
              </article>
              <article>
                <span>
                  {activity === "stairs"
                    ? "Degraus"
                    : "Distância"}
                </span>
                <strong>
                  {activity === "stairs"
                    ? Math.round(distanceMeters)
                    : `${(distanceMeters / 1000).toFixed(2)} km`}
                </strong>
              </article>
              <article>
                <span>Calorias</span>
                <strong>{calories} kcal</strong>
              </article>
            </div>

            <button
              type="button"
              onClick={resetSession}
            >
              Fazer outro cardio
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => navigate("/menu-teste")}
            >
              Voltar ao menu
            </button>
          </section>
        </div>
      ) : null}

      {toast ? (
        <div className="cardio-toast" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
