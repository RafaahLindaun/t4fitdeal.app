type IconProps = {
  size?: number;
  className?: string;
};

function base(size: number, strokeWidth = 1.75) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
}

export function AdminBackIcon({ size = 22, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size)}>
      <path d="m14.8 5.2-6.7 6.8 6.7 6.8" />
    </svg>
  );
}

export function AdminSearchIcon({ size = 21, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size)}>
      <circle cx="10.8" cy="10.8" r="6.2" />
      <path d="m15.4 15.4 4.2 4.2" />
    </svg>
  );
}

export function AdminCloseIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size, 1.9)}>
      <path d="m6.3 6.3 11.4 11.4M17.7 6.3 6.3 17.7" />
    </svg>
  );
}

export function AdminShieldIcon({ size = 23, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size)}>
      <path d="M12 3.1 5.7 5.7v4.7c0 4.3 2.6 7.5 6.3 9.5 3.7-2 6.3-5.2 6.3-9.5V5.7L12 3.1Z" />
      <path d="m8.7 11.8 2.1 2.1 4.6-4.7" />
    </svg>
  );
}

export function AdminLockIcon({ size = 22, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size)}>
      <rect x="5.2" y="10.1" width="13.6" height="10" rx="2.2" />
      <path d="M8.3 10.1V7.7a3.7 3.7 0 0 1 7.4 0v2.4M12 14.2v2.2" />
    </svg>
  );
}

export function AdminUserIcon({ size = 23, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size)}>
      <circle cx="12" cy="7.8" r="3.4" />
      <path d="M5.2 20.1c.4-4.5 2.8-6.8 6.8-6.8s6.4 2.3 6.8 6.8" />
    </svg>
  );
}

export function AdminEditIcon({ size = 21, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size)}>
      <path d="m4.6 16.9-.7 3.2 3.2-.7L18.4 8.1l-2.5-2.5L4.6 16.9Z" />
      <path d="m14.7 6.8 2.5 2.5M13.3 20.1h6.8" />
    </svg>
  );
}

export function AdminDumbbellIcon({ size = 23, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size, 1.85)}>
      <path d="M7.1 8.7v6.6M4.6 10.1v3.8M16.9 8.7v6.6M19.4 10.1v3.8M7.1 12h9.8" />
    </svg>
  );
}

export function AdminBoltIcon({ size = 22, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size)}>
      <path d="M13.7 2.9 5.5 13.2h5.4l-.7 7.9 8.3-10.4h-5.4l.6-7.8Z" />
    </svg>
  );
}

export function AdminChevronIcon({ size = 19, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size)}>
      <path d="m9 5.5 6.2 6.5L9 18.5" />
    </svg>
  );
}

export function AdminCheckIcon({ size = 21, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size, 2)}>
      <path d="m5.1 12.4 4.1 4.1 9.7-9.8" />
    </svg>
  );
}

export function AdminPlusIcon({ size = 21, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size, 2)}>
      <path d="M12 5.5v13M5.5 12h13" />
    </svg>
  );
}

export function AdminMinusIcon({ size = 21, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size, 2)}>
      <path d="M5.5 12h13" />
    </svg>
  );
}

export function AdminTrashIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size)}>
      <path d="M4.8 7.1h14.4M9.1 7.1V4.5h5.8v2.6M7 7.1l.8 12.2h8.4L17 7.1M10 10.6v5.6M14 10.6v5.6" />
    </svg>
  );
}

export function AdminSaveIcon({ size = 21, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size)}>
      <path d="M5 3.8h12.1L20 6.7v13.5H4V3.8h1Z" />
      <path d="M8 3.8v5h8v-5M8 20.2v-7.1h8v7.1" />
    </svg>
  );
}

export function AdminCardioIcon({ size = 23, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size, 1.9)}>
      <path d="M3 12h4l1.8-4.7 3.2 10.1 2.5-7.2 1.8 1.8H21" />
    </svg>
  );
}

export function AdminInfoIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 10.5v5M12 7.5h.01" />
    </svg>
  );
}

export function AdminCalendarIcon({ size = 21, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size)}>
      <rect x="3.8" y="5.5" width="16.4" height="14.2" rx="2" />
      <path d="M7.5 3.5v4M16.5 3.5v4M3.8 9.5h16.4" />
    </svg>
  );
}

export function AdminLayersIcon({ size = 22, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size)}>
      <path d="m12 3.8 8.3 4.5-8.3 4.5-8.3-4.5L12 3.8Z" />
      <path d="m5.2 12.1 6.8 3.7 6.8-3.7M5.2 16l6.8 3.7 6.8-3.7" />
    </svg>
  );
}

export function AdminUpIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size)}>
      <path d="m6.2 14.4 5.8-5.8 5.8 5.8" />
    </svg>
  );
}

export function AdminDownIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size)}>
      <path d="m6.2 9.6 5.8 5.8 5.8-5.8" />
    </svg>
  );
}
export function AdminLinkIcon({ size = 22, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size)}>
      <path d="M9.4 14.6 7.8 16.2a3.3 3.3 0 0 1-4.7-4.7l3-3a3.3 3.3 0 0 1 4.7 0" />
      <path d="m14.6 9.4 1.6-1.6a3.3 3.3 0 1 1 4.7 4.7l-3 3a3.3 3.3 0 0 1-4.7 0" />
      <path d="m8.7 15.3 6.6-6.6" />
    </svg>
  );
}

export function AdminTargetIcon({ size = 22, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size)}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.6" />
      <circle cx="12" cy="12" r="1.2" />
    </svg>
  );
}

export function AdminSparkIcon({ size = 22, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size)}>
      <path d="m12 2.8 1.2 4.1 4 1.2-4 1.2-1.2 4.1-1.2-4.1-4-1.2 4-1.2L12 2.8Z" />
      <path d="m18.5 14.2.7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7-2.3Z" />
      <path d="m5.4 14.8.5 1.7 1.7.5-1.7.5-.5 1.7-.5-1.7-1.7-.5 1.7-.5.5-1.7Z" />
    </svg>
  );
}

export function AdminWarningIcon({ size = 22, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size)}>
      <path d="M10.4 4.5 3.5 17a2 2 0 0 0 1.8 3h13.4a2 2 0 0 0 1.8-3L13.6 4.5a1.8 1.8 0 0 0-3.2 0Z" />
      <path d="M12 9v4.7M12 17h.01" />
    </svg>
  );
}
export function AdminPeopleIcon({ size = 23, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size)}>
      <circle cx="9" cy="8.2" r="3.1" />
      <path d="M3.7 19.3c.3-4 2.1-6 5.3-6s5 2 5.3 6" />
      <circle cx="17.3" cy="9.3" r="2.2" />
      <path d="M15.3 14.3c2.8-.5 4.6 1.1 5 4.5" />
    </svg>
  );
}

export function AdminClipboardListIcon({ size = 22, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size)}>
      <rect x="5" y="4.8" width="14" height="16" rx="2.2" />
      <path d="M9 4.8V3.4h6v1.4M8.5 9h7M8.5 13h7M8.5 17h4.5" />
    </svg>
  );
}

export function AdminShoppingBagIcon({ size = 22, className = "" }: IconProps) {
  return (
    <svg className={className} {...base(size)}>
      <path d="M5 8h14l-1 12H6L5 8Z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </svg>
  );
}
