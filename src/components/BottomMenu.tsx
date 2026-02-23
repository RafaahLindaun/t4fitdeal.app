import { Link, useLocation, useNavigate } from "react-router-dom";
import { useRef } from "react";

type Item = {
  to: string;
  label: string;
  Icon: (p: { active: boolean }) => JSX.Element;
  activeBg: string;
  activeFg: string;
};

const ORANGE = "#FF6A00";

export default function BottomMenu() {
  const { pathname } = useLocation();
  const nav = useNavigate();

  const items: Item[] = [
    {
      to: "/dashboard",
      label: "Início",
      Icon: HomeIcon,
      activeBg: "rgba(37, 99, 235, 0.12)",
      activeFg: "#2563eb",
    },
    {
      to: "/nutricao",
      label: "Nutrição",
      Icon: NutritionIcon,
      activeBg: "rgba(34, 197, 94, 0.14)",
      activeFg: "#16a34a",
    },
    {
      to: "/pagamentos",
      label: "Planos",
      Icon: CardIcon,
      activeBg: "rgba(245, 158, 11, 0.16)",
      activeFg: "#d97706",
    },
    {
      to: "/conta",
      label: "Conta",
      Icon: UserIcon,
      activeBg: "rgba(124, 58, 237, 0.14)",
      activeFg: "#7c3aed",
    },
  ];

  const treinoActive = pathname.startsWith("/treino");

  // ✅ Long-press Apple-like: segura no botão central -> vai direto pro TreinoDetalhe
  const pressTimerRef = useRef<number | null>(null);
  const didLongPressRef = useRef(false);

  function vibrate(ms = 14) {
    try {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        // @ts-ignore
        navigator.vibrate(ms);
      }
    } catch {}
  }

  function clearPressTimer() {
    if (pressTimerRef.current != null) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }

  function startLongPress() {
    didLongPressRef.current = false;
    clearPressTimer();

    // tempo “discreto” tipo iOS
    pressTimerRef.current = window.setTimeout(() => {
      didLongPressRef.current = true;
      vibrate(18);
      // ✅ vai direto pro detalhe (sem mexer no visual)
      nav("/treino/detalhe", { state: { from: "/treino" } });
    }, 420);
  }

  function endLongPress() {
    clearPressTimer();
  }

  function cancelClickIfLongPress(e: any) {
    if (didLongPressRef.current) {
      e.preventDefault();
      e.stopPropagation();
      didLongPressRef.current = false;
    }
  }

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        <MenuItem it={items[0]} active={pathname === items[0].to} />
        <MenuItem it={items[1]} active={pathname === items[1].to} />

        {/* SLOT CENTRAL */}
        <div style={{ height: 1 }} />

        <MenuItem it={items[2]} active={pathname === items[2].to} />
        <MenuItem it={items[3]} active={pathname === items[3].to} />
      </div>

      {/* BOTÃO CENTRAL “TREINO” */}
      <Link
        to="/treino"
        aria-label="Treino"
        style={{
          ...styles.centerBtn,
          ...(treinoActive ? styles.centerBtnActive : null),
        }}
        onMouseDown={startLongPress}
        onMouseUp={endLongPress}
        onMouseLeave={endLongPress}
        onTouchStart={startLongPress}
        onTouchEnd={endLongPress}
        onTouchCancel={endLongPress}
        onClick={cancelClickIfLongPress}
      >
        <div style={styles.centerIconWrap}>
          {/* ✅ SOMENTE SVG: evita “quadrado quebrado” de imagem/placeholder */}
          <div style={styles.centerIconSvg}>
            <DumbbellIcon active={treinoActive} />
          </div>
        </div>

        <div style={styles.centerLabel}>Treino</div>
      </Link>
    </nav>
  );
}

function MenuItem({ it, active }: { it: Item; active: boolean }) {
  return (
    <Link
      to={it.to}
      style={{
        ...styles.item,
        background: active ? it.activeBg : "transparent",
      }}
    >
      <div
        style={{
          ...styles.square,
          borderColor: "rgba(15,23,42,0.08)",
          boxShadow: active ? "0 10px 26px rgba(15,23,42,0.10)" : "none",
          transform: active ? "translateY(-1px)" : "translateY(0px)",
        }}
      >
        <it.Icon active={active} />
      </div>

      <div
        style={{
          ...styles.label,
          color: active ? it.activeFg : "#64748b",
          fontWeight: active ? 800 : 700,
        }}
      >
        {it.label}
      </div>
    </Link>
  );
}

const styles: Record<string, any> = {
  nav: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    padding: "10px 12px 14px",
    background: "rgba(255,255,255,0.86)",
    borderTop: "1px solid rgba(15,23,42,0.08)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    zIndex: 200,
  },
  inner: {
    maxWidth: 420,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 10,
    alignItems: "end",
  },
  item: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    padding: "10px 6px",
    borderRadius: 16,
    textDecoration: "none",
    transition: "transform 0.14s ease, background 0.14s ease",
  },
  square: {
    width: 44,
    height: 44,
    borderRadius: 14,
    background: "#ffffff",
    border: "1px solid rgba(15,23,42,0.08)",
    display: "grid",
    placeItems: "center",
    transition: "box-shadow 0.14s ease, transform 0.14s ease",
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.1,
  },

  // ✅ Botão central
  centerBtn: {
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%) translateY(-16px)",
    bottom: 12,
    width: 78,
    height: 78,
    borderRadius: 26,
    textDecoration: "none",
    display: "grid",
    placeItems: "center",
    gap: 6,
    background: `linear-gradient(180deg, ${ORANGE}, #FF8A3D)`,
    boxShadow: "0 20px 50px rgba(255,106,0,.33), 0 12px 24px rgba(15,23,42,.12)",
    border: "1px solid rgba(255,255,255,.35)",
    transition: "transform .14s ease, filter .14s ease",
  },
  centerBtnActive: {
    filter: "saturate(1.05) brightness(1.02)",
  },

  centerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 18,
    position: "relative",
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,.18)",
    border: "1px solid rgba(255,255,255,.38)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,.38)",
    overflow: "hidden",
  },
  centerIconSvg: {
    position: "absolute",
    inset: 0,
    display: "grid",
    placeItems: "center",
  },

  centerLabel: {
    fontSize: 11,
    fontWeight: 950,
    color: "#111",
    marginTop: -2,
    letterSpacing: 0.1,
  },
};

/* ÍCONES (SVG) — sem lib */
function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 10.8 12 4l8 6.8V20a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 20v-9.2Z"
        stroke={active ? "#2563eb" : "#64748b"}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 21.5v-6.2h5v6.2"
        stroke={active ? "#2563eb" : "#64748b"}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NutritionIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 20c4.5 0 10-6.2 10-12.2C17 5.1 15.7 4 14.2 4 12 4 11 6.2 11 6.2S10 4 7.8 4C6.3 4 5 5.1 5 7.8 5 13.8 2.5 20 7 20Z"
        stroke={active ? "#16a34a" : "#64748b"}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 10c-1.2 2.2-3.1 4-5.5 5.2"
        stroke={active ? "#16a34a" : "#64748b"}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CardIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4.5 7.5A2.5 2.5 0 0 1 7 5h10a2.5 2.5 0 0 1 2.5 2.5v9A2.5 2.5 0 0 1 17 19H7a2.5 2.5 0 0 1-2.5-2.5v-9Z"
        stroke={active ? "#d97706" : "#64748b"}
        strokeWidth="1.8"
      />
      <path d="M4.5 9.3h15" stroke={active ? "#d97706" : "#64748b"} strokeWidth="1.8" />
      <path
        d="M7.5 15.5h5.2"
        stroke={active ? "#d97706" : "#64748b"}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UserIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 12.2c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4Z"
        stroke={active ? "#7c3aed" : "#64748b"}
        strokeWidth="1.8"
      />
      <path
        d="M4.8 20c1.6-3 4.1-4.6 7.2-4.6s5.6 1.6 7.2 4.6"
        stroke={active ? "#7c3aed" : "#64748b"}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ✅ ÍCONE TREINO: branco, “Apple-like” (clean, rounded, monoline) — sem mudar funcionalidade */
function DumbbellIcon({ active }: { active: boolean }) {
  const stroke = "#FFFFFF";
  const glow = "rgba(255,255,255,.28)";

  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {/* leve diagonal, visual “iOS” */}
      <g transform="rotate(-22 12 12)">
        {/* barra */}
        <path
          d="M9 12h6"
          stroke={stroke}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* collars */}
        <path d="M8.2 10.4v3.2" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" />
        <path d="M15.8 10.4v3.2" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" />

        {/* placas externas (rounded) */}
        <path
          d="M5.2 9.1c0-.7.6-1.3 1.3-1.3h.6c.7 0 1.3.6 1.3 1.3v5.8c0 .7-.6 1.3-1.3 1.3h-.6c-.7 0-1.3-.6-1.3-1.3V9.1Z"
          stroke={stroke}
          strokeWidth="2.2"
          strokeLinejoin="round"
          style={{ filter: `drop-shadow(0 0 0.5px ${glow})` }}
        />
        <path
          d="M15.6 9.1c0-.7.6-1.3 1.3-1.3h.6c.7 0 1.3.6 1.3 1.3v5.8c0 .7-.6 1.3-1.3 1.3h-.6c-.7 0-1.3-.6-1.3-1.3V9.1Z"
          stroke={stroke}
          strokeWidth="2.2"
          strokeLinejoin="round"
          style={{ filter: `drop-shadow(0 0 0.5px ${glow})` }}
        />

        {/* caps (pontas) */}
        <path d="M4.4 10.2v3.6" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" />
        <path d="M19.6 10.2v3.6" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" />
      </g>
    </svg>
  );
}
