import type { SVGProps } from "react";

export type IconName =
  | "back" | "info" | "bell" | "lock" | "user" | "home" | "dumbbell" | "apple"
  | "trophy" | "clipboard" | "bag" | "gear" | "calendar" | "chart" | "fire" | "water"
  | "leaf" | "chef" | "star" | "clock" | "weight" | "message" | "heart" | "check"
  | "plus" | "minus" | "play" | "pause" | "bike" | "treadmill" | "swim" | "music"
  | "mail" | "phone" | "map" | "shield" | "logout" | "key" | "sound" | "globe"
  | "ruler" | "device" | "medal" | "shirt" | "bolt" | "stairs" | "walk" | "rows"
  | "plate" | "eye" | "counter" | "target" | "spark" | "edit" | "camera";

const paths: Record<IconName, JSX.Element> = {
  back: <path d="M15 5 8 12l7 7" />,
  info: <><path d="M12 17v-6" /><path d="M12 7h.01" /><circle cx="12" cy="12" r="9" /></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
  lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  home: <><path d="M3 11 12 3l9 8" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></>,
  dumbbell: <><path d="M6 6v12M18 6v12M3 9v6M21 9v6M6 12h12" /></>,
  apple: <><path d="M12 7c-2-2-6-1.5-7 2.5-1.2 4.7 2.5 9.5 5 9.5 1.1 0 1.2-.6 2-.6s.9.6 2 .6c2.5 0 6.2-4.8 5-9.5C18 5.5 14 5 12 7Z" /><path d="M13 5c.5-2 2-3 4-3" /></>,
  trophy: <><path d="M8 21h8" /><path d="M12 17v4" /><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" /><path d="M7 7H4a3 3 0 0 0 3 3" /><path d="M17 7h3a3 3 0 0 1-3 3" /></>,
  clipboard: <><rect x="6" y="4" width="12" height="17" rx="2" /><path d="M9 4V2h6v2" /><path d="M9 13h6" /><path d="M9 17h4" /></>,
  bag: <><path d="M6 8h12l1 13H5L6 8Z" /><path d="M9 8a3 3 0 0 1 6 0" /></>,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1-2.1 2.1-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V20h-3v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1-2.1-2.1.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H4v-3h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1 2.1-2.1.1.1a1.7 1.7 0 0 0 1.8.3 1.7 1.7 0 0 0 1-1.5V4h3v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1 2.1 2.1-.1.1a1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 1.5 1h.1v3h-.1a1.7 1.7 0 0 0-1.5 1Z" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
  chart: <><path d="M4 19V5" /><path d="M4 19h16" /><path d="M8 16v-5M12 16V8M16 16v-9" /></>,
  fire: <path d="M12 21c4 0 7-3 7-7 0-4.5-4-7.5-6-11-.5 3-2.5 4.5-4.5 6.5A7 7 0 0 0 12 21Z" />,
  water: <path d="M12 21a7 7 0 0 0 7-7c0-4-7-12-7-12S5 10 5 14a7 7 0 0 0 7 7Z" />,
  leaf: <><path d="M20 4C12 4 5 9 5 17c0 2 1 3 3 3 8 0 11-8 12-16Z" /><path d="M5 20c3-6 7-9 12-11" /></>,
  chef: <><path d="M6 11a4 4 0 0 1 1-7 5 5 0 0 1 10 0 4 4 0 0 1 1 7" /><path d="M7 11h10v9H7z" /><path d="M9 15h6" /></>,
  star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  weight: <><path d="M8 10h8l2 10H6l2-10Z" /><path d="M9 10a3 3 0 0 1 6 0" /><path d="M12 14v2" /></>,
  message: <><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" /><path d="M8 10h8M8 14h5" /></>,
  heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />,
  check: <path d="m5 13 4 4L19 7" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  play: <path d="m8 5 12 7-12 7V5Z" />,
  pause: <path d="M8 5v14M16 5v14" />,
  bike: <><circle cx="6" cy="17" r="3" /><circle cx="18" cy="17" r="3" /><path d="M8 17l4-7 3 7M12 10h4M12 10 9 7" /></>,
  treadmill: <><path d="M4 17h14l2-4" /><path d="M7 17V9" /><path d="M11 17V9" /><path d="M7 9h6" /></>,
  swim: <><path d="M4 17c2 0 2-1 4-1s2 1 4 1 2-1 4-1 2 1 4 1" /><path d="M4 21c2 0 2-1 4-1s2 1 4 1 2-1 4-1 2 1 4 1" /><path d="m13 9 3-3 3 3" /></>,
  music: <><path d="M9 18V5l10-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="16" cy="16" r="3" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.9 19.9 0 0 1-8.7-3.1 19.5 19.5 0 0 1-6-6A19.9 19.9 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />,
  map: <><path d="M12 21s7-5 7-11a7 7 0 0 0-14 0c0 6 7 11 7 11Z" /><circle cx="12" cy="10" r="2" /></>,
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />,
  logout: <><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M21 3v18" /></>,
  key: <><circle cx="7" cy="14" r="3" /><path d="M10 14h11l-3 3 3 3" /></>,
  sound: <><path d="M4 9v6h4l5 4V5L8 9H4Z" /><path d="M16 9a5 5 0 0 1 0 6" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3c3 3 3 15 0 18" /><path d="M12 3c-3 3-3 15 0 18" /></>,
  ruler: <><path d="M4 17 17 4l3 3L7 20 4 17Z" /><path d="m8 13 2 2M11 10l2 2M14 7l2 2" /></>,
  device: <><rect x="6" y="3" width="12" height="18" rx="2" /><path d="M11 18h2" /></>,
  medal: <><circle cx="12" cy="9" r="5" /><path d="m9 14-2 7 5-3 5 3-2-7" /></>,
  shirt: <path d="M7 4 4 6v5l3-1v10h10V10l3 1V6l-3-2-3 2h-4L7 4Z" />,
  bolt: <path d="M13 2 3 14h8l-1 8 11-13h-8l0-7Z" />,
  stairs: <path d="M3 20h18M5 17h4v-4h4V9h4V5h4" />,
  walk: <><circle cx="13" cy="5" r="2" /><path d="M10 22l2-7-3-3 2-4 4 2 2 4" /><path d="M14 15l4 7" /></>,
  rows: <><path d="M5 17h14" /><path d="M8 14h8" /><path d="M12 7v7" /><path d="m9 10 3-3 3 3" /></>,
  plate: <><circle cx="12" cy="12" r="8" /><path d="M12 4v16M4 12h16" /></>,
  eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  counter: <><path d="M4 19V5" /><path d="M4 19h16" /><path d="M8 15l3-3 3 2 4-7" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
  spark: <path d="M12 2 9 9 2 12l7 3 3 7 3-7 7-3-7-3-3-7Z" />,
  edit: <><path d="M4 20h4l10-10-4-4L4 16v4Z" /><path d="m13 7 4 4" /></>,
  camera: <><path d="M4 8h4l2-3h4l2 3h4v11H4V8Z" /><circle cx="12" cy="14" r="3" /></>,
};

export function Icon({ name, size = 24, strokeWidth = 2.2, ...props }: SVGProps<SVGSVGElement> & { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {paths[name]}
    </svg>
  );
}
