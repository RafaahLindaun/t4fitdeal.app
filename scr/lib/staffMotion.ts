import type { Transition, Variants } from "framer-motion";

export const staffMotionTransition: Transition = {
  duration: 0.17,
  ease: [0.22, 1, 0.36, 1],
};

export const staffCardVariants: Variants = {
  idle: { y: 0, scale: 1 },
  hover: { y: -3, scale: 1.01 },
  tap: { y: 0, scale: 0.975 },
};

export const staffButtonVariants: Variants = {
  idle: { y: 0, scale: 1 },
  hover: { y: -1, scale: 1 },
  tap: { y: 0, scale: 0.96 },
};

export const staffIconVariants: Variants = {
  idle: { x: 0, y: 0, scale: 1 },
  hover: { x: 2, y: -1, scale: 1.035 },
  tap: { x: 0, y: 0, scale: 0.98 },
};
