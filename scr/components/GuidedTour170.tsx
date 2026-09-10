import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

type TourKey = "home" | "treino" | "cardio";
type TourStep = { selector: string; title: string; body: string };

type Rect = { left: number; top: number; width: number; height: number };

const tours: Record<TourKey, { route: string; steps: TourStep[] }> = {
  home: {
    route: "/menu-teste",
    steps: [
      { selector: ".accqua-workout-hero", title: "Seu treino começa aqui", body: "Quando sua ficha estiver disponível, este card mostra o treino do dia e seu progresso." },
      { selector: ".accqua-streak-card", title: "Acompanhe seu ritmo", body: "Veja os dias planejados, concluídos e sua sequência semanal sem precisar procurar no histórico." },
      { selector: ".accqua-menu-grid", title: "Tudo em poucos toques", body: "Treino, dieta, ranking e loja ficam reunidos nesta área." },
    ],
  },
  treino: {
    route: "/treino",
    steps: [
      { selector: ".workout-exercise-stage", title: "Uma série de cada vez", body: "A ficha mostra o exercício atual, carga, repetições e o que falta para concluir." },
      { selector: ".workout-exercise-dots", title: "Navegue pelo treino", body: "Os indicadores mostram onde você está e permitem acompanhar a sequência de exercícios." },
      { selector: ".workout-artboard", title: "Seu treino fica registrado", body: "Séries concluídas e cargas ficam salvas para acompanhar sua evolução." },
    ],
  },
  cardio: {
    route: "/cardio",
    steps: [
      { selector: ".cardio-activity-strip", title: "Escolha seu cardio", body: "Selecione a modalidade e configure a sessão de acordo com o que vai fazer hoje." },
      { selector: ".cardio-activity-ring", title: "Acompanhe em tempo real", body: "Tempo, ritmo e progresso da meta ficam visíveis durante toda a sessão." },
      { selector: ".cardio-screen", title: "Tudo fica no histórico", body: "Ao concluir, duração e calorias são salvas no seu histórico e entram no balanço da dieta." },
    ],
  },
};

function keyForPath(pathname: string): TourKey | null {
  if (pathname === "/menu-teste") return "home";
  if (pathname.startsWith("/treino")) return "treino";
  if (pathname.startsWith("/cardio")) return "cardio";
  return null;
}

function readRect(selector: string): Rect | null {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  const pad = 7;
  const left = Math.max(8, rect.left - pad);
  const top = Math.max(8, rect.top - pad);
  const right = Math.min(window.innerWidth - 8, rect.right + pad);
  const bottom = Math.min(window.innerHeight - 8, rect.bottom + pad);
  return { left, top, width: Math.max(30, right - left), height: Math.max(30, bottom - top) };
}

function hasSeen(value: unknown, key: TourKey) {
  if (!value || typeof value !== "object") return false;
  return Boolean((value as Record<string, unknown>)[key]);
}

export default function GuidedTour170() {
  const { user, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [seen, setSeen] = useState<Record<string, unknown>>({});
  const [loadedFor, setLoadedFor] = useState("");
  const [activeTour, setActiveTour] = useState<TourKey | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [replay, setReplay] = useState(false);
  const [helpHost, setHelpHost] = useState<HTMLElement | null>(null);

  const isStudent = profile?.role === "student" && profile?.status === "active";
  const routeTour = useMemo(() => keyForPath(location.pathname), [location.pathname]);
  const currentStep = activeTour ? tours[activeTour].steps[stepIndex] : null;

  useEffect(() => {
    if (!user?.id || !isStudent || !isSupabaseConfigured || loadedFor === user.id) return;
    let alive = true;
    void supabase.from("profiles").select("tours_vistos").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (!alive) return;
      const next = data?.tours_vistos && typeof data.tours_vistos === "object" ? data.tours_vistos as Record<string, unknown> : {};
      setSeen(next);
      setLoadedFor(user.id);
    });
    return () => { alive = false; };
  }, [isStudent, loadedFor, user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setLoadedFor("");
      setSeen({});
      setActiveTour(null);
      setReplay(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!routeTour || !loadedFor || !isStudent || replay || activeTour) return;
    if (hasSeen(seen, routeTour)) return;
    const timer = window.setTimeout(() => {
      if (document.querySelector(".accqua-welcome-overlay")) return;
      setStepIndex(0);
      setActiveTour(routeTour);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [activeTour, isStudent, loadedFor, replay, routeTour, seen]);

  const finish = useCallback(async (mark = true) => {
    const key = activeTour;
    setActiveTour(null);
    setStepIndex(0);
    setRect(null);
    setReplay(false);
    if (!key || !mark || !user?.id) return;
    setSeen((value) => ({ ...value, [key]: new Date().toISOString() }));
    await supabase.rpc("mark_my_accqua_tour_v1_7_0", { p_tour: key }).catch(() => undefined);
  }, [activeTour, user?.id]);

  useEffect(() => {
    if (!currentStep) {
      setRect(null);
      return;
    }
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const next = readRect(currentStep.selector);
        setRect(next);
        if (next) {
          const element = document.querySelector<HTMLElement>(currentStep.selector);
          element?.scrollIntoView?.({ block: "center", inline: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
        }
      });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    const observer = new MutationObserver(update);
    observer.observe(document.body, { childList: true, subtree: true });
    const timer = window.setInterval(update, 700);
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(timer);
      observer.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [currentStep, reduceMotion]);

  useEffect(() => {
    const onReplay = (event: Event) => {
      const detail = (event as CustomEvent<{ tour?: TourKey }>).detail;
      const key = detail?.tour && tours[detail.tour] ? detail.tour : "home";
      setReplay(true);
      setActiveTour(null);
      setStepIndex(0);
      if (location.pathname !== tours[key].route) navigate(tours[key].route);
      window.setTimeout(() => {
        setActiveTour(key);
        setReplay(true);
      }, 360);
    };
    window.addEventListener("accqua:tour:replay", onReplay);
    return () => window.removeEventListener("accqua:tour:replay", onReplay);
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (location.pathname !== "/perfil" || !isStudent) {
      setHelpHost(null);
      return;
    }
    let frame = 0;
    let current: HTMLElement | null = null;
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const hero = document.querySelector<HTMLElement>(".profile-support-hero");
        if (!hero) { current?.remove(); current = null; setHelpHost(null); return; }
        if (!current?.isConnected) {
          current = document.createElement("div");
          current.dataset.accquaTourHelpHost = "true";
          hero.insertAdjacentElement("afterend", current);
        }
        setHelpHost(current);
      });
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => { cancelAnimationFrame(frame); observer.disconnect(); current?.remove(); };
  }, [isStudent, location.pathname]);

  const total = activeTour ? tours[activeTour].steps.length : 0;
  const isLast = stepIndex >= total - 1;

  return <>
    {helpHost ? createPortal(
      <button type="button" className="accqua-tour-reopen-170" onClick={() => window.dispatchEvent(new CustomEvent("accqua:tour:replay", { detail: { tour: "home" } }))}>Rever guia do app</button>,
      helpHost,
    ) : null}

    <AnimatePresence>
      {activeTour && currentStep ? (
        <motion.div className="accqua-tour-overlay-170" initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="accqua-tour-shade-170" />
          {rect ? <div className="accqua-tour-spotlight-170" style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }} /> : null}
          <motion.section className="accqua-tour-card-170" initial={reduceMotion ? false : { opacity: 0, y: 18, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: reduceMotion ? 0 : .24 }}>
            <header><div><small>GUIA ACCQUA · {stepIndex + 1}/{total}</small><h3>{currentStep.title}</h3><p>{currentStep.body}</p></div><button type="button" className="tour-close" aria-label="Fechar guia" onClick={() => void finish(true)}>×</button></header>
            <footer><span>{activeTour === "home" ? "Início" : activeTour === "treino" ? "Treino" : "Cardio"}</span><button type="button" onClick={() => { if (isLast) void finish(true); else setStepIndex((value) => value + 1); }}>{isLast ? "Entendi" : "Próximo"}</button></footer>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  </>;
}
