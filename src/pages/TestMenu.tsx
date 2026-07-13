import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import AccquaLogo from "../components/AccquaLogo";
import LoadingSplash from "../components/LoadingSplash";
import { useAuth } from "../auth/AuthProvider";
import "./menu.css";

type IconProps = { size?: number; className?: string };

const iconBase = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

function BellIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size)}>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}

function ShieldIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size)}>
      <path d="M12 3 5 6v5c0 5 3.4 8.1 7 10 3.6-1.9 7-5 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function DumbbellIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size)}>
      <path d="M5 7v10M19 7v10M2 10v4M22 10v4M5 12h14" />
    </svg>
  );
}

function AppleIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size)}>
      <path d="M12 7c2-2 3.3-2.8 5-2" />
      <path d="M12 7c-2.5-1.7-7-1.2-7 4.3C5 16.6 8.4 21 11 19.4c.7-.4 1.3-.4 2 0 2.6 1.6 6-2.8 6-8.1C19 6 14.5 5.3 12 7Z" />
      <path d="M12 7c-.1-1.5.5-2.8 1.8-3.8" />
    </svg>
  );
}

function RankingIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size)}>
      <path d="M7 21v-7H3v7M14 21V9h-4v12M21 21V4h-4v17" />
      <path d="M4 7h3l2-3 3 2 4-4 4 2" />
    </svg>
  );
}

function PersonalIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size)}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <circle cx="12" cy="9" r="3" />
      <path d="M7.5 18a4.5 4.5 0 0 1 9 0" />
    </svg>
  );
}

function BagIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size)}>
      <path d="M5 8h14l1 13H4L5 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function GearIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.09a1.7 1.7 0 0 0-.4-1.1 1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.09a1.7 1.7 0 0 0 1.1-.4 1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.09a1.7 1.7 0 0 0 .4 1.1 1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.2.4.6.8 1 1 .3.2.7.3 1.1.3H21v4h-.09c-.4 0-.8.1-1.1.3-.4.2-.8.6-1 1Z" />
    </svg>
  );
}

function ArrowIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size)}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function HomeIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size)}>
      <path d="m3 10 9-7 9 7" />
      <path d="M5 9v12h14V9M9 21v-7h6v7" />
    </svg>
  );
}

function CalendarIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size)}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M7 3v4M17 3v4M3 10h18" />
    </svg>
  );
}

function UserIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

type AreaCard = {
  key: string;
  title: string;
  description: string;
  icon: (props: IconProps) => JSX.Element;
  badge?: string;
};

const areas: AreaCard[] = [
  {
    key: "treino",
    title: "Meu treino",
    description: "Acesse o treino liberado pelo seu professor.",
    icon: DumbbellIcon,
  },
  {
    key: "dieta",
    title: "Minha dieta",
    description: "Acompanhe metas, refeições e recomendações.",
    icon: AppleIcon,
  },
  {
    key: "ranking",
    title: "Ranking",
    description: "Veja os alunos com mais treinos registrados.",
    icon: RankingIcon,
    badge: "Novidade",
  },
  {
    key: "personal",
    title: "Área personal",
    description: "Conheça os professores disponíveis na academia.",
    icon: PersonalIcon,
  },
  {
    key: "loja",
    title: "Loja",
    description: "Visualize os produtos disponíveis na recepção.",
    icon: BagIcon,
  },
  {
    key: "configuracao",
    title: "Configuração",
    description: "Ajuste sua conta e as preferências do aplicativo.",
    icon: GearIcon,
  },
];

export default function TestMenu() {
  const { user, profile, loading, landingPath } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [message, setMessage] = useState("");

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
            <BellIcon size={25} />
            <span className="accqua-notification-dot" />
          </button>
        </header>

        <section className="accqua-menu-welcome">
          <h1>Olá, {firstName}</h1>
          <p>Seu app da academia</p>
        </section>

        <section className="accqua-membership-card">
          <div className="accqua-membership-icon">
            <ShieldIcon size={29} />
          </div>
          <div>
            <strong>{active ? "Matrícula ativa" : "Acesso liberado"}</strong>
            <span>
              <i className="accqua-status-dot" />
              {active ? "Acesso liberado" : "Conta autorizada no aplicativo"}
            </span>
          </div>
        </section>

        <section className="accqua-menu-grid" aria-label="Menu principal">
          {areas.map((area) => {
            const AreaIcon = area.icon;
            return (
              <button
                key={area.key}
                type="button"
                className="accqua-menu-card"
                onClick={() => openArea(area.title)}
              >
                <div className="accqua-menu-card-icon">
                  <AreaIcon size={32} />
                </div>
                <div className="accqua-menu-card-copy">
                  <strong>{area.title}</strong>
                  {area.badge ? <span className="accqua-menu-badge">{area.badge}</span> : null}
                  <p>{area.description}</p>
                </div>
                <ArrowIcon className="accqua-menu-arrow" size={20} />
              </button>
            );
          })}
        </section>

        <nav className="accqua-bottom-navigation" aria-label="Navegação principal">
          <button className="accqua-bottom-item is-active" type="button">
            <span className="accqua-bottom-indicator" />
            <HomeIcon size={23} />
            <strong>Início</strong>
          </button>
          <button type="button" className="accqua-bottom-item" onClick={() => openArea("Treino")}>
            <DumbbellIcon size={23} />
            <strong>Treino</strong>
          </button>
          <button type="button" className="accqua-bottom-item" onClick={() => openArea("Aulas")}>
            <CalendarIcon size={23} />
            <strong>Aulas</strong>
          </button>
          <button type="button" className="accqua-bottom-item" onClick={() => openArea("Perfil")}>
            <UserIcon size={23} />
            <strong>Perfil</strong>
          </button>
        </nav>
      </main>

      {message ? <div className="accqua-menu-toast" role="status">{message}</div> : null}
    </div>
  );
}
