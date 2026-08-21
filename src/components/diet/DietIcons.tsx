type IconProps = { size?: number; className?: string };

function base(size: number, className?: string) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };
}

export function DietBackIcon({ size = 22, className }: IconProps) {
  return <svg {...base(size, className)}><path d="m14.5 5-7 7 7 7" /></svg>;
}
export function DietDropIcon({ size = 22, className }: IconProps) {
  return <svg {...base(size, className)}><path d="M12 3.3S6.3 9.4 6.3 14a5.7 5.7 0 0 0 11.4 0C17.7 9.4 12 3.3 12 3.3Z" /><path d="M9.2 14.2c.2 1.5 1.2 2.5 2.7 2.8" /></svg>;
}
export function DietCameraIcon({ size = 22, className }: IconProps) {
  return <svg {...base(size, className)}><path d="M4.2 8.5h3l1.3-2h7l1.3 2h3v10h-15Z" /><circle cx="12" cy="13.5" r="3.1" /></svg>;
}
export function DietRecipeIcon({ size = 22, className }: IconProps) {
  return <svg {...base(size, className)}><path d="M7 4.5h10a2 2 0 0 1 2 2v13H7a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2Z" /><path d="M8.5 8h7M8.5 11.5h5M8.5 15h6" /></svg>;
}
export function DietFireIcon({ size = 22, className }: IconProps) {
  return <svg {...base(size, className)}><path d="M12.5 3.2c1.7 3-1 4.1.9 6.2 1.2 1.3 2.5-.2 2.4-1.4 2.4 2.2 3.2 4.8 2.2 7.4A6.3 6.3 0 0 1 6 14.6c-.6-2.3.4-4.9 2.6-7.1-.1 2.3 1.1 3.2 2.2 2 1.2-1.4.1-3.6 1.7-6.3Z" /></svg>;
}
export function DietPlusIcon({ size = 22, className }: IconProps) {
  return <svg {...base(size, className)}><path d="M12 5v14M5 12h14" /></svg>;
}
export function DietCheckIcon({ size = 22, className }: IconProps) {
  return <svg {...base(size, className)}><path d="m5 12.3 4.2 4.2L19 6.8" /></svg>;
}
export function DietEditIcon({ size = 22, className }: IconProps) {
  return <svg {...base(size, className)}><path d="m5 16.8-.7 3 3-.7L18.2 8.2l-2.3-2.3Z" /><path d="m14.5 7.3 2.3 2.3" /></svg>;
}
export function DietCloseIcon({ size = 22, className }: IconProps) {
  return <svg {...base(size, className)}><path d="m6 6 12 12M18 6 6 18" /></svg>;
}
export function DietSparkIcon({ size = 22, className }: IconProps) {
  return <svg {...base(size, className)}><path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2Z" /><path d="m18.5 13 .7 2.2 2.3.8-2.3.7-.7 2.3-.8-2.3-2.2-.7 2.2-.8Z" /></svg>;
}
export function DietChevronIcon({ size = 22, className }: IconProps) {
  return <svg {...base(size, className)}><path d="m9 5 7 7-7 7" /></svg>;
}
