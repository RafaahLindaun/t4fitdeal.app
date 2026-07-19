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
  MenuPersonalIcon,
  MenuRankingIcon,
  MenuShieldIcon,
} from "../components/MenuIcons";
import { useAuth } from "../auth/AuthProvider";
import "./menu.css";

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
    key: "personal",
    title: "Área personal",
    icon: MenuPersonalIcon,
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
  const { user, profile, loading, landingPath, isTeam } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [message, setMessage] = useState("");

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
    const timer = window.setTimeout(() => setShowSplash(false), 1650);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 2200);
    return () => window.clearTimeout(timer);
  }, [message]);

  const firstName = useMemo(() => {
    const name = profile?.fullName?.trim();
    return name ? name.split(/\s+/)[0] : "Aluno";
  }, [profile?.fullName]);

  if (loading) return <LoadingSplash />;
  if (!user) return <Navigate to="/login" replace />;
  if (landingPath !== "/menu-teste") return <Navigate to={landingPath} replace />;
  if (showSplash) return <LoadingSplash />;

  const active = profile?.status === "active";

  const openArea = (title: string) => {
    if (title === "Início") {
      setMessage("Você já está na página inicial.");
      return;
    }

    if (title === "Montar treino para aluno") {
      navigate("/montar-treino");
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
            aria-label="Notificações"
            onClick={() => setMessage("Você não possui novas notificações.")}
          >
            <MenuBellIcon size={33} />
            <span className="accqua-notification-dot" aria-hidden="true" />
          </button>
        </header>

        <section className="accqua-menu-welcome">
          <h1>Olá, {firstName}</h1>
          <p>Seu app da academia</p>
        </section>

        {isTeam ? (
          <button
            type="button"
            className="accqua-membership-card accqua-membership-staff-action"
            onClick={() => openArea("Montar treino para aluno")}
          >
            <div className="accqua-membership-icon">
              <MenuDumbbellIcon size={31} />
            </div>

            <div>
              <strong>Montar treino para aluno</strong>
              <span>
                <i className="accqua-status-dot" />
                Buscar aluno, montar, salvar e publicar
              </span>
            </div>

            <MenuArrowIcon className="accqua-membership-arrow" size={23} />
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

            return (
              <button
                key={area.key}
                type="button"
                className={`accqua-menu-card accqua-menu-card-${area.key}`}
                onClick={() => openArea(area.title)}
              >
                <div className="accqua-menu-card-icon">
                  <AreaIcon />
                </div>

                <div className="accqua-menu-card-copy">
                  <strong>{area.title}</strong>
                  {area.badge ? (
                    <span className="accqua-menu-badge">{area.badge}</span>
                  ) : null}
                </div>

                <MenuArrowIcon className="accqua-menu-arrow" size={22} />
              </button>
            );
          })}
        </section>

        <BottomNavigation onSelect={openArea} />
      </main>

      {message ? (
        <div className="accqua-menu-toast" role="status">
          {message}
        </div>
      ) : null}
    </div>
  );
}
