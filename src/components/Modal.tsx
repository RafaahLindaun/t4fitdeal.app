import type { ReactNode } from "react";
import Icon from "./Icon";

export default function Modal({
  open,
  title,
  onClose,
  children,
  wide = false,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className={`modal-card ${wide ? "wide" : ""}`} onMouseDown={(e) => e.stopPropagation()}>
        <header><h2>{title}</h2><button className="icon-button" onClick={onClose}><Icon name="close"/></button></header>
        <div className="modal-content">{children}</div>
      </section>
    </div>
  );
}
