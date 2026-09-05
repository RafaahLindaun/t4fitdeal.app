import type { Transition, Variants } from "framer-motion";

export type AccquaWindowMotionKind = "center" | "sheet" | "viewer";

export const ACCQUA_WINDOW_MOTION = {
  overlayOpenMs: 190,
  overlayCloseMs: 150,
  panelOpenMs: 260,
  panelCloseMs: 180,
  easeOut: [0.16, 1, 0.3, 1] as [number, number, number, number],
  easeIn: [0.4, 0, 1, 1] as [number, number, number, number],
} as const;

export const accquaOverlayTransition: Transition = {
  duration: ACCQUA_WINDOW_MOTION.overlayOpenMs / 1000,
  ease: ACCQUA_WINDOW_MOTION.easeOut,
};

export const accquaWindowTransition: Transition = {
  duration: ACCQUA_WINDOW_MOTION.panelOpenMs / 1000,
  ease: ACCQUA_WINDOW_MOTION.easeOut,
};

export const accquaOverlayVariants: Variants = {
  hidden: { opacity: 0, backdropFilter: "blur(0px)" },
  visible: { opacity: 1, backdropFilter: "blur(10px)" },
  exit: {
    opacity: 0,
    backdropFilter: "blur(0px)",
    transition: {
      duration: ACCQUA_WINDOW_MOTION.overlayCloseMs / 1000,
      ease: ACCQUA_WINDOW_MOTION.easeIn,
    },
  },
};

export const accquaWindowVariants: Record<AccquaWindowMotionKind, Variants> = {
  center: {
    hidden: { opacity: 0, y: 18, scale: 0.965, filter: "blur(5px)" },
    visible: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
    exit: {
      opacity: 0,
      y: 10,
      scale: 0.982,
      filter: "blur(3px)",
      transition: {
        duration: ACCQUA_WINDOW_MOTION.panelCloseMs / 1000,
        ease: ACCQUA_WINDOW_MOTION.easeIn,
      },
    },
  },
  sheet: {
    hidden: { opacity: 0, y: 42, scale: 0.992, filter: "blur(3px)" },
    visible: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
    exit: {
      opacity: 0,
      y: 28,
      scale: 0.995,
      filter: "blur(2px)",
      transition: {
        duration: ACCQUA_WINDOW_MOTION.panelCloseMs / 1000,
        ease: ACCQUA_WINDOW_MOTION.easeIn,
      },
    },
  },
  viewer: {
    hidden: { opacity: 0, scale: 0.94, filter: "blur(7px)" },
    visible: { opacity: 1, scale: 1, filter: "blur(0px)" },
    exit: {
      opacity: 0,
      scale: 0.975,
      filter: "blur(4px)",
      transition: {
        duration: ACCQUA_WINDOW_MOTION.panelCloseMs / 1000,
        ease: ACCQUA_WINDOW_MOTION.easeIn,
      },
    },
  },
};
