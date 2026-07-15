import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import LoadingSplash from "../components/LoadingSplash";
import {
  CardioBikeIcon,
  CardioCheckIcon,
  CardioHistoryIcon,
  CardioMinusIcon,
  CardioPauseIcon,
  CardioPlayIcon,
  CardioPlusIcon,
  CardioStopIcon,
  CardioSwapIcon,
  CardioSwimIcon,
  CardioTreadmillIcon,
  CardioWalkIcon,
} from "../components/CardioIcons";
import {
  WorkoutBackIcon,
} from "../components/WorkoutIcons";
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

const activityOptions: Array<{
  key: CardioActivity;
  label: string;
  subtitle: string;
  icon: (props: { size?: number; className?: string }) => JSX.Element;
}> = [
  {
    key: "treadmill",
    label: "Esteira",
    subtitle: "Pace e distância",
    icon: CardioTreadmillIcon,
  },
  {
    key: "swim",
    label: "Nado",
    subtitle: "Ritmo e voltas",
    icon: CardioSwimIcon,
  },
  {
    key: "spinning",
    label: "Spinning",
    subtitle: "Cadência e velocidade",
    icon: CardioBikeIcon,
  },
  {
    key: "walk",
    label: "Caminhada",
    subtitle: "Pace e distância",
    icon: CardioWalkIcon,
  },
];

const timingLabels: Record<CardioTiming, string> = {
  before: "Antes do treino",
  after: "Depois do treino",
  anytime: "Quando quiser",
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
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0",
    )}:${String(remaining).padStart(2, "0")}`;
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

function parsePace(value: string) {
  const normalized = value.trim().replace(",", ":");
  const parts = normalized.split(":");
  if (parts.length === 1) {
    const minutes = Number(parts[0]);
    return Number.isFinite(minutes) ? Math.round(minutes * 60) : 0;
  }

  const minutes = Number(parts[0]);
  const seconds = Number(parts[1]);
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return 0;
  return Math.max(0, Math.round(minutes * 60 + clamp(seconds, 0, 59)));
}

function defaultPace(activity: CardioActivity) {
  if (activity === "walk") return 600;
  if (activity === "swim") return 120;
  if (activity === "treadmill") return 390;
  return 0;
}

function defaultSpeed(activity: CardioActivity) {
  if (activity === "spinning") return 22;
  if (activity === "walk") return 6;
  if (activity === "treadmill") return 9.2;
  return 0;
}

function caloriesPerMinute(activity: CardioActivity) {
  if (activity === "swim") return 8;
  if (activity === "spinning") return 10;
  if (activity === "walk") return 5;
  return 9;
}

function targetText(prescription: CardioPrescription | null) {
  if (!prescription) return "Sessão livre";
  const parts = [`${prescription.targetDurationMinutes || 20} min`];

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
    profile,
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
  const [targetMinutes, setTargetMinutes] = useState(20);
  const [paceSeconds, setPaceSeconds] = useState(
    defaultPace("treadmill"),
  );
  const [paceDraft, setPaceDraft] = useState(
    formatPace(defaultPace("treadmill")),
  );
  const [speedKmh, setSpeedKmh] = useState(
    defaultSpeed("treadmill"),
  );
  const [cadenceRpm, setCadenceRpm] = useState(80);
  const [poolLengthMeters, setPoolLengthMeters] = useState(25);
  const [laps, setLaps] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [status, setStatus] =
    useState<"idle" | CardioSessionStatus>("idle");
  const [session, setSession] =
    useState<CardioSessionRecord | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
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

  const applyPrescription = useCallback(
    (prescription: CardioPrescription | null, nextActivity?: CardioActivity) => {
      const selectedActivity =
        nextActivity ?? prescription?.activityType ?? activity;

      setTiming(prescription?.timing ?? "anytime");
      setTargetMinutes(
        Math.max(5, prescription?.targetDurationMinutes || 20),
      );

      const nextPace =
        prescription?.targetPaceSeconds ||
        defaultPace(selectedActivity);
      setPaceSeconds(nextPace);
      setPaceDraft(formatPace(nextPace));

      setSpeedKmh(
        prescription?.targetSpeedKmh ||
          defaultSpeed(selectedActivity),
      );
      setCadenceRpm(
        selectedActivity === "spinning" ? 80 : 0,
      );
      setLaps(0);
    },
    [activity],
  );

  useEffect(() => {
    if (!user) return;

    let active = true;
    setLoading(true);

    loadCardioDashboard(user.id).then((dashboard) => {
      if (!active) return;

      setPrescriptions(dashboard.prescriptions);
      setRecentSessions(dashboard.recentSessions);
      setStorageReady(dashboard.storageReady);
      setStorageMessage(dashboard.message);

      if (dashboard.openSession) {
        const open = dashboard.openSession;
        setSession(open);
        setActivity(open.activityType);
        setTiming(open.timing);
        setTargetMinutes(
          Math.max(
            5,
            Math.round(open.targetDurationSeconds / 60) || 20,
          ),
        );
        setElapsedSeconds(open.elapsedSeconds);
        setLaps(open.laps);
        setSpeedKmh(
          open.averageSpeedKmh ||
            defaultSpeed(open.activityType),
        );
        setCadenceRpm(open.cadenceRpm || 80);
        setPaceSeconds(
          open.averagePaceSeconds ||
            defaultPace(open.activityType),
        );
        setPaceDraft(
          formatPace(
            open.averagePaceSeconds ||
              defaultPace(open.activityType),
          ),
        );
        setStatus("paused");
        setToast("Sua sessão anterior foi recuperada. Toque em retomar.");
      } else if (dashboard.prescriptions[0]) {
        const first = dashboard.prescriptions[0];
        setActivity(first.activityType);
        applyPrescription(first, first.activityType);
      }

      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (status !== "running") return;

    const timer = window.setInterval(() => {
      setElapsedSeconds((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const targetSeconds = Math.max(60, targetMinutes * 60);
  const progress = clamp(
    elapsedSeconds / targetSeconds,
    0,
    1,
  );

  const computedSpeed = useMemo(() => {
    if (
      activity === "treadmill" ||
      activity === "walk"
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

    return Math.round(
      computedSpeed * (elapsedSeconds / 3600) * 1000,
    );
  }, [
    activity,
    computedSpeed,
    elapsedSeconds,
    laps,
    poolLengthMeters,
  ]);

  const calories = useMemo(
    () =>
      Math.round(
        caloriesPerMinute(activity) *
          (elapsedSeconds / 60),
      ),
    [activity, elapsedSeconds],
  );

  const currentSnapshot = useCallback(
    (nextStatus: CardioSessionStatus) => ({
      elapsedSeconds,
      distanceMeters,
      averagePaceSeconds: paceSeconds,
      averageSpeedKmh: computedSpeed,
      cadenceRpm:
        activity === "spinning" ? cadenceRpm : 0,
      laps: activity === "swim" ? laps : 0,
      calories,
      status: nextStatus,
    }),
    [
      activity,
      cadenceRpm,
      calories,
      computedSpeed,
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

    const timer = window.setInterval(save, 15000);
    return () => window.clearInterval(timer);
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
      "Meta de tempo alcançada. Você pode finalizar ou continuar.",
    );
  }, [elapsedSeconds, status, targetSeconds]);

  if (authLoading || loading) return <LoadingSplash />;
  if (!user) return <Navigate to="/login" replace />;
  if (landingPath !== "/menu-teste") {
    return <Navigate to={landingPath} replace />;
  }

  const selectActivity = (nextActivity: CardioActivity) => {
    if (status === "running") {
      setToast("Pause ou finalize a sessão antes de trocar de modalidade.");
      return;
    }

    setActivity(nextActivity);
    const prescription =
      prescriptions.find(
        (item) => item.activityType === nextActivity,
      ) ?? null;
    applyPrescription(prescription, nextActivity);
    setElapsedSeconds(0);
    setSession(null);
    setStatus("idle");
    targetReachedRef.current = false;
  };

  const startOrResume = async () => {
    if (busy) return;

    if (status === "paused" && session) {
      setStatus("running");
      targetReachedRef.current =
        elapsedSeconds >= targetSeconds;
      await saveCardioSnapshot(
        session,
        currentSnapshot("running"),
      );
      return;
    }

    setBusy(true);
    const result = await startCardioSession({
      userId: user.id,
      prescriptionId: selectedPrescription?.id ?? null,
      activityType: activity,
      timing,
      targetDurationSeconds: targetSeconds,
      targetSnapshot: {
        target_minutes: targetMinutes,
        pace_seconds: paceSeconds,
        speed_kmh: computedSpeed,
        pool_length_meters: poolLengthMeters,
        target_text: targetText(selectedPrescription),
      },
      source: selectedPrescription ? "professor" : "free",
    });

    setSession(result);
    setElapsedSeconds(0);
    setLaps(0);
    setStatus("running");
    targetReachedRef.current = false;
    setBusy(false);

    if (result.local) {
      setStorageReady(false);
      setStorageMessage(
        "A sessão está funcionando neste aparelho, mas ainda não foi salva no Supabase. Execute a migration incluída.",
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
        ? "Cardio salvo no histórico individual do aluno."
        : "A sessão foi concluída, mas não foi gravada. Execute a migration do Supabase.",
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

  const updatePace = (value: string) => {
    setPaceDraft(value);
    const parsed = parsePace(value);
    if (parsed > 0) setPaceSeconds(parsed);
  };

  const ActiveIcon =
    activityOptions.find((option) => option.key === activity)
      ?.icon ?? CardioTreadmillIcon;

  const metricLabel =
    activity === "spinning"
      ? "Cadência"
      : activity === "swim"
        ? "Pace /100m"
        : "Pace /km";

  const metricValue =
    activity === "spinning"
      ? `${cadenceRpm} rpm`
      : `${formatPace(paceSeconds)}`;

  return (
    <div className="cardio-screen">
      <div className="cardio-background" />

      <main className="cardio-shell">
        <header className="cardio-topbar">
          <button
            type="button"
            className="cardio-round-button"
            onClick={() => navigate("/menu-teste")}
            aria-label="Voltar ao menu"
          >
            <WorkoutBackIcon />
          </button>

          <div className="cardio-header-brand">
            <span>
              <img
                src="/accqua-logo-header.png"
                alt="Accqua Sports"
              />
            </span>
            <i />
            <strong>CARDIO</strong>
          </div>

          <div className="cardio-top-actions">
            <button
              type="button"
              className="cardio-mode-switch"
              onClick={() => navigate("/treino")}
              aria-label="Ir para musculação"
              title="Ir para musculação"
            >
              <CardioSwapIcon />
              <small>TREINO</small>
            </button>

            <button
              type="button"
              className="cardio-round-button"
              onClick={() => setHistoryOpen(true)}
              aria-label="Abrir histórico de cardio"
            >
              <CardioHistoryIcon />
            </button>
          </div>
        </header>

        <section className="cardio-heading">
          <div>
            <span>SEU CARDIO</span>
            <h1>
              Olá,{" "}
              {profile?.fullName?.split(" ")[0] || "Aluno"}
            </h1>
            <p>
              Faça antes, depois do treino ou no horário indicado
              pelo professor.
            </p>
          </div>
          <div
            className={`cardio-save-state ${
              storageReady ? "ready" : "warning"
            }`}
          >
            <i />
            <span>
              {storageReady
                ? "Salvamento ativo"
                : "Configurar Supabase"}
            </span>
          </div>
        </section>

        <section className="cardio-prescription-card">
          <header>
            <div>
              <span>
                {selectedPrescription
                  ? "PRESCRIÇÃO DO PROFESSOR"
                  : "CARDIO LIVRE"}
              </span>
              <strong>
                {selectedPrescription?.title ??
                  "Escolha sua modalidade"}
              </strong>
            </div>
            <b>{timingLabels[timing]}</b>
          </header>

          <p>{targetText(selectedPrescription)}</p>

          {selectedPrescription?.notes ? (
            <small>{selectedPrescription.notes}</small>
          ) : (
            <small>
              Sem prescrição ativa para esta modalidade. A sessão
              ainda pode ser realizada e registrada.
            </small>
          )}

          {!storageReady && storageMessage ? (
            <div className="cardio-storage-warning">
              {storageMessage}
            </div>
          ) : null}
        </section>

        <section className="cardio-modes" aria-label="Modalidades">
          {activityOptions.map((option) => {
            const OptionIcon = option.icon;
            const active = option.key === activity;
            const assigned = prescriptions.some(
              (item) => item.activityType === option.key,
            );

            return (
              <button
                type="button"
                key={option.key}
                className={active ? "active" : ""}
                onClick={() => selectActivity(option.key)}
              >
                <i>
                  <OptionIcon />
                </i>
                <strong>{option.label}</strong>
                <span>{option.subtitle}</span>
                {assigned ? <small>PROFESSOR</small> : null}
              </button>
            );
          })}
        </section>

        <section className="cardio-main-panel">
          <div className="cardio-activity-visual">
            <span className="cardio-activity-glow" />
            <ActiveIcon size={96} />
            <strong>
              {
                activityOptions.find(
                  (option) => option.key === activity,
                )?.label
              }
            </strong>
          </div>

          <div
            className="cardio-timer-ring"
            style={
              {
                "--cardio-progress": `${progress * 360}deg`,
              } as React.CSSProperties
            }
          >
            <div>
              <span>
                {status === "running"
                  ? "EM ANDAMENTO"
                  : status === "paused"
                    ? "PAUSADO"
                    : "CRONÔMETRO"}
              </span>
              <strong>{formatClock(elapsedSeconds)}</strong>
              <small>meta {formatClock(targetSeconds)}</small>
            </div>
          </div>
        </section>

        <section className="cardio-target-controls">
          <article>
            <span>Tempo planejado</span>
            <div>
              <button
                type="button"
                onClick={() =>
                  setTargetMinutes((value) =>
                    Math.max(5, value - 5),
                  )
                }
                disabled={status === "running"}
              >
                <CardioMinusIcon />
              </button>
              <strong>{targetMinutes} min</strong>
              <button
                type="button"
                onClick={() =>
                  setTargetMinutes((value) =>
                    Math.min(180, value + 5),
                  )
                }
                disabled={status === "running"}
              >
                <CardioPlusIcon />
              </button>
            </div>
          </article>

          {activity === "spinning" ? (
            <article>
              <span>Cadência desejada</span>
              <div>
                <button
                  type="button"
                  onClick={() =>
                    setCadenceRpm((value) =>
                      Math.max(30, value - 5),
                    )
                  }
                >
                  <CardioMinusIcon />
                </button>
                <strong>{cadenceRpm} rpm</strong>
                <button
                  type="button"
                  onClick={() =>
                    setCadenceRpm((value) =>
                      Math.min(180, value + 5),
                    )
                  }
                >
                  <CardioPlusIcon />
                </button>
              </div>
            </article>
          ) : (
            <article>
              <span>
                {activity === "swim"
                  ? "Pace por 100m"
                  : "Pace por quilômetro"}
              </span>
              <label>
                <input
                  value={paceDraft}
                  onChange={(event) =>
                    updatePace(event.target.value)
                  }
                  inputMode="numeric"
                  aria-label="Pace"
                />
                <small>
                  /{activity === "swim" ? "100m" : "km"}
                </small>
              </label>
            </article>
          )}
        </section>

        <section className="cardio-metrics">
          <article>
            <span>{metricLabel}</span>
            <strong>{metricValue}</strong>
          </article>

          <article>
            <span>
              {activity === "swim" ? "Distância / voltas" : "Distância"}
            </span>
            <strong>
              {distanceMeters >= 1000
                ? `${(distanceMeters / 1000).toFixed(2)} km`
                : `${distanceMeters} m`}
            </strong>
            {activity === "swim" ? (
              <small>{laps} volta(s)</small>
            ) : null}
          </article>

          <article>
            <span>Calorias estimadas</span>
            <strong>{calories} kcal</strong>
          </article>
        </section>

        {activity === "swim" ? (
          <section className="cardio-swim-controls">
            <div>
              <span>Tamanho da piscina</span>
              <button
                type="button"
                onClick={() =>
                  setPoolLengthMeters((value) =>
                    value === 25 ? 50 : 25,
                  )
                }
              >
                {poolLengthMeters} metros
              </button>
            </div>

            <button
              type="button"
              className="cardio-lap-button"
              onClick={() => setLaps((value) => value + 1)}
              disabled={status !== "running"}
            >
              <CardioPlusIcon />
              Registrar volta
            </button>
          </section>
        ) : null}

        <section className="cardio-timing">
          <span>Quando você está fazendo?</span>
          <div>
            {(
              Object.keys(timingLabels) as CardioTiming[]
            ).map((item) => (
              <button
                type="button"
                key={item}
                className={item === timing ? "active" : ""}
                onClick={() => setTiming(item)}
                disabled={status === "running"}
              >
                {timingLabels[item]}
              </button>
            ))}
          </div>
        </section>

        <section className="cardio-actions">
          {status !== "running" ? (
            <button
              type="button"
              className="cardio-primary-action"
              onClick={() => void startOrResume()}
              disabled={busy || status === "completed"}
            >
              <CardioPlayIcon />
              <span>
                {busy
                  ? "Preparando..."
                  : status === "paused"
                    ? "Retomar cardio"
                    : "Começar cardio"}
              </span>
            </button>
          ) : (
            <button
              type="button"
              className="cardio-primary-action pause"
              onClick={() => void pause()}
            >
              <CardioPauseIcon />
              <span>Pausar</span>
            </button>
          )}

          <button
            type="button"
            className="cardio-finish-action"
            onClick={() => void finish()}
            disabled={
              !session ||
              status === "completed" ||
              busy
            }
          >
            <CardioStopIcon />
            Finalizar
          </button>
        </section>

        <footer className="cardio-autosave-note">
          <i />
          <span>
            Tempo, modalidade, pace, distância, voltas e calorias são
            atualizados no histórico individual do aluno.
          </span>
        </footer>
      </main>

      {historyOpen ? (
        <div
          className="cardio-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Histórico de cardio"
        >
          <button
            type="button"
            className="cardio-modal-backdrop"
            onClick={() => setHistoryOpen(false)}
            aria-label="Fechar histórico"
          />
          <section className="cardio-history-sheet">
            <header>
              <div>
                <span>SEU HISTÓRICO</span>
                <h2>Cardios realizados</h2>
                <p>
                  Registros individuais salvos para acompanhamento
                  do aluno e do professor.
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
                recentSessions.map((item) => (
                  <article key={item.id}>
                    <i>
                      {item.activityType === "swim" ? (
                        <CardioSwimIcon />
                      ) : item.activityType === "spinning" ? (
                        <CardioBikeIcon />
                      ) : item.activityType === "walk" ? (
                        <CardioWalkIcon />
                      ) : (
                        <CardioTreadmillIcon />
                      )}
                    </i>
                    <div>
                      <strong>
                        {
                          activityOptions.find(
                            (option) =>
                              option.key === item.activityType,
                          )?.label
                        }
                      </strong>
                      <span>
                        {formatClock(item.elapsedSeconds)}
                        {" • "}
                        {(item.distanceMeters / 1000).toFixed(2)} km
                        {" • "}
                        {item.calories} kcal
                      </span>
                      <small>
                        {item.completedAt
                          ? new Intl.DateTimeFormat("pt-BR", {
                              dateStyle: "short",
                              timeStyle: "short",
                            }).format(new Date(item.completedAt))
                          : "Sessão concluída"}
                      </small>
                    </div>
                    <CardioCheckIcon />
                  </article>
                ))
              ) : (
                <div className="cardio-history-empty">
                  Seu primeiro cardio concluído aparecerá aqui.
                </div>
              )}
            </div>
          </section>
        </div>
      ) : null}

      {finishOpen ? (
        <div
          className="cardio-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Cardio concluído"
        >
          <section className="cardio-finish-modal">
            <div className="cardio-finish-check">
              <CardioCheckIcon size={36} />
            </div>
            <span>CARDIO CONCLUÍDO</span>
            <h2>Bom trabalho!</h2>
            <p>{saveMessage}</p>
            <div>
              <article>
                <span>Tempo</span>
                <strong>{formatClock(elapsedSeconds)}</strong>
              </article>
              <article>
                <span>Distância</span>
                <strong>
                  {(distanceMeters / 1000).toFixed(2)} km
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
