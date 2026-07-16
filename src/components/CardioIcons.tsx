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
    <svg className={className} {...strokeIcon(size, "0 0 24 24", 1.75)}>
      <path d="M13.5 3.5c.8 3.1-1.9 4.4-1.5 7.2.9-1.1 2.1-1.8 3.4-2.4 1.7 1.8 2.7 4 2.7 6.3a6.1 6.1 0 0 1-12.2 0c0-3.4 2-6.2 5.2-8.8-.2 2.2.4 3.6 1.1 4.5.9-2 1.9-3.5 1.3-6.8Z" />
    </svg>
  );
}

export function CardioPulseIcon({
  size = 24,
  className = "",
}: IconProps) {
  return (
    <svg className={className} {...strokeIcon(size, "0 0 24 24", 1.8)}>
      <path d="M2.5 12h4.1l2-5.1 3.2 10.2 2.6-7 1.8 1.9h5.3" />
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

/**
 * Compatibilidade com a tela Meu Treino.
 * O componente foi renomeado para CardioBackSwitchIcon na tela Cardio,
 * mas Treino.tsx ainda utiliza o nome CardioSwapIcon.
 */
export function CardioSwapIcon(props: IconProps) {
  return <CardioBackSwitchIcon {...props} />;
}
