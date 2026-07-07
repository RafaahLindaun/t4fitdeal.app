import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import { Icon, type IconName } from "./Icon";

export function Screen({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <main className={`screen ${className}`}>{children}</main>;
}

export function Header({ title, infoTo, help = false, right }: { title?: string; infoTo?: string; help?: boolean; right?: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <header className="top-header">
      <button className="round ghost" onClick={() => navigate(-1)} aria-label="Voltar"><Icon name="back" /></button>
      <div className="brand-title"><Logo compact />{title && <><span className="divider" /><strong>{title}</strong></>}</div>
      {right ?? (infoTo ? <Link className="round ghost" to={infoTo}><Icon name={help ? "info" : "info"} /></Link> : <span className="round ghost invisible" />)}
    </header>
  );
}

export function AppLogoHeader({ bell = false }: { bell?: boolean }) {
  return (
    <div className="home-brand-row">
      <Logo />
      {bell && <button className="bell-btn"><Icon name="bell" /><span /></button>}
    </div>
  );
}

export function BottomNav({ active }: { active: "inicio" | "treino" | "aulas" | "perfil" | "ranking" }) {
  const items: { key: typeof active; label: string; icon: IconName; to: string }[] = [
    { key: "inicio", label: "Início", icon: "home", to: "/home" },
    { key: "treino", label: "Treino", icon: "dumbbell", to: "/treino" },
    { key: "aulas", label: "Aulas", icon: "calendar", to: "/aulas" },
    { key: "perfil", label: "Perfil", icon: "user", to: "/conta" },
  ];
  return (
    <nav className="bottom-nav">
      {items.map((item) => <Link key={item.key} className={active === item.key ? "active" : ""} to={item.to}><Icon name={item.icon} /><span>{item.label}</span></Link>)}
    </nav>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`glass-card ${className}`}>{children}</section>;
}

export function StatPill({ icon, label, value, tone = "yellow" }: { icon: IconName; label: string; value: string; tone?: "yellow" | "blue" | "green" | "orange" | "red" }) {
  return <div className={`stat-pill ${tone}`}><Icon name={icon} /><span>{label}</span><strong>{value}</strong></div>;
}

export function Toggle({ checked = true }: { checked?: boolean }) {
  return <span className={`toggle ${checked ? "on" : ""}`}><i /></span>;
}

export function MenuRow({ icon, title, subtitle, to }: { icon: IconName; title: string; subtitle: string; to: string }) {
  return <Link className="menu-row" to={to}><span className="menu-icon"><Icon name={icon} /></span><span><strong>{title}</strong><small>{subtitle}</small></span><Icon className="chev" name="back" /></Link>;
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return <div className="page-title"><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>;
}
