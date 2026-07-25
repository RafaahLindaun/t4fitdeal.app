type IconProps = {
  size?: number;
  className?: string;
};

const iconBase = (
  size: number,
  viewBox = "0 0 24 24",
  strokeWidth = 1.78,
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
 * Ícones redesenhados para seguir o conceito aprovado:
 * linhas limpas, espessura intermediária e proporções mais elegantes.
 * Nenhum deles usa preenchimento grosso ou traço "borrachudo".
 */

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

export function MenuDumbbellIcon({ size = 42, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size, "0 0 24 24", 1.82)}>
      <path d="M7.4 7.4v9.2M16.6 7.4v9.2" />
      <path d="M4.45 9.05v5.9M19.55 9.05v5.9" />
      <path d="M2.25 10.45v3.1M21.75 10.45v3.1" />
      <path d="M7.4 12h9.2" />
    </svg>
  );
}

export function MenuAppleIcon({ size = 42, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size, "0 0 24 24", 1.8)}>
      <path d="M12.05 7.25c1.45-2.05 3.2-2.85 5.05-2.5" />
      <path d="M12.05 7.25c-2.25-1.55-6.95-1.25-6.95 4.05 0 5.25 3.25 9 6 7.45.58-.32 1.22-.32 1.8 0 2.75 1.55 6-2.2 6-7.45 0-5.3-4.7-5.6-6.85-4.05Z" />
      <path d="M12.05 7.15c-.12-1.55.45-2.85 1.8-3.85" />
    </svg>
  );
}

export function MenuRankingIcon({ size = 45, className = "" }: IconProps) {
  return (
    <svg
      className={className}
      {...iconBase(size, "0 0 48 48", 2.15)}
    >
      {/* troféu */}
      <path d="M17 5.5h14v5.7a7 7 0 0 1-14 0V5.5Z" />
      <path d="M17 8H11.5v2.2c0 3.45 2.4 6.1 5.95 6.45" />
      <path d="M31 8h5.5v2.2c0 3.45-2.4 6.1-5.95 6.45" />
      <path d="M24 18.2v5.1" />
      <path d="M20.2 23.3h7.6" />

      {/* pódio 2 - 1 - 3 */}
      <rect x="4.5" y="31.2" width="12" height="11.3" rx="1.4" />
      <rect x="18" y="27.2" width="12" height="15.3" rx="1.4" />
      <rect x="31.5" y="33.4" width="12" height="9.1" rx="1.4" />

      <text
        x="10.5"
        y="39.2"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="6.6"
        fontWeight="800"
        fill="currentColor"
        stroke="none"
      >
        2
      </text>
      <text
        x="24"
        y="36.7"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="6.6"
        fontWeight="800"
        fill="currentColor"
        stroke="none"
      >
        1
      </text>
      <text
        x="37.5"
        y="40.4"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="6.6"
        fontWeight="800"
        fill="currentColor"
        stroke="none"
      >
        3
      </text>
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

export function MenuBagIcon({ size = 42, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size, "0 0 24 24", 1.8)}>
      <path d="M5.25 8.25h13.5l1 12H4.25l1-12Z" />
      <path d="M8.55 8.25V6.45a3.45 3.45 0 0 1 6.9 0v1.8" />
    </svg>
  );
}

export function MenuGearIcon({ size = 42, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size, "0 0 24 24", 1.68)}>
      <path d="M12.2 2.5h-.4a1.8 1.8 0 0 0-1.8 1.8v.2a1.8 1.8 0 0 1-.9 1.55l-.45.25a1.8 1.8 0 0 1-1.8 0l-.15-.1a1.8 1.8 0 0 0-2.45.65l-.2.35a1.8 1.8 0 0 0 .65 2.45l.15.1a1.8 1.8 0 0 1 .9 1.55v.5a1.8 1.8 0 0 1-.9 1.55l-.15.1a1.8 1.8 0 0 0-.65 2.45l.2.35a1.8 1.8 0 0 0 2.45.65l.15-.1a1.8 1.8 0 0 1 1.8 0l.45.25a1.8 1.8 0 0 1 .9 1.55v.2a1.8 1.8 0 0 0 1.8 1.8h.4a1.8 1.8 0 0 0 1.8-1.8v-.2a1.8 1.8 0 0 1 .9-1.55l.45-.25a1.8 1.8 0 0 1 1.8 0l.15.1a1.8 1.8 0 0 0 2.45-.65l.2-.35a1.8 1.8 0 0 0-.65-2.45l-.15-.1a1.8 1.8 0 0 1-.9-1.55v-.5a1.8 1.8 0 0 1 .9-1.55l.15-.1a1.8 1.8 0 0 0 .65-2.45l-.2-.35a1.8 1.8 0 0 0-2.45-.65l-.15.1a1.8 1.8 0 0 1-1.8 0l-.45-.25A1.8 1.8 0 0 1 14 4.5v-.2a1.8 1.8 0 0 0-1.8-1.8Z" />
      <circle cx="12" cy="12" r="3" />
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
