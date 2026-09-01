import type { ReactNode } from "react";
import {
  AdminCalendarIcon,
  AdminClipboardListIcon,
  AdminDumbbellIcon,
  AdminPeopleIcon,
  AdminShieldIcon,
  AdminShoppingBagIcon,
  AdminWarningIcon,
} from "../components/AdminIcons";

function TrophyIcon() {
  return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 4h8v3.5c0 3-1.7 5.2-4 5.2s-4-2.2-4-5.2V4Z"/><path d="M8 6H4.5v1.5c0 2.2 1.5 3.8 4.1 4M16 6h3.5v1.5c0 2.2-1.5 3.8-4.1 4M12 12.7V17M8.5 20h7M10 17h4"/></svg>;
}

function BellIcon() {
  return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6.5 9.7a5.5 5.5 0 0 1 11 0c0 6 2.5 6.3 2.5 6.3H4s2.5-.3 2.5-6.3Z"/><path d="M10 19h4"/></svg>;
}

export type StaffNavKey = "students" | "alerts" | "approvals" | "classes" | "library" | "templates" | "store" | "ranking" | "notifications";
export type StaffNavItem = { key: StaffNavKey; label: string; href: string; icon: ReactNode };

export function getStaffNavItems(): StaffNavItem[] {
  return [
    { key: "students", label: "Alunos", href: "/area-accqua", icon: <AdminPeopleIcon size={21} /> },
    { key: "alerts", label: "Alertas", href: "/area-accqua?section=alerts", icon: <AdminWarningIcon size={21} /> },
    { key: "approvals", label: "Aprovações", href: "/area-accqua?section=approvals", icon: <AdminShieldIcon size={21} /> },
    { key: "classes", label: "Aulas", href: "/area-accqua/aulas", icon: <AdminCalendarIcon size={21} /> },
    { key: "ranking", label: "Ranking", href: "/area-accqua/ranking", icon: <TrophyIcon /> },
    { key: "notifications", label: "Notificações", href: "/area-accqua/notificacoes", icon: <BellIcon /> },
    { key: "library", label: "Biblioteca", href: "/area-accqua?section=library", icon: <AdminDumbbellIcon size={21} /> },
    { key: "templates", label: "Modelos", href: "/area-accqua?section=templates", icon: <AdminClipboardListIcon size={21} /> },
    { key: "store", label: "Loja", href: "/area-accqua/loja", icon: <AdminShoppingBagIcon size={21} /> },
  ];
}

export function staffNavKeyForLocation(pathname: string, search: string): StaffNavKey {
  if (pathname.startsWith("/area-accqua/aulas")) return "classes";
  if (pathname.startsWith("/area-accqua/loja")) return "store";
  if (pathname.startsWith("/area-accqua/ranking")) return "ranking";
  if (pathname.startsWith("/area-accqua/notificacoes")) return "notifications";
  if (pathname.startsWith("/area-accqua/montar")) return "students";
  const section = new URLSearchParams(search).get("section");
  if (section === "alerts" || section === "approvals" || section === "library" || section === "templates") return section;
  return "students";
}
