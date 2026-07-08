import type { ReactNode } from "react";
import Icon from "./Icon";

export default function EmptyState({
  icon = "info",
  title,
  text,
  action,
}: {
  icon?: string;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state card">
      <span className="empty-icon"><Icon name={icon} size={38}/></span>
      <h2>{title}</h2>
      <p>{text}</p>
      {action}
    </div>
  );
}
