const DEFAULT_ORANGE = "#FF6A00";
const DARK = "#0f172a";

export default function EmphasisIcon({
  type = "gluteo",
  color = DEFAULT_ORANGE,
  size = 118,
  stroke = DARK,
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 118 118",
    fill: "none",
    "aria-hidden": "true",
  };

  const line = {
    stroke,
    strokeWidth: 4.3,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  const thin = {
    stroke,
    strokeWidth: 3,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  const accent = {
    fill: `url(#g_${type})`,
    stroke: color,
    strokeWidth: 1.6,
  };

  function Defs() {
    return (
      <defs>
        <radialGradient id={`g_${type}`} cx="38%" cy="32%" r="72%">
          <stop offset="0%" stopColor="#FFB26B" />
          <stop offset="52%" stopColor={color} />
          <stop offset="100%" stopColor="#E94900" />
        </radialGradient>
      </defs>
    );
  }

  if (type === "gluteo") {
    return (
      <svg {...common}>
        <Defs />
        <path d="M33 18c-7 15-8 31-5 49 2 12 2 20-3 31" {...line} />
        <path d="M85 18c7 15 8 31 5 49-2 12-2 20 3 31" {...line} />
        <path d="M59 32v58" {...thin} />
        <path d="M39 43c-6 7-8 18-5 28 3 11 10 18 20 18 3 0 5-1 5-1V45c-5-4-14-6-20-2Z" {...accent} />
        <path d="M79 43c6 7 8 18 5 28-3 11-10 18-20 18-3 0-5-1-5-1V45c5-4 14-6 20-2Z" {...accent} />
        <path d="M38 36c7-5 14-6 21-2 7-4 14-3 21 2" {...thin} />
        <path d="M24 45c-3 7-4 14-3 22" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray="4 7" />
        <path d="M94 45c3 7 4 14 3 22" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray="4 7" />
      </svg>
    );
  }

  if (type === "quadriceps") {
    return (
      <svg {...common}>
        <Defs />
        <path d="M40 18c-3 14-3 30-1 47 1 11-1 21-5 33" {...line} />
        <path d="M78 18c3 14 3 30 1 47-1 11 1 21 5 33" {...line} />
        <path d="M52 22c-2 15-1 34 1 54" {...thin} />
        <path d="M66 22c2 15 1 34-1 54" {...thin} />
        <path d="M49 43c-7 14-8 31-4 45 1 4 5 5 8 2 8-9 10-28 7-44-1-5-8-8-11-3Z" {...accent} />
        <path d="M69 43c7 14 8 31 4 45-1 4-5 5-8 2-8-9-10-28-7-44 1-5 8-8 11-3Z" {...accent} />
        <path d="M27 44c-2 9-2 17 0 25" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray="4 7" />
        <path d="M91 44c2 9 2 17 0 25" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray="4 7" />
      </svg>
    );
  }

  if (type === "panturrilha") {
    return (
      <svg {...common}>
        <Defs />
        <path d="M45 16c-3 18-1 36 4 54 3 11 1 20-6 30" {...line} />
        <path d="M73 16c3 18 1 36-4 54-3 11-1 20 6 30" {...line} />
        <path d="M57 20c-2 22-2 42 0 62" {...thin} />
        <path d="M61 20c2 22 2 42 0 62" {...thin} />
        <path d="M43 77c6 0 12 1 16 6" {...thin} />
        <path d="M75 77c-6 0-12 1-16 6" {...thin} />
        <path d="M48 44c-8 11-9 29-3 39 2 3 7 2 9-2 6-13 7-27 3-38-2-5-6-4-9 1Z" {...accent} />
        <path d="M70 44c8 11 9 29 3 39-2 3-7 2-9-2-6-13-7-27-3-38 2-5 6-4 9 1Z" {...accent} />
        <path d="M28 58l-7-3" stroke={color} strokeWidth="3" strokeLinecap="round" />
        <path d="M29 70l-7 3" stroke={color} strokeWidth="3" strokeLinecap="round" />
        <path d="M90 58l7-3" stroke={color} strokeWidth="3" strokeLinecap="round" />
        <path d="M89 70l7 3" stroke={color} strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "posterior") {
    return (
      <svg {...common}>
        <Defs />
        <path d="M35 18c-7 16-8 34-5 54 2 12 2 20-3 29" {...line} />
        <path d="M83 18c7 16 8 34 5 54-2 12-2 20 3 29" {...line} />
        <path d="M59 29v60" {...thin} />
        <path d="M43 46c-6 12-6 28-2 41 1 4 6 5 9 1 7-9 9-26 7-39-1-6-11-8-14-3Z" {...accent} />
        <path d="M75 46c6 12 6 28 2 41-1 4-6 5-9 1-7-9-9-26-7-39 1-6 11-8 14-3Z" {...accent} />
        <path d="M40 36c7-5 13-6 19-3 6-3 12-2 19 3" {...thin} />
        <path d="M24 50c-3 7-4 15-3 23" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray="4 7" />
        <path d="M94 50c3 7 4 15 3 23" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray="4 7" />
      </svg>
    );
  }

  if (type === "abdomen") {
    return (
      <svg {...common}>
        <Defs />
        <path d="M33 20c-6 19-6 39 0 59 2 7 3 13 1 20" {...line} />
        <path d="M85 20c6 19 6 39 0 59-2 7-3 13-1 20" {...line} />
        <path d="M41 29c5 3 11 4 18 4s13-1 18-4" {...thin} />
        <path d="M59 42v43" {...thin} />
        <rect x="45" y="43" width="12" height="14" rx="4" {...accent} />
        <rect x="61" y="43" width="12" height="14" rx="4" {...accent} />
        <rect x="45" y="61" width="12" height="14" rx="4" {...accent} />
        <rect x="61" y="61" width="12" height="14" rx="4" {...accent} />
        <rect x="45" y="79" width="12" height="14" rx="4" {...accent} />
        <rect x="61" y="79" width="12" height="14" rx="4" {...accent} />
      </svg>
    );
  }

  if (type === "perda_peso") {
    return (
      <svg {...common}>
        <Defs />
        <path d="M36 19c-5 17-5 34 0 51 3 11 1 20-4 30" {...line} />
        <path d="M82 19c5 17 5 34 0 51-3 11-1 20 4 30" {...line} />
        <path d="M49 45c-8 12-8 26-2 37" {...thin} />
        <path d="M69 45c8 12 8 26 2 37" {...thin} />
        <path d="M43 56l-12 8 12 8" {...line} />
        <path d="M75 56l12 8-12 8" {...line} />
        <path d="M59 50c2 9 13 13 13 25 0 10-6 17-13 17s-13-7-13-17c0-8 5-15 11-21 0 6 2 10 7 13 2-5 1-11-5-17Z" {...accent} />
      </svg>
    );
  }

  if (type === "biceps") {
    return (
      <svg {...common}>
        <Defs />
        <path d="M42 82c0-20 8-36 24-46 7-5 17-1 20 7 4 11-4 23-19 27" {...line} />
        <path d="M42 82c12-13 31-14 44-3" {...line} />
        <path d="M35 86l-9 16" {...line} />
        <path d="M67 36l5-16" {...line} />
        <path d="M45 78c8-14 23-19 35-10-5 10-15 16-29 16-4 0-6-2-6-6Z" {...accent} />
        <path d="M88 57l8-2" stroke={color} strokeWidth="3" strokeLinecap="round" />
        <path d="M86 47l6-5" stroke={color} strokeWidth="3" strokeLinecap="round" />
        <path d="M87 67l7 5" stroke={color} strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "ombro") {
    return (
      <svg {...common}>
        <Defs />
        <path d="M39 43c6-12 13-18 20-18s14 6 20 18" {...line} />
        <path d="M24 91c3-22 12-37 27-45" {...line} />
        <path d="M94 91c-3-22-12-37-27-45" {...line} />
        <path d="M42 49c-7 2-13 8-16 18" {...thin} />
        <path d="M76 49c7 2 13 8 16 18" {...thin} />
        <path d="M34 53c-10 3-17 12-18 25 11 1 21-5 26-16 3-6-1-11-8-9Z" {...accent} />
        <path d="M84 53c10 3 17 12 18 25-11 1-21-5-26-16-3-6 1-11 8-9Z" {...accent} />
        <path d="M28 40c10 7 20 10 31 10s21-3 31-10" {...thin} />
      </svg>
    );
  }

  if (type === "triceps") {
    return (
      <svg {...common}>
        <Defs />
        <path d="M42 82c0-20 8-36 24-46 7-5 17-1 20 7 4 11-4 23-19 27" {...line} />
        <path d="M42 82c12-13 31-14 44-3" {...line} />
        <path d="M35 86l-9 16" {...line} />
        <path d="M67 36l5-16" {...line} />
        <path d="M44 82c9-5 17-14 23-27 6 5 8 13 5 21-4 10-13 17-28 18-3 0-5-9 0-12Z" {...accent} />
        <path d="M74 84l9 7" stroke={color} strokeWidth="3" strokeLinecap="round" />
        <path d="M76 74l10 1" stroke={color} strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "peitoral") {
    return (
      <svg {...common}>
        <Defs />
        <path d="M30 98c1-21 3-39 8-55" {...line} />
        <path d="M88 98c-1-21-3-39-8-55" {...line} />
        <path d="M38 40c8-6 15-8 21-8s13 2 21 8" {...thin} />
        <path d="M59 37v51" {...thin} />
        <path d="M39 48c6-7 14-9 20-5v25c-8 5-20 3-26-6-3-6 0-12 6-14Z" {...accent} />
        <path d="M79 48c-6-7-14-9-20-5v25c8 5 20 3 26-6 3-6 0-12-6-14Z" {...accent} />
        <path d="M45 82h28" {...thin} />
        <path d="M49 93h20" {...thin} />
      </svg>
    );
  }

  if (type === "costas") {
    return (
      <svg {...common}>
        <Defs />
        <path d="M27 99c3-24 8-43 18-61" {...line} />
        <path d="M91 99c-3-24-8-43-18-61" {...line} />
        <path d="M38 38c8-8 14-12 21-12s13 4 21 12" {...thin} />
        <path d="M59 31v64" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeDasharray="6 7" />
        <path d="M43 51c-8 10-14 24-16 42 15-4 26-15 33-36-5-7-12-9-17-6Z" {...accent} />
        <path d="M75 51c8 10 14 24 16 42-15-4-26-15-33-36 5-7 12-9 17-6Z" {...accent} />
        <path d="M37 63c4 7 9 11 16 14" {...thin} />
        <path d="M81 63c-4 7-9 11-16 14" {...thin} />
      </svg>
    );
  }

  if (type === "lombar") {
    return (
      <svg {...common}>
        <Defs />
        <path d="M35 20c-5 16-6 33-2 52 2 10 1 19-4 28" {...line} />
        <path d="M83 20c5 16 6 33 2 52-2 10-1 19 4 28" {...line} />
        <path d="M59 25v73" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeDasharray="6 7" />
        <circle cx="59" cy="70" r="13" fill={color} opacity="0.14" />
        <circle cx="59" cy="70" r="8" {...accent} />
        <path d="M31 70l-8-4" stroke={color} strokeWidth="3" strokeLinecap="round" />
        <path d="M31 80l-8 4" stroke={color} strokeWidth="3" strokeLinecap="round" />
        <path d="M87 70l8-4" stroke={color} strokeWidth="3" strokeLinecap="round" />
        <path d="M87 80l8 4" stroke={color} strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "trapezio") {
    return (
      <svg {...common}>
        <Defs />
        <path d="M59 18c9 0 16 7 16 16s-7 16-16 16-16-7-16-16 7-16 16-16Z" {...line} />
        <path d="M39 48c6 8 13 12 20 12s14-4 20-12" {...thin} />
        <path d="M20 100c6-20 20-32 39-32s33 12 39 32" {...line} />
        <path d="M59 52v50" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeDasharray="6 7" />
        <path d="M42 55c-11 8-18 20-22 39 15-4 27-12 37-28-3-6-8-10-15-11Z" {...accent} />
        <path d="M76 55c11 8 18 20 22 39-15-4-27-12-37-28 3-6 8-10 15-11Z" {...accent} />
      </svg>
    );
  }

  if (type === "pescoco") {
    return (
      <svg {...common}>
        <Defs />
        <path d="M47 20c7-6 17-6 24 0 7 7 7 20-1 28-4 4-8 6-13 6" {...line} />
        <path d="M57 54c-1 15-8 27-20 36" {...line} />
        <path d="M67 52c4 18 1 32-8 44" {...line} />
        <path d="M40 102c10-8 21-10 34-7" {...thin} />
        <path d="M52 55c-8 9-13 20-16 34 8-2 15-7 20-16 4-7 4-14-4-18Z" {...accent} />
        <path d="M69 59c-2 12-5 22-11 32" stroke={color} strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "leve") {
    return (
      <svg {...common}>
        <Defs />
        <circle cx="59" cy="59" r="36" stroke={color} strokeWidth="3" opacity="0.18" />
        <path d="M25 88c25-4 45-20 62-51" {...line} />
        <path d="M33 82c9-28 26-45 52-51-3 24-16 43-39 57" fill="#fff" />
        <path d="M33 82c9-28 26-45 52-51-3 24-16 43-39 57" {...line} />
        <path d="M46 73c7-2 12-1 17 3" {...thin} />
        <path d="M54 61c6-1 11 0 15 3" {...thin} />
        <path d="M61 49c5 0 9 1 12 3" {...thin} />
        <path d="M33 82c11-6 23-16 36-30" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <Defs />
      <circle cx="59" cy="59" r="36" stroke={color} strokeWidth="3" opacity="0.18" />
      <path d="M61 17 27 65h29l-6 39 41-55H62l9-32Z" fill={color} opacity="0.14" />
      <path d="M61 17 27 65h29l-6 39 41-55H62l9-32Z" stroke={color} strokeWidth="6" strokeLinejoin="round" />
      <path d="M91 87h11" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M86 98h15" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
