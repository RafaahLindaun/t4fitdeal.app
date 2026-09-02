import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { staffCardVariants, staffIconVariants, staffMotionTransition } from "../lib/staffMotion";

type StaffActionCardProps = {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
};

export default function StaffActionCard({
  icon,
  title,
  subtitle,
  meta,
  onClick,
  className = "",
  disabled = false,
  type = "button",
}: StaffActionCardProps) {
  return (
    <motion.button
      type={type}
      className={`staff-action-card ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
      initial="idle"
      animate="idle"
      whileHover={disabled ? undefined : "hover"}
      whileTap={disabled ? undefined : "tap"}
      variants={staffCardVariants}
      transition={staffMotionTransition}
    >
      <motion.span className="staff-action-card-icon" variants={staffIconVariants}>
        {icon}
      </motion.span>
      <span className="staff-action-card-copy">
        <strong>{title}</strong>
        {subtitle ? <p>{subtitle}</p> : null}
      </span>
      {meta ? <em className="staff-action-card-meta">{meta}</em> : null}
    </motion.button>
  );
}
