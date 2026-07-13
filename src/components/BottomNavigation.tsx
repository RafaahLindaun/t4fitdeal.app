import { useMemo, useState } from "react";
import {
  NavDumbbellIcon,
  NavCalendarIcon,
  NavHomeIcon,
  NavUserIcon,
} from "./MenuIcons";
import "./bottom-navigation.css";

type BottomNavigationProps = {
  onSelect?: (label: string) => void;
};

type NavKey = "inicio" | "treino" | "aulas" | "perfil";

const items: Array<{
  key: NavKey;
  label: string;
  icon: (props: { size?: number; className?: string }) => JSX.Element;
}> = [
  { key: "inicio", label: "Início", icon: NavHomeIcon },
  { key: "treino", label: "Treino", icon: NavDumbbellIcon },
  { key: "aulas", label: "Aulas", icon: NavCalendarIcon },
  { key: "perfil", label: "Perfil", icon: NavUserIcon },
];

export default function BottomNavigation({ onSelect }: BottomNavigationProps) {
  const [active, setActive] = useState<NavKey>("inicio");

  const activeIndex = useMemo(
    () => Math.max(0, items.findIndex((item) => item.key === active)),
    [active],
  );

  const selectItem = (key: NavKey, label: string) => {
    setActive(key);
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

        return (
          <button
            key={item.key}
            type="button"
            className={`accqua-bottom-item ${selected ? "is-active" : ""}`}
            aria-current={selected ? "page" : undefined}
            onClick={() => selectItem(item.key, item.label)}
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
