import { useState, type ReactNode } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import clsx from "clsx";
import "./swipeable-list-item.css";

function TrashIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5m4-5v5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

export default function SwipeableListItem({
  children,
  onDelete,
  disabled = false,
  deleteLabel = "Excluir",
  className,
}: {
  children: ReactNode;
  onDelete: () => void | Promise<void>;
  disabled?: boolean;
  deleteLabel?: string;
  className?: string;
}) {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-84, -18], [1, 0]);
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);

  const settle = (target: number) => {
    if (reduceMotion) { x.set(target); return; }
    animate(x, target, { type: "spring", stiffness: 520, damping: 42, mass: 0.7 });
  };
  const reveal = () => {
    if (disabled) return;
    setOpen(true);
    settle(-84);
  };
  const close = () => {
    setOpen(false);
    settle(0);
  };
  const remove = async () => {
    if (disabled) return;
    await onDelete();
    close();
  };

  return (
    <div data-tab-swipe-ignore className={clsx("accqua-swipe-item", open && "is-open", disabled && "is-disabled", className)}>
      <div className="accqua-swipe-delete" style={{ opacity: disabled ? 0 : undefined }}>
        <motion.button
          type="button"
          style={{ opacity }}
          onClick={() => void remove()}
          aria-label={deleteLabel}
          disabled={disabled}
        >
          <TrashIcon />
          <span>{deleteLabel}</span>
        </motion.button>
      </div>
      <motion.div
        className="accqua-swipe-content"
        drag={disabled || reduceMotion ? false : "x"}
        dragDirectionLock
        dragConstraints={{ left: -84, right: 0 }}
        dragElastic={0.04}
        style={{ x }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -58 || info.velocity.x < -500) reveal();
          else close();
        }}
        onClick={() => { if (open) close(); }}
      >
        {children}
        {!disabled ? (
          <button
            type="button"
            className="accqua-swipe-desktop-delete"
            onClick={(event) => { event.stopPropagation(); void remove(); }}
            aria-label={deleteLabel}
            title={deleteLabel}
          ><TrashIcon /></button>
        ) : null}
      </motion.div>
    </div>
  );
}
