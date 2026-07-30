import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import AccquaLogo from "../components/AccquaLogo";
import BottomNavigation from "../components/BottomNavigation";
import LoadingSplash from "../components/LoadingSplash";
import {
  MenuAppleIcon,
  MenuArrowIcon,
  MenuBagIcon,
  MenuBellIcon,
  MenuDumbbellIcon,
  MenuGearIcon,
  MenuRankingIcon,
  MenuShieldIcon,
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
import "./menu.css";
import "./admin-entry.css";

type IconProps = {
  size?: number;
  className?: string;
};

type AreaCard = {
  key: string;
  title: string;
  icon: (props: IconProps) => JSX.Element;
  badge?: string;
};

const areas: AreaCard[] = [
  {
    key: "treino",
    title: "Meu treino",
    icon: MenuDumbbellIcon,
  },
  {
    key: "dieta",
    title: "Minha dieta",
    icon: MenuAppleIcon,
  },
  {
    key: "ranking",
    title: "Ranking",
    icon: MenuRankingIcon,
    badge: "Novidade",
  },
  {
    key: "loja",
    title: "Loja",
    icon: MenuBagIcon,
  },
  {
    key: "configuracao",
    title: "Configuração",
    icon: MenuGearIcon,
  },
];

export default function TestMenu() {
  const navigate = useNavigate();
  const { user, profile, loading, landingPath } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [message, setMessage] = useState("");
  const [workoutAlerts, setWorkoutAlerts] = useState<WorkoutRequiredAlert[]>([]);
  const [isDesktop, setIsDesktop] = useState(
    () => window.matchMedia("(min-width: 900px)").matches,
  );

  const canManageStudents =
    profile?.role === "professor" ||
    profile?.role === "reception" ||
    profile?.role === "admin";

  useEffect(() => {
    const viewport = window.visualViewport;

    const updateViewport = () => {
      const height = Math.round(viewport?.height ?? window.innerHeight);
      document.documentElement.style.setProperty(
        "--menu-viewport-height",
        `${height}px`,
      );
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
    const media = window.matchMedia("(min-width: 900px)");
    const syncDesktop = () => setIsDesktop(media.matches);

    syncDesktop();
    media.addEventListener("change", syncDesktop);

    return () =>
      media.removeEventListener("change", syncDesktop);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSplash(false), 1650);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 2200);
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

    void loadWorkoutRequiredAlerts()
      .then(setWorkoutAlerts)
      .catch(() => setWorkoutAlerts([]));
  }, [canManageStudents, landingPath, user?.id]);

  const firstName = useMemo(() => {
    const name = profile?.fullName?.trim();
    return name ? name.split(/\s+/)[0] : "Aluno";
  }, [profile?.fullName]);

  if (loading) return <LoadingSplash />;
  if (!user) return <Navigate to="/login" replace />;
  if (landingPath !== "/menu-teste") return <Navigate to={landingPath} replace />;
  if (showSplash) return <LoadingSplash />;

  const active = profile?.status === "active";

  const openNotifications = async () => {
    if (!canManageStudents) {
      setMessage("Você não possui novas notificações.");
      return;
    }

    const permission = await requestStaffNotificationPermission();
    const firstAlert = workoutAlerts[0];

    if (firstAlert) {
      await markWorkoutRequiredAlertRead(firstAlert.id);
      navigate(`/area-accqua?student=${firstAlert.studentId}`);
      return;
    }

    if (permission === "granted") {
      setMessage("Alertas de alunos sem treino ativados no celular.");
    } else if (permission === "denied") {
      setMessage("As notificações estão bloqueadas nas configurações do navegador.");
    } else if (permission === "unsupported") {
      setMessage("Este navegador não oferece notificações do sistema.");
    } else {
      setMessage("Você não possui alunos aguardando treino.");
    }
  };

  const openArea = (title: string) => {
    if (title === "Início") {
      setMessage("Você já está na página inicial.");
      return;
    }

    if (
      isDesktop &&
      (title === "Meu treino" ||
        title === "Treino" ||
        title === "Cardio")
    ) {
      setMessage(
        "Treino e Cardio ficam disponíveis somente no celular.",
      );
      return;
    }

    if (title === "Meu treino" || title === "Treino") {
      navigate("/treino");
      return;
    }

    setMessage(`${title} será a próxima tela que vamos construir.`);
  };

  return (
    <div className="accqua-menu-screen">
      <div className="accqua-menu-background" aria-hidden="true">
        <span className="accqua-menu-orbit orbit-one" />
        <span className="accqua-menu-orbit orbit-two" />
        <span className="accqua-menu-glow" />
      </div>

      <main className="accqua-menu-shell">
        <header className="accqua-menu-header">
          <div className="accqua-menu-logo">
            <AccquaLogo compact />
          </div>

          <button
            className="accqua-notification-button"
            type="button"
            aria-label={
              workoutAlerts.length
                ? `${workoutAlerts.length} aluno${workoutAlerts.length === 1 ? "" : "s"} sem treino`
                : "Notificações"
            }
            onClick={() => void openNotifications()}
          >
            <MenuBellIcon size={33} />
            {canManageStudents && workoutAlerts.length ? (
              <span className="accqua-notification-dot" aria-hidden="true" />
            ) : null}
          </button>
        </header>

        <section className="accqua-menu-welcome">
          <h1>Olá, {firstName}</h1>
          <p>Seu app da academia</p>
        </section>

        {canManageStudents ? (
          <button
            type="button"
            className="accqua-membership-card accqua-admin-entry"
            onClick={() => navigate("/area-accqua")}
          >
            <div className="accqua-membership-icon">
              <MenuShieldIcon size={30} />
            </div>

            <div>
              <strong>Área ACCQUA Sports</strong>
              <span>
                <i className="accqua-status-dot" />
                {profile?.role === "professor"
                  ? "Alunos e montagem de treinos"
                  : "Alunos, autorizações e montagem de treinos"}
              </span>
            </div>

            <MenuArrowIcon
              className="accqua-admin-entry-arrow"
              size={21}
            />
          </button>
        ) : (
          <section className="accqua-membership-card">
            <div className="accqua-membership-icon">
              <MenuShieldIcon size={30} />
            </div>

            <div>
              <strong>{active ? "Matrícula ativa" : "Acesso liberado"}</strong>
              <span>
                <i className="accqua-status-dot" />
                {active ? "Acesso liberado" : "Conta autorizada no aplicativo"}
              </span>
            </div>
          </section>
        )}

        <section className="accqua-menu-grid" aria-label="Menu principal">
          {areas.map((area) => {
            const AreaIcon = area.icon;
            const desktopBlocked =
              isDesktop && area.key === "treino";

            return (
              <button
                key={area.key}
                type="button"
                className={[
                  "accqua-menu-card",
                  `accqua-menu-card-${area.key}`,
                  desktopBlocked
                    ? "is-desktop-unavailable"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-disabled={desktopBlocked}
                onClick={() => openArea(area.title)}
              >
                <div className="accqua-menu-card-icon">
                  <AreaIcon />
                </div>

                <div className="accqua-menu-card-copy">
                  <strong>{area.title}</strong>
                  {desktopBlocked ? (
                    <span className="accqua-menu-badge is-device">
                      Somente celular
                    </span>
                  ) : area.badge ? (
                    <span className="accqua-menu-badge">{area.badge}</span>
                  ) : null}
                </div>

                <MenuArrowIcon className="accqua-menu-arrow" size={22} />
              </button>
            );
          })}
        </section>

        <BottomNavigation
          onSelect={openArea}
          disabledLabels={isDesktop ? ["Treino"] : []}
        />
      </main>

      {message ? (
        <div className="accqua-menu-toast" role="status">
          {message}
        </div>
      ) : null}
    </div>
  );
}
