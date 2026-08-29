import type { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

export function IconButton({ className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={clsx("accqua-icon-button", className)} {...props}>{children}</button>;
}

export function ActionButton({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  return <button type="button" className={clsx("accqua-action-button", `is-${variant}`, className)} {...props}>{children}</button>;
}

export function FilterPill({
  active = false,
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; children: ReactNode }) {
  return <button type="button" className={clsx("accqua-filter-pill", active && "is-active", className)} {...props}>{children}</button>;
}
