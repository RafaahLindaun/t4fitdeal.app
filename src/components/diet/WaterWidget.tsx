import { motion, useReducedMotion } from "framer-motion";
import { DietDropIcon, DietPlusIcon } from "./DietIcons";

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

export default function WaterWidget({ currentMl, targetMl, busy, onAdd }: { currentMl: number; targetMl: number; busy: boolean; onAdd: (ml: number) => void }) {
  const reduceMotion = Boolean(useReducedMotion());
  const safeCurrent = Number.isFinite(currentMl) ? Math.max(0, currentMl) : 0;
  const hasTarget = Number.isFinite(targetMl) && targetMl > 0;
  const safeTarget = hasTarget ? targetMl : 1;
  const rawProgress = hasTarget ? safeCurrent / safeTarget : 0;
  const progress = clamp(rawProgress);
  const cups = 8;
  const overflowPercent = rawProgress > 1 ? Math.round((rawProgress - 1) * 100) : 0;

  return (
    <section className={`diet-section-card diet-water-card ${overflowPercent > 0 ? "is-overflow" : ""}`}>
      <header className="diet-card-heading">
        <div className="diet-card-heading-icon"><DietDropIcon /></div>
        <div><span>HIDRATAÇÃO</span><h2>Água de hoje</h2></div>
        <strong>{(safeCurrent / 1000).toFixed(1)}L <small>/ {((hasTarget ? safeTarget : 0) / 1000).toFixed(1)}L</small></strong>
      </header>

      {overflowPercent > 0 ? (
        <div className="diet-water-overflow" role="status">+{overflowPercent}% da meta</div>
      ) : null}

      <div className="diet-cup-grid" aria-label={`${Math.round(rawProgress * 100)}% da meta de água`}>
        {Array.from({ length: cups }, (_, index) => {
          const cupFill = clamp(progress * cups - index);
          const hasWater = cupFill > 0;
          return (
            <motion.div
              className={`diet-cup ${hasWater ? "is-filled" : ""}`}
              key={index}
              initial={false}
              animate={{
                scale: hasWater ? 1 : 0.965,
                opacity: hasWater ? 1 : 0.72,
              }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.2, delay: index * 0.018 }}
            >
              <span className="diet-cup-shell" />
              <motion.span
                className="diet-cup-fill"
                initial={false}
                animate={{ height: `${cupFill * 78}%`, opacity: hasWater ? 1 : 0 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.2, ease: [0.2, 0.8, 0.2, 1], delay: index * 0.025 }}
              />
            </motion.div>
          );
        })}
      </div>

      <div className="diet-water-actions">
        {[200, 300, 500].map((ml) => (
          <motion.button
            key={ml}
            type="button"
            disabled={busy}
            aria-label={`Adicionar ${ml} mililitros de água`}
            whileTap={reduceMotion ? undefined : { scale: 0.94 }}
            onClick={() => onAdd(ml)}
          ><DietPlusIcon size={16} /> {ml} ml</motion.button>
        ))}
      </div>
    </section>
  );
}
