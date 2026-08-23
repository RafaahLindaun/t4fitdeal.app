import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  MenuDumbbellIcon,
  NavCalendarIcon,
  NavHomeIcon,
  NavUserIcon,
} from "./MenuIcons";
import "./bottom-navigation.css";

type BottomNavigationProps = {
  onSelect?: (label: string) => void;
  disabledLabels?: string[];
};

type NavKey = "inicio" | "treino" | "aulas" | "perfil";

const items: Array<{
  key: NavKey;
  label: string;
  icon: (props: { size?: number; className?: string }) => JSX.Element;
}> = [
  { key: "inicio", label: "Início", icon: NavHomeIcon },
  { key: "treino", label: "Treino", icon: MenuDumbbellIcon },
  { key: "aulas", label: "Aulas", icon: NavCalendarIcon },
  { key: "perfil", label: "Perfil", icon: NavUserIcon },
];

function activeKeyForPath(pathname: string): NavKey {
  if (pathname.startsWith("/treino") || pathname.startsWith("/cardio")) return "treino";
  if (pathname.startsWith("/perfil")) return "perfil";
  if (pathname.startsWith("/aulas")) return "aulas";
  // Minha dieta, ranking e páginas abertas a partir da Home mantêm Início ativo.
  return "inicio";
}

export default function BottomNavigation({
  onSelect,
  disabledLabels = [],
}: BottomNavigationProps) {
  const location = useLocation();
  const active = useMemo(() => activeKeyForPath(location.pathname), [location.pathname]);

  const activeIndex = useMemo(
    () => Math.max(0, items.findIndex((item) => item.key === active)),
    [active],
  );

  const selectItem = (label: string) => {
    onSelect?.(label);
  };

  return (
    <nav
      className="accqua-bottom-navigation"
      aria-label="Navegação principal"
      style={{ "--active-index": activeIndex } as React.CSSProperties}
    >
      <span className="accqua-bottom-slider" aria-hidden="true" />

      {items.map((item) => {
        const ItemIcon = item.icon;
        const selected = item.key === active;
        const disabled = disabledLabels.includes(item.label);

        return (
          <button
            key={item.key}
            type="button"
            className={[
              "accqua-bottom-item",
              selected ? "is-active" : "",
              disabled ? "is-disabled" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-current={selected ? "page" : undefined}
            aria-disabled={disabled}
            disabled={disabled}
            onClick={() => { if (!disabled) selectItem(item.label); }}
          >
            <span className="accqua-bottom-icon">
              <ItemIcon size={24} />
            </span>
            <strong>{item.label}</strong>
          </button>
        );
      })}
    </nav>
  );
}
