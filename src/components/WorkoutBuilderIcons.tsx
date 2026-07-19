type IconProps = {
  size?: number;
  className?: string;
};

const base = (size: number, strokeWidth = 1.8) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export function BuilderBackIcon({ size = 23, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size)}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export function BuilderSearchIcon({ size = 21, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size)}>
      <circle cx="10.8" cy="10.8" r="6.7" />
      <path d="m16 16 4.2 4.2" />
    </svg>
  );
}

export function BuilderStudentIcon({ size = 23, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size)}>
      <circle cx="12" cy="7.6" r="3.4" />
      <path d="M4.8 20c.45-4.35 3-6.7 7.2-6.7s6.75 2.35 7.2 6.7" />
    </svg>
  );
}

export function BuilderDumbbellIcon({ size = 23, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size)}>
      <path d="M7 8.7v6.6M4.3 10v4M17 8.7v6.6M19.7 10v4M7 12h10" />
    </svg>
  );
}

export function BuilderCheckIcon({ size = 22, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size, 2.15)}>
      <path d="m5 12.5 4.3 4.3L19.2 7" />
    </svg>
  );
}

export function BuilderPlusIcon({ size = 21, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size, 2)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function BuilderMinusIcon({ size = 21, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size, 2)}>
      <path d="M5 12h14" />
    </svg>
  );
}

export function BuilderTrashIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size)}>
      <path d="M4.5 7h15M9 4.5h6M7.2 7l.7 12h8.2l.7-12M10 10.5v5.5M14 10.5v5.5" />
    </svg>
  );
}

export function BuilderUpIcon({ size = 19, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size, 2)}>
      <path d="m6 14 6-6 6 6" />
    </svg>
  );
}

export function BuilderDownIcon({ size = 19, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size, 2)}>
      <path d="m6 10 6 6 6-6" />
    </svg>
  );
}

export function BuilderSaveIcon({ size = 21, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size)}>
      <path d="M5 4h12l2 2v14H5V4Z" />
      <path d="M8 4v6h8V4M8 20v-6h8v6" />
    </svg>
  );
}

export function BuilderTemplateIcon({ size = 21, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size)}>
      <rect x="5" y="4" width="14" height="16" rx="2" />
      <path d="M8.5 8h7M8.5 12h7M8.5 16h4.2" />
    </svg>
  );
}

export function BuilderLightIcon({ size = 22, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size)}>
      <path d="M8.3 15.4a6 6 0 1 1 7.4 0c-1 .75-1.5 1.55-1.55 2.6h-4.3c-.05-1.05-.55-1.85-1.55-2.6Z" />
      <path d="M9.7 21h4.6M12 1.5v1.7M4.6 4.6l1.2 1.2M19.4 4.6l-1.2 1.2" />
    </svg>
  );
}

export function BuilderCloseIcon({ size = 21, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size, 2)}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function BuilderChevronIcon({ size = 18, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size, 2)}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
