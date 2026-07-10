import type { ReactNode } from "react";

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`.trim()}>{children}</section>;
}

export function SectionTitle({ title, hint, right }: { title: string; hint?: string; right?: ReactNode }) {
  return (
    <div className="section-title">
      <div>
        <h3>{title}</h3>
        {hint ? <p>{hint}</p> : null}
      </div>
      {right}
    </div>
  );
}

export function Stat({ label, value, small }: { label: string; value: ReactNode; small?: boolean }) {
  return (
    <div className={`stat-card ${small ? "small" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
