import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { useEffect, useState } from "react";
import { DietFireIcon } from "./DietIcons";

function safeNumber(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function AnimatedNumber({ value, reducedMotion }: { value: number; reducedMotion: boolean }) {
  const safeValue = safeNumber(value);
  const motionValue = useMotionValue(reducedMotion ? safeValue : 0);
  const spring = useSpring(motionValue, { stiffness: 130, damping: 24, mass: 0.55 });
  const [display, setDisplay] = useState(reducedMotion ? safeValue : 0);

  useMotionValueEvent(spring, "change", (latest) => setDisplay(latest));
  useEffect(() => {
    if (reducedMotion) {
      motionValue.set(safeValue);
      setDisplay(safeValue);
    } else {
      motionValue.set(safeValue);
    }
  }, [motionValue, reducedMotion, safeValue]);

  return <>{Math.round(display).toLocaleString("pt-BR")}</>;
}

export default function CalorieRing({ consumed, target, burned }: { consumed: number; target: number; burned: number }) {
  const reduceMotion = Boolean(useReducedMotion());
  const safeConsumed = safeNumber(consumed);
  const safeTarget = safeNumber(target);
  const safeBurned = safeNumber(burned);
  const radius = 78;
  const circumference = Math.PI * 2 * radius;
  const adjustedBudget = Math.max(1, safeTarget + safeBurned);
  const rawProgress = safeConsumed / adjustedBudget;
  const progress = Math.min(1, Math.max(0, rawProgress));
  const remaining = Math.max(0, adjustedBudget - safeConsumed);
  const overflowPercent = rawProgress > 1 ? Math.round((rawProgress - 1) * 100) : 0;

  return (
    <section className={`diet-calorie-card ${overflowPercent > 0 ? "is-overflow" : ""}`} aria-label="Balanço calórico do dia">
      <div className="diet-calorie-ring-wrap">
        <svg className="diet-calorie-ring" viewBox="0 0 190 190" aria-hidden="true">
          <defs>
            <linearGradient id="diet-calorie-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="72%" stopColor="#ffb32f" />
              <stop offset="100%" stopColor="#ff7b2d" />
            </linearGradient>
          </defs>
          <circle cx="95" cy="95" r={radius} className="diet-ring-track" />
          <motion.circle
            cx="95"
            cy="95"
            r={radius}
            className="diet-ring-progress"
            strokeDasharray={circumference}
            initial={reduceMotion ? false : { strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - progress) }}
            transition={reduceMotion ? { duration: 0 } : { duration: 1.05, ease: [0.2, 0.82, 0.22, 1] }}
          />
        </svg>
        <div className="diet-calorie-center">
          <span><DietFireIcon size={18} /> RESTAM</span>
          <strong><AnimatedNumber value={remaining} reducedMotion={reduceMotion} /></strong>
          <small>kcal</small>
        </div>
      </div>

      {overflowPercent > 0 ? (
        <div className="diet-calorie-overflow" role="status">+{overflowPercent}% acima do saldo do dia</div>
      ) : null}

      <div className="diet-balance-row">
        <article><span>Consumidas</span><strong>{Math.round(safeConsumed)}</strong><small>kcal</small></article>
        <i aria-hidden="true" />
        <article><span>Meta base</span><strong>{Math.round(safeTarget)}</strong><small>kcal</small></article>
        <i aria-hidden="true" />
        <article><span>Gastas</span><strong>{Math.round(safeBurned)}</strong><small>kcal</small></article>
      </div>
    </section>
  );
}
