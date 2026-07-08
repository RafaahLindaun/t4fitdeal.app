import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import Icon from "./Icon";

const navItems = [
  ["/home", "home", "Início"],
  ["/treino", "dumbbell", "Treino"],
  ["/aulas", "calendar", "Aulas"],
  ["/conta", "user", "Perfil"],
] as const;

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>;
}

export default function AppShell({
  children,
  title,
  subtitle,
  back = false,
  right,
  hideNav = false,
  className = "",
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
  hideNav?: boolean;
  className?: string;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className={`app-page ${className}`}>
      <header className="app-header">
        <div className="header-side">
          {back ? <button className="icon-button" onClick={() => navigate(-1)}><Icon name="back"/></button> : null}
        </div>
        <Logo compact />
        <div className="header-side right">{right}</div>
      </header>
      {(title || subtitle) && <div className="page-title"><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>}
      <main className="page-content">{children}</main>
      {!hideNav && (
        <nav className="bottom-nav">
          {navItems.map(([to, icon, label]) => {
            const active = location.pathname === to || (to === "/treino" && location.pathname === "/cardio");
            return <Link key={to} className={active ? "active" : ""} to={to}><Icon name={icon}/><span>{label}</span></Link>;
          })}
        </nav>
      )}
    </div>
  );
}
