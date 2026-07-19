type IconProps = {
  size?: number;
  className?: string;
};

type VectorProps = {
  vectorEffect: "non-scaling-stroke";
};

const vector: VectorProps = {
  vectorEffect: "non-scaling-stroke",
};

const iconBase = (
  size: number,
  viewBox = "0 0 32 32",
  strokeWidth = 1.55,
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
 * Ícones do menu no padrão da imagem-conceito:
 * traço leve, cantos limpos, proporções equilibradas e sem preenchimento pesado.
 */

export function MenuBellIcon({ size = 30, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size, "0 0 24 24", 1.5)}>
      <path
        {...vector}
        d="M6.35 10.15a5.65 5.65 0 0 1 11.3 0v3.1c0 1.55.48 2.83 1.5 3.9H4.85c1.02-1.07 1.5-2.35 1.5-3.9v-3.1Z"
      />
      <path
        {...vector}
        d="M9.55 19.05c.48.92 1.3 1.45 2.45 1.45s1.97-.53 2.45-1.45"
      />
      <circle
        cx="18.9"
        cy="5.1"
        r="1.55"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

export function MenuShieldIcon({ size = 30, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size, "0 0 32 32", 1.55)}>
      <path
        {...vector}
        d="M16 3.7 6.8 7.45v6.75c0 6.25 3.9 10.72 9.2 13.45 5.3-2.73 9.2-7.2 9.2-13.45V7.45L16 3.7Z"
      />
      <path {...vector} d="m11.65 15.7 2.85 2.85 5.95-6.15" />
    </svg>
  );
}

export function MenuDumbbellIcon({ size = 42, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size, "0 0 32 32", 1.55)}>
      <path {...vector} d="M10.1 10.25v11.5M21.9 10.25v11.5" />
      <path {...vector} d="M6.7 12.45v7.1M25.3 12.45v7.1" />
      <path {...vector} d="M3.75 14.35v3.3M28.25 14.35v3.3" />
      <path {...vector} d="M10.1 16h11.8" />
    </svg>
  );
}

export function MenuAppleIcon({ size = 42, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size, "0 0 32 32", 1.55)}>
      <path
        {...vector}
        d="M16.15 10.2c2.05-2.4 4.28-3.32 6.72-2.92"
      />
      <path
        {...vector}
        d="M16.05 10.3c-3.02-2.12-9.17-1.5-9.17 5.48 0 6.42 3.95 11.38 7.48 9.45.95-.52 2.33-.52 3.28 0 3.53 1.93 7.48-3.03 7.48-9.45 0-6.98-6.15-7.6-9.07-5.48Z"
      />
      <path
        {...vector}
        d="M16.08 10.08c-.12-2.25.83-4.08 2.72-5.35"
      />
    </svg>
  );
}

export function MenuRankingIcon({ size = 45, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size, "0 0 40 40", 1.5)}>
      <path
        {...vector}
        d="M14.2 4.75h11.6v4.5a5.8 5.8 0 0 1-11.6 0v-4.5Z"
      />
      <path
        {...vector}
        d="M14.2 6.6H9.7v1.65c0 2.82 1.88 4.9 4.78 5.18"
      />
      <path
        {...vector}
        d="M25.8 6.6h4.5v1.65c0 2.82-1.88 4.9-4.78 5.18"
      />
      <path {...vector} d="M20 15.2v4.1M16.9 19.3h6.2" />

      <rect
        {...vector}
        x="4.35"
        y="27.15"
        width="9.4"
        height="8.4"
        rx="1.15"
      />
      <rect
        {...vector}
        x="15.3"
        y="23.9"
        width="9.4"
        height="11.65"
        rx="1.15"
      />
      <rect
        {...vector}
        x="26.25"
        y="28.75"
        width="9.4"
        height="6.8"
        rx="1.15"
      />

      <text
        x="9.05"
        y="33.15"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="4.8"
        fontWeight="700"
        fill="currentColor"
        stroke="none"
      >
        2
      </text>
      <text
        x="20"
        y="31.75"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="4.8"
        fontWeight="700"
        fill="currentColor"
        stroke="none"
      >
        1
      </text>
      <text
        x="30.95"
        y="33.45"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="4.8"
        fontWeight="700"
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
    <svg className={className} {...iconBase(size, "0 0 32 32", 1.55)}>
      <rect
        {...vector}
        x="7.2"
        y="5.35"
        width="17.6"
        height="22"
        rx="2.1"
      />
      <rect
        {...vector}
        x="12.15"
        y="3.25"
        width="7.7"
        height="4.1"
        rx="1.15"
      />
      <circle {...vector} cx="16" cy="14.15" r="3" />
      <path {...vector} d="M11.35 22.65a4.65 4.65 0 0 1 9.3 0" />
    </svg>
  );
}

export function MenuBagIcon({ size = 42, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size, "0 0 32 32", 1.55)}>
      <path
        {...vector}
        d="M7.15 11.15h17.7l1.35 16H5.8l1.35-16Z"
      />
      <path
        {...vector}
        d="M11.35 11.15V8.6a4.65 4.65 0 0 1 9.3 0v2.55"
      />
    </svg>
  );
}

export function MenuGearIcon({ size = 42, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size, "0 0 32 32", 1.45)}>
      <path
        {...vector}
        d="M18.05 3.8h-4.1l-.7 3.18a10.45 10.45 0 0 0-2.08.86L8.42 6.1 5.5 9.02l1.75 2.75c-.38.66-.67 1.35-.87 2.08l-3.18.7v4.1l3.18.7c.2.73.49 1.42.87 2.08L5.5 24.18l2.92 2.92 2.75-1.75c.66.38 1.35.67 2.08.87l.7 3.18h4.1l.7-3.18c.73-.2 1.42-.49 2.08-.87l2.75 1.75 2.92-2.92-1.75-2.75c.38-.66.67-1.35.87-2.08l3.18-.7v-4.1l-3.18-.7a10.45 10.45 0 0 0-.87-2.08l1.75-2.75-2.92-2.92-2.75 1.74a10.45 10.45 0 0 0-2.08-.86l-.7-3.18Z"
      />
      <circle {...vector} cx="16" cy="16.6" r="4.35" />
    </svg>
  );
}

export function MenuArrowIcon({ size = 22, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size, "0 0 24 24", 1.45)}>
      <path {...vector} d="m9.25 5.7 6.15 6.3-6.15 6.3" />
    </svg>
  );
}

export function NavHomeIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size, "0 0 24 24", 1.45)}>
      <path {...vector} d="m3.65 10.25 8.35-6.9 8.35 6.9" />
      <path {...vector} d="M5.45 9.85v10.1h13.1V9.85" />
      <path {...vector} d="M9.3 19.95v-6.2h5.4v6.2" />
    </svg>
  );
}

export function NavCalendarIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size, "0 0 24 24", 1.4)}>
      <rect
        {...vector}
        x="3.5"
        y="5.2"
        width="17"
        height="15.1"
        rx="1.8"
      />
      <path {...vector} d="M7.35 3v4.05M16.65 3v4.05M3.5 9.55h17" />
      <circle cx="8" cy="13" r=".65" fill="currentColor" stroke="none" />
      <circle cx="12" cy="13" r=".65" fill="currentColor" stroke="none" />
      <circle cx="16" cy="13" r=".65" fill="currentColor" stroke="none" />
      <circle cx="8" cy="16.55" r=".65" fill="currentColor" stroke="none" />
      <circle cx="12" cy="16.55" r=".65" fill="currentColor" stroke="none" />
      <circle cx="16" cy="16.55" r=".65" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function NavUserIcon({ size = 24, className = "" }: IconProps) {
  return (
    <svg className={className} {...iconBase(size, "0 0 24 24", 1.45)}>
      <circle {...vector} cx="12" cy="7.45" r="3.45" />
      <path {...vector} d="M4.75 20.35a7.25 7.25 0 0 1 14.5 0" />
    </svg>
  );
}
