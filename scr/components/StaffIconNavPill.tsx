import type { ReactNode } from "react";

type StaffIconNavPillProps = {
  icon: ReactNode;
  label: string;
  active: boolean;
  onActivate: () => void;
  onPrefetch?: () => void;
};

export default function StaffIconNavPill({
  icon,
  label,
  active,
  onActivate,
  onPrefetch,
}: StaffIconNavPillProps) {
  return (
    <button
      type="button"
      className={`accqua-staff-icon-nav-pill ${active ? "is-active" : ""}`}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      onClick={onActivate}
      onPointerEnter={onPrefetch}
      onFocus={onPrefetch}
      onPointerDown={onPrefetch}
    >
      <span className="accqua-staff-icon-nav-pill-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="accqua-staff-icon-nav-pill-label">{label}</span>
    </button>
  );
}
