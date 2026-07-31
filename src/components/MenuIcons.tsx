type IconProps = {
  size?: number;
  className?: string;
};

const iconBase = (
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

export function MenuBellIcon({ size = 30, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size, "0 0 24 24", 1.72)}>
      <path d="M6.6 10.1a5.4 5.4 0 0 1 10.8 0v3.15c0 1.55.5 2.85 1.55 3.85H5.05c1.05-1 1.55-2.3 1.55-3.85V10.1Z" />
      <path d="M9.65 19.1c.48.95 1.25 1.45 2.35 1.45s1.87-.5 2.35-1.45" />
    </svg>
  );
}

export function MenuShieldIcon({ size = 30, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size, "0 0 24 24", 1.75)}>
      <path d="M12 2.75 5.1 5.8v5.15c0 4.65 3.05 7.8 6.9 9.85 3.85-2.05 6.9-5.2 6.9-9.85V5.8L12 2.75Z" />
      <path d="m8.85 11.95 2.05 2.05 4.25-4.4" />
    </svg>
  );
}

export function MenuDumbbellIcon({ size = 44, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size, "0 0 48 48", 2.15)}>
      <rect x="5.4" y="17.2" width="3.8" height="13.6" rx="1.1" fill="currentColor" opacity=".16" stroke="none" />
      <rect x="10.5" y="14.4" width="4.8" height="19.2" rx="1.2" fill="currentColor" opacity=".12" stroke="none" />
      <rect x="32.7" y="14.4" width="4.8" height="19.2" rx="1.2" fill="currentColor" opacity=".12" stroke="none" />
      <rect x="38.8" y="17.2" width="3.8" height="13.6" rx="1.1" fill="currentColor" opacity=".16" stroke="none" />
      <path d="M7.3 18.1v11.8" />
      <path d="M12.9 14.8v18.4" />
      <path d="M18.2 21.3h11.6" />
      <path d="M35.1 14.8v18.4" />
      <path d="M40.7 18.1v11.8" />
      <path d="M18.2 18.7v5.2" />
      <path d="M29.8 18.7v5.2" />
      <path d="M18.2 24.9v4.4" />
      <path d="M29.8 24.9v4.4" />
    </svg>
  );
}

export function MenuAppleIcon({ size = 44, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size, "0 0 48 48", 2.05)}>
      <path d="M25.1 11.5c1.7-3.4 4.9-5.7 8.5-5.8-1.2 3.5-3.6 5.8-7 6.8" />
      <path d="M24.2 14.4c-3.3-2.3-8.2-1.5-10.8 1-4.8 4.7-3.2 17.9 3.7 23.3 2.1 1.7 4.3 1.5 5.9.8 1-.5 2.1-.5 3.1 0 1.6.7 3.8.9 5.9-.8 5.4-4.3 8.2-14.8 4.8-20.7-1.2-2.1-3.8-4-7.3-4-1.7 0-3.3.4-5.3 1.5Z" />
      <path d="M24.1 14.2c-.3-2.5.3-4.7 1.8-6.7" />
      <path d="M18.2 21.4c-1.7 1.9-2.6 4.1-2.6 6.9" opacity=".72" />
      <path d="M31.5 21.3c1.5 1.8 2.3 3.9 2.3 6.4" opacity=".72" />
    </svg>
  );
}

export function MenuRankingIcon({ size = 46, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size, "0 0 48 48", 2.05)}>
      <path d="M18.2 6.8h11.6v4.5a5.8 5.8 0 0 1-11.6 0V6.8Z" />
      <path d="M18.2 9.3h-4.5v1.5c0 2.6 1.7 4.8 4.3 5.3" />
      <path d="M29.8 9.3h4.5v1.5c0 2.6-1.7 4.8-4.3 5.3" />
      <path d="M24 17.4v5" />
      <path d="M20 22.4h8" />
      <path d="M16.7 26.6h14.6" />
      <path d="M10 31.3h8.6v9.8H10z" fill="currentColor" opacity=".1" stroke="currentColor" />
      <path d="M19.7 26.7h8.6v14.4h-8.6z" fill="currentColor" opacity=".14" stroke="currentColor" />
      <path d="M29.3 33.8h8.7v7.3h-8.7z" fill="currentColor" opacity=".08" stroke="currentColor" />
      <path d="M12.7 36.3h3.1" />
      <path d="M22.5 33.3h3.1" />
      <path d="M32.2 37.3h2.9" />
    </svg>
  );
}

export function MenuPersonalIcon({ size = 42, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size, "0 0 24 24", 1.78)}>
      <rect x="5" y="4.2" width="14" height="16.4" rx="1.75" />
      <rect x="9" y="2.5" width="6" height="3.5" rx="1" />
      <circle cx="12" cy="10.6" r="2.25" />
      <path d="M8.45 17.35a3.55 3.55 0 0 1 7.1 0" />
    </svg>
  );
}

export function MenuBagIcon({ size = 44, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size, "0 0 48 48", 2.05)}>
      <path d="M13.2 18.8h21.6l-1.8 20.4H15z" fill="currentColor" opacity=".08" stroke="currentColor" />
      <path d="M17.1 18.8v-2.7a6.9 6.9 0 0 1 13.8 0v2.7" />
      <path d="M19.7 24.8v7.8" />
      <path d="M28.3 24.8v7.8" />
      <path d="M17.2 27.2h13.6" opacity=".52" />
      <path d="M15.5 18.8h17" />
    </svg>
  );
}

export function MenuGearIcon({ size = 44, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size, "0 0 48 48", 2.05)}>
      <circle cx="24" cy="24" r="5.1" fill="currentColor" opacity=".12" stroke="currentColor" />
      <path d="M24 7.5v4.2" />
      <path d="M24 36.3v4.2" />
      <path d="M40.5 24h-4.2" />
      <path d="M11.7 24H7.5" />
      <path d="m35.7 12.3-2.9 2.9" />
      <path d="m15.2 32.8-2.9 2.9" />
      <path d="m35.7 35.7-2.9-2.9" />
      <path d="m15.2 15.2-2.9-2.9" />
      <path d="M24 14.1a9.9 9.9 0 1 1 0 19.8 9.9 9.9 0 0 1 0-19.8Z" />
      <path d="M24 20.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z" />
    </svg>
  );
}

export function MenuArrowIcon({ size = 22, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size, "0 0 24 24", 1.55)}>
      <path d="m9 5.8 6.2 6.2L9 18.2" />
    </svg>
  );
}

export function NavHomeIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size, "0 0 24 24", 1.72)}>
      <path d="m3.5 10.35 8.5-7 8.5 7" />
      <path d="M5.35 9.8v10.3h13.3V9.8" />
      <path d="M9.2 20.1v-6.35h5.6v6.35" />
    </svg>
  );
}

export function NavCalendarIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size, "0 0 24 24", 1.65)}>
      <rect x="3.4" y="5.2" width="17.2" height="15.2" rx="1.8" />
      <path d="M7.3 3v4.1M16.7 3v4.1M3.4 9.6h17.2" />
      <path d="M8 13h.01M12 13h.01M16 13h.01M8 16.4h.01M12 16.4h.01M16 16.4h.01" />
    </svg>
  );
}

export function NavUserIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size, "0 0 24 24", 1.72)}>
      <circle cx="12" cy="7.5" r="3.6" />
      <path d="M4.6 20.4a7.4 7.4 0 0 1 14.8 0" />
    </svg>
  );
}
