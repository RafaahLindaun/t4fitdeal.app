import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { Navigate, useNavigate } from "react-router-dom";
import * as Tabs from "@radix-ui/react-tabs";
import confetti from "canvas-confetti";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  Area,
  AreaChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../auth/AuthProvider";
import LoadingSplash from "../components/LoadingSplash";
import PageHeader from "../components/PageHeader";
import {
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
  loadCardioDashboard,
  type CardioActivity,
  type CardioPrescription,
  type CardioSessionRecord,
  type CardioSessionStatus,
  type CardioTiming,
} from "../lib/cardio";
import {
  useCardioSession,
  type CardioMachinePhase,
  type CardioSample,
} from "../hooks/useCardioSession";
import "./cardio.css";

type ActivityOption = {
  key: CardioActivity;
  label: string;
  subtitle: string;
  image: string;
  video?: string;
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

type MetricDescriptor = {
  title: string;
  value: number;
  unit: string;
  formatter: (value: number) => string;
  min: number;
  max: number;
};

const activityOptions: ActivityOption[] = [
  { key: "treadmill", label: "Esteira", subtitle: "Velocidade e pace", image: treadmillImage },
  { key: "spinning", label: "Bike", subtitle: "Velocidade e cadência", image: spinningImage },
  { key: "elliptical", label: "Elíptico", subtitle: "Ritmo contínuo", image: ellipticalImage },
  { key: "stairs", label: "Escada", subtitle: "Degraus por minuto", image: stairsImage },
  { key: "rowing", label: "Remo", subtitle: "Pace por 500 metros", image: rowingImage },
  { key: "walk", label: "Caminhada", subtitle: "Velocidade e pace", image: walkImage },
  { key: "swim", label: "Nado", subtitle: "Pace por 100 metros", image: swimImage },
];

const timingLabels: Record<CardioTiming, string> = {
  before: "Antes do treino",
  after: "Depois do treino",
  anytime: "Configurar sessão",
};

const activityDefaults: Record<
  CardioActivity,
  { pace: number; speed: number; cadence: number; caloriesPerMinute: number }
> = {
  treadmill: { pace: 400, speed: 9, cadence: 0, caloriesPerMinute: 8.5 },
  spinning: { pace: 0, speed: 22, cadence: 80, caloriesPerMinute: 10 },
  elliptical: { pace: 450, speed: 8, cadence: 62, caloriesPerMinute: 8 },
  stairs: { pace: 0, speed: 0, cadence: 60, caloriesPerMinute: 10.5 },
  rowing: { pace: 135, speed: 0, cadence: 26, caloriesPerMinute: 9 },
  walk: { pace: 600, speed: 6, cadence: 0, caloriesPerMinute: 5 },
  swim: { pace: 120, speed: 0, cadence: 0, caloriesPerMinute: 8 },
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
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}

function formatPace(seconds: number) {
  if (!seconds || !Number.isFinite(seconds)) return "—";
  const safe = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safe / 60);
  const remaining = safe % 60;
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
  return activityOptions.find((option) => option.key === activity) ?? activityOptions[0];
}

function targetDescription(prescription: CardioPrescription | null, targetMinutes: number) {
  if (!prescription) return `${targetMinutes} minutos configurados`;
  const parts = [`${prescription.targetDurationMinutes || targetMinutes} min`];
  if (prescription.targetDistance > 0) {
    parts.push(`${prescription.targetDistance} ${prescription.distanceUnit}`);
  }
  if (prescription.targetPaceSeconds > 0) {
    parts.push(`pace ${formatPace(prescription.targetPaceSeconds)}/${prescription.paceUnit}`);
  }
  if (prescription.targetLaps > 0) parts.push(`${prescription.targetLaps} voltas`);
  return parts.join(" • ");
}

function haptic(pattern: number | number[] = 10) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

function AnimatedMetric({
  value,
  formatter,
  reducedMotion,
}: {
  value: number;
  formatter: (value: number) => string;
  reducedMotion: boolean;
}) {
  const motionValue = useMotionValue(reducedMotion ? value : 0);
  const spring = useSpring(motionValue, { stiffness: 210, damping: 28, mass: 0.45 });
  const [display, setDisplay] = useState(reducedMotion ? value : 0);

  useMotionValueEvent(spring, "change", (latest) => setDisplay(latest));
  useEffect(() => {
    if (reducedMotion) {
      motionValue.set(value);
      setDisplay(value);
    } else {
      motionValue.set(value);
    }
  }, [motionValue, reducedMotion, value]);

  return <>{formatter(display)}</>;
}

const ProgressRing = memo(function ProgressRing({
  elapsedSeconds,
  targetSeconds,
  metric,
  phase,
  reducedMotion,
}: {
  elapsedSeconds: number;
  targetSeconds: number;
  metric: MetricDescriptor;
  phase: CardioMachinePhase;
  reducedMotion: boolean;
}) {
  const radius = 92;
  const circumference = Math.PI * 2 * radius;
  const progress = targetSeconds > 0 ? clamp(elapsedSeconds / targetSeconds, 0, 1) : 0;
  const dashOffset = circumference * (1 - progress);
  const remaining = Math.max(0, targetSeconds - elapsedSeconds);

  return (
    <div className="cardio-activity-ring" aria-label={`Progresso de ${Math.round(progress * 100)}% da meta`}>
      <svg viewBox="0 0 224 224" role="img" aria-hidden="true">
        <defs>
          <linearGradient id="cardio-ring-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--cardio-accent)" />
            <stop offset="70%" stopColor="var(--cardio-accent-hot)" />
            <stop offset="100%" stopColor="var(--cardio-hot)" />
          </linearGradient>
        </defs>
        <circle className="cardio-ring-track" cx="112" cy="112" r={radius} />
        <motion.circle
          className="cardio-ring-progress"
          cx="112"
          cy="112"
          r={radius}
          stroke="url(#cardio-ring-gradient)"
          strokeDasharray={circumference}
          initial={reducedMotion ? false : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={reducedMotion ? { duration: 0 } : { duration: 0.7, ease: [0.2, 0.82, 0.22, 1] }}
        />
      </svg>

      <div className="cardio-ring-content">
        <span>{phase === "pausado" ? "PAUSADO" : phase === "idle" ? "PRONTO" : "TEMPO ATIVO"}</span>
        <strong><AnimatedMetric value={elapsedSeconds} formatter={(value) => formatClock(value)} reducedMotion={reducedMotion} /></strong>
        <div className="cardio-ring-live-metric">
          <b>
            <AnimatedMetric value={metric.value} formatter={metric.formatter} reducedMotion={reducedMotion} />
          </b>
          <small>{metric.unit}</small>
        </div>
        <em>{phase === "em_andamento" ? `${formatClock(remaining)} para a meta` : `meta ${Math.round(targetSeconds / 60)} min`}</em>
      </div>
    </div>
  );
});

function ActivityMedia({ option, active }: { option: ActivityOption; active: boolean }) {
  if (option.video) {
    return (
      <video
        src={option.video}
        muted
        loop
        playsInline
        autoPlay={active}
        preload={active ? "metadata" : "none"}
        aria-label={`${option.label} em movimento`}
      />
    );
  }

  return (
    <img
      src={option.image}
      alt={`Modalidade ${option.label}`}
      loading={active ? "eager" : "lazy"}
      draggable={false}
    />
  );
}

function ActivityCard({
  option,
  selected,
  containerRef,
  disabled,
  onSelect,
  reducedMotion,
}: {
  option: ActivityOption;
  selected: boolean;
  containerRef: RefObject<HTMLDivElement>;
  disabled: boolean;
  onSelect: () => void;
  reducedMotion: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const { scrollXProgress } = useScroll({
    axis: "x",
    container: containerRef,
    target: ref,
    offset: ["start end", "end start"],
  });
  const scale = useTransform(scrollXProgress, [0, 0.5, 1], [0.9, 1, 0.9]);
  const opacity = useTransform(scrollXProgress, [0, 0.5, 1], [0.52, 1, 0.52]);

  return (
    <motion.button
      ref={ref}
      type="button"
      className={`cardio-activity-card ${selected ? "is-selected" : ""}`}
      style={reducedMotion ? { opacity: 1 } : { scale, opacity }}
      onClick={onSelect}
      disabled={disabled}
      aria-label={`Selecionar ${option.label}`}
      aria-pressed={selected}
    >
      <div className="cardio-activity-media"><ActivityMedia option={option} active={selected} /></div>
      <span>{option.label}</span>
      <small>{option.subtitle}</small>
    </motion.button>
  );
}

function ActivityCarousel({
  activity,
  disabled,
  onSelect,
  reducedMotion,
}: {
  activity: CardioActivity;
  disabled: boolean;
  onSelect: (activity: CardioActivity) => void;
  reducedMotion: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const selected = containerRef.current?.querySelector<HTMLElement>(".cardio-activity-card.is-selected");
    selected?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "nearest", inline: "center" });
  }, [activity, reducedMotion]);

  return (
    <div className="cardio-activity-carousel" ref={containerRef} role="list" aria-label="Modalidades de cardio">
      {activityOptions.map((option) => (
        <ActivityCard
          key={option.key}
          option={option}
          selected={activity === option.key}
          containerRef={containerRef}
          disabled={disabled}
          onSelect={() => onSelect(option.key)}
          reducedMotion={reducedMotion}
        />
      ))}
    </div>
  );
}

function PaceChart({
  samples,
  metric,
}: {
  samples: CardioSample[];
  metric: MetricDescriptor;
}) {
  const data = samples.length
    ? samples.map((sample) => ({ ...sample, label: formatClock(sample.elapsedSeconds) }))
    : [{ elapsedSeconds: 0, value: metric.value, label: "00:00" }];

  const range = Math.max(1, metric.max - metric.min);
  const zone1 = metric.min + range * 0.45;
  const zone2 = metric.min + range * 0.72;

  return (
    <section className="cardio-chart-card" aria-label={`Gráfico ao vivo de ${metric.title}`}>
      <header>
        <div>
          <span>RITMO AO VIVO</span>
          <strong>{metric.title}</strong>
        </div>
        <small>últimos 3 min</small>
      </header>
      <div className="cardio-chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 7, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="cardio-live-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--cardio-accent)" stopOpacity={0.26} />
                <stop offset="100%" stopColor="var(--cardio-accent)" stopOpacity={0.015} />
              </linearGradient>
            </defs>
            {metric.title === "Pace" ? (
              <>
                <ReferenceArea y1={metric.min} y2={zone1} fill="var(--cardio-zone-hard)" fillOpacity={0.09} />
                <ReferenceArea y1={zone1} y2={zone2} fill="var(--cardio-zone-medium)" fillOpacity={0.12} />
                <ReferenceArea y1={zone2} y2={metric.max} fill="var(--cardio-zone-light)" fillOpacity={0.18} />
              </>
            ) : (
              <>
                <ReferenceArea y1={metric.min} y2={zone1} fill="var(--cardio-zone-light)" fillOpacity={0.18} />
                <ReferenceArea y1={zone1} y2={zone2} fill="var(--cardio-zone-medium)" fillOpacity={0.12} />
                <ReferenceArea y1={zone2} y2={metric.max} fill="var(--cardio-zone-hard)" fillOpacity={0.09} />
              </>
            )}
            <XAxis dataKey="label" hide />
            <YAxis domain={[metric.min, metric.max]} hide />
            <Tooltip
              cursor={{ stroke: "rgba(255,255,255,.12)", strokeWidth: 1 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const raw = Number(payload[0]?.value ?? 0);
                return (
                  <div className="cardio-chart-tooltip">
                    <span>{label}</span>
                    <strong>{metric.formatter(raw)} {metric.unit}</strong>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--cardio-accent)"
              strokeWidth={3}
              fill="url(#cardio-live-area)"
              dot={false}
              activeDot={{ r: 4, fill: "var(--cardio-accent-hot)", strokeWidth: 0 }}
              isAnimationActive={false}
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <footer aria-label="Zonas estimadas de esforço">
        <span><i className="zone-light" />Leve</span>
        <span><i className="zone-medium" />Moderado</span>
        <span><i className="zone-hard" />Intenso</span>
      </footer>
    </section>
  );
}

function SummaryMetric({
  label,
  value,
  formatter,
  reducedMotion,
}: {
  label: string;
  value: number;
  formatter: (value: number) => string;
  reducedMotion: boolean;
}) {
  return (
    <article>
      <span>{label}</span>
      <strong><AnimatedMetric value={value} formatter={formatter} reducedMotion={reducedMotion} /></strong>
    </article>
  );
}

function CardioSummary({
  activity,
  elapsedSeconds,
  targetSeconds,
  distanceMeters,
  calories,
  metric,
  syncStatus,
  validForRanking,
  reducedMotion,
  onRetrySync,
  onAgain,
  onMenu,
}: {
  activity: CardioActivity;
  elapsedSeconds: number;
  targetSeconds: number;
  distanceMeters: number;
  calories: number;
  metric: MetricDescriptor;
  syncStatus: "idle" | "pending" | "synced" | "failed";
  validForRanking: boolean;
  reducedMotion: boolean;
  onRetrySync: () => void;
  onAgain: () => void;
  onMenu: () => void;
}) {
  const option = getActivityOption(activity);
  const progress = targetSeconds > 0 ? clamp(elapsedSeconds / targetSeconds, 0, 1) : 0;
  const radius = 104;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (reducedMotion) return;
    const end = Date.now() + 650;
    const frame = () => {
      confetti({
        particleCount: 4,
        spread: 52,
        startVelocity: 19,
        gravity: 0.8,
        scalar: 0.7,
        origin: { x: 0.5, y: 0.68 },
        colors: ["#ffd11e", "#ff9b2f", "#ffffff"],
        disableForReducedMotion: true,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, [reducedMotion]);

  return (
    <div className="cardio-screen cardio-summary-screen">
      <div className="cardio-background" />
      <main className="cardio-summary-page">
        <div className="cardio-summary-kicker"><CardioCheckIcon /> CARDIO CONCLUÍDO</div>
        <h1>{option.label} finalizada</h1>
        {syncStatus === "synced" ? (
          <div className="cardio-sync-state is-synced" role="status" aria-live="polite">
            <span className="cardio-cloud-icon" aria-hidden="true"><i /></span>
            <div><strong>Sessão salva ✓</strong><small>{validForRanking
              ? "Cardio registrado e contabilizado no ranking ACCQUA."
              : elapsedSeconds >= 1800
                ? "Cardio registrado no seu histórico."
                : "Cardio registrado. Para pontuar sem musculação no dia, complete pelo menos 30 minutos."}</small></div>
          </div>
        ) : (
          <div className={`cardio-sync-state ${syncStatus === "failed" ? "is-waiting" : ""}`} role="status" aria-live="polite">
            <span className="cardio-cloud-icon" aria-hidden="true"><i /></span>
            <div><strong>Sincronizando quando a conexão voltar</strong><small>Sua sessão já está salva neste dispositivo.</small></div>
            <button type="button" onClick={onRetrySync}>Tentar novamente</button>
          </div>
        )}

        <section className="cardio-summary-ring">
          <svg viewBox="0 0 250 250" aria-hidden="true">
            <defs>
              <linearGradient id="cardio-summary-gradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--cardio-accent)" />
                <stop offset="100%" stopColor="var(--cardio-hot)" />
              </linearGradient>
            </defs>
            <circle cx="125" cy="125" r={radius} className="summary-ring-track" />
            <motion.circle
              cx="125"
              cy="125"
              r={radius}
              className="summary-ring-progress"
              stroke="url(#cardio-summary-gradient)"
              strokeDasharray={circumference}
              initial={reducedMotion ? false : { strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference * (1 - progress) }}
              transition={reducedMotion ? { duration: 0 } : { duration: 1.1, ease: [0.2, 0.8, 0.2, 1] }}
            />
          </svg>
          <div>
            <span>TEMPO TOTAL</span>
            <strong><AnimatedMetric value={elapsedSeconds} formatter={(value) => formatClock(value)} reducedMotion={reducedMotion} /></strong>
            <small>{Math.round(progress * 100)}% da meta</small>
          </div>
        </section>

        <section className="cardio-summary-grid">
          <SummaryMetric
            label={activity === "stairs" ? "Degraus" : "Distância"}
            value={distanceMeters}
            formatter={(value) => activity === "stairs" ? `${Math.round(value)}` : value >= 1000 ? `${(value / 1000).toFixed(2)} km` : `${Math.round(value)} m`}
            reducedMotion={reducedMotion}
          />
          <SummaryMetric label="Calorias" value={calories} formatter={(value) => `${Math.round(value)} kcal`} reducedMotion={reducedMotion} />
          <SummaryMetric label={metric.title} value={metric.value} formatter={(value) => `${metric.formatter(value)} ${metric.unit}`} reducedMotion={reducedMotion} />
          <SummaryMetric label="Meta" value={targetSeconds / 60} formatter={(value) => `${Math.round(value)} min`} reducedMotion={reducedMotion} />
        </section>

        {validForRanking ? <div className="cardio-ranking-badge">✓ Contabilizado no ranking ACCQUA</div> : null}

        <div className="cardio-summary-actions">
          <button type="button" onClick={onAgain}>Fazer outro cardio</button>
          <button type="button" className="secondary" onClick={onMenu}>Voltar ao menu</button>
        </div>
      </main>
    </div>
  );
}

export default function Cardio() {
  const navigate = useNavigate();
  const { user, loading: authLoading, landingPath } = useAuth();
  const reducedMotionPreference = useReducedMotion();
  const reducedMotion = Boolean(reducedMotionPreference);

  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<CardioPrescription[]>([]);
  const [recentSessions, setRecentSessions] = useState<CardioSessionRecord[]>([]);
  const [activity, setActivity] = useState<CardioActivity>("treadmill");
  const [timing, setTiming] = useState<CardioTiming>("anytime");
  const [targetMinutes, setTargetMinutes] = useState(30);
  const [paceSeconds, setPaceSeconds] = useState(activityDefaults.treadmill.pace);
  const [speedKmh, setSpeedKmh] = useState(activityDefaults.treadmill.speed);
  const [cadenceRpm, setCadenceRpm] = useState(activityDefaults.treadmill.cadence);
  const [poolLengthMeters, setPoolLengthMeters] = useState(25);
  const [laps, setLaps] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState("");
  const targetReachedRef = useRef(false);

  const selectedPrescription = useMemo(
    () => prescriptions.find((prescription) => prescription.activityType === activity && prescription.isActive) ?? null,
    [activity, prescriptions],
  );

  const isSpeedBased = activity === "treadmill" || activity === "walk" || activity === "elliptical";

  const applyActivity = useCallback((nextActivity: CardioActivity, prescription?: CardioPrescription | null) => {
    const defaults = activityDefaults[nextActivity];
    const prescriptionSpeed = prescription?.targetSpeedKmh || (prescription?.targetPaceSeconds ? speedFromPace(prescription.targetPaceSeconds) : 0);
    const nextSpeed = prescriptionSpeed || defaults.speed;
    const speedDriven = nextActivity === "treadmill" || nextActivity === "walk" || nextActivity === "elliptical";

    setActivity(nextActivity);
    setTiming(prescription?.timing ?? "anytime");
    setTargetMinutes(clamp(prescription?.targetDurationMinutes || 30, 5, 120));
    setSpeedKmh(Number(nextSpeed.toFixed(1)));
    setPaceSeconds(speedDriven ? paceFromSpeed(nextSpeed) : prescription?.targetPaceSeconds || defaults.pace);
    setCadenceRpm(defaults.cadence);
    setPoolLengthMeters(25);
    setLaps(0);
  }, []);

  useEffect(() => {
    if (!isSpeedBased) return;
    setPaceSeconds(paceFromSpeed(speedKmh));
  }, [isSpeedBased, speedKmh]);

  const targetSeconds = targetMinutes * 60;
  const calculatedSpeed = isSpeedBased || activity === "spinning" ? speedKmh : 0;

  const metricsForElapsed = useCallback((seconds: number) => {
    const distanceMeters = activity === "swim"
      ? laps * poolLengthMeters
      : activity === "rowing"
        ? paceSeconds > 0 ? Math.round((seconds / paceSeconds) * 500) : 0
        : activity === "stairs"
          ? Math.round(cadenceRpm * (seconds / 60))
          : Math.round(calculatedSpeed * (seconds / 3600) * 1000);

    const calories = Math.round(activityDefaults[activity].caloriesPerMinute * (seconds / 60));
    return { distanceMeters, calories };
  }, [activity, calculatedSpeed, cadenceRpm, laps, paceSeconds, poolLengthMeters]);

  const buildSnapshot = useCallback((seconds: number, status: CardioSessionStatus) => {
    const metrics = metricsForElapsed(seconds);
    return {
      elapsedSeconds: seconds,
      distanceMeters: metrics.distanceMeters,
      averagePaceSeconds: paceSeconds,
      averageSpeedKmh: calculatedSpeed,
      cadenceRpm,
      laps,
      calories: metrics.calories,
      status,
    };
  }, [calculatedSpeed, cadenceRpm, laps, metricsForElapsed, paceSeconds]);

  const intensityConfig = useMemo<IntensityConfig>(() => {
    if (activity === "treadmill") return { label: "Velocidade da esteira", helper: `Pace calculado: ${formatPace(paceSeconds)} min/km`, value: speedKmh, min: 1, max: 22, step: 0.1, displayValue: speedKmh.toFixed(1), unit: "km/h" };
    if (activity === "walk") return { label: "Velocidade da caminhada", helper: `Pace calculado: ${formatPace(paceSeconds)} min/km`, value: speedKmh, min: 1, max: 9, step: 0.1, displayValue: speedKmh.toFixed(1), unit: "km/h" };
    if (activity === "elliptical") return { label: "Velocidade do elíptico", helper: `Pace equivalente: ${formatPace(paceSeconds)} min/km`, value: speedKmh, min: 1, max: 18, step: 0.1, displayValue: speedKmh.toFixed(1), unit: "km/h" };
    if (activity === "spinning") return { label: "Velocidade da bike", helper: `Cadência atual: ${cadenceRpm} rpm`, value: speedKmh, min: 5, max: 60, step: 0.5, displayValue: speedKmh.toFixed(1), unit: "km/h" };
    if (activity === "stairs") return { label: "Ritmo da escada", helper: "Use o valor mostrado pela máquina", value: cadenceRpm, min: 20, max: 180, step: 5, displayValue: String(cadenceRpm), unit: "degraus/min" };
    if (activity === "rowing") return { label: "Pace do remo", helper: "Tempo para completar 500 metros", value: paceSeconds, min: 80, max: 300, step: 5, displayValue: formatPace(paceSeconds), unit: "/500m" };
    return { label: "Pace do nado", helper: `Piscina de ${poolLengthMeters} m`, value: paceSeconds, min: 45, max: 300, step: 5, displayValue: formatPace(paceSeconds), unit: "/100m" };
  }, [activity, cadenceRpm, paceSeconds, poolLengthMeters, speedKmh]);

  const metric = useMemo<MetricDescriptor>(() => {
    if (activity === "stairs") {
      return { title: "Ritmo", value: cadenceRpm, unit: "degraus/min", formatter: (value) => String(Math.round(value)), min: 20, max: 180 };
    }
    if (activity === "rowing") {
      return { title: "Pace", value: paceSeconds, unit: "min/500m", formatter: formatPace, min: 80, max: 300 };
    }
    if (activity === "swim") {
      return { title: "Pace", value: paceSeconds, unit: "min/100m", formatter: formatPace, min: 45, max: 300 };
    }
    return {
      title: "Velocidade",
      value: speedKmh,
      unit: "km/h",
      formatter: (value) => value.toFixed(1),
      min: intensityConfig.min,
      max: intensityConfig.max,
    };
  }, [activity, cadenceRpm, intensityConfig.max, intensityConfig.min, paceSeconds, speedKmh]);

  const startConfig = useMemo(() => ({
    userId: user?.id ?? "",
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
    source: selectedPrescription ? "professor" as const : "free" as const,
  }), [activity, calculatedSpeed, cadenceRpm, paceSeconds, poolLengthMeters, selectedPrescription, targetMinutes, targetSeconds, timing, user?.id]);

  const cardioSession = useCardioSession({
    startConfig,
    liveMetricValue: metric.value,
    buildSnapshot,
    onPersistError: () => setToast("A conexão oscilou. A sessão continua e tentaremos salvar novamente."),
  });

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
        const recoveredSpeed = current.averageSpeedKmh || speedFromPace(current.averagePaceSeconds) || defaults.speed;
        setActivity(current.activityType);
        setTiming(current.timing);
        setTargetMinutes(clamp(Math.round(current.targetDurationSeconds / 60) || 30, 5, 120));
        setPaceSeconds(current.averagePaceSeconds || defaults.pace);
        setSpeedKmh(Number(recoveredSpeed.toFixed(1)));
        setCadenceRpm(current.cadenceRpm || defaults.cadence);
        setLaps(current.laps);
        cardioSession.restore(current);
        setToast("Sessão recuperada. Toque em retomar para continuar.");
      } else {
        const first = dashboard.prescriptions[0];
        if (first) applyActivity(first.activityType, first);
      }
      setLoading(false);
    });

    return () => { mounted = false; };
  // restore/applyActivity are stable callbacks; avoid reloading when session state changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (cardioSession.syncStatus !== "synced" || !user?.id) return;
    void loadCardioDashboard(user.id).then((dashboard) => setRecentSessions(dashboard.recentSessions));
  }, [cardioSession.syncStatus, user?.id]);

  useEffect(() => {
    if (cardioSession.phase !== "em_andamento" || cardioSession.elapsedSeconds < targetSeconds || targetReachedRef.current) return;
    targetReachedRef.current = true;
    haptic([120, 70, 120]);
    setToast("Meta atingida! Você pode continuar ou pausar para finalizar.");
  }, [cardioSession.elapsedSeconds, cardioSession.phase, targetSeconds]);

  const setIntensityValue = (rawValue: number) => {
    const value = clamp(roundToStep(rawValue, intensityConfig.step), intensityConfig.min, intensityConfig.max);
    haptic(8);
    if (activity === "treadmill" || activity === "walk" || activity === "elliptical" || activity === "spinning") {
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
    if (cardioSession.phase !== "idle") {
      setToast("Finalize a sessão atual antes de trocar a modalidade.");
      return;
    }
    const prescription = prescriptions.find((item) => item.activityType === nextActivity) ?? null;
    applyActivity(nextActivity, prescription);
    targetReachedRef.current = false;
  };

  const finish = async () => {
    haptic(20);
    await cardioSession.finish();
  };

  const resetSession = () => {
    cardioSession.reset();
    setLaps(0);
    targetReachedRef.current = false;
  };

  const currentOption = getActivityOption(activity);
  const currentMetrics = metricsForElapsed(cardioSession.elapsedSeconds);
  const distanceLabel = activity === "stairs"
    ? `${Math.round(currentMetrics.distanceMeters)} degraus`
    : currentMetrics.distanceMeters >= 1000
      ? `${(currentMetrics.distanceMeters / 1000).toFixed(2)} km`
      : `${Math.round(currentMetrics.distanceMeters)} m`;

  if (authLoading || loading) return <LoadingSplash />;
  if (!user) return <Navigate to="/login" replace />;
  if (landingPath !== "/menu-teste") return <Navigate to={landingPath} replace />;

  if (cardioSession.phase === "finalizado") {
    return (
      <CardioSummary
        activity={activity}
        elapsedSeconds={cardioSession.elapsedSeconds}
        targetSeconds={targetSeconds}
        distanceMeters={currentMetrics.distanceMeters}
        calories={currentMetrics.calories}
        metric={metric}
        syncStatus={cardioSession.syncStatus === "idle" ? "pending" : cardioSession.syncStatus}
        validForRanking={cardioSession.validForRanking}
        reducedMotion={reducedMotion}
        onRetrySync={cardioSession.retrySync}
        onAgain={resetSession}
        onMenu={() => navigate("/menu-teste")}
      />
    );
  }

  return (
    <div className="cardio-screen">
      <div className="cardio-background" />
      <main className="cardio-page">
        <PageHeader className="cardio-topbar" ariaLabel="Cabeçalho Cardio"
          left={<button type="button" className="cardio-top-button" onClick={() => navigate("/menu-teste")} aria-label="Voltar ao menu"><WorkoutBackIcon /></button>}
          center={<Tabs.Root className="cardio-context-tabs" value="cardio" onValueChange={(value) => { if (value === "musculacao") navigate("/treino"); }} aria-label="Alternar entre musculação e cardio"><Tabs.List><Tabs.Trigger value="musculacao">Musculação</Tabs.Trigger><Tabs.Trigger value="cardio">Cardio</Tabs.Trigger></Tabs.List></Tabs.Root>}
          right={<button type="button" className="cardio-top-button" onClick={() => setHistoryOpen(true)} aria-label="Abrir histórico de cardio"><CardioHistoryIcon /></button>}
        />

        <div className="cardio-scroll-area">
          <section className="cardio-title-row">
            <div>
              <span>{selectedPrescription ? "TREINO DO PROFESSOR" : "SESSÃO PERSONALIZADA"}</span>
              <h1>{currentOption.label}</h1>
              <p>{targetDescription(selectedPrescription, targetMinutes)}</p>
            </div>
            <button type="button" className="cardio-settings-chip" onClick={() => setSettingsOpen(true)} aria-label="Abrir configurações do cardio">
              <CardioSettingsIcon />
              <span>{timingLabels[timing]}</span>
            </button>
          </section>

          <ActivityCarousel activity={activity} disabled={cardioSession.phase !== "idle"} onSelect={selectActivity} reducedMotion={reducedMotion} />

          <section className="cardio-session-hero">
            <ProgressRing
              elapsedSeconds={cardioSession.elapsedSeconds}
              targetSeconds={targetSeconds}
              metric={metric}
              phase={cardioSession.phase}
              reducedMotion={reducedMotion}
            />

            <div className="cardio-quick-stats">
              <article><CardioFlameIcon /><span>Calorias</span><strong>{currentMetrics.calories}</strong><small>kcal</small></article>
              <article><CardioPulseIcon /><span>{activity === "stairs" ? "Degraus" : "Distância"}</span><strong>{distanceLabel}</strong><small>estimado</small></article>
            </div>
          </section>

          <PaceChart samples={cardioSession.samples} metric={metric} />

          <section className="cardio-intensity-card">
            <header>
              <div><CardioClockIcon /><span><strong>{intensityConfig.label}</strong><small>{intensityConfig.helper}</small></span></div>
              <b>{intensityConfig.displayValue}<small>{intensityConfig.unit}</small></b>
            </header>
            <div className="cardio-intensity-controls">
              <motion.button whileTap={reducedMotion ? undefined : { scale: 0.9 }} type="button" onClick={() => setIntensityValue(intensityConfig.value - intensityConfig.step)} aria-label="Diminuir intensidade"><CardioMinusIcon /></motion.button>
              <input
                type="range"
                min={intensityConfig.min}
                max={intensityConfig.max}
                step={intensityConfig.step}
                value={intensityConfig.value}
                onChange={(event) => setIntensityValue(Number(event.target.value))}
                style={{ "--slider-progress": `${((intensityConfig.value - intensityConfig.min) / (intensityConfig.max - intensityConfig.min)) * 100}%` } as CSSProperties}
                aria-label={intensityConfig.label}
              />
              <motion.button whileTap={reducedMotion ? undefined : { scale: 0.9 }} type="button" onClick={() => setIntensityValue(intensityConfig.value + intensityConfig.step)} aria-label="Aumentar intensidade"><CardioPlusIcon /></motion.button>
            </div>
          </section>

          {activity === "swim" && cardioSession.phase !== "idle" ? (
            <section className="cardio-laps-card">
              <div><span>VOLTAS</span><strong>{laps}</strong><small>{poolLengthMeters} m cada</small></div>
              <motion.button whileTap={reducedMotion ? undefined : { scale: 0.92 }} type="button" onClick={() => { haptic(12); setLaps((value) => value + 1); }} aria-label="Adicionar uma volta">
                <CardioPlusIcon /> Marcar volta
              </motion.button>
            </section>
          ) : null}

          <section className="cardio-actions" aria-label="Controles da sessão">
            <AnimatePresence mode="wait" initial={false}>
              {cardioSession.phase === "idle" ? (
                <motion.button
                  key="start"
                  layoutId="cardio-primary-action"
                  type="button"
                  className="cardio-primary-action"
                  onClick={() => { haptic(16); void cardioSession.start(); }}
                  disabled={cardioSession.busy}
                  initial={reducedMotion ? false : { opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reducedMotion ? undefined : { opacity: 0, y: -5 }}
                  whileTap={reducedMotion ? undefined : { scale: 0.975 }}
                  aria-label="Iniciar cardio"
                >
                  <CardioPlayIcon /> <span>{cardioSession.busy ? "Preparando..." : "Iniciar cardio"}</span>
                </motion.button>
              ) : cardioSession.phase === "em_andamento" ? (
                <motion.button
                  key="pause"
                  layoutId="cardio-primary-action"
                  type="button"
                  className="cardio-primary-action is-running"
                  onClick={() => { haptic(14); void cardioSession.pause(); }}
                  whileTap={reducedMotion ? undefined : { scale: 0.975 }}
                  aria-label="Pausar cardio"
                >
                  <CardioPauseIcon /> <span>Pausar</span>
                </motion.button>
              ) : (
                <motion.button
                  key="resume"
                  layoutId="cardio-primary-action"
                  type="button"
                  className="cardio-primary-action"
                  onClick={() => { haptic(14); void cardioSession.resume(); }}
                  whileTap={reducedMotion ? undefined : { scale: 0.975 }}
                  aria-label="Retomar cardio"
                >
                  <CardioPlayIcon /> <span>Retomar cardio</span>
                </motion.button>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {cardioSession.phase === "pausado" ? (
                <motion.button
                  type="button"
                  className="cardio-finish-action"
                  initial={reducedMotion ? false : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 50 }}
                  exit={reducedMotion ? undefined : { opacity: 0, height: 0 }}
                  onClick={() => void finish()}
                  disabled={cardioSession.busy}
                  whileTap={reducedMotion ? undefined : { scale: 0.975 }}
                  aria-label="Finalizar e salvar cardio"
                >
                  <CardioStopIcon /> <span>{cardioSession.busy ? "Salvando..." : "Finalizar e ver resumo"}</span>
                </motion.button>
              ) : null}
            </AnimatePresence>
          </section>
        </div>
      </main>

      {settingsOpen ? (
        <div className="cardio-modal-overlay" role="dialog" aria-modal="true" aria-label="Configurações do cardio">
          <button type="button" className="cardio-modal-backdrop" onClick={() => setSettingsOpen(false)} aria-label="Fechar configurações" />
          <section className="cardio-settings-sheet">
            <header><div><span>CONFIGURAÇÕES</span><h2>Ajustar sessão</h2></div><button type="button" onClick={() => setSettingsOpen(false)} aria-label="Fechar"><span className="cardio-close-icon" /></button></header>
            <div className="cardio-setting-group">
              <strong>Meta de tempo</strong>
              <div className="cardio-stepper cardio-time-stepper">
                <button type="button" onClick={() => setTargetMinutes((value) => Math.max(5, value - 5))} aria-label="Diminuir meta em cinco minutos"><CardioMinusIcon /></button>
                <span>{targetMinutes} min</span>
                <button type="button" onClick={() => setTargetMinutes((value) => Math.min(120, value + 5))} aria-label="Aumentar meta em cinco minutos"><CardioPlusIcon /></button>
              </div>
            </div>
            <div className="cardio-setting-group">
              <strong>Quando será feito?</strong>
              <div className="cardio-segmented">
                {(Object.keys(timingLabels) as CardioTiming[]).map((item) => (
                  <button type="button" key={item} className={timing === item ? "active" : ""} onClick={() => setTiming(item)} aria-pressed={timing === item}>{timingLabels[item]}</button>
                ))}
              </div>
            </div>
            {activity === "spinning" ? (
              <div className="cardio-setting-group"><strong>Cadência da bike</strong><div className="cardio-stepper"><button type="button" onClick={() => setCadenceRpm((value) => Math.max(30, value - 5))} aria-label="Diminuir cadência"><CardioMinusIcon /></button><span>{cadenceRpm} rpm</span><button type="button" onClick={() => setCadenceRpm((value) => Math.min(160, value + 5))} aria-label="Aumentar cadência"><CardioPlusIcon /></button></div></div>
            ) : null}
            {activity === "swim" ? (
              <div className="cardio-setting-group"><strong>Tamanho da piscina</strong><div className="cardio-segmented two">{[25, 50].map((length) => <button type="button" key={length} className={poolLengthMeters === length ? "active" : ""} onClick={() => setPoolLengthMeters(length)} aria-pressed={poolLengthMeters === length}>{length} metros</button>)}</div></div>
            ) : null}
            <button type="button" className="cardio-settings-confirm" onClick={() => setSettingsOpen(false)}>Salvar configurações</button>
          </section>
        </div>
      ) : null}

      {historyOpen ? (
        <div className="cardio-modal-overlay" role="dialog" aria-modal="true" aria-label="Histórico de cardio">
          <button type="button" className="cardio-modal-backdrop" onClick={() => setHistoryOpen(false)} aria-label="Fechar histórico" />
          <section className="cardio-history-sheet">
            <header><div><span>HISTÓRICO INDIVIDUAL</span><h2>Cardios realizados</h2><p>Sessões salvas para o aluno e para o professor.</p></div><button type="button" onClick={() => setHistoryOpen(false)} aria-label="Fechar"><span className="cardio-close-icon" /></button></header>
            <div className="cardio-history-list">
              {recentSessions.length ? recentSessions.map((item) => {
                const option = getActivityOption(item.activityType);
                return (
                  <article key={item.id}>
                    <img src={option.image} alt="" aria-hidden="true" loading="lazy" />
                    <div><strong>{option.label}</strong><span>{formatClock(item.elapsedSeconds)} • {item.activityType === "stairs" ? `${Math.round(item.distanceMeters)} degraus` : `${(item.distanceMeters / 1000).toFixed(2)} km`} • {item.calories} kcal</span><small>{item.completedAt ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(item.completedAt)) : "Sessão concluída"}{item.validForRanking ? " • Ranking" : ""}</small></div>
                    <CardioCheckIcon />
                  </article>
                );
              }) : <div className="cardio-history-empty">O primeiro cardio concluído aparecerá aqui.</div>}
            </div>
          </section>
        </div>
      ) : null}

      {toast ? <div key={toast} className="cardio-toast" role="status" aria-live="polite"><span>{toast}</span></div> : null}
    </div>
  );
}
