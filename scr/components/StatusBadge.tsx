import clsx from "clsx";
import type { HTMLAttributes, ReactNode } from "react";
import "./status-badge.css";

export type StatusBadgeVariant = "success" | "warning" | "danger" | "neutral";

type StatusBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: StatusBadgeVariant;
  children: ReactNode;
};

export default function StatusBadge({
  variant = "neutral",
  className,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      {...props}
      className={clsx("accqua-status-badge", `is-${variant}`, className)}
      data-status-variant={variant}
    >
      {children}
    </span>
  );
}
