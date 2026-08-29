import type { ComponentType } from "react";
import type { AppRole } from "../auth/AuthProvider";
import {
  MenuDumbbellIcon,
  MenuShieldIcon,
  NavCalendarIcon,
  NavHomeIcon,
  NavUserIcon,
} from "../components/MenuIcons";

export const APP_NAV_BREAKPOINT_PX = 1024;

export type PrimaryNavKey = "inicio" | "treino" | "aulas" | "perfil" | "staff";

export type PrimaryNavItem = {
  key: PrimaryNavKey;
  label: string;
  href: string;
  icon: ComponentType<{ size?: number; className?: string }>;
};

const BASE_NAV_ITEMS: readonly PrimaryNavItem[] = [
  { key: "inicio", label: "Início", href: "/menu-teste", icon: NavHomeIcon },
  { key: "treino", label: "Treino", href: "/treino", icon: MenuDumbbellIcon },
  { key: "aulas", label: "Aulas", href: "/aulas", icon: NavCalendarIcon },
  { key: "perfil", label: "Perfil", href: "/perfil", icon: NavUserIcon },
];

const STAFF_NAV_ITEM: PrimaryNavItem = {
  key: "staff",
  label: "Staff",
  href: "/area-accqua",
  icon: MenuShieldIcon,
};

export function isStaffRole(role: AppRole | string | null | undefined) {
  const normalized = String(role ?? "").trim().toLowerCase();
  return ["professor", "admin", "reception", "recepcao"].includes(normalized);
}

export function getNavItems(role: AppRole | string | null | undefined): PrimaryNavItem[] {
  return isStaffRole(role) ? [...BASE_NAV_ITEMS, STAFF_NAV_ITEM] : [...BASE_NAV_ITEMS];
}

export function activeNavKeyForPath(pathname: string): PrimaryNavKey {
  if (pathname.startsWith("/area-accqua")) return "staff";
  if (pathname.startsWith("/treino") || pathname.startsWith("/cardio")) return "treino";
  if (pathname.startsWith("/aulas")) return "aulas";
  if (pathname.startsWith("/perfil")) return "perfil";
  return "inicio";
}
