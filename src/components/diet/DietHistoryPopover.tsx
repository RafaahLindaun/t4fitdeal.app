import { useEffect, useRef, useState } from "react";
import type { DietHistoryDay } from "../../lib/diet";

function CalendarIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="15" rx="3"/><path d="M7.5 3.5v4M16.5 3.5v4M3.5 9.5h17"/></svg>;
}

export default function DietHistoryPopover({ mode, days }: { mode: "water" | "calories"; days: DietHistoryDay[] }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const visible = days.slice(-14);
  return <div className="diet-history-popover-root" ref={rootRef}>
    <button type="button" className="diet-history-trigger" aria-label={`Ver histórico de ${mode === "water" ? "água" : "calorias"} dos últimos 14 dias`} aria-expanded={open} onClick={() => setOpen((value) => !value)}><CalendarIcon /></button>
    {open ? <div className="diet-history-popover" role="dialog" aria-label={`Histórico de ${mode === "water" ? "hidratação" : "calorias"}`}>
      <strong>Últimos 14 dias</strong>
      <div className="diet-history-days">
        {visible.map((day) => {
          const ratio = mode === "water" ? (day.waterTargetMl > 0 ? day.waterMl / day.waterTargetMl : 0) : (day.calorieTarget > 0 ? day.consumedCalories / day.calorieTarget : 0);
          const pct = Math.max(0, Math.min(100, ratio * 100));
          const kcalClass = ratio >= .9 && ratio <= 1.1 ? "is-good" : ratio >= .75 && ratio <= 1.25 ? "is-medium" : "is-far";
          return <div key={day.dateKey} className="diet-history-day" title={day.dateKey}>
            <span className={mode === "calories" ? kcalClass : "is-water"} style={mode === "water" ? { "--diet-history-fill": `${pct}%` } as React.CSSProperties : undefined} aria-label={`${day.label}: ${Math.round(pct)}%`} />
            <small>{day.label.slice(0,3)}</small>
          </div>;
        })}
      </div>
    </div> : null}
  </div>;
}
