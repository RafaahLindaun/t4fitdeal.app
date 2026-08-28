type IconProps = {
  size?: number;
  className?: string;
};

const symbolProps = (
  size: number,
  strokeWidth = 2.15,
) => ({
  width: size,
  height: size,
  viewBox: "0 0 48 48",
  fill: "none",
  stroke: "currentColor",
  strokeWidth,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  preserveAspectRatio: "xMidYMid meet",
  "aria-hidden": true,
  focusable: false,
});

const utilityProps = (
  size: number,
  viewBox = "0 0 24 24",
  strokeWidth = 1.72,
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
 * Sistema próprio de ícones da Home.
 * Todos usam a mesma malha de 48 × 48, peso óptico e margens internas.
 * O resultado é consistente em celulares pequenos sem depender de imagens.
 */
export function MenuDumbbellIcon({ size = 48, className = "" }: IconProps) {
  return (
    <svg className={className} {...symbolProps(size)}>
      <rect x="3.8" y="18.2" width="4.7" height="11.6" rx="1.65" fill="currentColor" opacity=".14" stroke="none" />
      <rect x="9.6" y="14.8" width="6.2" height="18.4" rx="1.9" fill="currentColor" opacity=".1" stroke="none" />
      <rect x="32.2" y="14.8" width="6.2" height="18.4" rx="1.9" fill="currentColor" opacity=".1" stroke="none" />
      <rect x="39.5" y="18.2" width="4.7" height="11.6" rx="1.65" fill="currentColor" opacity=".14" stroke="none" />
      <path d="M6.15 18.55v10.9" />
      <path d="M12.7 15.25v17.5" />
      <path d="M15.8 24h16.4" />
      <path d="M35.3 15.25v17.5" />
      <path d="M41.85 18.55v10.9" />
      <path d="M20.2 21.5v5" opacity=".72" />
      <path d="M27.8 21.5v5" opacity=".72" />
    </svg>
  );
}

export function MenuAppleIcon({ size = 48, className = "" }: IconProps) {
  return (
    <svg className={className} {...symbolProps(size, 2.1)}>
      <path
        d="M24.2 16.2c-3.25-2.45-8.15-1.9-11.05.75-5.2 4.75-3.65 17.75 3.6 23.05 2.15 1.58 4.45 1.35 6.05.62.78-.36 1.62-.36 2.4 0 1.6.73 3.9.96 6.05-.62 7.25-5.3 8.8-18.3 3.6-23.05-2.9-2.65-7.8-3.2-10.65-.75Z"
        fill="currentColor"
        opacity=".08"
      />
      <path d="M24.2 16.2c-3.25-2.45-8.15-1.9-11.05.75-5.2 4.75-3.65 17.75 3.6 23.05 2.15 1.58 4.45 1.35 6.05.62.78-.36 1.62-.36 2.4 0 1.6.73 3.9.96 6.05-.62 7.25-5.3 8.8-18.3 3.6-23.05-2.9-2.65-7.8-3.2-10.65-.75Z" />
      <path d="M24.1 16c-.15-3.85 1.35-6.7 4.25-8.65" />
      <path d="M27.7 10.3c3.25-2.45 6.15-2.8 8.8-1.15-1.65 2.9-4.4 4.3-8.8 4.15" fill="currentColor" opacity=".12" />
      <path d="M27.7 10.3c3.25-2.45 6.15-2.8 8.8-1.15-1.65 2.9-4.4 4.3-8.8 4.15" />
      <path d="M15.8 23.1c-1.4 2.15-1.7 4.55-.9 7.2" opacity=".65" />
    </svg>
  );
}

export function MenuRankingIcon({ size = 48, className = "" }: IconProps) {
  return (
    <svg className={className} {...symbolProps(size, 2.05)}>
      <path d="M15.8 7.2h16.4v6.05c0 5-3.55 8.65-8.2 8.65s-8.2-3.65-8.2-8.65V7.2Z" fill="currentColor" opacity=".08" />
      <path d="M15.8 7.2h16.4v6.05c0 5-3.55 8.65-8.2 8.65s-8.2-3.65-8.2-8.65V7.2Z" />
      <path d="M15.8 10.15h-5.2v2.3c0 4.15 2.75 7.15 6.85 7.5" />
      <path d="M32.2 10.15h5.2v2.3c0 4.15-2.75 7.15-6.85 7.5" />
      <path d="m24 10.7 1.2 2.45 2.7.4-1.95 1.9.45 2.7-2.4-1.25-2.4 1.25.45-2.7-1.95-1.9 2.7-.4L24 10.7Z" fill="currentColor" opacity=".78" stroke="none" />
      <path d="M24 22v7" />
      <path d="M18.7 29h10.6" />
      <path d="M16.4 34.2h15.2v6.6H16.4z" fill="currentColor" opacity=".09" />
      <path d="M16.4 34.2h15.2v6.6H16.4z" />
    </svg>
  );
}

export function MenuBagIcon({ size = 48, className = "" }: IconProps) {
  return (
    <svg className={className} {...symbolProps(size, 2.05)}>
      <path d="M11.7 17.5h24.6l-1.9 23H13.6l-1.9-23Z" fill="currentColor" opacity=".08" />
      <path d="M11.7 17.5h24.6l-1.9 23H13.6l-1.9-23Z" />
      <path d="M17.3 17.5v-2.6a6.7 6.7 0 0 1 13.4 0v2.6" />
      <path d="M18.2 24.8h11.6" opacity=".72" />
      <path d="M18.2 30.1h7.6" opacity=".72" />
      <circle cx="31.2" cy="30.1" r="1.25" fill="currentColor" opacity=".85" stroke="none" />
    </svg>
  );
}

export function MenuGearIcon({ size = 48, className = "" }: IconProps) {
  const gearPath =
    "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.09a2 2 0 0 1 1 1.73v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.73l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z";

  return (
    <svg className={className} {...symbolProps(size, 1.95)}>
      <g transform="scale(2)">
        <path d={gearPath} fill="currentColor" opacity=".08" stroke="none" />
        <path d={gearPath} />
        <circle cx="12" cy="12" r="3" fill="currentColor" opacity=".1" />
        <circle cx="12" cy="12" r="3" />
      </g>
    </svg>
  );
}

// Mantido por compatibilidade com versões anteriores do menu.
export function MenuPersonalIcon({ size = 48, className = "" }: IconProps) {
  return (
    <svg className={className} {...symbolProps(size, 2.05)}>
      <rect x="12" y="9" width="24" height="31" rx="4" />
      <path d="M19 9V6.8h10V9" />
      <circle cx="24" cy="20" r="4" />
      <path d="M17.5 33a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}

export function MenuBellIcon({ size = 30, className = "" }: IconProps) {
  return (
    <svg className={className} {...utilityProps(size)}>
      <path d="M6.6 10.1a5.4 5.4 0 0 1 10.8 0v3.15c0 1.55.5 2.85 1.55 3.85H5.05c1.05-1 1.55-2.3 1.55-3.85V10.1Z" />
      <path d="M9.65 19.1c.48.95 1.25 1.45 2.35 1.45s1.87-.5 2.35-1.45" />
    </svg>
  );
}

export function MenuShieldIcon({ size = 30, className = "" }: IconProps) {
  return (
    <svg className={className} {...utilityProps(size, "0 0 24 24", 1.75)}>
      <path d="M12 2.75 5.1 5.8v5.15c0 4.65 3.05 7.8 6.9 9.85 3.85-2.05 6.9-5.2 6.9-9.85V5.8L12 2.75Z" />
      <path d="m8.85 11.95 2.05 2.05 4.25-4.4" />
    </svg>
  );
}


export function MenuPhoneIcon({ size = 18, className = "" }: IconProps) {
  return (
    <svg className={className} {...utilityProps(size, "0 0 24 24", 1.8)}>
      <rect x="6.7" y="2.6" width="10.6" height="18.8" rx="2.2" />
      <path d="M10.2 5.4h3.6M10.4 18.4h3.2" />
    </svg>
  );
}

export function MenuArrowIcon({ size = 22, className = "" }: IconProps) {
  return (
    <svg className={className} {...utilityProps(size, "0 0 24 24", 1.55)}>
      <path d="m9 5.8 6.2 6.2L9 18.2" />
    </svg>
  );
}

export function NavHomeIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg className={className} {...utilityProps(size)}>
      <path d="m3.5 10.35 8.5-7 8.5 7" />
      <path d="M5.35 9.8v10.3h13.3V9.8" />
      <path d="M9.2 20.1v-6.35h5.6v6.35" />
    </svg>
  );
}

export function NavCalendarIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg className={className} {...utilityProps(size, "0 0 24 24", 1.65)}>
      <rect x="3.4" y="5.2" width="17.2" height="15.2" rx="1.8" />
      <path d="M7.3 3v4.1M16.7 3v4.1M3.4 9.6h17.2" />
      <path d="M8 13h.01M12 13h.01M16 13h.01M8 16.4h.01M12 16.4h.01M16 16.4h.01" />
    </svg>
  );
}

export function NavUserIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg className={className} {...utilityProps(size)}>
      <circle cx="12" cy="7.5" r="3.6" />
      <path d="M4.6 20.4a7.4 7.4 0 0 1 14.8 0" />
    </svg>
  );
}
