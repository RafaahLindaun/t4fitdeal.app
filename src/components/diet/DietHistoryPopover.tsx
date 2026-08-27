import { useEffect, useRef, useState } from "react";
import type { DietHistoryDay } from "../../lib/diet";
import { useHeatmapDiario } from "../../hooks/useHeatmapDiario";

function CalendarIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="15" rx="3"/><path d="M7.5 3.5v4M16.5 3.5v4M3.5 9.5h17"/></svg>;
}

export default function DietHistoryPopover({ mode, days }: { mode: "water" | "calories"; days: DietHistoryDay[] }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const points = useHeatmapDiario(days, mode === "water" ? "agua" : "kcal", 14);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  return <div className="diet-history-popover-root" ref={rootRef}>
    <button type="button" className="diet-history-trigger" aria-label={`Ver histórico de ${mode === "water" ? "água" : "calorias"} dos últimos 14 dias`} aria-expanded={open} onClick={() => setOpen((value) => !value)}><CalendarIcon /></button>
    {open ? <div className="diet-history-popover" role="dialog" aria-label={`Histórico de ${mode === "water" ? "hidratação" : "calorias"}`}>
      <strong>Últimos 14 dias</strong>
      <div className="diet-history-days">
        {points.map((point) => {
          const toneClass = point.tone === "future" ? "is-future" : point.tone === "empty" ? "is-empty" : point.tone === "water" ? "is-water" : `is-${point.tone}`;
          return <div key={point.dateKey} className="diet-history-day" title={point.dateKey}>
            <span
              className={toneClass}
              style={mode === "water" && !point.future ? { "--diet-history-fill": `${point.percent}%` } as React.CSSProperties : undefined}
              aria-label={point.future ? `${point.label}: data futura` : `${point.label}: ${Math.round(point.percent)}%`}
            />
            <small>{point.label.slice(0,3)}</small>
          </div>;
        })}
      </div>
    </div> : null}
  </div>;
}
