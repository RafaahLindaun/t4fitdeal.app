import type { ReactNode } from "react";
import {
  AdminDumbbellIcon,
  AdminPeopleIcon,
  AdminShieldIcon,
  AdminSparkIcon,
  AdminWarningIcon,
} from "../components/AdminIcons";

export type StaffNavKey = "students" | "alerts" | "approvals" | "classes" | "library" | "templates" | "store";
export type StaffNavItem = { key: StaffNavKey; label: string; href: string; icon: ReactNode };

export function getStaffNavItems(): StaffNavItem[] {
  return [
    { key: "students", label: "Alunos", href: "/area-accqua", icon: <AdminPeopleIcon size={21} /> },
    { key: "alerts", label: "Alertas", href: "/area-accqua?section=alerts", icon: <AdminWarningIcon size={21} /> },
    { key: "approvals", label: "Aprovações", href: "/area-accqua?section=approvals", icon: <AdminShieldIcon size={21} /> },
    { key: "classes", label: "Aulas", href: "/area-accqua/aulas", icon: <AdminSparkIcon size={21} /> },
    { key: "library", label: "Biblioteca", href: "/area-accqua?section=library", icon: <AdminDumbbellIcon size={21} /> },
    { key: "templates", label: "Modelos", href: "/area-accqua?section=templates", icon: <AdminSparkIcon size={21} /> },
    { key: "store", label: "Loja", href: "/area-accqua/loja", icon: <AdminSparkIcon size={21} /> },
  ];
}

export function staffNavKeyForLocation(pathname: string, search: string): StaffNavKey {
  if (pathname.startsWith("/area-accqua/aulas")) return "classes";
  if (pathname.startsWith("/area-accqua/loja")) return "store";
  if (pathname.startsWith("/area-accqua/montar")) return "students";
  const section = new URLSearchParams(search).get("section");
  if (section === "alerts" || section === "approvals" || section === "library" || section === "templates") return section;
  return "students";
}
