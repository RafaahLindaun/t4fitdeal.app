export const ACCQUA_MOTION = {
  duration: {
    micro: 0.18,
    transition: 0.3,
    celebration: 0.6,
  },
  easing: {
    enter: [0.2, 0.8, 0.2, 1] as [number, number, number, number],
    exit: [0.4, 0, 1, 1] as [number, number, number, number],
    standard: [0.4, 0, 0.2, 1] as [number, number, number, number],
    expressive: [0.65, 0, 0.35, 1] as [number, number, number, number],
  },
  spring: {
    responsive: { type: "spring" as const, stiffness: 360, damping: 30, mass: 0.85 },
    gentle: { type: "spring" as const, stiffness: 260, damping: 28, mass: 0.95 },
  },
} as const;

export const ACCQUA_Z = {
  bottomNav: 140,
  modalOverlay: 10040,
  modalContent: 10041,
  toast: 10060,
} as const;

export const ACCQUA_CARD_PADDING = {
  spacious: "24px",
  compact: "16px",
} as const;
