import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import confetti from "canvas-confetti";
import { MenuArrowIcon, MenuPhoneIcon } from "../MenuIcons";
import type { HomeWorkoutSummary } from "../../lib/home";
import { performHaptic } from "../../lib/appFeedback";
import { consumeWorkoutCompletionTransition } from "../../lib/workoutCompletionTransition";

type Phase = "pending" | "confirming" | "hidden";

function formatProgress(completed: number, total: number) {
  const safeTotal = Math.max(0, total);
  const safeCompleted = Math.min(safeTotal, Math.max(0, completed));
  return `${safeCompleted}/${safeTotal}`;
}

export default function TreinoHojeCard({
  userId,
  workout,
  statusLoading,
  completedToday,
  isDesktop,
  onOpenWorkout,
}: {
  userId: string;
  workout: HomeWorkoutSummary | undefined;
  statusLoading: boolean;
  completedToday: boolean;
  isDesktop: boolean;
  onOpenWorkout: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("pending");
  const [initialized, setInitialized] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const resolvedOnce = useRef(false);
  const previousCompleted = useRef(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  const beginCompletion = () => {
    if (phase === "confirming" || phase === "hidden") return;
    setAnnouncement("Treino concluído!");
    if (reduceMotion) {
      setPhase("hidden");
      return;
    }
    setPhase("confirming");
    performHaptic(userId, [55, 28, 70]);
    confetti({
      particleCount: 38,
      spread: 58,
      startVelocity: 25,
      scalar: 0.72,
      origin: { x: 0.5, y: 0.32 },
      disableForReducedMotion: true,
    });
    timerRef.current = window.setTimeout(() => setPhase("hidden"), 600);
  };

  useEffect(() => {
    if (statusLoading || !userId) return;

    if (!resolvedOnce.current) {
      resolvedOnce.current = true;
      previousCompleted.current = completedToday;
      if (completedToday) {
        // Só anima quando a conclusão aconteceu nesta navegação da sessão.
        if (consumeWorkoutCompletionTransition(userId)) beginCompletion();
        else setPhase("hidden");
      } else {
        setPhase("pending");
      }
      setInitialized(true);
      return;
    }

    if (completedToday && !previousCompleted.current) beginCompletion();
    if (!completedToday && previousCompleted.current) setPhase("pending");
    previousCompleted.current = completedToday;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedToday, statusLoading, userId]);

  // Evita qualquer flash do hero no cold start quando o treino já chegou concluído.
  if (statusLoading || !initialized) return null;

  const progressPercentage = workout?.exerciseCount
    ? Math.min(100, Math.round(((workout.completedExercises ?? 0) / workout.exerciseCount) * 100))
    : 0;
  const heroLabel = workout?.hasProgress ? "Continuar treino" : "Começar treino";

  return (
    <>
      <span className="accqua-sr-only" aria-live="polite">{announcement}</span>
      <AnimatePresence initial={false} mode="popLayout">
        {phase !== "hidden" ? (
          <motion.section
            key="treino-hoje-card"
            layout
            className={`accqua-workout-hero ${phase === "confirming" ? "is-completed" : ""}`}
            aria-label="Treino de hoje"
            initial={false}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : {
              height: 0,
              opacity: 0,
              marginBottom: 0,
              paddingTop: 0,
              paddingBottom: 0,
              overflow: "hidden",
              transition: { duration: 0.35, ease: "easeInOut" },
            }}
          >
            <div className="accqua-workout-hero-pattern" aria-hidden="true" />
            <div className="accqua-workout-hero-kicker">
              <span>TREINO DE HOJE</span>
              {phase === "confirming" ? <i>CONCLUÍDO</i> : null}
            </div>

            {phase === "confirming" ? (
              <motion.div layout className="accqua-workout-hero-completed">
                <motion.svg viewBox="0 0 48 48" aria-hidden="true" initial={{ scale: .82, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                  <circle cx="24" cy="24" r="20" fill="rgba(255,209,40,.13)" stroke="rgba(255,209,40,.48)" />
                  <motion.path
                    d="M15 24.5l6 6L34 17"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: .52, ease: [0.2,.8,.2,1] }}
                  />
                </motion.svg>
                <div aria-live="polite"><h2>Treino concluído!</h2><p>Seu progresso de hoje foi atualizado.</p></div>
              </motion.div>
            ) : workout?.status === "ready" && workout.plan ? (
              <>
                <h2>{workout.plan.name || "Seu treino"}</h2>
                <p>{workout.exerciseCount} exercícios <b>•</b> ~{workout.estimatedMinutes} min</p>
                {workout.completedSets > 0 ? (
                  <div className="accqua-workout-hero-progress">
                    <div><span>{formatProgress(workout.completedExercises, workout.exerciseCount)} exercícios concluídos hoje</span><strong>{progressPercentage}%</strong></div>
                    <i><b style={{ width: `${progressPercentage}%` }} /></i>
                  </div>
                ) : null}
                <motion.button
                  layoutId="accqua-primary-workout-action"
                  type="button"
                  className="accqua-workout-hero-cta"
                  whileTap={{ scale: 0.97 }}
                  onClick={onOpenWorkout}
                >
                  <span>{heroLabel}</span>{isDesktop ? <MenuPhoneIcon size={19} /> : <MenuArrowIcon size={20} />}
                </motion.button>
              </>
            ) : (
              <div className="accqua-workout-hero-empty">
                <h2>Seu próximo treino aparece aqui</h2>
                <p>Quando sua ficha estiver ativa, você começa direto por este card.</p>
              </div>
            )}
          </motion.section>
        ) : null}
      </AnimatePresence>
    </>
  );
}
