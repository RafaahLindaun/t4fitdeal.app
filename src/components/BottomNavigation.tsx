import { useMemo } from "react";
import type { CSSProperties } from "react";
import type { PrimaryNavItem, PrimaryNavKey } from "../lib/navigation";
import { useBottomNavTreinoTarget } from "./BottomNavTargetContext";
import "./bottom-navigation.css";

type BottomNavigationProps = {
  items: PrimaryNavItem[];
  activeKey: PrimaryNavKey;
  onSelect: (item: PrimaryNavItem) => void;
  disabledLabels?: string[];
};

export default function BottomNavigation({
  items,
  activeKey,
  onSelect,
  disabledLabels = [],
}: BottomNavigationProps) {
  const treinoTargetRef = useBottomNavTreinoTarget();
  const activeIndex = useMemo(
    () => Math.max(0, items.findIndex((item) => item.key === activeKey)),
    [activeKey, items],
  );

  return (
    <nav
      className="accqua-bottom-navigation"
      aria-label="Navegação principal"
      data-testid="bottom-nav"
      style={{ "--active-index": activeIndex, "--nav-count": items.length } as CSSProperties}
    >
      <span className="accqua-bottom-slider" aria-hidden="true" />
      {items.map((item) => {
        const ItemIcon = item.icon;
        const selected = item.key === activeKey;
        const disabled = disabledLabels.includes(item.label);
        return (
          <button
            key={item.key}
            type="button"
            className={["accqua-bottom-item", selected ? "is-active" : "", disabled ? "is-disabled" : ""].filter(Boolean).join(" ")}
            aria-current={selected ? "page" : undefined}
            aria-disabled={disabled}
            disabled={disabled}
            onClick={() => { if (!disabled) onSelect(item); }}
          >
            <span ref={item.key === "treino" ? treinoTargetRef : undefined} className="accqua-bottom-icon">
              <ItemIcon size={24} />
            </span>
            <strong>{item.label}</strong>
          </button>
        );
      })}
    </nav>
  );
}
