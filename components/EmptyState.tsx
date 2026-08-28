import type { ReactNode } from "react";
import clsx from "clsx";
import "./empty-state.css";

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("accqua-empty-state", className)} role="status">
      {icon ? <span className="accqua-empty-state-icon" aria-hidden="true">{icon}</span> : null}
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
      {action ? <div className="accqua-empty-state-action">{action}</div> : null}
    </div>
  );
}
