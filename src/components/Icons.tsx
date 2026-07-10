import type { CSSProperties } from "react";

const common: CSSProperties = {
  width: 20,
  height: 20,
  stroke: "currentColor",
  fill: "none",
  strokeWidth: 1.9,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function Icon({ name, size = 20, className = "" }: { name: string; size?: number; className?: string }) {
  const props = { ...common, width: size, height: size } as any;
  const map: Record<string, JSX.Element> = {
    home: <svg viewBox="0 0 24 24" style={props}><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.8V21h14V9.8"/></svg>,
    training: <svg viewBox="0 0 24 24" style={props}><path d="M5 8v8"/><path d="M19 8v8"/><path d="M2 10v4"/><path d="M22 10v4"/><path d="M5 12h14"/></svg>,
    cardio: <svg viewBox="0 0 24 24" style={props}><path d="M4 16h16"/><path d="M6 16v-4h4l2-3 3 7 2-4h1"/></svg>,
    diet: <svg viewBox="0 0 24 24" style={props}><path d="M12 7c1.8-2.1 3.2-2.8 5-2"/><path d="M12 7c-2.5-1.7-7-1.2-7 4.3C5 16.6 8.4 21 11 19.4c.7-.4 1.3-.4 2 0 2.6 1.6 6-2.8 6-8.1C19 6 14.5 5.3 12 7Z"/></svg>,
    ranking: <svg viewBox="0 0 24 24" style={props}><path d="M12 3 9.3 8.3 3.5 9.1l4.2 4.1-1 5.8L12 16.2l5.3 2.8-1-5.8 4.2-4.1-5.8-.8Z"/></svg>,
    store: <svg viewBox="0 0 24 24" style={props}><path d="M4 7h16"/><path d="M6 7l1.4 13h9.2L18 7"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/></svg>,
    account: <svg viewBox="0 0 24 24" style={props}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>,
    team: <svg viewBox="0 0 24 24" style={props}><circle cx="8" cy="8" r="3"/><circle cx="17" cy="7" r="2.5"/><path d="M3 20a6 6 0 0 1 10 0"/><path d="M14.5 19a4.8 4.8 0 0 1 6.5-1.1"/></svg>,
    info: <svg viewBox="0 0 24 24" style={props}><circle cx="12" cy="12" r="9"/><path d="M12 10v6"/><path d="M12 7h.01"/></svg>,
    search: <svg viewBox="0 0 24 24" style={props}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>,
    plus: <svg viewBox="0 0 24 24" style={props}><path d="M12 5v14"/><path d="M5 12h14"/></svg>,
    arrow: <svg viewBox="0 0 24 24" style={props}><path d="m9 6 6 6-6 6"/></svg>,
    calendar: <svg viewBox="0 0 24 24" style={props}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4"/><path d="M17 3v4"/><path d="M3 10h18"/></svg>,
    message: <svg viewBox="0 0 24 24" style={props}><path d="M5 18h8l4 3v-3h2a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2Z"/></svg>,
    settings: <svg viewBox="0 0 24 24" style={props}><path d="M12 3v3"/><path d="M12 18v3"/><path d="M3 12h3"/><path d="M18 12h3"/><circle cx="12" cy="12" r="4"/></svg>,
    bell: <svg viewBox="0 0 24 24" style={props}><path d="M6 17h12"/><path d="M8 17V11a4 4 0 1 1 8 0v6"/><path d="M10 21h4"/></svg>,
    shield: <svg viewBox="0 0 24 24" style={props}><path d="M12 3 5 6v5c0 5 3.5 8 7 10 3.5-2 7-5 7-10V6l-7-3Z"/></svg>,
  };
  return <span className={className}>{map[name] || map.home}</span>;
}
