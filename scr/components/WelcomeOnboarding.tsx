import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import AccquaLogo from "./AccquaLogo";
import { useAuth } from "../auth/AuthProvider";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import {
  accquaOverlayTransition,
  accquaOverlayVariants,
  accquaWindowTransition,
  accquaWindowVariants,
} from "../lib/windowMotion";

const slides = [
  { key: "treino", title: "Treino", description: "Sua ficha evolui com você, série após série." },
  { key: "aulas", title: "Aulas", description: "Reserve seu horário em poucos toques e acompanhe sua agenda." },
  { key: "cardio", title: "Cardio", description: "Acompanhe seu ritmo, calorias e evolução em tempo real." },
  { key: "dieta", title: "Dieta", description: "Refeições, água e gasto do dia reunidos no mesmo lugar." },
  { key: "perfil", title: "Perfil", description: "Sua jornada fica registrada desde o primeiro dia." },
] as const;

type SlideKey = (typeof slides)[number]["key"];

function SlideIcon({ name }: { name: SlideKey }) {
  const common = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (name === "aulas") return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/><path d="m8.5 15 2 2 5-5"/></svg>;
  if (name === "cardio") return <svg {...common}><path d="M3 12h4l2-5 4 10 2-5h6"/><path d="M6 4.8C7.5 3.6 9.5 3 12 3s4.5.6 6 1.8"/></svg>;
  if (name === "dieta") return <svg {...common}><path d="M12 21c4-3 7-7 7-12-4 0-7 1.6-7 6.2C12 10.6 9 9 5 9c0 5 3 9 7 12Z"/><path d="M12 15c0-5 1.8-8.3 5.2-10.5"/></svg>;
  if (name === "perfil") return <svg {...common}><circle cx="12" cy="8" r="4"/><path d="M4.5 21c.8-4.2 3.3-6.4 7.5-6.4s6.7 2.2 7.5 6.4"/><path d="M18 5.5 19 7l1.8.3-1.3 1.3.3 1.8-1.8-.9-1.8.9.3-1.8-1.3-1.3L17 7l1-1.5Z"/></svg>;
  return <svg {...common}><path d="M6 8v8M3.5 10v4M18 8v8M20.5 10v4M6 12h12"/></svg>;
}

export default function WelcomeOnboarding() {
  const { user, profile, landingPath } = useAuth();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [checkedUserId, setCheckedUserId] = useState("");
  const [busy, setBusy] = useState(false);
  const [index, setIndex] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const current = slides[index];
  const last = index === slides.length - 1;
  const progressLabel = useMemo(() => `${index + 1} de ${slides.length}`, [index]);

  useEffect(() => {
    if (
      !isSupabaseConfigured ||
      !user?.id ||
      !profile ||
      profile.role !== "student" ||
      profile.status !== "active" ||
      landingPath !== "/menu-teste" ||
      checkedUserId === user.id
    ) return;

    let cancelled = false;
    setCheckedUserId(user.id);
    void supabase.rpc("get_my_app_welcome_state_v1").then(({ data, error }) => {
      if (cancelled || error) return;
      const seen = Array.isArray(data) ? Boolean(data[0]) : Boolean(data);
      if (!seen) {
        setIndex(0);
        setOpen(true);
      }
    });
    return () => { cancelled = true; };
  }, [checkedUserId, landingPath, profile, user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setOpen(false);
      setCheckedUserId("");
      setIndex(0);
    }
  }, [user?.id]);

  const finishWelcome = async () => {
    if (busy) return;
    setBusy(true);
    const { error } = await supabase.rpc("mark_my_app_welcome_seen_v1");
    setBusy(false);
    if (!error) setOpen(false);
  };

  const next = () => {
    if (last) void finishWelcome();
    else setIndex((value) => Math.min(slides.length - 1, value + 1));
  };

  const onTouchEnd = (event: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.35) return;
    if (dx < 0 && index < slides.length - 1) setIndex((value) => value + 1);
    if (dx > 0 && index > 0) setIndex((value) => value - 1);
  };

  return (
    <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          className="accqua-welcome-overlay accqua-welcome-overlay-170"
          role="dialog"
          aria-modal="true"
          aria-labelledby="accqua-welcome-title"
          variants={accquaOverlayVariants}
          initial={reduceMotion ? false : "hidden"}
          animate="visible"
          exit="exit"
          transition={reduceMotion ? { duration: 0 } : accquaOverlayTransition}
          data-accqua-window-overlay
          data-accqua-motion-managed
        >
          <motion.section
            className="accqua-welcome-card accqua-welcome-card-170"
            variants={accquaWindowVariants.center}
            initial={reduceMotion ? false : "hidden"}
            animate="visible"
            exit="exit"
            transition={reduceMotion ? { duration: 0 } : accquaWindowTransition}
            data-accqua-window-surface="center"
            onTouchStart={(event) => {
              const touch = event.touches[0];
              if (touch) touchStart.current = { x: touch.clientX, y: touch.clientY };
            }}
            onTouchEnd={onTouchEnd}
          >
            <motion.header
              className="accqua-welcome-head-170"
              initial={reduceMotion ? false : { opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.34, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <div className="accqua-welcome-logo accqua-welcome-logo-170"><AccquaLogo /></div>
              <span>NOVO APP ACCQUA</span>
              <h2 id="accqua-welcome-title">Bem-vindo!</h2>
              <p>Seu espaço da academia agora está todo aqui.</p>
            </motion.header>

            <div className="accqua-welcome-stage-170" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                <motion.article
                  key={current.key}
                  className="accqua-welcome-slide-170"
                  initial={reduceMotion ? false : { opacity: 0, x: 28, scale: 0.985 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0, x: -24, scale: 0.99 }}
                  transition={{ duration: reduceMotion ? 0 : 0.24, ease: [0.2, 0.8, 0.2, 1] }}
                >
                  <span className="accqua-welcome-slide-icon-170"><SlideIcon name={current.key}/></span>
                  <strong>{current.title}</strong>
                  <p>{current.description}</p>
                </motion.article>
              </AnimatePresence>
            </div>

            <div className="accqua-welcome-dots-170" aria-label={`Etapa ${progressLabel}`}>
              {slides.map((slide, dotIndex) => (
                <button
                  type="button"
                  key={slide.key}
                  className={dotIndex === index ? "is-current" : dotIndex < index ? "is-complete" : ""}
                  aria-label={`Ir para ${slide.title}`}
                  aria-current={dotIndex === index ? "step" : undefined}
                  onClick={() => setIndex(dotIndex)}
                />
              ))}
            </div>

            <div className="accqua-welcome-actions-170">
              <button type="button" className="accqua-welcome-skip-170" disabled={busy} onClick={() => void finishWelcome()}>Pular</button>
              <motion.button
                type="button"
                className="accqua-welcome-start accqua-welcome-start-170"
                disabled={busy}
                onClick={next}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                animate={!reduceMotion && last && !busy ? { scale: [1, 1.02, 1] } : undefined}
                transition={!reduceMotion && last ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : undefined}
              >
                {busy ? "Preparando..." : last ? "Começar" : "Continuar"}
              </motion.button>
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
