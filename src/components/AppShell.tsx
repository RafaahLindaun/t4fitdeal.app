import type { ReactNode } from "react";
import BottomNav from "./BottomNav";
import { Icon } from "./Icons";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";

export default function AppShell({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode }) {
  const { profile } = useAuth();
  return (
    <div className="app-screen">
      <header className="page-header">
        <div>
          <div className="eyebrow">Accqua Sports</div>
          <h1>{title}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        <div className="header-actions">
          {action}
          <Link to="/conta" className="header-avatar">
            {profile?.full_name?.charAt(0).toUpperCase() || "A"}
          </Link>
        </div>
      </header>
      <main className="page-content">{children}</main>
      <BottomNav />
    </div>
  );
}

export function SmallIconButton({ to, label, icon = "info" }: { to?: string; label: string; icon?: string }) {
  const content = (
    <span className="icon-button" aria-label={label} title={label}>
      <Icon name={icon} size={16} />
    </span>
  );
  if (!to) return content;
  return <Link to={to}>{content}</Link>;
}
