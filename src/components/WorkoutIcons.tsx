type WorkoutIconProps = {
  size?: number;
  className?: string;
};

const base = (
  size: number,
  viewBox = "0 0 24 24",
  strokeWidth = 1.75,
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

export function WorkoutBackIcon({
  size = 30,
  className = "",
}: WorkoutIconProps) {
  return (
    <svg className={className} {...base(size, "0 0 24 24", 2.25)}>
      <path d="m15 5-7 7 7 7" />
    </svg>
  );
}

export function WorkoutCalendarIcon({
  size = 27,
  className = "",
}: WorkoutIconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3.2"
        y="5.25"
        width="17.6"
        height="15.25"
        rx="2"
        stroke="white"
        strokeWidth="1.55"
      />
      <path
        d="M3.2 9.65h17.6"
        stroke="white"
        strokeWidth="1.55"
        strokeLinecap="round"
      />
      <path
        d="M7.25 3v4.25M16.75 3v4.25"
        stroke="#FFD11E"
        strokeWidth="2.15"
        strokeLinecap="round"
      />
      <circle cx="7.4" cy="13.1" r="1" fill="#FFD11E" />
      <circle cx="12" cy="13.1" r="1" fill="#FFD11E" />
      <circle cx="16.6" cy="13.1" r="1" fill="#FFD11E" />
      <circle cx="7.4" cy="16.9" r="1" fill="white" />
      <circle cx="12" cy="16.9" r="1" fill="white" />
      <circle cx="16.6" cy="16.9" r="1" fill="white" />
    </svg>
  );
}

export function WorkoutMinusIcon({
  size = 30,
  className = "",
}: WorkoutIconProps) {
  return (
    <svg className={className} {...base(size, "0 0 24 24", 2.25)}>
      <path d="M6.5 12h11" />
    </svg>
  );
}

export function WorkoutPlusIcon({
  size = 30,
  className = "",
}: WorkoutIconProps) {
  return (
    <svg className={className} {...base(size, "0 0 24 24", 2.25)}>
      <path d="M12 6.5v11M6.5 12h11" />
    </svg>
  );
}

export function WorkoutRepeatIcon({
  size = 29,
  className = "",
}: WorkoutIconProps) {
  return (
    <svg className={className} {...base(size, "0 0 24 24", 1.75)}>
      <path d="M18.2 8.1A7.6 7.6 0 1 0 19 15" />
      <path d="m18.25 3.9-.05 4.3-4.25-.2" />
      <path d="M12 8.5v3.9l2.7 1.6" />
    </svg>
  );
}

export function WorkoutWeightIcon({
  size = 31,
  className = "",
}: WorkoutIconProps) {
  return (
    <svg className={className} {...base(size, "0 0 24 24", 1.65)}>
      <path d="M8.6 7.3V6a3.4 3.4 0 0 1 6.8 0v1.3" />
      <path d="M6.2 7.3h11.6l2.1 13H4.1l2.1-13Z" />
      <circle cx="12" cy="13.5" r="2.1" />
    </svg>
  );
}

export function WorkoutStopwatchIcon({
  size = 31,
  className = "",
}: WorkoutIconProps) {
  return (
    <svg className={className} {...base(size, "0 0 24 24", 1.65)}>
      <circle cx="12" cy="13" r="7.6" />
      <path d="M12 13V8.8M12 13l3.2 1.8M9.2 2.8h5.6M12 2.8v2.5M18.2 6.7l1.4-1.4" />
    </svg>
  );
}

export function WorkoutCrownIcon({
  size = 23,
  className = "",
}: WorkoutIconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="m3.3 7.2 4.1 3.2L12 4.5l4.6 5.9 4.1-3.2-1.7 11H5l-1.7-11Z" />
    </svg>
  );
}

export function WorkoutNextIcon({
  size = 30,
  className = "",
}: WorkoutIconProps) {
  return (
    <svg className={className} {...base(size, "0 0 24 24", 2.1)}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

export function WorkoutCheckIcon({
  size = 28,
  className = "",
}: WorkoutIconProps) {
  return (
    <svg className={className} {...base(size, "0 0 24 24", 2.4)}>
      <path d="m5.5 12.5 4.2 4.1 8.8-9.1" />
    </svg>
  );
}

export function WorkoutRefreshIcon({
  size = 23,
  className = "",
}: WorkoutIconProps) {
  return (
    <svg className={className} {...base(size, "0 0 24 24", 1.8)}>
      <path d="M19 7.3A8 8 0 1 0 20 14" />
      <path d="M19 3.7v3.8h-3.8" />
    </svg>
  );
}
