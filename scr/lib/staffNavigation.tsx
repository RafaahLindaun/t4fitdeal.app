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

function StaffTrophyIcon({ size=21 }:{size?:number}){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 4h8v4a4 4 0 0 1-8 0V4Z"/><path d="M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 12v5M8 21h8M9 17h6"/></svg>}
function StaffBellIcon({ size=21 }:{size?:number}){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>}

export type StaffNavKey = "students" | "alerts" | "approvals" | "classes" | "library" | "templates" | "store" | "ranking" | "notifications";
export type StaffNavItem = { key: StaffNavKey; label: string; href: string; icon: ReactNode };

export function getStaffNavItems(): StaffNavItem[] {
  return [
    { key: "students", label: "Alunos", href: "/area-accqua", icon: <AdminPeopleIcon size={21} /> },
    { key: "alerts", label: "Alertas", href: "/area-accqua?section=alerts", icon: <AdminWarningIcon size={21} /> },
    { key: "approvals", label: "Aprovações", href: "/area-accqua?section=approvals", icon: <AdminShieldIcon size={21} /> },
    { key: "classes", label: "Aulas", href: "/area-accqua/aulas", icon: <AdminCalendarIcon size={21} /> },
    { key: "ranking", label: "Ranking", href: "/area-accqua/ranking", icon: <StaffTrophyIcon /> },
    { key: "notifications", label: "Notificações", href: "/area-accqua/notificacoes", icon: <StaffBellIcon /> },
    { key: "library", label: "Biblioteca", href: "/area-accqua?section=library", icon: <AdminDumbbellIcon size={21} /> },
    { key: "templates", label: "Modelos", href: "/area-accqua?section=templates", icon: <AdminClipboardListIcon size={21} /> },
    { key: "store", label: "Loja", href: "/area-accqua/loja", icon: <AdminShoppingBagIcon size={21} /> },
  ];
}

export function staffNavKeyForLocation(pathname: string, search: string): StaffNavKey {
  if (pathname.startsWith("/area-accqua/aulas")) return "classes";
  if (pathname.startsWith("/area-accqua/ranking")) return "ranking";
  if (pathname.startsWith("/area-accqua/notificacoes")) return "notifications";
  if (pathname.startsWith("/area-accqua/loja")) return "store";
  if (pathname.startsWith("/area-accqua/montar")) return "students";
  const section = new URLSearchParams(search).get("section");
  if (section === "alerts" || section === "approvals" || section === "library" || section === "templates") return section;
  return "students";
}
