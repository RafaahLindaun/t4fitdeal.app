import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import AccquaLogo from "./AccquaLogo";
import { useAuth } from "../auth/AuthProvider";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

const welcomeFeatures = [
  ["Treino", "Sua ficha, séries e progresso."],
  ["Aulas", "Horários e reservas em poucos toques."],
  ["Cardio", "Cronômetro, métricas e histórico."],
  ["Dieta", "Refeições, água e balanço do dia."],
  ["Perfil", "Sua evolução e atividades registradas."],
] as const;

export default function WelcomeOnboarding() {
  const { user, profile, landingPath } = useAuth();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [checkedUserId, setCheckedUserId] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (
      !isSupabaseConfigured ||
      !user?.id ||
      !profile ||
      profile.role !== "student" ||
      profile.status !== "active" ||
      landingPath !== "/menu-teste" ||
      checkedUserId === user.id
    ) {
      return;
    }

    let cancelled = false;
    setCheckedUserId(user.id);

    void supabase
      .rpc("get_my_app_welcome_state_v1")
      .then(({ data, error }) => {
        if (cancelled || error) return;
        const seen = Array.isArray(data) ? Boolean(data[0]) : Boolean(data);
        if (!seen) setOpen(true);
      });

    return () => {
      cancelled = true;
    };
  }, [checkedUserId, landingPath, profile, user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setOpen(false);
      setCheckedUserId("");
    }
  }, [user?.id]);

  const finishWelcome = async () => {
    if (busy) return;
    setBusy(true);
    const { error } = await supabase.rpc("mark_my_app_welcome_seen_v1");
    setBusy(false);
    if (!error) setOpen(false);
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="accqua-welcome-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="accqua-welcome-title"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.section
            className="accqua-welcome-card"
            initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.99 }}
            transition={{ duration: 0.28, ease: [0.2, 0.82, 0.2, 1] }}
          >
            <div className="accqua-welcome-logo"><AccquaLogo /></div>
            <span>NOVO APP ACCQUA</span>
            <h2 id="accqua-welcome-title">Bem-vindo!</h2>
            <p>Seu espaço da academia agora está todo aqui. Você vai descobrindo aos poucos.</p>

            <div className="accqua-welcome-features">
              {welcomeFeatures.map(([title, description], index) => (
                <motion.article
                  key={title}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduceMotion ? 0 : 0.08 + index * 0.045 }}
                >
                  <strong>{title}</strong>
                  <p>{description}</p>
                </motion.article>
              ))}
            </div>

            <motion.button
              type="button"
              className="accqua-welcome-start"
              disabled={busy}
              onClick={() => void finishWelcome()}
              whileTap={reduceMotion ? undefined : { scale: 0.985 }}
            >
              {busy ? "Preparando seu app..." : "Começar"}
            </motion.button>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
