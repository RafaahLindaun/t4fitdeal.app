type Props = { size?: number; className?: string };
const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export function UserIcon({ size = 24, className = "" }: Props) {
  return <svg className={className} {...base(size)}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>;
}
export function LockIcon({ size = 24, className = "" }: Props) {
  return <svg className={className} {...base(size)}><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>;
}
export function EyeIcon({ size = 24, className = "" }: Props) {
  return <svg className={className} {...base(size)}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>;
}
export function DumbbellIcon({ size = 24, className = "" }: Props) {
  return <svg className={className} {...base(size)}><path d="M5 7v10M19 7v10M2 10v4M22 10v4M5 12h14"/></svg>;
}
export function AppleIcon({ size = 24, className = "" }: Props) {
  return <svg className={className} {...base(size)}><path d="M12 7c2-2 3.3-2.8 5-2"/><path d="M12 7c-2.5-1.7-7-1.2-7 4.3C5 16.6 8.4 21 11 19.4c.7-.4 1.3-.4 2 0 2.6 1.6 6-2.8 6-8.1C19 6 14.5 5.3 12 7Z"/><path d="M12 7c-.1-1.5.5-2.8 1.8-3.8"/></svg>;
}
export function CalendarIcon({ size = 24, className = "" }: Props) {
  return <svg className={className} {...base(size)}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></svg>;
}
export function ChartIcon({ size = 24, className = "" }: Props) {
  return <svg className={className} {...base(size)}><path d="M4 19V5M4 19h16M7 15l3-3 3 2 5-7"/></svg>;
}
export function HeadsetIcon({ size = 24, className = "" }: Props) {
  return <svg className={className} {...base(size)}><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M4 14h3v5H4zM17 14h3v5h-3zM17 19c0 1.1-.9 2-2 2h-3"/></svg>;
}
