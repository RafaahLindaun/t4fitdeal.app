type IconProps = {
  size?: number;
  className?: string;
};

const iconBase = (size: number, viewBox = "0 0 24 24") => ({
  width: size,
  height: size,
  viewBox,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.35,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
});

export function MenuBellIcon({ size = 30, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size)}>
      <path d="M7 10a5 5 0 0 1 10 0v3.15c0 1.55.55 2.9 1.55 3.85H5.45C6.45 16.05 7 14.7 7 13.15V10Z" />
      <path d="M10 20h4" />
      <path d="M9.2 17.1h5.6" opacity=".7" />
    </svg>
  );
}

export function MenuShieldIcon({ size = 30, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size)}>
      <path d="M12 2.8 5 5.9v5.2c0 4.75 3.15 7.9 7 9.95 3.85-2.05 7-5.2 7-9.95V5.9L12 2.8Z" />
      <path d="m8.9 11.9 2 2 4.3-4.45" />
    </svg>
  );
}

export function MenuDumbbellIcon({ size = 42, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size)}>
      <path d="M7 7v10M17 7v10" />
      <path d="M4 9v6M20 9v6" />
      <path d="M2 10.5v3M22 10.5v3" />
      <path d="M7 12h10" />
    </svg>
  );
}

export function MenuAppleIcon({ size = 42, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size)}>
      <path d="M12.1 7.1c1.8-2.35 3.55-3 5.45-2.65" />
      <path d="M12.1 7.1C9.85 5.55 5 5.8 5 11.2c0 5.35 3.35 9.25 6.15 7.65.55-.3 1.15-.3 1.7 0C15.65 20.45 19 16.55 19 11.2c0-5.4-4.85-5.65-6.9-4.1Z" />
      <path d="M12.05 7.05c-.15-1.6.45-2.95 1.9-4" />
    </svg>
  );
}

export function MenuRankingIcon({ size = 45, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size, "0 0 32 32")}>
      <path d="M11 3.5h10v4.1a5 5 0 0 1-10 0V3.5Z" />
      <path d="M11 5.2H7.7v1.6a4.1 4.1 0 0 0 4.15 4.1" />
      <path d="M21 5.2h3.3v1.6a4.1 4.1 0 0 1-4.15 4.1" />
      <path d="M16 12.6v3.2" />
      <path d="M12.7 15.8h6.6" />
      <rect x="3.4" y="22" width="7" height="6.2" rx="1" />
      <rect x="12.5" y="18.7" width="7" height="9.5" rx="1" />
      <rect x="21.6" y="23.4" width="7" height="4.8" rx="1" />
      <path d="M6 25.8c.55-.7 1.95-.95 2.15-1.85.15-.65-.35-1.15-1.05-1.15-.65 0-1.15.35-1.45.8" strokeWidth="1.7" />
      <path d="M15.35 22h1.3v3.9" strokeWidth="1.7" />
      <path d="M24.1 25.1c.2-.75.75-1.15 1.5-1.15.9 0 1.45.45 1.45 1.05 0 .5-.35.85-.9.95.7.1 1.05.5 1.05 1.05 0 .7-.65 1.2-1.65 1.2-.8 0-1.4-.35-1.7-1" strokeWidth="1.7" />
    </svg>
  );
}

export function MenuPersonalIcon({ size = 42, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size)}>
      <rect x="4" y="3.2" width="16" height="17.6" rx="2.1" />
      <path d="M8.2 3.2V2h7.6v1.2" />
      <circle cx="12" cy="9" r="2.8" />
      <path d="M7.7 17.1a4.3 4.3 0 0 1 8.6 0" />
    </svg>
  );
}

export function MenuBagIcon({ size = 42, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size)}>
      <path d="M5.2 8h13.6l1 12.5H4.2L5.2 8Z" />
      <path d="M8.7 8V6.4a3.3 3.3 0 0 1 6.6 0V8" />
      <path d="M8.7 11.5v.1M15.3 11.5v.1" />
    </svg>
  );
}

export function MenuGearIcon({ size = 42, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size)}>
      <circle cx="12" cy="12" r="3.1" />
      <path d="M12 2.7v2.1M12 19.2v2.1M21.3 12h-2.1M4.8 12H2.7" />
      <path d="m18.55 5.45-1.5 1.5M6.95 17.05l-1.5 1.5M18.55 18.55l-1.5-1.5M6.95 6.95l-1.5-1.5" />
      <path d="M16.8 8.35a5.8 5.8 0 0 1 .85 3.05c0 3.2-2.6 5.8-5.8 5.8S6.05 14.6 6.05 11.4c0-1.1.3-2.15.85-3.05" />
    </svg>
  );
}

export function MenuArrowIcon({ size = 22, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size)}>
      <path d="m8.5 5.5 6.5 6.5-6.5 6.5" />
    </svg>
  );
}

export function NavHomeIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size)}>
      <path d="m3 10.4 9-7.2 9 7.2" />
      <path d="M5.2 9.8v10.7h13.6V9.8" />
      <path d="M9.2 20.5v-6.7h5.6v6.7" />
    </svg>
  );
}

export function NavCalendarIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size)}>
      <rect x="3.2" y="5" width="17.6" height="15.7" rx="2" />
      <path d="M7.2 2.8v4.4M16.8 2.8v4.4M3.2 9.8h17.6" />
      <path d="M8.1 13h.1M12 13h.1M15.9 13h.1M8.1 16.5h.1M12 16.5h.1" />
    </svg>
  );
}

export function NavUserIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size)}>
      <circle cx="12" cy="7.6" r="3.8" />
      <path d="M4.4 20.6a7.6 7.6 0 0 1 15.2 0" />
    </svg>
  );
}
