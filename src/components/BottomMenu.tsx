import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

type IconProps = {
  active: boolean;
};

type Item = {
  to: string;
  label: string;
  Icon: (p: IconProps) => JSX.Element;
  main?: boolean;
};

const ORANGE = "#FF6A00";
const TEXT = "#0f172a";

function HomeIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4.5 10.7 12 4.4l7.5 6.3"
        stroke={active ? "#fff" : ORANGE}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.7 10.2v8.1c0 .8.6 1.4 1.4 1.4h7.8c.8 0 1.4-.6 1.4-1.4v-8.1"
        stroke={active ? "#fff" : ORANGE}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 19.7v-5.1h4v5.1"
        stroke={active ? "#fff" : ORANGE}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NutritionIcon({ active }: IconProps) {
  const c = active ? "#fff" : ORANGE;

  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{
        display: "block",
      }}
    >
      <path
        d="M12 21c-3.9-2.7-6.2-6.1-6.2-9.1A6.2 6.2 0 0 1 12 5.7a6.2 6.2 0 0 1 6.2 6.2c0 3-2.3 6.4-6.2 9.1Z"
        stroke={c}
        strokeWidth="2.25"
        strokeLinejoin="round"
      />
      <path
        d="M12 5.7V3.4"
        stroke={c}
        strokeWidth="2.25"
        strokeLinecap="round"
      />
      <path
        d="M9.2 12.1c1.7.4 3.8.2 5.6-1.3"
        stroke={c}
        strokeWidth="2.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DumbbellIcon({ active }: IconProps) {
  const c = active ? ORANGE : ORANGE;

  return (
    <svg width="30" height="30" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <g transform="rotate(-35 32 32)">
        <rect x="8" y="25" width="7" height="14" rx="2.5" fill={c} opacity="0.94" />
        <rect x="16" y="21" width="8" height="22" rx="3" fill={c} />
        <rect x="25" y="29" width="14" height="6" rx="3" fill={c} />
        <rect x="40" y="21" width="8" height="22" rx="3" fill={c} />
        <rect x="49" y="25" width="7" height="14" rx="2.5" fill={c} opacity="0.94" />
        <path
          d="M18 24.5C20.5 22 24.5 21 32 21C39.5 21 43.5 22 46 24.5"
          stroke="rgba(255,255,255,.22)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

function CardIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="3.7"
        y="6.4"
        width="16.6"
        height="11.2"
        rx="2.6"
        stroke={active ? "#fff" : ORANGE}
        strokeWidth="2.25"
      />
      <path
        d="M4.2 10h15.6"
        stroke={active ? "#fff" : ORANGE}
        strokeWidth="2.25"
        strokeLinecap="round"
      />
      <path
        d="M7.4 14.5h3.5"
        stroke={active ? "#fff" : ORANGE}
        strokeWidth="2.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UserIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 12.2a4.1 4.1 0 1 0 0-8.2 4.1 4.1 0 0 0 0 8.2Z"
        stroke={active ? "#fff" : ORANGE}
        strokeWidth="2.25"
      />
      <path
        d="M4.9 20.1c.8-3.6 3.3-5.5 7.1-5.5s6.3 1.9 7.1 5.5"
        stroke={active ? "#fff" : ORANGE}
        strokeWidth="2.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function BottomMenu() {
  const { pathname } = useLocation();
  const nav = useNavigate();

  const items: Item[] = [
    {
      to: "/dashboard",
      label: "Início",
      Icon: HomeIcon,
    },
    {
      to: "/nutricao",
      label: "Nutrição",
      Icon: NutritionIcon,
    },
    {
      to: "/treino",
      label: "Treino",
      Icon: DumbbellIcon,
      main: true,
    },
    {
      to: "/pagamentos",
      label: "Planos",
      Icon: CardIcon,
    },
    {
      to: "/conta",
      label: "Conta",
      Icon: UserIcon,
    },
  ];

  const activeIndex = Math.max(
    0,
    items.findIndex((it) => pathname === it.to || pathname.startsWith(`${it.to}/`))
  );

  function go(to: string) {
    nav(to);
  }

  return (
    <div style={styles.wrapper}>
      <nav style={styles.nav}>
        <div
          style={{
            ...styles.activePill,
            width: `calc((100% - 12px) / ${items.length})`,
            transform: `translateX(${activeIndex * 100}%)`,
            opacity: items[activeIndex]?.main ? 0 : 1,
          }}
        />

        {items.map((item) => {
          const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
          const Icon = item.Icon;

          if (item.main) {
            return (
              <button
                key={item.to}
                type="button"
                onClick={() => go(item.to)}
                className="fitdeal-bottom-item fitdeal-main-item"
                style={styles.mainItem}
              >
                <span
                  style={{
                    ...styles.mainIconWrap,
                    transform: active
                      ? "translateY(-8px) scale(1.05)"
                      : "translateY(-7px) scale(1)",
                  }}
                >
                  <span
                    style={{
                      ...styles.mainIconGlass,
                      opacity: active ? 1 : 0.94,
                    }}
                  />
                  <span
                    style={{
                      ...styles.mainIconInner,
                      boxShadow: active
                        ? "0 18px 46px rgba(255,106,0,.22), inset 0 1px 0 rgba(255,255,255,.68)"
                        : "0 16px 38px rgba(255,106,0,.16), inset 0 1px 0 rgba(255,255,255,.62)",
                    }}
                  >
                    <Icon active={active} />
                  </span>
                </span>

                <span
                  style={{
                    ...styles.mainLabel,
                    color: active ? ORANGE : TEXT,
                    opacity: active ? 1 : 0.74,
                  }}
                >
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.to}
              type="button"
              onClick={() => go(item.to)}
              className="fitdeal-bottom-item"
              style={styles.item}
            >
              <span
                style={{
                  ...styles.iconWrap,
                  ...(item.to === "/nutricao" ? styles.iconWrapNutri : null),
                  transform: active
                    ? item.to === "/nutricao"
                      ? "translateY(-1px) scale(1.1)"
                      : "translateY(-1px) scale(1.06)"
                    : item.to === "/nutricao"
                      ? "translateY(0) scale(1.04)"
                      : "translateY(0) scale(1)",
                  filter: active
                    ? "drop-shadow(0 8px 16px rgba(255,255,255,.14))"
                    : "drop-shadow(0 8px 14px rgba(255,106,0,.12))",
                }}
              >
                <Icon active={active} />
              </span>

              <span
                style={{
                  ...styles.label,
                  color: active ? "#fff" : TEXT,
                  opacity: active ? 1 : 0.62,
                  transform: active ? "translateY(-1px)" : "translateY(0)",
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <style>{`
        .fitdeal-bottom-item {
          transition:
            transform .16s cubic-bezier(.2,.9,.2,1),
            filter .16s ease;
        }

        .fitdeal-bottom-item:active {
          transform: scale(.91);
          filter: brightness(.98);
        }

        .fitdeal-main-item:active {
          transform: scale(.96);
        }

        @keyframes fitdealFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-2px); }
        }

        @keyframes fitdealGlow {
          0%, 100% { box-shadow: 0 16px 38px rgba(255,106,0,.16), inset 0 1px 0 rgba(255,255,255,.62); }
          50% { box-shadow: 0 18px 42px rgba(255,106,0,.22), inset 0 1px 0 rgba(255,255,255,.68); }
        }

        .fitdeal-main-item > span:first-child {
          animation: fitdealFloat 3.8s ease-in-out infinite;
        }

        .fitdeal-main-item > span:first-child > span:last-child {
          animation: fitdealGlow 3.8s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .fitdeal-bottom-item,
          .fitdeal-main-item > span:first-child,
          .fitdeal-main-item > span:first-child > span:last-child {
            transition: none !important;
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: "calc(18px + env(safe-area-inset-bottom))",
    display: "flex",
    justifyContent: "center",
    padding: "0 14px",
    zIndex: 10001,
    pointerEvents: "none",
  },

  nav: {
    position: "relative",
    display: "flex",
    width: "100%",
    maxWidth: 430,
    minHeight: 70,
    padding: 6,
    gap: 4,
    borderRadius: 34,
    background:
      "linear-gradient(180deg, rgba(255,255,255,.84), rgba(255,255,255,.66))",
    border: "1px solid rgba(255,255,255,.52)",
    boxShadow:
      "0 28px 70px rgba(15,23,42,.16), inset 0 1px 0 rgba(255,255,255,.55)",
    backdropFilter: "blur(34px)",
    WebkitBackdropFilter: "blur(34px)",
    overflow: "visible",
    pointerEvents: "auto",
  },

  activePill: {
    position: "absolute",
    top: 6,
    bottom: 6,
    left: 6,
    borderRadius: 28,
    background:
      "linear-gradient(135deg, rgba(255,106,0,1), rgba(255,138,61,1))",
    boxShadow:
      "0 16px 38px rgba(255,106,0,.30), 0 0 0 1px rgba(255,255,255,.22)",
    transition: "transform .38s cubic-bezier(.22,1,.36,1), opacity .22s ease",
    zIndex: 1,
  },

  item: {
    position: "relative",
    zIndex: 2,
    flex: 1,
    height: 56,
    border: "none",
    background: "transparent",
    borderRadius: 28,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    padding: 0,
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
  },

  mainItem: {
    position: "relative",
    zIndex: 3,
    flex: 1,
    height: 56,
    border: "none",
    background: "transparent",
    borderRadius: 28,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 0,
    padding: 0,
    paddingBottom: 6,
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
  },

  iconWrap: {
    width: 24,
    height: 24,
    display: "grid",
    placeItems: "center",
    transition:
      "transform .32s cubic-bezier(.22,1,.36,1), filter .26s ease",
  },

  iconWrapNutri: {
    width: 28,
    height: 28,
  },

  mainIconWrap: {
    position: "absolute",
    top: -24,
    width: 68,
    height: 68,
    display: "grid",
    placeItems: "center",
    transition: "transform .34s cubic-bezier(.22,1,.36,1)",
  },

  mainIconGlass: {
    position: "absolute",
    inset: 0,
    borderRadius: 999,
    background:
      "linear-gradient(180deg, rgba(255,255,255,.82), rgba(255,255,255,.54))",
    border: "1px solid rgba(255,255,255,.72)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
  },

  mainIconInner: {
    position: "relative",
    width: 58,
    height: 58,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    background:
      "radial-gradient(circle at 30% 20%, rgba(255,255,255,.58), rgba(255,255,255,0) 32%), linear-gradient(180deg, rgba(255,255,255,.96), rgba(255,255,255,.82))",
    border: "1px solid rgba(255,255,255,.88)",
  },

  label: {
    fontSize: 8,
    lineHeight: 1,
    fontWeight: 950,
    letterSpacing: 0.85,
    textTransform: "uppercase",
    transition:
      "color .26s ease, opacity .26s ease, transform .32s cubic-bezier(.22,1,.36,1)",
  },

  mainLabel: {
    fontSize: 8,
    lineHeight: 1,
    fontWeight: 950,
    letterSpacing: 0.85,
    textTransform: "uppercase",
    transition:
      "color .26s ease, opacity .26s ease, transform .32s cubic-bezier(.22,1,.36,1)",
  },
};
