import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate, useNavigate } from "react-router-dom";
import AccquaLogo from "../components/AccquaLogo";
import LoadingSplash from "../components/LoadingSplash";
import WorkoutQrDialog from "../components/home/WorkoutQrDialog";
import TreinoHojeCard from "../components/home/TreinoHojeCard";
import MembershipShield from "../components/home/MembershipShield";
import {
  MenuAppleIcon,
  MenuArrowIcon,
  MenuBagIcon,
  MenuBellIcon,
  MenuDumbbellIcon,
  MenuPhoneIcon,
  MenuRankingIcon,
} from "../components/MenuIcons";
import { useAuth } from "../auth/AuthProvider";
import {
  loadWorkoutRequiredAlerts,
  markWorkoutRequiredAlertRead,
  type WorkoutRequiredAlert,
} from "../lib/admin";
import {
  requestStaffNotificationPermission,
  WORKOUT_ALERTS_EVENT,
} from "../lib/staffNotifications";
import { loadActiveWorkoutCardioPrescription } from "../lib/cardio";
import { loadHomeDashboard, loadUnreadNotificationCount } from "../lib/home";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { startWorkoutSession } from "../lib/workout";
import { useTreinoStatus } from "../hooks/useTreinoStatus";
import "./menu.css";
import "./admin-entry.css";

type IconProps = { size?: number; className?: string };
type AreaCard = {
  key: "treino" | "dieta" | "ranking" | "loja";
  title: string;
  icon: (props: IconProps) => JSX.Element;
  badge?: string;
};

const areas: AreaCard[] = [
  { key: "treino", title: "Meu treino", icon: MenuDumbbellIcon },
  { key: "dieta", title: "Minha dieta", icon: MenuAppleIcon },
  { key: "ranking", title: "Ranking", icon: MenuRankingIcon, badge: "Novidade" },
  { key: "loja", title: "Loja", icon: MenuBagIcon },
];

const entranceVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.2, 0.8, 0.2, 1] } },
};


export default function TestMenu() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const reduceMotion = useReducedMotion();
  const { user, profile, loading, landingPath } = useAuth();
  const [showSplash, setShowSplash] = useState(() => {
    const skipNextSplash = window.sessionStorage.getItem("accqua:skip-next-menu-splash");
    if (skipNextSplash === "1") {
      window.sessionStorage.removeItem("accqua:skip-next-menu-splash");
      return false;
    }
    return true;
  });
  const [message, setMessage] = useState("");
  const [workoutAlerts, setWorkoutAlerts] = useState<WorkoutRequiredAlert[]>([]);
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia("(min-width: 768px)").matches);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrSessionId, setQrSessionId] = useState<string | null>(null);

  const canManageStudents =
    profile?.role === "professor" || profile?.role === "reception" || profile?.role === "admin";

  const homeQuery = useQuery({
    queryKey: ["home-dashboard", user?.id],
    queryFn: () => loadHomeDashboard(user!.id),
    enabled: Boolean(user?.id),
    refetchInterval: 30_000,
  });

  const treinoStatus = useTreinoStatus(user?.id ?? "", { periodo: "hoje" });

  const notificationQuery = useQuery({
    queryKey: ["unread-notifications", user?.id],
    queryFn: () => loadUnreadNotificationCount(user!.id),
    enabled: Boolean(user?.id),
    refetchInterval: 45_000,
  });

  useEffect(() => {
    const viewport = window.visualViewport;
    const updateViewport = () => {
      const height = Math.round(viewport?.height ?? window.innerHeight);
      document.documentElement.style.setProperty("--menu-viewport-height", `${height}px`);
    };
    updateViewport();
    viewport?.addEventListener("resize", updateViewport);
    window.addEventListener("resize", updateViewport);
    return () => {
      viewport?.removeEventListener("resize", updateViewport);
      window.removeEventListener("resize", updateViewport);
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const syncDesktop = () => setIsDesktop(media.matches);
    syncDesktop();
    media.addEventListener("change", syncDesktop);
    return () => media.removeEventListener("change", syncDesktop);
  }, []);

  useEffect(() => {
    if (!showSplash) return;
    const timer = window.setTimeout(() => setShowSplash(false), 1650);
    return () => window.clearTimeout(timer);
  }, [showSplash]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 2400);
    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    const handleAlerts = (event: Event) => {
      const customEvent = event as CustomEvent<WorkoutRequiredAlert[]>;
      setWorkoutAlerts(customEvent.detail ?? []);
    };
    window.addEventListener(WORKOUT_ALERTS_EVENT, handleAlerts);
    return () => window.removeEventListener(WORKOUT_ALERTS_EVENT, handleAlerts);
  }, []);

  useEffect(() => {
    if (!user || !canManageStudents || landingPath !== "/menu-teste") {
      setWorkoutAlerts([]);
      return;
    }
    void loadWorkoutRequiredAlerts().then(setWorkoutAlerts).catch(() => setWorkoutAlerts([]));
  }, [canManageStudents, landingPath, user?.id]);

  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured) return;
    const invalidateHome = () => {
      void queryClient.invalidateQueries({ queryKey: ["home-dashboard", user.id] });
    };
    const invalidateNotifications = () => {
      void queryClient.invalidateQueries({ queryKey: ["unread-notifications", user.id] });
    };

    const activityChannel = supabase
      .channel(`home-activity-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "accqua_workout_records" }, invalidateHome)
      .on("postgres_changes", { event: "*", schema: "public", table: "workout_sessions" }, invalidateHome)
      .on("postgres_changes", { event: "*", schema: "public", table: "workout_set_logs" }, invalidateHome)
      .on("postgres_changes", { event: "*", schema: "public", table: "serie_execucoes" }, invalidateHome)
      .on("postgres_changes", { event: "*", schema: "public", table: "cardio_sessions" }, invalidateHome)
      .subscribe();

    const notificationChannel = supabase
      .channel(`home-notifications-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, invalidateNotifications)
      .subscribe();

    const localRefresh = () => invalidateHome();
    window.addEventListener("accqua:daily-summary-invalidated", localRefresh);
    window.addEventListener("accqua:cardio-synced", localRefresh);

    return () => {
      window.removeEventListener("accqua:daily-summary-invalidated", localRefresh);
      window.removeEventListener("accqua:cardio-synced", localRefresh);
      void supabase.removeChannel(activityChannel);
      void supabase.removeChannel(notificationChannel);
    };
  }, [queryClient, user?.id]);

  const firstName = useMemo(() => {
    const name = profile?.fullName?.trim();
    return name ? name.split(/\s+/)[0] : "Aluno";
  }, [profile?.fullName]);

  if (loading) return <LoadingSplash />;
  if (!user) return <Navigate to="/login" replace />;
  if (landingPath !== "/menu-teste") return <Navigate to={landingPath} replace />;
  if (showSplash) return <LoadingSplash />;

  const dashboard = homeQuery.data;
  const workout = dashboard?.workout;
  const unreadNotifications = Math.max(0, notificationQuery.data ?? 0);
  const staffAlertCount = canManageStudents ? workoutAlerts.length : 0;
  const bellCount = unreadNotifications + staffAlertCount;

  const prepareQrSession = async () => {
    if (!workout || workout.status !== "ready" || !workout.plan) {
      setQrSessionId(null);
      setQrOpen(true);
      return;
    }

    setQrOpen(true);
    if (workout.sessionId) {
      setQrSessionId(workout.sessionId);
      return;
    }
    if (qrSessionId) return;

    setQrLoading(true);
    try {
      const created = await startWorkoutSession(user.id, workout.plan.id);
      if (created.local) {
        setMessage("Não conseguimos preparar o QR agora. Tente novamente com conexão à internet.");
        setQrSessionId(null);
      } else {
        setQrSessionId(created.id);
        void queryClient.invalidateQueries({ queryKey: ["home-dashboard", user.id] });
      }
    } catch {
      setQrSessionId(null);
      setMessage("Não conseguimos preparar o QR agora.");
    } finally {
      setQrLoading(false);
    }
  };

  const openWorkout = async () => {
    if (!workout || workout.status !== "ready") {
      setMessage("Seu treino ainda não está disponível.");
      return;
    }

    if (isDesktop) {
      await prepareQrSession();
      return;
    }

    const cardio = await loadActiveWorkoutCardioPrescription(user.id);
    if (cardio?.timing === "before") {
      navigate("/cardio");
      return;
    }

    const sessionId = workout.sessionId ?? qrSessionId;
    navigate(sessionId ? `/treino?session=${encodeURIComponent(sessionId)}` : "/treino");
  };

  const openNotifications = async () => {
    const firstAlert = workoutAlerts[0];
    if (canManageStudents && firstAlert) {
      await markWorkoutRequiredAlertRead(firstAlert.id);
      navigate(`/area-accqua?student=${firstAlert.studentId}`);
      return;
    }

    if (unreadNotifications > 0) {
      setMessage(`${unreadNotifications} notificaç${unreadNotifications === 1 ? "ão não lida" : "ões não lidas"}.`);
      return;
    }

    if (canManageStudents) {
      const permission = await requestStaffNotificationPermission();
      if (permission === "granted") setMessage("Alertas da ACCQUA ativados no celular.");
      else if (permission === "denied") setMessage("As notificações estão bloqueadas no navegador.");
      else setMessage("Você não possui novas notificações.");
      return;
    }

    setMessage("Você não possui novas notificações.");
  };

  const openArea = async (title: string) => {
    if (title === "Início") {
      setMessage("Você já está na página inicial.");
      return;
    }
    if (title === "Meu treino" || title === "Treino") {
      await openWorkout();
      return;
    }
    if (title === "Perfil") return navigate("/perfil");
    if (title === "Ranking") return navigate("/ranking");
    if (title === "Minha dieta") return navigate("/minha-dieta");
    if (title === "Aulas") return navigate("/aulas");
    if (title === "Loja") return navigate("/loja");
  };

  const workoutCompletedToday = treinoStatus.data?.completed ?? false;
  const streakLabel = dashboard?.currentStreak
    ? `${dashboard.currentStreak} dia${dashboard.currentStreak === 1 ? "" : "s"} seguido${dashboard.currentStreak === 1 ? "" : "s"}`
    : `${dashboard?.activeDaysThisWeek ?? 0} treino${(dashboard?.activeDaysThisWeek ?? 0) === 1 ? "" : "s"} esta semana`;

  return (
    <div className="accqua-menu-screen">
      <div className="accqua-menu-background" aria-hidden="true">
        <span className="accqua-menu-orbit orbit-one" />
        <span className="accqua-menu-orbit orbit-two" />
        <span className="accqua-menu-glow" />
      </div>

      <main className="accqua-menu-shell">
        <header className="accqua-menu-header">
          <div className="accqua-menu-logo"><AccquaLogo compact /></div>
          <div className="accqua-menu-header-actions">
            {homeQuery.isSuccess ? <MembershipShield validUntil={dashboard?.membershipValidUntil ?? ""} /> : null}
            <button
              className="accqua-notification-button"
              type="button"
              aria-label={bellCount ? `Notificações, ${bellCount} não lida${bellCount === 1 ? "" : "s"}` : "Notificações"}
              onClick={() => void openNotifications()}
            >
              <MenuBellIcon size={33} />
              {bellCount ? (
                <span className="accqua-notification-badge" aria-hidden="true">
                  {bellCount > 9 ? "9+" : bellCount}
                </span>
              ) : null}
            </button>
          </div>
        </header>

        <motion.div
          className="accqua-menu-scroll"
          variants={entranceVariants}
          initial={reduceMotion ? false : "hidden"}
          animate="show"
        >
          <motion.section className="accqua-menu-welcome" variants={itemVariants}>
            <h1>Olá, {firstName}</h1>
            <p>Seu app da academia</p>
          </motion.section>

          <TreinoHojeCard
            userId={user.id}
            workout={workout}
            statusLoading={treinoStatus.isLoading || treinoStatus.isFetching && !treinoStatus.data}
            completedToday={workoutCompletedToday}
            isDesktop={isDesktop}
            onOpenWorkout={() => void openWorkout()}
          />

          <motion.section layout className="accqua-streak-card" variants={itemVariants} aria-label="Atividade nos últimos sete dias">
            <div className="accqua-streak-heading">
              <div><small>SEU RITMO</small><strong>{streakLabel}</strong></div>
              <span>{dashboard?.recentDays.filter((day) => day.active).length ?? 0}/7 ativos</span>
            </div>
            <div className="accqua-streak-days">
              {(dashboard?.recentDays ?? Array.from({ length: 7 }, (_, index) => ({
                key: `loading-${index}`, weekday: "–", dayNumber: 0, active: false, isToday: false,
              }))).map((day) => (
                <div key={day.key} className={["accqua-streak-day", day.active ? "is-active" : "", day.isToday ? "is-today" : ""].filter(Boolean).join(" ")}>
                  <small>{day.weekday}</small>
                  <span aria-label={day.active ? "Atividade registrada" : "Sem atividade registrada"}><i /></span>
                  <b>{day.dayNumber || ""}</b>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section layout className="accqua-menu-grid" variants={itemVariants} aria-label="Ações principais">
            {areas.map((area) => {
              const AreaIcon = area.icon;
              const desktopWorkout = isDesktop && area.key === "treino";
              return (
                <motion.button
                  key={area.key}
                  type="button"
                  className={`accqua-menu-card accqua-menu-card-${area.key}`}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => void openArea(area.title)}
                >
                  <span className="accqua-menu-card-pattern" aria-hidden="true" />
                  <div className="accqua-menu-card-icon"><AreaIcon /></div>
                  <div className="accqua-menu-card-copy">
                    <strong>{area.title}</strong>
                    {desktopWorkout ? (
                      <span className="accqua-menu-badge is-device"><MenuPhoneIcon size={12} /> Continue no celular</span>
                    ) : area.badge ? <span className="accqua-menu-badge">{area.badge}</span> : null}
                  </div>
                  <MenuArrowIcon className="accqua-menu-arrow" size={22} />
                </motion.button>
              );
            })}
          </motion.section>

        </motion.div>
      </main>

      <WorkoutQrDialog
        open={qrOpen}
        onOpenChange={setQrOpen}
        sessionId={qrSessionId ?? workout?.sessionId ?? null}
        loading={qrLoading}
      />

      {message ? <div className="accqua-menu-toast" role="status">{message}</div> : null}
    </div>
  );
}
