type AppBackIconProps = {
  size?: number;
  className?: string;
};

export default function AppBackIcon({ size = 24, className = "" }: AppBackIconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m14.8 5.2-6.7 6.8 6.7 6.8" />
    </svg>
  );
}
