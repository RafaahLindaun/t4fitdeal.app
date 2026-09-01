import { motion, useReducedMotion } from "framer-motion";

type Props = {
  className?: string;
  size?: number;
};

export default function CompletionCheckmark({ className, size = 48 }: Props) {
  const reduceMotion = Boolean(useReducedMotion());

  return (
    <motion.svg
      className={className}
      viewBox="0 0 48 48"
      width={size}
      height={size}
      aria-hidden="true"
      initial={reduceMotion ? false : { scale: 0.82, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <circle cx="24" cy="24" r="20" fill="rgba(255,209,40,.13)" stroke="rgba(255,209,40,.48)" />
      <motion.path
        d="M15 24.5l6 6L34 17"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduceMotion ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.52, ease: [0.2, 0.8, 0.2, 1] }}
      />
    </motion.svg>
  );
}
