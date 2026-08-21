import { motion, useReducedMotion } from "framer-motion";
import { DietFireIcon } from "./DietIcons";

export default function CalorieRing({ consumed, target, burned }: { consumed: number; target: number; burned: number }) {
  const reduceMotion = useReducedMotion();
  const radius = 78;
  const circumference = Math.PI * 2 * radius;
  const adjustedBudget = Math.max(1, target + burned);
  const progress = Math.min(1, consumed / adjustedBudget);
  const remaining = Math.max(0, Math.round(adjustedBudget - consumed));

  return (
    <section className="diet-calorie-card" aria-label="Balanço calórico do dia">
      <div className="diet-calorie-ring-wrap">
        <svg className="diet-calorie-ring" viewBox="0 0 190 190" aria-hidden="true">
          <defs>
            <linearGradient id="diet-calorie-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="#ff8f28" />
            </linearGradient>
          </defs>
          <circle cx="95" cy="95" r={radius} className="diet-ring-track" />
          <motion.circle
            cx="95" cy="95" r={radius}
            className="diet-ring-progress"
            strokeDasharray={circumference}
            initial={false}
            animate={{ strokeDashoffset: circumference * (1 - progress) }}
            transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 65, damping: 18 }}
          />
        </svg>
        <div className="diet-calorie-center">
          <span><DietFireIcon size={18} /> RESTAM</span>
          <strong>{remaining.toLocaleString("pt-BR")}</strong>
          <small>kcal</small>
        </div>
      </div>

      <div className="diet-balance-row">
        <article><span>Consumidas</span><strong>{Math.round(consumed)}</strong><small>kcal</small></article>
        <i aria-hidden="true" />
        <article><span>Meta base</span><strong>{Math.round(target)}</strong><small>kcal</small></article>
        <i aria-hidden="true" />
        <article><span>Gastas</span><strong>{Math.round(burned)}</strong><small>kcal</small></article>
      </div>
    </section>
  );
}
