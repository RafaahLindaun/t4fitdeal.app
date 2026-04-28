const DEFAULT_ORANGE = "#FF6A00";

export default function EmphasisIcon({ type = "gluteo", color = DEFAULT_ORANGE, size = 118 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 118 118",
    fill: "none",
    "aria-hidden": "true",
  };

  if (type === "gluteo") {
    return (
      <svg {...common}>
        <circle cx="59" cy="59" r="45" fill={color} opacity="0.12" />
        <path d="M59 19c8.5 0 15.5 6.9 15.5 15.5S67.5 50 59 50s-15.5-6.9-15.5-15.5S50.5 19 59 19Z" fill={color} opacity="0.16" />
        <path d="M43 50c-7 6-10 15-10 25 0 14 8 24 19 24 4.5 0 7.5-1.8 9.5-4.6 2 2.8 5 4.6 9.5 4.6 11 0 19-10 19-24 0-10-3-19-10-25" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M61.5 55v39" stroke={color} strokeWidth="5.5" strokeLinecap="round" />
        <path d="M42 76c5-7 11-10.5 19.5-10.5S76 69 81 76" stroke={color} strokeWidth="6" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "quadriceps") {
    return (
      <svg {...common}>
        <circle cx="59" cy="59" r="45" fill={color} opacity="0.12" />
        <path d="M47 20c-5 11-7 23-6 36l3 39" stroke={color} strokeWidth="6" strokeLinecap="round" />
        <path d="M71 20c5 11 7 23 6 36l-3 39" stroke={color} strokeWidth="6" strokeLinecap="round" />
        <path d="M52 35c-3 10-3 22-1 34" stroke={color} strokeWidth="5" strokeLinecap="round" opacity="0.82" />
        <path d="M66 35c3 10 3 22 1 34" stroke={color} strokeWidth="5" strokeLinecap="round" opacity="0.82" />
        <path d="M44 55h30" stroke={color} strokeWidth="5" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "panturrilha") {
    return (
      <svg {...common}>
        <circle cx="59" cy="59" r="45" fill={color} opacity="0.12" />
        <path d="M48 22c-3 13-2 27 3 41 3 9 1 21-5 32" stroke={color} strokeWidth="6" strokeLinecap="round" />
        <path d="M70 22c3 13 2 27-3 41-3 9-1 21 5 32" stroke={color} strokeWidth="6" strokeLinecap="round" />
        <path d="M52 58c5-4 9-4 14 0" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <path d="M45 96h28" stroke={color} strokeWidth="5" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "posterior") {
    return (
      <svg {...common}>
        <circle cx="59" cy="59" r="45" fill={color} opacity="0.12" />
        <path d="M43 20c7 9 9 20 8 35l-4 40" stroke={color} strokeWidth="6" strokeLinecap="round" />
        <path d="M75 20c-7 9-9 20-8 35l4 40" stroke={color} strokeWidth="6" strokeLinecap="round" />
        <path d="M52 46c5 5 9 5 14 0" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <path d="M49 67c7 5 13 5 20 0" stroke={color} strokeWidth="5" strokeLinecap="round" opacity="0.85" />
      </svg>
    );
  }

  if (type === "abdomen") {
    return (
      <svg {...common}>
        <circle cx="59" cy="59" r="45" fill={color} opacity="0.12" />
        <path d="M59 18c14 10 22 24 22 43 0 20-8 33-22 40-14-7-22-20-22-40 0-19 8-33 22-43Z" stroke={color} strokeWidth="6" strokeLinejoin="round" />
        <path d="M59 32v55" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <path d="M47 43h24M45 58h28M47 73h24" stroke={color} strokeWidth="5" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "perda_peso") {
    return (
      <svg {...common}>
        <circle cx="59" cy="59" r="45" fill={color} opacity="0.12" />
        <path d="M59 18c8 0 14.5 6.5 14.5 14.5S67 47 59 47s-14.5-6.5-14.5-14.5S51 18 59 18Z" fill={color} opacity="0.16" />
        <path d="M43 52c-6 9-9 20-7 31 2.2 13.8 11 22 23 22s20.8-8.2 23-22c2-11-1-22-7-31" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M47 70c8 5 16 5 24 0" stroke={color} strokeWidth="5.5" strokeLinecap="round" />
        <path d="M88 37c7 5 10 12 11 21" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <path d="M99 58l5-7" stroke={color} strokeWidth="5" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "biceps") {
    return (
      <svg {...common}>
        <circle cx="59" cy="59" r="45" fill={color} opacity="0.12" />
        <path d="M37 72c5-19 13-32 27-36 7-2 16 2 18 10 3 12-8 24-25 23" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M40 72c10-8 22-8 32 0" stroke={color} strokeWidth="6" strokeLinecap="round" />
        <path d="M35 73l-8 16" stroke={color} strokeWidth="6" strokeLinecap="round" />
        <path d="M70 37l4-14" stroke={color} strokeWidth="5" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "ombro") {
    return (
      <svg {...common}>
        <circle cx="59" cy="59" r="45" fill={color} opacity="0.12" />
        <path d="M34 62c3-18 13-30 25-30s22 12 25 30" stroke={color} strokeWidth="6" strokeLinecap="round" />
        <path d="M32 63c-8 5-13 13-15 24" stroke={color} strokeWidth="6" strokeLinecap="round" />
        <path d="M86 63c8 5 13 13 15 24" stroke={color} strokeWidth="6" strokeLinecap="round" />
        <path d="M47 50c6-5 18-5 24 0" stroke={color} strokeWidth="5" strokeLinecap="round" opacity="0.82" />
      </svg>
    );
  }

  if (type === "triceps") {
    return (
      <svg {...common}>
        <circle cx="59" cy="59" r="45" fill={color} opacity="0.12" />
        <path d="M43 32c11 5 18 14 20 28 1.5 10 6 17 15 22" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M42 32c-7 10-8 22-2 34 4 8 3 16-3 25" stroke={color} strokeWidth="6" strokeLinecap="round" />
        <path d="M50 54c7 5 12 13 14 24" stroke={color} strokeWidth="5" strokeLinecap="round" opacity="0.84" />
      </svg>
    );
  }

  if (type === "peitoral") {
    return (
      <svg {...common}>
        <circle cx="59" cy="59" r="45" fill={color} opacity="0.12" />
        <path d="M59 27c-13 0-24 9-29 24 6 10 16 16 29 16s23-6 29-16c-5-15-16-24-29-24Z" stroke={color} strokeWidth="6" strokeLinejoin="round" />
        <path d="M59 30v38" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <path d="M36 53c7-5 14-7 23-7s16 2 23 7" stroke={color} strokeWidth="5" strokeLinecap="round" opacity="0.85" />
      </svg>
    );
  }

  if (type === "costas") {
    return (
      <svg {...common}>
        <circle cx="59" cy="59" r="45" fill={color} opacity="0.12" />
        <path d="M59 20c15 10 26 26 29 48-10 20-20 29-29 31-9-2-19-11-29-31 3-22 14-38 29-48Z" stroke={color} strokeWidth="6" strokeLinejoin="round" />
        <path d="M59 31v54" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <path d="M43 43c4 14 8 25 16 34" stroke={color} strokeWidth="5" strokeLinecap="round" opacity="0.85" />
        <path d="M75 43c-4 14-8 25-16 34" stroke={color} strokeWidth="5" strokeLinecap="round" opacity="0.85" />
      </svg>
    );
  }

  if (type === "lombar") {
    return (
      <svg {...common}>
        <circle cx="59" cy="59" r="45" fill={color} opacity="0.12" />
        <path d="M59 20c11 9 18 22 18 39 0 18-7 31-18 39-11-8-18-21-18-39 0-17 7-30 18-39Z" stroke={color} strokeWidth="6" strokeLinejoin="round" />
        <path d="M59 31v56" stroke={color} strokeWidth="5.5" strokeLinecap="round" />
        <path d="M48 45h22M47 59h24M50 73h18" stroke={color} strokeWidth="5" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "trapezio") {
    return (
      <svg {...common}>
        <circle cx="59" cy="59" r="45" fill={color} opacity="0.12" />
        <path d="M59 18c8 0 14 6 14 14s-6 14-14 14-14-6-14-14 6-14 14-14Z" fill={color} opacity="0.16" />
        <path d="M39 55c7-8 13-11 20-11s13 3 20 11" stroke={color} strokeWidth="6" strokeLinecap="round" />
        <path d="M31 86c5-19 16-31 28-31s23 12 28 31" stroke={color} strokeWidth="6" strokeLinecap="round" />
        <path d="M59 46v28" stroke={color} strokeWidth="5" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "pescoco") {
    return (
      <svg {...common}>
        <circle cx="59" cy="59" r="45" fill={color} opacity="0.12" />
        <path d="M59 18c8 0 14 6 14 14s-6 14-14 14-14-6-14-14 6-14 14-14Z" stroke={color} strokeWidth="6" />
        <path d="M50 48v23c0 8-4 14-11 18" stroke={color} strokeWidth="6" strokeLinecap="round" />
        <path d="M68 48v23c0 8 4 14 11 18" stroke={color} strokeWidth="6" strokeLinecap="round" />
        <path d="M48 67h22" stroke={color} strokeWidth="5" strokeLinecap="round" opacity="0.85" />
      </svg>
    );
  }

  if (type === "leve") {
    return (
      <svg {...common}>
        <circle cx="59" cy="59" r="45" fill={color} opacity="0.12" />
        <path d="M78 30c-5 4-10 5-16 5-17 0-31 14-31 31s14 31 31 31c13 0 24-8 29-19-5 3-10 4-16 4-17 0-31-14-31-31 0-9 4-17 10-23 7-6 15-8 24-8Z" stroke={color} strokeWidth="6" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle cx="59" cy="59" r="45" fill={color} opacity="0.12" />
      <path d="M61 17 27 65h29l-6 39 41-55H62l9-32Z" fill={color} opacity="0.16" />
      <path d="M61 17 27 65h29l-6 39 41-55H62l9-32Z" stroke={color} strokeWidth="6" strokeLinejoin="round" />
    </svg>
  );
}
