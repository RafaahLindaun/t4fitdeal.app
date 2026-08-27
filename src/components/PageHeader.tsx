import type { ReactNode } from "react";
import clsx from "clsx";
import "./page-header.css";

type PageHeaderProps = {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  className?: string;
  ariaLabel?: string;
};

export default function PageHeader({ left, center, right, className, ariaLabel }: PageHeaderProps) {
  return (
    <header className={clsx("accqua-page-header", className)} aria-label={ariaLabel} data-testid="page-header">
      <div className="accqua-page-header-slot is-left">{left}</div>
      <div className="accqua-page-header-center">{center}</div>
      <div className="accqua-page-header-slot is-right">{right}</div>
    </header>
  );
}
