import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from "framer-motion";
import { useLocation, useNavigate, useOutlet } from "react-router-dom";
import BottomNavigation from "./BottomNavigation";
import PrimarySidebar from "./PrimarySidebar";
import { useAuth } from "../auth/AuthProvider";
import { loadActiveWorkoutCardioPrescription } from "../lib/cardio";
import { activeNavKeyForPath, getNavItems, type PrimaryNavItem, type PrimaryNavKey } from "../lib/navigation";
import { BottomNavTreinoTargetProvider } from "./BottomNavTargetContext";
import { FocusModeProvider } from "./FocusModeContext";
import { PRIMARY_TAB_ROUTES, useTabSwipe } from "../hooks/useTabSwipe";
import "./main-layout.css";

const SWIPE_KEY_ORDER: PrimaryNavKey[] = ["inicio", "treino", "aulas", "perfil"];

function transitionDirection(from: PrimaryNavKey, to: PrimaryNavKey): -1 | 0 | 1 {
  const fromIndex = SWIPE_KEY_ORDER.indexOf(from);
  const toIndex = SWIPE_KEY_ORDER.indexOf(to);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return 0;
  return toIndex > fromIndex ? 1 : -1;
}

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const outlet = useOutlet();
  const { user, profile } = useAuth();
  const treinoTargetRef = useRef<HTMLSpanElement>(null);
  const items = useMemo(() => getNavItems(profile?.role), [profile?.role]);
  const activeKey = useMemo(() => activeNavKeyForPath(location.pathname), [location.pathname]);
  const [focusMode, setFocusMode] = useState(false);
  const [mobileNavigation, setMobileNavigation] = useState(() => window.matchMedia("(max-width: 1023.98px)").matches);
  const [routeDirection, setRouteDirection] = useState<-1 | 0 | 1>(0);
  const edgeControls = useAnimationControls();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023.98px)");
    const update = () => setMobileNavigation(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  // Cardio e Área ACCQUA são telas operacionais no celular. A bottom nav some
  // para liberar altura útil; cada fluxo mantém sua própria navegação interna.
  const routeFocusMode = mobileNavigation && (
    location.pathname.startsWith("/cardio") ||
    location.pathname.startsWith("/area-accqua")
  );
  const effectiveFocusMode = focusMode || routeFocusMode;

  const { handlers: swipeHandlers } = useTabSwipe({
    disabled: effectiveFocusMode || !mobileNavigation,
    onNavigate: (direction) => setRouteDirection(direction),
    onBoundary: (direction) => {
      if (reduceMotion) return;
      void edgeControls.start({
        x: [0, direction < 0 ? 12 : -12, 0],
        transition: { duration: 0.24, ease: "easeOut" },
      });
    },
  });

  const onSelect = async (item: PrimaryNavItem) => {
    setRouteDirection(mobileNavigation ? transitionDirection(activeKey, item.key) : 0);
    if (item.key !== "treino") {
      navigate(item.href);
      return;
    }
    if (!user?.id) {
      navigate(item.href);
      return;
    }
    const cardio = await loadActiveWorkoutCardioPrescription(user.id).catch(() => null);
    navigate(cardio?.timing === "before" ? "/cardio" : "/treino");
  };

  const transitionKey = PRIMARY_TAB_ROUTES.some((route) => location.pathname.startsWith(route))
    ? activeKey
    : location.pathname.startsWith("/area-accqua")
      ? "staff"
      : location.pathname;

  const layoutClassName = [
    "accqua-main-layout",
    effectiveFocusMode ? "is-focus-mode" : "",
    routeFocusMode ? "is-route-focus-mode" : "",
  ].filter(Boolean).join(" ");

  return (
    <FocusModeProvider focusMode={focusMode} setFocusMode={setFocusMode}>
      <BottomNavTreinoTargetProvider value={treinoTargetRef}>
        <div className={layoutClassName}>
          {!effectiveFocusMode ? (
            <div className="accqua-main-layout-sidebar">
              <PrimarySidebar items={items} activeKey={activeKey} onSelect={(item) => void onSelect(item)} />
            </div>
          ) : null}

          <motion.main
            className="accqua-main-layout-content"
            animate={edgeControls}
            {...(!effectiveFocusMode ? swipeHandlers : {})}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={transitionKey}
                className="accqua-route-transition"
                initial={reduceMotion || !mobileNavigation ? false : { x: routeDirection * 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={reduceMotion || !mobileNavigation ? undefined : { x: routeDirection * -26, opacity: 0 }}
                transition={{ duration: routeDirection === 0 ? 0.16 : 0.24, ease: [0.2, 0.8, 0.2, 1] }}
                onAnimationComplete={() => setRouteDirection(0)}
              >
                {outlet}
              </motion.div>
            </AnimatePresence>
          </motion.main>

          {!effectiveFocusMode ? (
            <div className="accqua-main-layout-nav">
              <BottomNavigation items={items} activeKey={activeKey} onSelect={(item) => void onSelect(item)} />
            </div>
          ) : null}
        </div>
      </BottomNavTreinoTargetProvider>
    </FocusModeProvider>
  );
}
