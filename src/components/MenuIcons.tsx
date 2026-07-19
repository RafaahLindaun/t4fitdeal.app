type IconProps = {
  size?: number;
  className?: string;
};

const vector = {
  vectorEffect: "non-scaling-stroke" as const,
};

const iconBase = (
  size: number,
  viewBox = "0 0 32 32",
  strokeWidth = 1.62,
) => ({
  width: size,
  height: size,
  viewBox,
  fill: "none",
  stroke: "currentColor",
  strokeWidth,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
});

/**
 * Ícones exclusivos do menu ACCQUA.
 *
 * O desenho segue o conceito visual do aplicativo:
 * - traço fino e uniforme;
 * - formas abertas e leves;
 * - cantos arredondados;
 * - proporções ópticas consistentes;
 * - nenhuma alteração de layout ou comportamento do menu.
 */

export function MenuBellIcon({
  size = 30,
  className = "",
}: IconProps) {
  return (
    <svg className={className} {...iconBase(size, "0 0 24 24", 1.55)}>
      <path
        {...vector}
        d="M6.45 10.05a5.55 5.55 0 0 1 11.1 0v3.15c0 1.55.5 2.82 1.55 3.85H4.9c1.05-1.03 1.55-2.3 1.55-3.85v-3.15Z"
      />
      <path
        {...vector}
        d="M9.55 19.05c.5.95 1.3 1.45 2.45 1.45s1.95-.5 2.45-1.45"
      />
      <circle
        cx="18.8"
        cy="5.05"
        r="1.45"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

export function MenuShieldIcon({
  size = 30,
  className = "",
}: IconProps) {
  return (
    <svg className={className} {...iconBase(size, "0 0 32 32", 1.58)}>
      <path
        {...vector}
        d="M16 3.7 6.8 7.45v6.7c0 6.15 3.88 10.6 9.2 13.35 5.32-2.75 9.2-7.2 9.2-13.35v-6.7L16 3.7Z"
      />
      <path {...vector} d="m11.55 15.8 2.85 2.85 6.05-6.2" />
    </svg>
  );
}

export function MenuDumbbellIcon({
  size = 42,
  className = "",
}: IconProps) {
  return (
    <svg className={className} {...iconBase(size, "0 0 32 32", 1.72)}>
      <path {...vector} d="M10.25 11.05v9.9M21.75 11.05v9.9" />
      <path {...vector} d="M6.85 12.65v6.7M25.15 12.65v6.7" />
      <path {...vector} d="M4.15 14.25v3.5M27.85 14.25v3.5" />
      <path {...vector} d="M10.25 16h11.5" />
    </svg>
  );
}

export function MenuAppleIcon({
  size = 42,
  className = "",
}: IconProps) {
  return (
    <svg className={className} {...iconBase(size, "0 0 32 32", 1.66)}>
      <path
        {...vector}
        d="M16.05 10.3c-2.85-2.05-8.95-1.48-8.95 5.55 0 6.22 3.9 10.92 7.35 9.08.92-.5 2.18-.5 3.1 0 3.45 1.84 7.35-2.86 7.35-9.08 0-7.03-6.1-7.6-8.85-5.55Z"
      />
      <path {...vector} d="M16.1 10.05c-.08-2.2.9-4 2.85-5.25" />
      <path {...vector} d="M17.7 7.4c2.05-1.35 4.15-1.55 6.1-.55" />
    </svg>
  );
}

export function MenuRankingIcon({
  size = 45,
  className = "",
}: IconProps) {
  return (
    <svg className={className} {...iconBase(size, "0 0 32 32", 1.7)}>
      <path {...vector} d="M5.2 26.6v-6.2M11.65 26.6V17M18.1 26.6V12.7M24.55 26.6V8.9" />
      <path
        {...vector}
        d="m5.45 16.45 6.2-6 5.05 4.05 8.65-8.1"
      />
      <path {...vector} d="M20.95 6.4h4.4v4.4" />
    </svg>
  );
}

export function MenuPersonalIcon({
  size = 42,
  className = "",
}: IconProps) {
  return (
    <svg className={className} {...iconBase(size, "0 0 32 32", 1.62)}>
      <rect
        {...vector}
        x="6.7"
        y="5.7"
        width="18.6"
        height="22.2"
        rx="2.8"
      />
      <rect
        {...vector}
        x="12.15"
        y="3.55"
        width="7.7"
        height="4.4"
        rx="1.35"
      />
      <circle {...vector} cx="16" cy="13.45" r="3.05" />
      <path
        {...vector}
        d="M10.95 22.85c.4-3 2.18-4.65 5.05-4.65s4.65 1.65 5.05 4.65"
      />
    </svg>
  );
}

export function MenuBagIcon({
  size = 42,
  className = "",
}: IconProps) {
  return (
    <svg className={className} {...iconBase(size, "0 0 32 32", 1.66)}>
      <path
        {...vector}
        d="M7.15 11.15h17.7l1.05 16H6.1l1.05-16Z"
      />
      <path
        {...vector}
        d="M11.45 11.15V8.7a4.55 4.55 0 0 1 9.1 0v2.45"
      />
      <path {...vector} d="M10.2 16.1h.01M21.8 16.1h.01" />
    </svg>
  );
}

export function MenuGearIcon({
  size = 42,
  className = "",
}: IconProps) {
  return (
    <svg className={className} {...iconBase(size, "0 0 32 32", 1.62)}>
      <circle {...vector} cx="16" cy="16" r="8.25" />
      <circle {...vector} cx="16" cy="16" r="3.15" />

      <path {...vector} d="M16 3.55v4.2M16 24.25v4.2" />
      <path {...vector} d="M3.55 16h4.2M24.25 16h4.2" />
      <path {...vector} d="m7.2 7.2 2.95 2.95M21.85 21.85l2.95 2.95" />
      <path {...vector} d="m24.8 7.2-2.95 2.95M10.15 21.85 7.2 24.8" />
    </svg>
  );
}

export function MenuArrowIcon({
  size = 22,
  className = "",
}: IconProps) {
  return (
    <svg className={className} {...iconBase(size, "0 0 24 24", 1.52)}>
      <path {...vector} d="m9.15 5.75 6.1 6.25-6.1 6.25" />
    </svg>
  );
}

export function NavHomeIcon({
  size = 24,
  className = "",
}: IconProps) {
  return (
    <svg className={className} {...iconBase(size, "0 0 24 24", 1.58)}>
      <path {...vector} d="m3.55 10.4 8.45-7 8.45 7" />
      <path {...vector} d="M5.35 9.85v10.25h13.3V9.85" />
      <path {...vector} d="M9.15 20.1v-6.35h5.7v6.35" />
    </svg>
  );
}

export function NavCalendarIcon({
  size = 24,
  className = "",
}: IconProps) {
  return (
    <svg className={className} {...iconBase(size, "0 0 24 24", 1.52)}>
      <rect
        {...vector}
        x="3.35"
        y="5.2"
        width="17.3"
        height="15.2"
        rx="2"
      />
      <path {...vector} d="M7.25 3v4.15M16.75 3v4.15M3.35 9.55h17.3" />
      <path {...vector} d="M7.8 13.1h.01M12 13.1h.01M16.2 13.1h.01" />
      <path {...vector} d="M7.8 16.7h.01M12 16.7h.01M16.2 16.7h.01" />
    </svg>
  );
}

export function NavUserIcon({
  size = 24,
  className = "",
}: IconProps) {
  return (
    <svg className={className} {...iconBase(size, "0 0 24 24", 1.58)}>
      <circle {...vector} cx="12" cy="7.45" r="3.55" />
      <path {...vector} d="M4.65 20.35c.35-4.55 3-7 7.35-7s7 2.45 7.35 7" />
    </svg>
  );
}
