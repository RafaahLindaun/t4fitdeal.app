type IconProps = {
  size?: number;
  className?: string;
};

const lineIcon = (
  size: number,
  viewBox: string,
  strokeWidth: number,
  widthRatio = 1,
) => ({
  width: Math.round(size * widthRatio * 100) / 100,
  height: size,
  viewBox,
  fill: "none",
  stroke: "currentColor",
  strokeWidth,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
  preserveAspectRatio: "xMidYMid meet",
  style: {
    overflow: "visible",
    shapeRendering: "geometricPrecision" as const,
    flex: "0 0 auto",
  },
});

/**
 * Ícones redesenhados à mão com base direta na arte-conceito aprovada.
 * Não usam biblioteca genérica: as proporções, cortes e espaços seguem
 * o desenho original do menu.
 */

export function MenuBellIcon({ size = 32, className = "" }: IconProps) {
  return (
    <svg
      className={className}
      {...lineIcon(size, "3.8 1.6 24.4 27.5", 1.58, 0.91)}
    >
      <path d="M5.9 23.5h20.2c-1.65-1.5-2.4-3.3-2.4-5.65v-5.1c0-4.15-3.1-7.35-7.7-7.35s-7.7 3.2-7.7 7.35v5.1c0 2.35-.75 4.15-2.4 5.65Z" />
      <path d="M12.65 26.2c.7 1.15 1.8 1.75 3.35 1.75s2.65-.6 3.35-1.75" />
      <path d="M13.95 4.5c.4-1.05 1.1-1.55 2.05-1.55s1.65.5 2.05 1.55" />
    </svg>
  );
}

export function MenuShieldIcon({ size = 34, className = "" }: IconProps) {
  return (
    <svg
      className={className}
      {...lineIcon(size, "4.2 1.8 23.6 26.7", 1.82, 0.91)}
    >
      <path d="M16 3.5 6.25 7.45v6.2c0 6.15 4.3 10.25 9.75 12.95 5.45-2.7 9.75-6.8 9.75-12.95v-6.2L16 3.5Z" />
      <path d="m10.85 14.8 3.15 3.05 7.05-7.15" />
    </svg>
  );
}

export function MenuDumbbellIcon({ size = 42, className = "" }: IconProps) {
  return (
    <svg
      className={className}
      {...lineIcon(size, "1.5 7.5 45 33", 2.08, 1.34)}
    >
      <rect x="10.4" y="12.8" width="7.6" height="22.4" rx="3.8" />
      <rect x="30" y="12.8" width="7.6" height="22.4" rx="3.8" />
      <path d="M18 19.7h12M18 28.3h12" />
      <path d="M6.7 17.1v13.8M41.3 17.1v13.8" />
      <path d="M3.5 21.4v5.2M44.5 21.4v5.2" />
    </svg>
  );
}

export function MenuAppleIcon({ size = 40, className = "" }: IconProps) {
  return (
    <svg
      className={className}
      {...lineIcon(size, "0 0 48 48", 2.12, 1.04)}
    >
      <path d="M24 15.5c-4.8-4.2-14.2-3.25-15.65 6.2-1.4 9.1 4.15 18.7 11.2 16.25 2.75-.95 3.6-.95 6.35 0 7.05 2.45 12.6-7.15 11.2-16.25C35.65 12.25 28.8 11.3 24 15.5Z" />
      <path d="M24 15.25c-.35-4.65 1.25-8.1 5.1-10.55" />
      <path d="M25.2 10.4c4.3-4.25 8.3-4.25 11.65-3.45-1.2 4.7-4.5 7.25-9.45 6.3" />
    </svg>
  );
}

export function MenuRankingIcon({ size = 43, className = "" }: IconProps) {
  return (
    <svg
      className={className}
      {...lineIcon(size, "0 0 48 48", 2.0, 1.08)}
    >
      <path d="M18 5.5h12v5.15c0 5.15-2.4 8.2-6 8.2s-6-3.05-6-8.2V5.5Z" />
      <path d="M18 8.2h-5.5v2.2c0 3.45 2.2 5.75 5.75 6.15M30 8.2h5.5v2.2c0 3.45-2.2 5.75-5.75 6.15" />
      <path d="M24 18.85v6.35" />
      <rect x="3.5" y="31.2" width="13.2" height="11.3" rx="1.2" />
      <rect x="17.4" y="26.7" width="13.2" height="15.8" rx="1.2" />
      <rect x="31.3" y="33.3" width="13.2" height="9.2" rx="1.2" />

      <g
        fill="currentColor"
        stroke="none"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="7"
        fontWeight="800"
        textAnchor="middle"
      >
        <text x="10.1" y="39.2">2</text>
        <text x="24" y="36.8">1</text>
        <text x="37.9" y="40.4">3</text>
      </g>
    </svg>
  );
}

export function MenuPersonalIcon({ size = 40, className = "" }: IconProps) {
  return (
    <svg
      className={className}
      {...lineIcon(size, "0 0 48 48", 2.08, 1.06)}
    >
      <rect x="8.5" y="9.5" width="31" height="33" rx="2.3" />
      <rect x="18" y="5.5" width="12" height="7" rx="1.6" />
      <circle cx="24" cy="23.2" r="5" />
      <path d="M15.9 35.8c.7-5.15 3.4-8.1 8.1-8.1s7.4 2.95 8.1 8.1" />
    </svg>
  );
}

export function MenuBagIcon({ size = 40, className = "" }: IconProps) {
  return (
    <svg
      className={className}
      {...lineIcon(size, "0 0 48 48", 2.08, 1.09)}
    >
      <path d="M10.1 18.2h27.8l2.25 23.25c.2 2.05-1.35 3.8-3.4 3.8h-25.5c-2.05 0-3.6-1.75-3.4-3.8l2.25-23.25Z" />
      <path d="M15.8 21.5V15c0-5.25 3.45-9 8.2-9s8.2 3.75 8.2 9v6.5" />
    </svg>
  );
}

export function MenuGearIcon({ size = 41, className = "" }: IconProps) {
  return (
    <svg
      className={className}
      {...lineIcon(size, "0 0 48 48", 2.0, 1.0)}
    >
      <path d="M18.45 10.60 L19.82 7.73 L20.65 4.79 L27.35 4.79 L28.18 7.73 L29.55 10.60 L29.55 10.60 L32.55 9.54 L35.21 8.05 L39.95 12.79 L38.46 15.45 L37.40 18.45 L37.40 18.45 L40.27 19.82 L43.21 20.65 L43.21 27.35 L40.27 28.18 L37.40 29.55 L37.40 29.55 L38.46 32.55 L39.95 35.21 L35.21 39.95 L32.55 38.46 L29.55 37.40 L29.55 37.40 L28.18 40.27 L27.35 43.21 L20.65 43.21 L19.82 40.27 L18.45 37.40 L18.45 37.40 L15.45 38.46 L12.79 39.95 L8.05 35.21 L9.54 32.55 L10.60 29.55 L10.60 29.55 L7.73 28.18 L4.79 27.35 L4.79 20.65 L7.73 19.82 L10.60 18.45 L10.60 18.45 L9.54 15.45 L8.05 12.79 L12.79 8.05 L15.45 9.54 L18.45 10.60 Z" />
      <circle cx="24" cy="24" r="8.3" />
    </svg>
  );
}

export function MenuArrowIcon({ size = 22, className = "" }: IconProps) {
  return (
    <svg
      className={className}
      {...lineIcon(size, "0 0 32 32", 1.72, 0.72)}
    >
      <path d="m11.2 6.5 9.5 9.5-9.5 9.5" />
    </svg>
  );
}

export function NavHomeIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg
      className={className}
      {...lineIcon(size, "0 0 32 32", 1.76, 1.02)}
    >
      <path d="m4.8 14.1 11.2-9 11.2 9" />
      <path d="M7.2 12.3v14.1h17.6V12.3" />
      <path d="M12.1 26.4v-8.2h7.8v8.2" />
    </svg>
  );
}

export function NavDumbbellIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg
      className={className}
      {...lineIcon(size, "1 6 30 20", 1.64, 1.34)}
    >
      <rect x="7.1" y="8" width="4.7" height="16" rx="2.35" />
      <rect x="20.2" y="8" width="4.7" height="16" rx="2.35" />
      <path d="M11.8 13h8.4M11.8 19h8.4" />
      <path d="M4.5 11v10M27.5 11v10" />
      <path d="M2.3 14.2v3.6M29.7 14.2v3.6" />
    </svg>
  );
}

export function NavCalendarIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg
      className={className}
      {...lineIcon(size, "0 0 32 32", 1.66, 1.02)}
    >
      <rect x="5" y="6.5" width="22" height="21" rx="1.8" />
      <path d="M10 3.5v6M22 3.5v6M5 12h22" />
      <g fill="currentColor" stroke="none">
        <circle cx="10.5" cy="16.5" r="1.1" />
        <circle cx="16" cy="16.5" r="1.1" />
        <circle cx="21.5" cy="16.5" r="1.1" />
        <circle cx="10.5" cy="22" r="1.1" />
        <circle cx="16" cy="22" r="1.1" />
        <circle cx="21.5" cy="22" r="1.1" />
      </g>
    </svg>
  );
}

export function NavUserIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg
      className={className}
      {...lineIcon(size, "0 0 32 32", 1.68, 0.96)}
    >
      <circle cx="16" cy="9.3" r="5.2" />
      <path d="M5.2 27.2c.7-7.05 4.7-10.7 10.8-10.7s10.1 3.65 10.8 10.7H5.2Z" />
    </svg>
  );
}

/* Compatibilidade com componentes antigos. */
export function NavTrainingIcon(props: IconProps) {
  return <NavDumbbellIcon {...props} />;
}
