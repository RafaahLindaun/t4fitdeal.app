type CardioIconProps = {
  size?: number;
  className?: string;
};

function strokeProps(
  size: number,
  viewBox = "0 0 32 32",
  strokeWidth = 1.8,
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

export function CardioSwapIcon({
  size = 23,
  className = "",
}: CardioIconProps) {
  return (
    <svg className={className} {...strokeProps(size, "0 0 24 24", 1.9)}>
      <path d="M4 7.4h12" />
      <path d="m13.3 4.7 2.8 2.7-2.8 2.8" />
      <path d="M20 16.6H8" />
      <path d="m10.7 13.8-2.8 2.8 2.8 2.7" />
    </svg>
  );
}

export function CardioTreadmillIcon({
  size = 34,
  className = "",
}: CardioIconProps) {
  return (
    <svg className={className} {...strokeProps(size)}>
      <circle cx="18.8" cy="5.4" r="2.3" />
      <path d="m16.9 9.4 4.1 2.2 2.2 4.3" />
      <path d="m20.9 11.7-4.4 5.4-4.9 1.4" />
      <path d="m16.5 17.1 4.3 4.3 3.7 1.4" />
      <path d="m13.6 12 2.9 5.1" />
      <path d="M4.2 24.3h22.5l-2.4 3H7l-2.8-3Z" />
      <path d="M25.7 8h2v16.3" />
      <path d="M22.6 8h5.1" />
    </svg>
  );
}

export function CardioBikeIcon({
  size = 34,
  className = "",
}: CardioIconProps) {
  return (
    <svg className={className} {...strokeProps(size)}>
      <circle cx="8" cy="23.2" r="5.1" />
      <circle cx="24.1" cy="23.2" r="5.1" />
      <path d="m8 23.2 6.1-9.3h5.2l4.8 9.3" />
      <path d="m14.1 13.9 4.4 9.3H8" />
      <path d="M12.2 10.2h5.1" />
      <path d="M21.3 9h4" />
      <path d="m20.9 9-1.6 4.9" />
    </svg>
  );
}

export function CardioEllipticalIcon({
  size = 34,
  className = "",
}: CardioIconProps) {
  return (
    <svg className={className} {...strokeProps(size)}>
      <circle cx="18.2" cy="5.3" r="2.2" />
      <path d="m16.3 9.2-2.5 5.9 4.7 3.6 2.4 6.2" />
      <path d="m14.5 12.1 6.3 2.3 4.3-3.5" />
      <path d="M5.2 24.2c2.5-3.7 6.1-5.1 10.3-4 3.6.9 6.3 3.5 11.1 3.5" />
      <path d="M7 27.1h19.5" />
      <path d="M24.8 10.8v13.4" />
    </svg>
  );
}

export function CardioStairsIcon({
  size = 34,
  className = "",
}: CardioIconProps) {
  return (
    <svg className={className} {...strokeProps(size)}>
      <circle cx="15.9" cy="5.2" r="2.2" />
      <path d="m14.2 9.4-2.1 6.1 4.8 2.8 2.2 6.3" />
      <path d="m13.1 12 5.1 2 4.1-2.7" />
      <path d="M4.5 27.3h5.2v-4.2h5.2v-4.2h5.2v-4.2h7.4" />
    </svg>
  );
}

export function CardioRowingIcon({
  size = 34,
  className = "",
}: CardioIconProps) {
  return (
    <svg className={className} {...strokeProps(size)}>
      <circle cx="11.5" cy="7.8" r="2.2" />
      <path d="m9.9 11.5 4.8 4.7 5.1 1.1" />
      <path d="m14.7 16.2-3.4 5.2-5.1.5" />
      <path d="m19.8 17.3 6-5.1" />
      <path d="M4.3 24.7h23" />
      <path d="M7 21.8h12.8l3 2.9" />
      <circle cx="7" cy="26.2" r="1.5" />
      <circle cx="23.1" cy="26.2" r="1.5" />
    </svg>
  );
}

export function CardioWalkIcon({
  size = 34,
  className = "",
}: CardioIconProps) {
  return (
    <svg className={className} {...strokeProps(size)}>
      <circle cx="17.7" cy="5.4" r="2.4" />
      <path d="m15.8 9.4-2.5 6.7 4.3 3.9 1.4 7" />
      <path d="m14.8 12.1 5.6 4.2 4.3.5" />
      <path d="m13.3 16.1-4.1 5.6-4.1 2.5" />
      <path d="m17.6 20 4.8 4.3" />
    </svg>
  );
}

export function CardioSwimIcon({
  size = 34,
  className = "",
}: CardioIconProps) {
  return (
    <svg className={className} {...strokeProps(size)}>
      <circle cx="19.3" cy="7" r="2.3" />
      <path d="m7 15.5 7.8-5.2 5.3 3 5.1-1.8" />
      <path d="m14.8 10.3-2 7" />
      <path d="M3.5 20.6c2.4-2 4.8-2 7.2 0 2.4 2 4.8 2 7.2 0 2.4-2 4.8-2 7.2 0 1.2 1 2.4 1.5 3.6 1.5" />
      <path d="M3.5 25c2.4-2 4.8-2 7.2 0 2.4 2 4.8 2 7.2 0 2.4-2 4.8-2 7.2 0 1.2 1 2.4 1.5 3.6 1.5" />
    </svg>
  );
}

export function CardioHistoryIcon({
  size = 24,
  className = "",
}: CardioIconProps) {
  return (
    <svg className={className} {...strokeProps(size, "0 0 24 24", 1.8)}>
      <path d="M4.2 8.1A8 8 0 1 1 4 15.4" />
      <path d="M4.2 3.9v4.4h4.4" />
      <path d="M12 7.4v5l3.2 1.9" />
    </svg>
  );
}

export function CardioPulseIcon({
  size = 25,
  className = "",
}: CardioIconProps) {
  return (
    <svg className={className} {...strokeProps(size, "0 0 24 24", 1.9)}>
      <path d="M2.5 12h4.2l2-5.1 3.3 10.3 2.5-7.1 1.9 1.9h5.1" />
    </svg>
  );
}

export function CardioGoalIcon({
  size = 24,
  className = "",
}: CardioIconProps) {
  return (
    <svg className={className} {...strokeProps(size, "0 0 24 24", 1.8)}>
      <path d="M12 21s7-4.4 7-11.1A4.1 4.1 0 0 0 12 7a4.1 4.1 0 0 0-7 2.9C5 16.6 12 21 12 21Z" />
      <path d="m7.5 12 2.3-2.4 2.3 4.7 2.1-3h2.3" />
    </svg>
  );
}

export function CardioClockIcon({
  size = 24,
  className = "",
}: CardioIconProps) {
  return (
    <svg className={className} {...strokeProps(size, "0 0 24 24", 1.9)}>
      <circle cx="12" cy="12" r="8.2" />
      <path d="M12 7.4v5l3.4 2" />
    </svg>
  );
}

export function CardioFireIcon({
  size = 27,
  className = "",
}: CardioIconProps) {
  return (
    <svg className={className} {...strokeProps(size, "0 0 24 24", 1.8)}>
      <path d="M13.5 3.5c.5 3.2-2.4 4.2-1.8 7.1.8-1.2 2-1.8 3.2-2.4 2 1.8 3.1 4 3.1 6.4a6 6 0 0 1-12 0c0-3.5 2.1-6.1 5.2-8.7-.1 2.3.6 3.5 1.3 4.4.8-2.1 1.9-3.4 1-6.8Z" />
    </svg>
  );
}

export function CardioPlayIcon({
  size = 25,
  className = "",
}: CardioIconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M7.2 4.4v15.2L19 12 7.2 4.4Z" />
    </svg>
  );
}

export function CardioPauseIcon({
  size = 24,
  className = "",
}: CardioIconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="6.2" y="4.8" width="4.1" height="14.4" rx="1" />
      <rect x="13.7" y="4.8" width="4.1" height="14.4" rx="1" />
    </svg>
  );
}

export function CardioStopIcon({
  size = 22,
  className = "",
}: CardioIconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="5.5" y="5.5" width="13" height="13" rx="2.2" />
    </svg>
  );
}

export function CardioPlusIcon({
  size = 22,
  className = "",
}: CardioIconProps) {
  return (
    <svg className={className} {...strokeProps(size, "0 0 24 24", 2.2)}>
      <path d="M12 6v12M6 12h12" />
    </svg>
  );
}

export function CardioMinusIcon({
  size = 22,
  className = "",
}: CardioIconProps) {
  return (
    <svg className={className} {...strokeProps(size, "0 0 24 24", 2.2)}>
      <path d="M6 12h12" />
    </svg>
  );
}

export function CardioCheckIcon({
  size = 23,
  className = "",
}: CardioIconProps) {
  return (
    <svg className={className} {...strokeProps(size, "0 0 24 24", 2.3)}>
      <path d="m5.3 12.4 4.2 4.2 9.1-9.2" />
    </svg>
  );
}
