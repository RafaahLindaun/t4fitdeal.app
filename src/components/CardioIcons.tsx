type IconProps = {
  size?: number;
  className?: string;
};

function strokeIcon(
  size: number,
  viewBox = "0 0 24 24",
  strokeWidth = 1.85,
) {
  return {
    width: size,
    height: size,
    viewBox,
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
}

export function CardioBackSwitchIcon({
  size = 22,
  className = "",
}: IconProps) {
  return (
    <svg className={className} {...strokeIcon(size)}>
      <path d="M4.5 7.4h11.2" />
      <path d="m13.1 4.8 2.7 2.6-2.7 2.7" />
      <path d="M19.5 16.6H8.3" />
      <path d="m10.9 13.9-2.7 2.7 2.7 2.6" />
    </svg>
  );
}

export function CardioHistoryIcon({
  size = 22,
  className = "",
}: IconProps) {
  return (
    <svg className={className} {...strokeIcon(size, "0 0 24 24", 1.8)}>
      <path d="M4.2 8.4A8.2 8.2 0 1 1 4 15.1" />
      <path d="M4.2 4.2v4.4h4.4" />
      <path d="M12 7.5v4.9l3.1 1.8" />
    </svg>
  );
}

export function CardioFlameIcon({
  size = 24,
  className = "",
}: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        opacity=".28"
        d="M12 22a7.15 7.15 0 0 1-7.15-7.15c0-3.72 2.16-6.56 6.3-9.9-.18 2.2.44 3.66 1.28 4.63 1.1-2.17 2.04-3.92 1.15-7.58 3.18 2.66 5.58 6.42 5.58 10.24A7.15 7.15 0 0 1 12 22Z"
      />
      <path
        fill="currentColor"
        d="M12.26 20.15a5.2 5.2 0 0 1-5.18-5.2c0-2.55 1.32-4.66 4.02-7.08.08 1.82.68 3.06 1.66 3.96 1.04-1.45 1.62-2.85 1.3-5.2 2.1 1.94 3.12 4.42 3.12 7.05a4.92 4.92 0 0 1-4.92 6.47Z"
      />
      <path
        fill="#06152c"
        opacity=".42"
        d="M12.1 18.3a2.75 2.75 0 0 1-2.75-2.75c0-1.42.75-2.48 2.08-3.7.16 1.02.55 1.72 1.12 2.23.57-.72.84-1.44.72-2.58 1.13 1.05 1.68 2.3 1.68 3.55a2.85 2.85 0 0 1-2.85 3.25Z"
      />
    </svg>
  );
}

export function CardioPulseIcon({
  size = 24,
  className = "",
}: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 12h3.85l1.78-4.65 3.25 10.08 2.52-7.18 1.82 1.75H21"
        stroke="currentColor"
        strokeWidth="2.15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="6.85" cy="12" r="1.15" fill="currentColor" opacity=".9" />
      <circle cx="16.22" cy="12" r="1.15" fill="currentColor" opacity=".9" />
    </svg>
  );
}

export function CardioClockIcon({
  size = 23,
  className = "",
}: IconProps) {
  return (
    <svg className={className} {...strokeIcon(size, "0 0 24 24", 1.85)}>
      <circle cx="12" cy="12" r="8.3" />
      <path d="M12 7.4v5l3.4 2" />
    </svg>
  );
}

export function CardioPlayIcon({
  size = 24,
  className = "",
}: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M7.4 4.7v14.6L18.8 12 7.4 4.7Z" />
    </svg>
  );
}

export function CardioPauseIcon({
  size = 23,
  className = "",
}: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="6.1" y="4.8" width="4.2" height="14.4" rx="1.1" />
      <rect x="13.7" y="4.8" width="4.2" height="14.4" rx="1.1" />
    </svg>
  );
}

export function CardioStopIcon({
  size = 21,
  className = "",
}: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="5.7" y="5.7" width="12.6" height="12.6" rx="2.4" />
    </svg>
  );
}

export function CardioPlusIcon({
  size = 21,
  className = "",
}: IconProps) {
  return (
    <svg className={className} {...strokeIcon(size, "0 0 24 24", 2.1)}>
      <path d="M12 6v12M6 12h12" />
    </svg>
  );
}

export function CardioMinusIcon({
  size = 21,
  className = "",
}: IconProps) {
  return (
    <svg className={className} {...strokeIcon(size, "0 0 24 24", 2.1)}>
      <path d="M6 12h12" />
    </svg>
  );
}

export function CardioCheckIcon({
  size = 22,
  className = "",
}: IconProps) {
  return (
    <svg className={className} {...strokeIcon(size, "0 0 24 24", 2.2)}>
      <path d="m5.2 12.5 4.1 4.1 9.3-9.3" />
    </svg>
  );
}

export function CardioSettingsIcon({
  size = 21,
  className = "",
}: IconProps) {
  return (
    <svg className={className} {...strokeIcon(size, "0 0 24 24", 1.75)}>
      <path d="M4 7h10" />
      <circle cx="17" cy="7" r="2.2" />
      <path d="M20 17H10" />
      <circle cx="7" cy="17" r="2.2" />
    </svg>
  );
}

export function CardioGoalIcon({
  size = 22,
  className = "",
}: IconProps) {
  return (
    <svg className={className} {...strokeIcon(size, "0 0 24 24", 1.75)}>
      <circle cx="12" cy="12" r="8.3" />
      <circle cx="12" cy="12" r="4.3" />
      <path d="m15.1 8.9 4-4M15.2 4.9h3.9v3.9" />
    </svg>
  );
}

export function CardioMenuIcon({
  size = 22,
  className = "",
}: IconProps) {
  return (
    <svg className={className} {...strokeIcon(size, "0 0 24 24", 1.8)}>
      <path d="M4 19.5V10.4l8-6.2 8 6.2v9.1" />
      <path d="M9.4 19.5v-6h5.2v6" />
    </svg>
  );
}

export function CardioDumbbellIcon({
  size = 22,
  className = "",
}: IconProps) {
  return (
    <svg className={className} {...strokeIcon(size, "0 0 24 24", 1.8)}>
      <path d="M6.2 8.2v7.6M3.8 9.8v4.4M17.8 8.2v7.6M20.2 9.8v4.4M6.2 12h11.6" />
    </svg>
  );
}

export function CardioTrophyIcon({
  size = 22,
  className = "",
}: IconProps) {
  return (
    <svg className={className} {...strokeIcon(size, "0 0 24 24", 1.8)}>
      <path d="M8 4.5h8v4.2a4 4 0 0 1-8 0V4.5Z" />
      <path d="M8 6.2H5.2v1.4A3.1 3.1 0 0 0 8.4 10M16 6.2h2.8v1.4a3.1 3.1 0 0 1-3.2 2.4M12 13v3.4M8.8 19.5h6.4M10 16.4h4" />
    </svg>
  );
}

export function CardioUserIcon({
  size = 22,
  className = "",
}: IconProps) {
  return (
    <svg className={className} {...strokeIcon(size, "0 0 24 24", 1.8)}>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5.2 19.5a6.8 6.8 0 0 1 13.6 0" />
    </svg>
  );
}

/**
 * Compatibilidade com a tela Meu Treino.
 * Treino.tsx ainda importa CardioSwapIcon.
 */
export function CardioSwapIcon(props: IconProps) {
  return <CardioBackSwitchIcon {...props} />;
}
