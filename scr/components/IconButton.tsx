import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import "./icon-button.css";

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  size?: "md";
  children: ReactNode;
};

export default function IconButton({
  size = "md",
  className,
  type = "button",
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={clsx("accqua-icon-button", `is-${size}`, className)}
    >
      {children}
    </button>
  );
}
