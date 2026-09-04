import { motion, useReducedMotion } from "framer-motion";
import "./timer-overlay.css";

type TimerOverlayProps = {
  remainingSeconds: number;
  totalSeconds: number;
  title: string;
  subtitle?: string;
  mediaUrl?: string;
  mediaAlt?: string;
  canSkip?: boolean;
  skipLabel?: string;
  onSkip?: () => void;
};

function formatClock(seconds: number) {
  const safe = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

export default function TimerOverlay({
  remainingSeconds,
  totalSeconds,
  title,
  subtitle,
  mediaUrl,
  mediaAlt = "",
  canSkip = false,
  skipLabel = "Pular descanso",
  onSkip,
}: TimerOverlayProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const radius = 86;
  const circumference = 2 * Math.PI * radius;
  const progress = totalSeconds > 0
    ? Math.max(0, Math.min(1, remainingSeconds / totalSeconds))
    : 0;

  return (
    <motion.div
      className="accqua-timer-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reducedMotion ? undefined : { opacity: 0 }}
    >
      <header className="accqua-timer-overlay-brand">
        <img src="/accqua-logo-header.png" alt="ACCQUA Sports" />
      </header>

      <main className="accqua-timer-overlay-content">
        <div className="accqua-timer-overlay-copy">
          <small>{title}</small>
          {subtitle ? <strong>{subtitle}</strong> : null}
        </div>

        {mediaUrl ? (
          <div className="accqua-timer-overlay-media">
            <img src={mediaUrl} alt={mediaAlt} draggable={false} />
          </div>
        ) : null}

        <div className="accqua-timer-overlay-ring" aria-label={`${formatClock(remainingSeconds)} restantes`}>
          <svg viewBox="0 0 200 200" aria-hidden="true">
            <circle className="accqua-timer-overlay-track" cx="100" cy="100" r={radius} />
            <motion.circle
              className="accqua-timer-overlay-progress"
              cx="100"
              cy="100"
              r={radius}
              strokeDasharray={circumference}
              initial={false}
              animate={{ strokeDashoffset: circumference * (1 - progress) }}
              transition={reducedMotion ? { duration: 0 } : { duration: 0.9, ease: "linear" }}
            />
          </svg>
          <div>
            <span>RESTANTE</span>
            <strong>{formatClock(remainingSeconds)}</strong>
          </div>
        </div>

        {canSkip && onSkip ? (
          <motion.button
            type="button"
            className="accqua-timer-overlay-skip"
            onClick={onSkip}
            whileTap={reducedMotion ? undefined : { scale: 0.96 }}
          >
            {skipLabel}
          </motion.button>
        ) : (
          <p className="accqua-timer-overlay-lock">Aguarde o tempo terminar para continuar.</p>
        )}
      </main>
    </motion.div>
  );
}
