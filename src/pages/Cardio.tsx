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
  CardioBackSwitchIcon,
  CardioCheckIcon,
  CardioClockIcon,
  CardioFlameIcon,
  CardioHistoryIcon,
  CardioMinusIcon,
  CardioPauseIcon,
  CardioPlayIcon,
  CardioPlusIcon,
  CardioPulseIcon,
  CardioSettingsIcon,
  CardioStopIcon,
} from "../components/CardioIcons";
import { WorkoutBackIcon } from "../components/WorkoutIcons";
import treadmillImage from "../assets/cardio/treadmill.png";
import spinningImage from "../assets/cardio/spinning.png";
import ellipticalImage from "../assets/cardio/elliptical.png";
import stairsImage from "../assets/cardio/stairs.png";
import rowingImage from "../assets/cardio/rowing.png";
import walkImage from "../assets/cardio/walk.png";
import swimImage from "../assets/cardio/swim.png";
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
  image: string;
};

type IntensityConfig = {
  label: string;
  helper: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  unit: string;
};

const activityOptions: ActivityOption[] = [
  {
    key: "treadmill",
    label: "Esteira",
    subtitle: "Velocidade e pace",
    image: treadmillImage,
  },
  {
    key: "spinning",
    label: "Bike",
    subtitle: "Velocidade e cadência",
    image: spinningImage,
  },
  {
    key: "elliptical",
    label: "Elíptico",
    subtitle: "Ritmo contínuo",
    image: ellipticalImage,
  },
  {
    key: "stairs",
    label: "Escada",
    subtitle: "Degraus por minuto",
    image: stairsImage,
  },
  {
    key: "rowing",
    label: "Remo",
    subtitle: "Pace por 500 metros",
    image: rowingImage,
  },
  {
    key: "walk",
    label: "Caminhada",
    subtitle: "Velocidade e pace",
    image: walkImage,
  },
  {
    key: "swim",
    label: "Nado",
    subtitle: "Pace por 100 metros",
    image: swimImage,
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
    pace: 400,
    speed: 9,
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

function roundToStep(value: number, step: number) {
  return Math.round(value / step) * step;
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

function paceFromSpeed(speedKmh: number) {
  if (!speedKmh || speedKmh <= 0) return 0;
  return Math.round(3600 / speedKmh);
}

function speedFromPace(paceSeconds: number) {
  if (!paceSeconds || paceSeconds <= 0) return 0;
  return 3600 / paceSeconds;
}

function getActivityOption(activity: CardioActivity) {
  return (
    activityOptions.find((option) => option.key === activity) ??
    activityOptions[0]
  );
}

function targetDescription(
  prescription: CardioPrescription | null,
  targetMinutes: number,
) {
  if (!prescription) {
    return `${targetMinutes} minutos configurados`;
  }

  const parts = [
    `${prescription.targetDurationMinutes || targetMinutes} min`,
  ];

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

  const isSpeedBased =
    activity === "treadmill" ||
    activity === "walk" ||
    activity === "elliptical";

  const applyActivity = useCallback(
    (
      nextActivity: CardioActivity,
      prescription?: CardioPrescription | null,
    ) => {
      const defaults = activityDefaults[nextActivity];
      const prescriptionSpeed =
        prescription?.targetSpeedKmh ||
        (prescription?.targetPaceSeconds
          ? speedFromPace(prescription.targetPaceSeconds)
          : 0);
      const nextSpeed = prescriptionSpeed || defaults.speed;
      const speedDriven =
        nextActivity === "treadmill" ||
        nextActivity === "walk" ||
        nextActivity === "elliptical";

      setActivity(nextActivity);
      setTiming(prescription?.timing ?? "anytime");
      setTargetMinutes(
        clamp(prescription?.targetDurationMinutes || 30, 5, 120),
      );
      setSpeedKmh(Number(nextSpeed.toFixed(1)));
      setPaceSeconds(
        speedDriven
          ? paceFromSpeed(nextSpeed)
          : prescription?.targetPaceSeconds || defaults.pace,
      );
      setCadenceRpm(defaults.cadence);
      setPoolLengthMeters(25);
      setLaps(0);
    },
    [],
  );

  useEffect(() => {
    if (!isSpeedBased) return;
    setPaceSeconds(paceFromSpeed(speedKmh));
  }, [isSpeedBased, speedKmh]);

  useEffect(() => {
    if (!user) return;

    let mounted = true;
    setLoading(true);

    loadCardioDashboard(user.id).then((dashboard) => {
      if (!mounted) return;

      setPrescriptions(dashboard.prescriptions);
      setRecentSessions(dashboard.recentSessions);

      if (dashboard.openSession) {
        const current = dashboard.openSession;
        const defaults = activityDefaults[current.activityType];
        const recoveredSpeed =
          current.averageSpeedKmh ||
          speedFromPace(current.averagePaceSeconds) ||
          defaults.speed;

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
        setSpeedKmh(Number(recoveredSpeed.toFixed(1)));
        setCadenceRpm(
          current.cadenceRpm || defaults.cadence,
        );
        setLaps(current.laps);
        setElapsedSeconds(current.elapsedSeconds);
        setStatus("paused");
        setToast(
          "Sessão recuperada. Toque em retomar para continuar.",
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
  const remainingSeconds = Math.max(
    0,
    targetSeconds - elapsedSeconds,
  );
  const focusMode = status === "running" || status === "paused";

  const calculatedSpeed = useMemo(() => {
    if (isSpeedBased || activity === "spinning") {
      return speedKmh;
    }
    return 0;
  }, [activity, isSpeedBased, speedKmh]);

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
      "Meta atingida. Você pode continuar ou finalizar.",
    );
  }, [elapsedSeconds, status, targetSeconds]);

  const intensityConfig = useMemo<IntensityConfig>(() => {
    if (activity === "treadmill") {
      return {
        label: "Velocidade da esteira",
        helper: `Pace calculado: ${formatPace(paceSeconds)} min/km`,
        value: speedKmh,
        min: 1,
        max: 22,
        step: 0.1,
        displayValue: speedKmh.toFixed(1),
        unit: "km/h",
      };
    }

    if (activity === "walk") {
      return {
        label: "Velocidade da caminhada",
        helper: `Pace calculado: ${formatPace(paceSeconds)} min/km`,
        value: speedKmh,
        min: 1,
        max: 9,
        step: 0.1,
        displayValue: speedKmh.toFixed(1),
        unit: "km/h",
      };
    }

    if (activity === "elliptical") {
      return {
        label: "Velocidade do elíptico",
        helper: `Pace equivalente: ${formatPace(paceSeconds)} min/km`,
        value: speedKmh,
        min: 1,
        max: 18,
        step: 0.1,
        displayValue: speedKmh.toFixed(1),
        unit: "km/h",
      };
    }

    if (activity === "spinning") {
      return {
        label: "Velocidade da bike",
        helper: `Cadência atual: ${cadenceRpm} rpm`,
        value: speedKmh,
        min: 5,
        max: 60,
        step: 0.5,
        displayValue: speedKmh.toFixed(1),
        unit: "km/h",
      };
    }

    if (activity === "stairs") {
      return {
        label: "Ritmo da escada",
        helper: "Use o valor mostrado pela máquina",
        value: cadenceRpm,
        min: 20,
        max: 180,
        step: 5,
        displayValue: String(cadenceRpm),
        unit: "degraus/min",
      };
    }

    if (activity === "rowing") {
      return {
        label: "Pace do remo",
        helper: "Tempo necessário para completar 500 metros",
        value: paceSeconds,
        min: 80,
        max: 300,
        step: 5,
        displayValue: formatPace(paceSeconds),
        unit: "/500m",
      };
    }

    return {
      label: "Pace do nado",
      helper: `Piscina de ${poolLengthMeters} m`,
      value: paceSeconds,
      min: 45,
      max: 300,
      step: 5,
      displayValue: formatPace(paceSeconds),
      unit: "/100m",
    };
  }, [
    activity,
    cadenceRpm,
    paceSeconds,
    poolLengthMeters,
    speedKmh,
  ]);

  if (authLoading || loading) return <LoadingSplash />;
  if (!user) return <Navigate to="/login" replace />;
  if (landingPath !== "/menu-teste") {
    return <Navigate to={landingPath} replace />;
  }

  const setIntensityValue = (rawValue: number) => {
    const value = clamp(
      roundToStep(rawValue, intensityConfig.step),
      intensityConfig.min,
      intensityConfig.max,
    );

    if (
      activity === "treadmill" ||
      activity === "walk" ||
      activity === "elliptical" ||
      activity === "spinning"
    ) {
      setSpeedKmh(Number(value.toFixed(1)));
      return;
    }

    if (activity === "stairs") {
      setCadenceRpm(Math.round(value));
      return;
    }

    setPaceSeconds(Math.round(value));
  };

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
        mode_label: getActivityOption(activity).label,
      },
      source: selectedPrescription ? "professor" : "free",
    });

    setSession(created);
    setElapsedSeconds(0);
    setLaps(0);
    setStatus("running");
    targetReachedRef.current = false;
    setBusy(false);
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
        : "Cardio concluído neste aparelho.",
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

  const currentOption = getActivityOption(activity);

  const metricTitle =
    activity === "spinning"
      ? "Velocidade"
      : activity === "stairs"
        ? "Ritmo"
        : "Pace";

  const metricValue =
    activity === "spinning"
      ? speedKmh.toFixed(1)
      : activity === "stairs"
        ? String(cadenceRpm)
        : formatPace(paceSeconds);

  const metricUnit =
    activity === "spinning"
      ? "km/h"
      : activity === "stairs"
        ? "degraus/min"
        : activity === "rowing"
          ? "min/500m"
          : activity === "swim"
            ? "min/100m"
            : "min/km";

  const distanceLabel =
    activity === "stairs"
      ? `${Math.round(distanceMeters)} degraus`
      : distanceMeters >= 1000
        ? `${(distanceMeters / 1000).toFixed(2)} km`
        : `${Math.round(distanceMeters)} m`;

  const readiness =
    status === "running"
      ? "Em andamento"
      : status === "paused"
        ? "Pausado"
        : "Pronto para iniciar";

  return (
    <div className="cardio-screen">
      <div className="cardio-background" />

      <main
        className={`cardio-page ${
          focusMode ? "is-focus" : ""
        }`}
      >
        <header className="cardio-topbar">
          <button
            type="button"
            className="cardio-top-button"
            onClick={() => navigate("/menu-teste")}
            aria-label="Voltar ao menu"
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
              className="cardio-top-button cardio-top-switch"
              onClick={() => navigate("/treino")}
              aria-label="Ir para musculação"
              title="Ir para musculação"
            >
              <CardioBackSwitchIcon />
            </button>

            <button
              type="button"
              className="cardio-top-button"
              onClick={() => setHistoryOpen(true)}
              aria-label="Abrir histórico de cardio"
              title="Histórico"
            >
              <CardioHistoryIcon />
            </button>
          </div>
        </header>

        <section className="cardio-workspace">
          <section className="cardio-hero-stage">
            <img
              key={currentOption.key}
              src={currentOption.image}
              alt={`Pessoa realizando ${currentOption.label}`}
            />
            <div className="cardio-hero-overlay" />

            <div className="cardio-hero-title">
              <div className="cardio-mode-mark">
                <CardioPulseIcon />
              </div>
              <div>
                <span>
                  {selectedPrescription
                    ? "PRESCRIÇÃO ATIVA"
                    : "SESSÃO PERSONALIZADA"}
                </span>
                <h1>{currentOption.label}</h1>
                <p>{currentOption.subtitle}</p>
              </div>
            </div>

            <button
              type="button"
              className="cardio-hero-settings"
              onClick={() => setSettingsOpen(true)}
            >
              <CardioSettingsIcon />
              <span>{timingLabels[timing]}</span>
            </button>

            <div className={`cardio-status status-${status}`}>
              <i />
              <span>{readiness}</span>
            </div>
          </section>

          <section className="cardio-live-stage">
            <article className="cardio-live-card calories">
              <CardioFlameIcon />
              <span>Calorias</span>
              <strong>{calories}</strong>
              <small>kcal</small>
            </article>

            <div
              className="cardio-timer-ring"
              style={
                {
                  "--cardio-progress": `${progress * 360}deg`,
                } as CSSProperties
              }
            >
              <div>
                <span>Tempo</span>
                <strong>{formatClock(elapsedSeconds)}</strong>
                <small>
                  {status === "running"
                    ? `${formatClock(remainingSeconds)} restantes`
                    : `/ ${String(targetMinutes).padStart(2, "0")}:00`}
                </small>
              </div>
            </div>

            <article className="cardio-live-card pace">
              <CardioPulseIcon />
              <span>{metricTitle}</span>
              <strong>{metricValue}</strong>
              <small>{metricUnit}</small>
            </article>
          </section>

          <section className="cardio-intensity-card">
            <header>
              <div>
                <strong>{intensityConfig.label}</strong>
                <small>{intensityConfig.helper}</small>
              </div>
              <b>
                {intensityConfig.displayValue}
                <small>{intensityConfig.unit}</small>
              </b>
            </header>

            <div className="cardio-intensity-controls">
              <button
                type="button"
                onClick={() =>
                  setIntensityValue(
                    intensityConfig.value - intensityConfig.step,
                  )
                }
                disabled={status === "running"}
                aria-label="Diminuir intensidade"
              >
                <CardioMinusIcon />
              </button>

              <input
                type="range"
                min={intensityConfig.min}
                max={intensityConfig.max}
                step={intensityConfig.step}
                value={intensityConfig.value}
                disabled={status === "running"}
                onChange={(event) =>
                  setIntensityValue(Number(event.target.value))
                }
                style={
                  {
                    "--slider-progress": `${
                      ((intensityConfig.value - intensityConfig.min) /
                        (intensityConfig.max - intensityConfig.min)) *
                      100
                    }%`,
                  } as CSSProperties
                }
                aria-label={intensityConfig.label}
              />

              <button
                type="button"
                onClick={() =>
                  setIntensityValue(
                    intensityConfig.value + intensityConfig.step,
                  )
                }
                disabled={status === "running"}
                aria-label="Aumentar intensidade"
              >
                <CardioPlusIcon />
              </button>
            </div>
          </section>

          <section className="cardio-actions">
            <button
              type="button"
              className="cardio-primary-action"
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
              className="cardio-secondary-action"
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
                {status === "paused" ? "Finalizar" : "Pausar"}
              </span>
            </button>
          </section>

          <section className="cardio-mode-picker">
            <header>
              <strong>Modalidade</strong>
              <small>{distanceLabel}</small>
            </header>

            <div className="cardio-mode-rail">
              {activityOptions.map((option) => {
                const active = option.key === activity;
                const prescribed = prescriptions.some(
                  (item) => item.activityType === option.key,
                );

                return (
                  <button
                    type="button"
                    key={option.key}
                    className={active ? "active" : ""}
                    onClick={() => selectActivity(option.key)}
                  >
                    <img
                      src={option.image}
                      alt=""
                      aria-hidden="true"
                    />
                    <span>{option.label}</span>
                    {active ? <b aria-hidden="true">✓</b> : null}
                    {prescribed ? <small>PROF.</small> : null}
                  </button>
                );
              })}
            </div>
          </section>
        </section>
      </main>

      {settingsOpen ? (
        <div
          className="cardio-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Configurações do cardio"
        >
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
                  Configure a meta e os dados usados no histórico.
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
              <strong>Meta de tempo</strong>
              <div className="cardio-stepper cardio-time-stepper">
                <button
                  type="button"
                  onClick={() =>
                    setTargetMinutes((value) => Math.max(5, value - 5))
                  }
                >
                  <CardioMinusIcon />
                </button>
                <span>{targetMinutes} min</span>
                <button
                  type="button"
                  onClick={() =>
                    setTargetMinutes((value) => Math.min(120, value + 5))
                  }
                >
                  <CardioPlusIcon />
                </button>
              </div>
            </div>

            <div className="cardio-setting-group">
              <strong>Quando será feito?</strong>
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

            {activity === "spinning" ? (
              <div className="cardio-setting-group">
                <strong>Cadência da bike</strong>
                <div className="cardio-stepper">
                  <button
                    type="button"
                    onClick={() =>
                      setCadenceRpm((value) => Math.max(30, value - 5))
                    }
                  >
                    <CardioMinusIcon />
                  </button>
                  <span>{cadenceRpm} rpm</span>
                  <button
                    type="button"
                    onClick={() =>
                      setCadenceRpm((value) => Math.min(160, value + 5))
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
                <span>HISTÓRICO INDIVIDUAL</span>
                <h2>Cardios realizados</h2>
                <p>
                  Sessões salvas para o aluno e para o professor.
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
                  const historyOption = getActivityOption(
                    item.activityType,
                  );

                  return (
                    <article key={item.id}>
                      <img
                        src={historyOption.image}
                        alt=""
                        aria-hidden="true"
                      />
                      <div>
                        <strong>{historyOption.label}</strong>
                        <span>
                          {formatClock(item.elapsedSeconds)}
                          {" • "}
                          {item.activityType === "stairs"
                            ? `${Math.round(
                                item.distanceMeters,
                              )} degraus`
                            : `${(
                                item.distanceMeters / 1000
                              ).toFixed(2)} km`}
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
        <div
          className="cardio-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Cardio concluído"
        >
          <section className="cardio-finish-modal">
            <div className="cardio-finish-check">
              <CardioCheckIcon size={35} />
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
                  {activity === "stairs" ? "Degraus" : "Distância"}
                </span>
                <strong>{distanceLabel}</strong>
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
