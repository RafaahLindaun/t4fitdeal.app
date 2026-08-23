import { motion, useReducedMotion } from "framer-motion";
import { DietDropIcon, DietPlusIcon } from "./DietIcons";

export default function WaterWidget({ currentMl, targetMl, busy, onAdd }: { currentMl: number; targetMl: number; busy: boolean; onAdd: (ml: number) => void }) {
  const reduceMotion = useReducedMotion();
  const progress = Math.min(1, currentMl / Math.max(1, targetMl));
  const cups = 8;
  const filled = Math.round(progress * cups);
  return (
    <section className="diet-section-card diet-water-card">
      <header className="diet-card-heading">
        <div className="diet-card-heading-icon"><DietDropIcon /></div>
        <div><span>HIDRATAÇÃO</span><h2>Água de hoje</h2></div>
        <strong>{(currentMl / 1000).toFixed(1)}L <small>/ {(targetMl / 1000).toFixed(1)}L</small></strong>
      </header>

      <div className="diet-cup-grid" aria-label={`${Math.round(progress * 100)}% da meta de água`}>
        {Array.from({ length: cups }, (_, index) => (
          <div className={`diet-cup ${index < filled ? "is-filled" : ""}`} key={index}>
            <span className="diet-cup-shell" />
            <motion.span
              className="diet-cup-fill"
              initial={false}
              animate={{ height: index < filled ? "78%" : "0%" }}
              transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 150, damping: 18 }}
            />
          </div>
        ))}
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
