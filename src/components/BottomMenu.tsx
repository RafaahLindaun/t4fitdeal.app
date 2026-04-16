import { Link, useLocation } from "react-router-dom";

const ORANGE = "#FF6A00";
const TEXT = "#0f172a";

export default function BottomMenu() {
  const { pathname } = useLocation();

  const items = [
    { to: "/dashboard", label: "Início", icon: "⌂" },
    { to: "/treino", label: "Treino", icon: "◈" },
    { to: "/cardio", label: "Cardio", icon: "⌁" },
    { to: "/nutricao", label: "Nutri+", icon: "✦" },
    { to: "/conta", label: "Conta", icon: "☻" },
  ];

  const activeIndex = Math.max(
    0,
    items.findIndex((it) => pathname === it.to || pathname.startsWith(`${it.to}/`))
  );

  return (
    <div style={styles.wrapper}>
      <nav style={styles.nav}>
        <div
          style={{
            ...styles.activePill,
            width: `${100 / items.length}%`,
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />

        {items.map((it) => {
          const active = pathname === it.to || pathname.startsWith(`${it.to}/`);

          return (
            <Link key={it.to} to={it.to} style={styles.link}>
              <div style={styles.item} className="bottom-menu-item">
                <span
                  style={{
                    ...styles.icon,
                    color: active ? "#fff" : TEXT,
                    transform: active ? "translateY(-1px) scale(1.05)" : "translateY(0) scale(1)",
                  }}
                >
                  {it.icon}
                </span>

                <span
                  style={{
                    ...styles.label,
                    color: active ? "#fff" : TEXT,
                    opacity: active ? 1 : 0.55,
                    transform: active ? "translateY(-1px)" : "translateY(0)",
                  }}
                >
                  {it.label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>

      <style>{`
        .bottom-menu-item {
          transition:
            transform .16s cubic-bezier(.2,.9,.2,1),
            filter .16s ease;
        }

        .bottom-menu-item:active {
          transform: scale(.91);
          filter: brightness(.98);
        }

        @media (prefers-reduced-motion: reduce) {
          .bottom-menu-item {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
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
    minHeight: 68,
    padding: 6,
    gap: 4,
    borderRadius: 34,
    background: "rgba(255,255,255,.76)",
    border: "1px solid rgba(255,255,255,.50)",
    boxShadow: "0 28px 70px rgba(15,23,42,.16)",
    backdropFilter: "blur(34px)",
    WebkitBackdropFilter: "blur(34px)",
    overflow: "hidden",
    pointerEvents: "auto",
  },

  activePill: {
    position: "absolute",
    top: 6,
    bottom: 6,
    left: 6,
    borderRadius: 28,
    background: `linear-gradient(135deg, #0B0B0C, #151515)`,
    boxShadow: `0 16px 38px rgba(0,0,0,.22), 0 0 0 1px rgba(255,106,0,.10)`,
    transition: "transform .38s cubic-bezier(.22,1,.36,1)",
    zIndex: 1,
  },

  link: {
    position: "relative",
    zIndex: 2,
    flex: 1,
    textDecoration: "none",
    color: "inherit",
    WebkitTapHighlightColor: "transparent",
  },

  item: {
    height: 56,
    borderRadius: 28,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    position: "relative",
  },

  icon: {
    fontSize: 19,
    lineHeight: 1,
    transition:
      "color .26s ease, transform .32s cubic-bezier(.22,1,.36,1)",
  },

  label: {
    fontSize: 8,
    lineHeight: 1,
    fontWeight: 950,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    transition:
      "color .26s ease, opacity .26s ease, transform .32s cubic-bezier(.22,1,.36,1)",
  },
};
