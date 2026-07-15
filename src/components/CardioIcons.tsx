type CardioIconProps = {
  size?: number;
  className?: string;
};

const strokeBase = (
  size: number,
  viewBox = "0 0 24 24",
  strokeWidth = 1.8,
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
});

export function CardioSwapIcon({
  size = 24,
  className = "",
}: CardioIconProps) {
  return (
    <svg className={className} {...strokeBase(size, "0 0 24 24", 1.85)}>
      <path d="M4 7.5h11.5" />
      <path d="m12.8 4.8 2.7 2.7-2.7 2.7" />
      <path d="M20 16.5H8.5" />
      <path d="m11.2 13.8-2.7 2.7 2.7 2.7" />
      <path d="M6.2 11.1c1.1-2 3.2-3.3 5.6-3.3M17.8 12.9c-1.1 2-3.2 3.3-5.6 3.3" opacity=".7" />
    </svg>
  );
}

export function CardioTreadmillIcon({
  size = 32,
  className = "",
}: CardioIconProps) {
  return (
    <svg className={className} {...strokeBase(size, "0 0 32 32", 1.75)}>
      <circle cx="18.7" cy="5.6" r="2.4" />
      <path d="m16.7 9.6 4.2 2.1 2.4 4.2" />
      <path d="m20.9 11.7-4.3 5.5-4.6 1.5" />
      <path d="m16.6 17.2 4.1 4.3 3.6 1.4" />
      <path d="m13.5 12.2 3.1 5" />
      <path d="M4.1 24.3h22.6l-2.2 3H7.1l-3-3Z" />
      <path d="M25.6 8.1h2.1v16.2" />
    </svg>
  );
}

export function CardioSwimIcon({
  size = 32,
  className = "",
}: CardioIconProps) {
  return (
    <svg className={className} {...strokeBase(size, "0 0 32 32", 1.75)}>
      <circle cx="19.4" cy="7" r="2.4" />
      <path d="m7.1 15.5 7.7-5.3 5.3 3.1 5.1-1.8" />
      <path d="m14.8 10.2-1.9 7.1" />
      <path d="M3.6 20.5c2.4-2 4.8-2 7.2 0 2.4 2 4.8 2 7.2 0 2.4-2 4.8-2 7.2 0 1.2 1 2.4 1.5 3.6 1.5" />
      <path d="M3.6 25c2.4-2 4.8-2 7.2 0 2.4 2 4.8 2 7.2 0 2.4-2 4.8-2 7.2 0 1.2 1 2.4 1.5 3.6 1.5" />
    </svg>
  );
}

export function CardioBikeIcon({
  size = 32,
  className = "",
}: CardioIconProps) {
  return (
    <svg className={className} {...strokeBase(size, "0 0 32 32", 1.75)}>
      <circle cx="8.1" cy="23.1" r="5.2" />
      <circle cx="24" cy="23.1" r="5.2" />
      <path d="m8.1 23.1 6.1-9.2h5.2l4.6 9.2" />
      <path d="m14.2 13.9 4.3 9.2H8.1" />
      <path d="M12.1 10.2h5.2M21.1 9.1h4.1" />
      <path d="m20.8 9.1-1.4 4.8" />
    </svg>
  );
}

export function CardioWalkIcon({
  size = 32,
  className = "",
}: CardioIconProps) {
  return (
    <svg className={className} {...strokeBase(size, "0 0 32 32", 1.75)}>
      <circle cx="17.7" cy="5.5" r="2.5" />
      <path d="m15.8 9.4-2.4 6.8 4.2 3.8 1.4 7" />
      <path d="m14.8 12.2 5.6 4.2 4.3.5" />
      <path d="m13.4 16.2-4.1 5.5-4.1 2.5" />
      <path d="m17.6 20 4.8 4.3" />
    </svg>
  );
}

export function CardioHistoryIcon({
  size = 25,
  className = "",
}: CardioIconProps) {
  return (
    <svg className={className} {...strokeBase(size, "0 0 24 24", 1.7)}>
      <path d="M4.3 8.1A8 8 0 1 1 4 15.3" />
      <path d="M4.3 3.9v4.4h4.4" />
      <path d="M12 7.5v5l3.2 1.9" />
    </svg>
  );
}

export function CardioPlayIcon({
  size = 26,
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
      <rect x="6.2" y="4.8" width="4.1" height="14.4" rx="1" />
      <rect x="13.7" y="4.8" width="4.1" height="14.4" rx="1" />
    </svg>
  );
}

export function CardioStopIcon({
  size = 23,
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
  size = 23,
  className = "",
}: CardioIconProps) {
  return (
    <svg className={className} {...strokeBase(size, "0 0 24 24", 2.1)}>
      <path d="M12 6v12M6 12h12" />
    </svg>
  );
}

export function CardioMinusIcon({
  size = 23,
  className = "",
}: CardioIconProps) {
  return (
    <svg className={className} {...strokeBase(size, "0 0 24 24", 2.1)}>
      <path d="M6 12h12" />
    </svg>
  );
}

export function CardioCheckIcon({
  size = 24,
  className = "",
}: CardioIconProps) {
  return (
    <svg className={className} {...strokeBase(size, "0 0 24 24", 2.25)}>
      <path d="m5.3 12.4 4.2 4.2 9.1-9.2" />
    </svg>
  );
}


export function CardioEllipticalIcon({
  size = 32,
  className = "",
}: CardioIconProps) {
  return (
    <svg className={className} {...strokeBase(size, "0 0 32 32", 1.7)}>
      <circle cx="18.2" cy="5.2" r="2.2" />
      <path d="m16.2 9.2-2.4 5.6 4.6 3.7 2.5 6.7" />
      <path d="m14.4 12.1 6.6 2.4 4.3-3.5" />
      <path d="M5.3 24.4c2.4-3.9 6.4-5.4 10.4-4.2 3.3 1 6.1 3.6 10.9 3.5" />
      <path d="M7.2 27.2h19.1" />
      <path d="M24.8 10.8v13.3" />
    </svg>
  );
}

export function CardioStairsIcon({
  size = 32,
  className = "",
}: CardioIconProps) {
  return (
    <svg className={className} {...strokeBase(size, "0 0 32 32", 1.7)}>
      <circle cx="16.3" cy="5.2" r="2.2" />
      <path d="m14.5 9.4-2.2 6.2 4.8 2.8 2.3 6.4" />
      <path d="m13.3 12 5.1 2 4.2-2.7" />
      <path d="M4.5 27.3h5.2v-4.2h5.2v-4.2h5.2v-4.2h7.4" />
    </svg>
  );
}

export function CardioRowingIcon({
  size = 32,
  className = "",
}: CardioIconProps) {
  return (
    <svg className={className} {...strokeBase(size, "0 0 32 32", 1.7)}>
      <circle cx="11.6" cy="8" r="2.2" />
      <path d="m10 11.6 4.6 4.6 5.3 1.2" />
      <path d="m14.6 16.2-3.4 5.2-5 .5" />
      <path d="m19.9 17.4 5.9-5.2" />
      <path d="M4.4 24.8h22.9" />
      <path d="M7.1 21.8h12.6l3 3" />
      <circle cx="7.1" cy="26.2" r="1.5" />
      <circle cx="23.1" cy="26.2" r="1.5" />
    </svg>
  );
}

export function CardioPulseIcon({
  size = 27,
  className = "",
}: CardioIconProps) {
  return (
    <svg className={className} {...strokeBase(size, "0 0 24 24", 1.8)}>
      <path d="M2.8 12h4.1l2-5.2 3.2 10.4 2.5-7.2 1.8 2H21" />
    </svg>
  );
}

export function CardioGoalIcon({
  size = 25,
  className = "",
}: CardioIconProps) {
  return (
    <svg className={className} {...strokeBase(size, "0 0 24 24", 1.7)}>
      <path d="M12 21s7-4.5 7-11.2A4.1 4.1 0 0 0 12 6.9a4.1 4.1 0 0 0-7 2.9C5 16.5 12 21 12 21Z" />
      <path d="m7.7 12 2.2-2.4 2.3 4.7 2-3h2.2" />
    </svg>
  );
}

export function CardioClockIcon({
  size = 25,
  className = "",
}: CardioIconProps) {
  return (
    <svg className={className} {...strokeBase(size, "0 0 24 24", 1.8)}>
      <circle cx="12" cy="12" r="8.3" />
      <path d="M12 7.5v5l3.3 1.9" />
    </svg>
  );
}
