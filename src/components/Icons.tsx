import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

const base = (props: IconProps) => ({
  width: props.size ?? 24,
  height: props.size ?? 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...props,
})

export function ArrowLeft(props: IconProps) {
  return <svg {...base(props)}><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
}
export function ChevronRight(props: IconProps) {
  return <svg {...base(props)}><path d="m9 18 6-6-6-6"/></svg>
}
export function HomeIcon(props: IconProps) {
  return <svg {...base(props)}><path d="m3 10.5 9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>
}
export function Dumbbell(props: IconProps) {
  return <svg {...base(props)}><path d="M6 7v10"/><path d="M18 7v10"/><path d="M3 9v6"/><path d="M21 9v6"/><path d="M6 12h12"/></svg>
}
export function CalendarIcon(props: IconProps) {
  return <svg {...base(props)}><path d="M8 2v4"/><path d="M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/></svg>
}
export function UserIcon(props: IconProps) {
  return <svg {...base(props)}><circle cx="12" cy="8" r="4"/><path d="M4 22c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>
}
export function Bell(props: IconProps) {
  return <svg {...base(props)}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>
}
export function Shield(props: IconProps) {
  return <svg {...base(props)}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>
}
export function Lock(props: IconProps) {
  return <svg {...base(props)}><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
}
export function Gear(props: IconProps) {
  return <svg {...base(props)}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6V20a2 2 0 1 1-4 0v-.08a1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1H4a2 2 0 1 1 0-4h.08a1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6V4a2 2 0 1 1 4 0v.08a1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.15.36.36.7.6 1H20a2 2 0 1 1 0 4h-.08a1.7 1.7 0 0 0-.6 1Z"/></svg>
}
export function Trophy(props: IconProps) {
  return <svg {...base(props)}><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v6a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4v2a4 4 0 0 0 4 4"/><path d="M17 6h3v2a4 4 0 0 1-4 4"/></svg>
}
export function Bag(props: IconProps) {
  return <svg {...base(props)}><path d="M6 8h12l1 13H5L6 8Z"/><path d="M9 8a3 3 0 0 1 6 0"/></svg>
}
export function Apple(props: IconProps) {
  return <svg {...base(props)}><path d="M12 6c-1.5-2-4-1.5-5.5.5C4.5 9 5 16 9 21c1.5-1 4.5-1 6 0 4-5 4.5-12 2.5-14.5C16 4.5 13.5 4 12 6Z"/><path d="M12 6c0-2 1.5-3 3-3"/></svg>
}
export function Info(props: IconProps) {
  return <svg {...base(props)}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
}
export function Fire(props: IconProps) {
  return <svg {...base(props)}><path d="M8.5 14.5A4 4 0 0 0 12 21a4 4 0 0 0 3.6-6.2C14.4 12.8 13 11 13.6 8c-2 1.2-3.1 2.7-3.6 4.5-.7-1.4-.8-3.4.3-5.5C7 9.5 5.8 12.5 8.5 14.5Z"/></svg>
}
export function Leaf(props: IconProps) {
  return <svg {...base(props)}><path d="M5 21c1-8 6-14 15-17 0 9-6 14-15 17Z"/><path d="M5 21c4-4 7-7 11-10"/></svg>
}
export function Droplet(props: IconProps) {
  return <svg {...base(props)}><path d="M12 2s7 7.5 7 13a7 7 0 0 1-14 0c0-5.5 7-13 7-13Z"/></svg>
}
export function Chart(props: IconProps) {
  return <svg {...base(props)}><path d="M4 19V5"/><path d="M4 19h16"/><path d="M7 16v-4"/><path d="M12 16V8"/><path d="M17 16v-6"/></svg>
}
export function Clock(props: IconProps) {
  return <svg {...base(props)}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
}
export function Message(props: IconProps) {
  return <svg {...base(props)}><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"/></svg>
}
export function Play(props: IconProps) {
  return <svg {...base(props)}><path d="m8 5 11 7-11 7V5Z"/></svg>
}
export function Pause(props: IconProps) {
  return <svg {...base(props)}><path d="M8 5v14"/><path d="M16 5v14"/></svg>
}
export function Plus(props: IconProps) {
  return <svg {...base(props)}><path d="M12 5v14"/><path d="M5 12h14"/></svg>
}
export function Minus(props: IconProps) {
  return <svg {...base(props)}><path d="M5 12h14"/></svg>
}
export function Check(props: IconProps) {
  return <svg {...base(props)}><path d="m20 6-11 11-5-5"/></svg>
}
export function HeartPulse(props: IconProps) {
  return <svg {...base(props)}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/><path d="M3.5 12h4l1.5-3 3 6 2-4h6.5"/></svg>
}
export function Bike(props: IconProps) {
  return <svg {...base(props)}><circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M8 17h4l3-6h-4l-3 6Z"/><path d="M12 11 9 7"/><path d="M15 11l2-3h2"/></svg>
}
export function Walk(props: IconProps) {
  return <svg {...base(props)}><circle cx="13" cy="4" r="2"/><path d="M10 21v-5l-3-2"/><path d="M15 21l-3-7 1-5 3 2 3 1"/><path d="M9 9l3-2 1 2"/></svg>
}
export function Stairs(props: IconProps) {
  return <svg {...base(props)}><path d="M3 20h18"/><path d="M5 20v-4h4v-4h4V8h4V4h4"/><path d="M7 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M7 9v4l-3 3"/></svg>
}
export function Swimmer(props: IconProps) {
  return <svg {...base(props)}><path d="M4 18c2-1 3-1 5 0s3 1 5 0 3-1 6 0"/><path d="M4 21c2-1 3-1 5 0s3 1 5 0 3-1 6 0"/><path d="M8 13l4-4 3 3"/><circle cx="16" cy="7" r="2"/></svg>
}
export function Shirt(props: IconProps) {
  return <svg {...base(props)}><path d="M16 4 14 2h-4L8 4 3 6l2 5 3-1v11h8V10l3 1 2-5-5-2Z"/></svg>
}
export function Bottle(props: IconProps) {
  return <svg {...base(props)}><path d="M9 2h6v4l2 3v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9l2-3V2Z"/><path d="M9 6h6"/></svg>
}
export function Mail(props: IconProps) {
  return <svg {...base(props)}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>
}
export function Phone(props: IconProps) {
  return <svg {...base(props)}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.4 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.6 1.9Z"/></svg>
}
export function MapPin(props: IconProps) {
  return <svg {...base(props)}><path d="M12 21s7-4.4 7-11A7 7 0 0 0 5 10c0 6.6 7 11 7 11Z"/><circle cx="12" cy="10" r="2"/></svg>
}
export function Clipboard(props: IconProps) {
  return <svg {...base(props)}><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4a3 3 0 0 1 6 0"/><path d="m9 14 2 2 4-4"/></svg>
}
