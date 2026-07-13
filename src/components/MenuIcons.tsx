type IconProps = {
  size?: number;
  className?: string;
};

const lineIcon = (
  size: number,
  viewBox: string,
  strokeWidth: number,
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
  preserveAspectRatio: "xMidYMid meet",
});

/**
 * Ícones redesenhados à mão com base direta na arte-conceito aprovada.
 * Não usam biblioteca genérica: as proporções, cortes e espaços seguem
 * o desenho original do menu.
 */

export function MenuBellIcon({ size = 30, className = "" }: IconProps) {
  return (
    <svg
      className={className}
      {...lineIcon(size, "0 0 32 32", 1.62)}
    >
      <path d="M7.2 23.5h17.6c-1.45-1.5-2.1-3.3-2.1-5.65v-5.1c0-4.15-2.7-7.35-6.7-7.35s-6.7 3.2-6.7 7.35v5.1c0 2.35-.65 4.15-2.1 5.65Z" />
      <path d="M13.1 26.2c.6 1.15 1.55 1.75 2.9 1.75s2.3-.6 2.9-1.75" />
      <path d="M14.2 4.5c.35-1.05.95-1.55 1.8-1.55s1.45.5 1.8 1.55" />
    </svg>
  );
}

export function MenuShieldIcon({ size = 30, className = "" }: IconProps) {
  return (
    <svg
      className={className}
      {...lineIcon(size, "0 0 32 32", 1.88)}
    >
      <path d="M16 3.5 7.5 7v6.4c0 6 3.75 10.1 8.5 12.8 4.75-2.7 8.5-6.8 8.5-12.8V7L16 3.5Z" />
      <path d="m11.7 14.8 2.75 2.75 5.85-6" />
    </svg>
  );
}

export function MenuDumbbellIcon({ size = 42, className = "" }: IconProps) {
  return (
    <svg
      className={className}
      {...lineIcon(size, "0 0 48 48", 2.18)}
    >
      <rect x="11.2" y="11.5" width="7.2" height="25" rx="3.6" />
      <rect x="29.6" y="11.5" width="7.2" height="25" rx="3.6" />
      <path d="M18.4 19.4h11.2M18.4 28.6h11.2" />
      <path d="M7.5 16.3v15.4M40.5 16.3v15.4" />
      <path d="M4.8 21.2v5.6M43.2 21.2v5.6" />
    </svg>
  );
}

export function MenuAppleIcon({ size = 42, className = "" }: IconProps) {
  return (
    <svg
      className={className}
      {...lineIcon(size, "0 0 48 48", 2.18)}
    >
      <path d="M24 15.5c-4.8-4.2-14.2-3.25-15.65 6.2-1.4 9.1 4.15 18.7 11.2 16.25 2.75-.95 3.6-.95 6.35 0 7.05 2.45 12.6-7.15 11.2-16.25C35.65 12.25 28.8 11.3 24 15.5Z" />
      <path d="M24 15.25c-.35-4.65 1.25-8.1 5.1-10.55" />
      <path d="M25.2 10.4c4.3-4.25 8.3-4.25 11.65-3.45-1.2 4.7-4.5 7.25-9.45 6.3" />
    </svg>
  );
}

export function MenuRankingIcon({ size = 45, className = "" }: IconProps) {
  return (
    <svg
      className={className}
      {...lineIcon(size, "0 0 48 48", 2.05)}
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

export function MenuPersonalIcon({ size = 42, className = "" }: IconProps) {
  return (
    <svg
      className={className}
      {...lineIcon(size, "0 0 48 48", 2.16)}
    >
      <rect x="8.5" y="9.5" width="31" height="33" rx="2.3" />
      <rect x="18" y="5.5" width="12" height="7" rx="1.6" />
      <circle cx="24" cy="23.2" r="5" />
      <path d="M15.9 35.8c.7-5.15 3.4-8.1 8.1-8.1s7.4 2.95 8.1 8.1" />
    </svg>
  );
}

export function MenuBagIcon({ size = 42, className = "" }: IconProps) {
  return (
    <svg
      className={className}
      {...lineIcon(size, "0 0 48 48", 2.16)}
    >
      <path d="M10.1 18.2h27.8l2.25 23.25c.2 2.05-1.35 3.8-3.4 3.8h-25.5c-2.05 0-3.6-1.75-3.4-3.8l2.25-23.25Z" />
      <path d="M15.8 21.5V15c0-5.25 3.45-9 8.2-9s8.2 3.75 8.2 9v6.5" />
    </svg>
  );
}

export function MenuGearIcon({ size = 42, className = "" }: IconProps) {
  return (
    <svg
      className={className}
      {...lineIcon(size, "0 0 48 48", 2.08)}
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
      {...lineIcon(size, "0 0 32 32", 1.8)}
    >
      <path d="m11.2 6.5 9.5 9.5-9.5 9.5" />
    </svg>
  );
}

export function NavHomeIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg
      className={className}
      {...lineIcon(size, "0 0 32 32", 1.82)}
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
      {...lineIcon(size, "0 0 32 32", 1.72)}
    >
      <rect x="7.4" y="7.5" width="4.5" height="17" rx="2.25" />
      <rect x="20.1" y="7.5" width="4.5" height="17" rx="2.25" />
      <path d="M11.9 13h8.2M11.9 19h8.2" />
      <path d="M4.9 10.7v10.6M27.1 10.7v10.6" />
      <path d="M3 14v4M29 14v4" />
    </svg>
  );
}

export function NavCalendarIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg
      className={className}
      {...lineIcon(size, "0 0 32 32", 1.7)}
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
      {...lineIcon(size, "0 0 32 32", 1.72)}
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
