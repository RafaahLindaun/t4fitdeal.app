import type { PrimaryNavItem, PrimaryNavKey } from "../lib/navigation";
import { useAuth } from "../auth/AuthProvider";
import AccquaLogo from "./AccquaLogo";
import "./primary-sidebar.css";

type PrimarySidebarProps = {
  items: PrimaryNavItem[];
  activeKey: PrimaryNavKey;
  onSelect: (item: PrimaryNavItem) => void;
};

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "AS";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts.at(-1)?.[0] ?? "" : "";
  return `${first}${last}`.toUpperCase();
}

function roleLabel(role: string) {
  if (role === "professor") return "Professor";
  if (role === "reception" || role === "recepcao") return "Recepção";
  if (role === "admin") return "Administração";
  return "Aluno ACCQUA";
}

export default function PrimarySidebar({ items, activeKey, onSelect }: PrimarySidebarProps) {
  const { profile, user } = useAuth();
  const displayName = profile?.fullName?.trim() || user?.email?.split("@")[0] || "ACCQUA Sports";
  const profileItem = items.find((item) => item.key === "perfil");

  return (
    <aside className="accqua-primary-sidebar" aria-label="Navegação principal" data-testid="desktop-sidebar">
      <div className="accqua-primary-sidebar-brand"><AccquaLogo compact /></div>
      <nav>
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.key === activeKey;
          return (
            <button
              type="button"
              key={item.key}
              className={active ? "is-active" : ""}
              aria-current={active ? "page" : undefined}
              onClick={() => onSelect(item)}
            >
              <span><Icon size={22} /></span>
              <strong>{item.label}</strong>
            </button>
          );
        })}
      </nav>
      <button className="accqua-primary-sidebar-account" type="button" onClick={() => { if (profileItem) onSelect(profileItem); }}>
        <span className="accqua-primary-sidebar-avatar">{initials(displayName)}</span>
        <span className="accqua-primary-sidebar-account-copy">
          <strong>{displayName}</strong>
          <small>{roleLabel(profile?.role ?? "student")}</small>
        </span>
      </button>
    </aside>
  );
}
