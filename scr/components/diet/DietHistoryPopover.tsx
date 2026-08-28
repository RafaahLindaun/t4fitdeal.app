import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { DietHistoryDay } from "../../lib/diet";
import { useHeatmapDiario, type HeatmapPoint } from "../../hooks/useHeatmapDiario";

function CalendarIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="15" rx="3"/><path d="M7.5 3.5v4M16.5 3.5v4M3.5 9.5h17"/></svg>;
}

function CheckIcon() {
  return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 10.2 3.1 3.1L15.4 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function formatWater(ml: number) {
  if (ml >= 1000) return `${(ml / 1000).toFixed(1).replace(".0", "")}L`;
  return `${Math.round(ml)}ml`;
}

function pointDescription(point: HeatmapPoint, mode: "water" | "calories", day?: DietHistoryDay) {
  if (point.future) return `${point.label}: data futura`;
  if (!day) return `${point.label}: sem registro`;
  if (mode === "water") {
    if (!day.waterMl) return `${point.label}: sem registro de água`;
    return `${point.label}: ${formatWater(day.waterMl)} de ${formatWater(day.waterTargetMl)} (${Math.round(point.ratio * 100)}%)`;
  }
  if (!day.consumedCalories) return `${point.label}: sem registro de calorias`;
  return `${point.label}: ${Math.round(day.consumedCalories)} de ${Math.round(day.calorieTarget)} kcal (${Math.round(point.ratio * 100)}%)`;
}

export default function DietHistoryPopover({ mode, days }: { mode: "water" | "calories"; days: DietHistoryDay[] }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const points = useHeatmapDiario(days, mode === "water" ? "agua" : "kcal", 14);
  const dayByKey = useMemo(() => new Map(days.map((day) => [day.dateKey, day])), [days]);

  const summary = useMemo(() => {
    const available = points.filter((point) => !point.future);
    if (mode === "water") {
      const hit = available.filter((point) => point.ratio >= 1).length;
      const totalMl = available.reduce((sum, point) => sum + (dayByKey.get(point.dateKey)?.waterMl ?? 0), 0);
      const registered = available.filter((point) => (dayByKey.get(point.dateKey)?.waterMl ?? 0) > 0).length;
      return {
        headline: `${hit}/${available.length} metas batidas`,
        detail: registered ? `Média ${formatWater(totalMl / registered)}/dia registrado` : "Comece registrando sua água hoje",
      };
    }
    const inside = available.filter((point) => point.tone === "good").length;
    const registeredDays = available.filter((point) => (dayByKey.get(point.dateKey)?.consumedCalories ?? 0) > 0);
    const total = registeredDays.reduce((sum, point) => sum + (dayByKey.get(point.dateKey)?.consumedCalories ?? 0), 0);
    return {
      headline: `${inside}/${available.length} dias dentro da meta`,
      detail: registeredDays.length ? `Média ${Math.round(total / registeredDays.length).toLocaleString("pt-BR")} kcal` : "Registre refeições para acompanhar a tendência",
    };
  }, [dayByKey, mode, points]);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  return <div className="diet-history-popover-root" ref={rootRef}>
    <button type="button" className="diet-history-trigger" aria-label={`Ver histórico de ${mode === "water" ? "água" : "calorias"} dos últimos 14 dias`} aria-expanded={open} onClick={() => setOpen((value) => !value)}><CalendarIcon /></button>
    {open ? <div className={`diet-history-popover is-${mode}`} role="dialog" aria-label={`Histórico de ${mode === "water" ? "hidratação" : "calorias"}`}>
      <header className="diet-history-header">
        <div><span>{mode === "water" ? "HIDRATAÇÃO" : "BALANÇO CALÓRICO"}</span><strong>Últimos 14 dias</strong></div>
        <b>{summary.headline}</b>
        <small>{summary.detail}</small>
      </header>
      <div className="diet-history-days">
        {points.map((point) => {
          const day = dayByKey.get(point.dateKey);
          const completeWater = mode === "water" && point.ratio >= 1 && !point.future;
          const baseToneClass = point.tone === "future" ? "is-future" : point.tone === "empty" ? "is-empty" : point.tone === "water" ? "is-water" : `is-${point.tone}`;
          const toneClass = `${baseToneClass}${completeWater ? " is-complete" : ""}`;
          const visualPercent = Math.max(0, Math.min(100, point.ratio * 100));
          return <div key={point.dateKey} className="diet-history-day" title={pointDescription(point, mode, day)}>
            <span
              className={toneClass}
              style={mode === "water" && !point.future ? { "--diet-history-fill": `${visualPercent}%` } as CSSProperties : undefined}
              aria-label={pointDescription(point, mode, day)}
            >
              <i />
              {completeWater ? <CheckIcon /> : mode === "calories" && point.tone !== "empty" && !point.future ? <em>{Math.round(point.ratio * 100)}%</em> : null}
            </span>
            <small>{point.label.slice(0,3)}</small>
          </div>;
        })}
      </div>
      <footer className="diet-history-legend" aria-label="Legenda">
        {mode === "water" ? <>
          <span><i className="is-empty"/>Sem registro</span>
          <span><i className="is-water"/>Parcial</span>
          <span><i className="is-complete"/>Meta</span>
        </> : <>
          <span><i className="is-good"/>Dentro</span>
          <span><i className="is-medium"/>Próximo</span>
          <span><i className="is-far"/>Distante</span>
        </>}
      </footer>
    </div> : null}
  </div>;
}
