import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";

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

  const auth = useAuth() as any;
  const logoutFn = auth?.logout;

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
  const contaActive = pathname.startsWith("/conta");

  // ✅ Long-press Apple-like: segura no botão central -> vai direto pro TreinoDetalhe
  const pressTimerRef = useRef<number | null>(null);
  const didLongPressRef = useRef(false);

  // ✅ Double-click “Conta” -> action sheet
  const [logoutOpen, setLogoutOpen] = useState(false);

  // ✅ IMPORTANTE: JSX não aceita <items[3].Icon />
  const ContaIcon = items[3].Icon;

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

    pressTimerRef.current = window.setTimeout(() => {
      didLongPressRef.current = true;
      vibrate(18);
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

  // trava scroll e fecha com ESC (web) quando sheet abre
  useEffect(() => {
    if (!logoutOpen) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLogoutOpen(false);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev || "";
      window.removeEventListener("keydown", onKey);
    };
  }, [logoutOpen]);

  function openLogoutSheet(e?: any) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    vibrate(10);
    setLogoutOpen(true);
  }

  function doLogout() {
    setLogoutOpen(false);

    // 1) se existir logout no AuthContext, usa
    try {
      if (typeof logoutFn === "function") {
        logoutFn();
        return;
      }
    } catch {}

    // 2) fallback: navega para login (ajuste se sua rota for diferente)
    try {
      localStorage.setItem("logged_in", "0");
      localStorage.removeItem("token");
      localStorage.removeItem("session");
      localStorage.removeItem("auth");
      localStorage.removeItem("user");
    } catch {}

    nav("/login", { replace: true });
  }

  return (
    <>
      <nav style={styles.nav}>
        <div style={styles.inner}>
          <MenuItem it={items[0]} active={pathname === items[0].to} />
          <MenuItem it={items[1]} active={pathname === items[1].to} />

          {/* SLOT CENTRAL */}
          <div style={{ height: 1 }} />

          <MenuItem it={items[2]} active={pathname === items[2].to} />

          {/* ✅ CONTA (igual visual), double-click abre sheet */}
          <Link
            to={items[3].to}
            style={{
              ...styles.item,
              background: contaActive ? items[3].activeBg : "transparent",
            }}
            onDoubleClick={openLogoutSheet}
          >
            <div
              style={{
                ...styles.square,
                borderColor: "rgba(15,23,42,0.08)",
                boxShadow: contaActive ? "0 10px 26px rgba(15,23,42,0.10)" : "none",
                transform: contaActive ? "translateY(-1px)" : "translateY(0px)",
              }}
            >
              <ContaIcon active={contaActive} />
            </div>

            <div
              style={{
                ...styles.label,
                color: contaActive ? items[3].activeFg : "#64748b",
                fontWeight: contaActive ? 800 : 700,
              }}
            >
              {items[3].label}
            </div>
          </Link>
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
            <div style={styles.centerIconSvg}>
              <DumbbellIcon active={treinoActive} />
            </div>
          </div>

          <div style={styles.centerLabel}>Treino</div>
        </Link>
      </nav>

      {/* ✅ Action Sheet (Apple-like) */}
      {logoutOpen && (
        <div style={styles.sheetOverlay} role="presentation" onClick={() => setLogoutOpen(false)}>
          <div style={styles.sheetWrap} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div style={styles.sheetCard}>
              <div style={styles.sheetTitle}>Deseja sair?</div>
              <div style={styles.sheetSub}>Você pode entrar novamente quando quiser.</div>
            </div>

            <div style={styles.sheetBtns}>
              <button type="button" style={styles.sheetBtnCancel} onClick={() => setLogoutOpen(false)}>
                Cancelar
              </button>
              <button type="button" style={styles.sheetBtnDestructive} onClick={doLogout}>
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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
    WebkitTapHighlightColor: "transparent",
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
    WebkitTapHighlightColor: "transparent",
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

  /* ✅ Action Sheet (Apple-like) */
  sheetOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    background: "rgba(2,6,23,.42)",
    display: "grid",
    alignItems: "end",
    padding: "12px",
    paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
    paddingTop: "calc(12px + env(safe-area-inset-top))",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
  },
  sheetWrap: {
    width: "100%",
    maxWidth: 520,
    margin: "0 auto",
    display: "grid",
    gap: 10,
  },
  sheetCard: {
    borderRadius: 18,
    background: "rgba(255,255,255,.92)",
    border: "1px solid rgba(255,255,255,.35)",
    boxShadow: "0 28px 90px rgba(0,0,0,.28)",
    padding: 14,
    textAlign: "center",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
  },
  sheetTitle: { fontSize: 14, fontWeight: 950, color: "#0f172a", letterSpacing: -0.2 },
  sheetSub: { marginTop: 6, fontSize: 12, fontWeight: 800, color: "#64748b", lineHeight: 1.3 },

  sheetBtns: {
    borderRadius: 18,
    overflow: "hidden",
    background: "rgba(255,255,255,.92)",
    border: "1px solid rgba(255,255,255,.35)",
    boxShadow: "0 18px 60px rgba(0,0,0,.22)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
  },
  sheetBtnCancel: {
    width: "100%",
    padding: 14,
    border: "none",
    background: "transparent",
    fontWeight: 950,
    color: "#0f172a",
    borderBottom: "1px solid rgba(15,23,42,.08)",
  },
  sheetBtnDestructive: {
    width: "100%",
    padding: 14,
    border: "none",
    background: "transparent",
    fontWeight: 950,
    color: "#ef4444",
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

/* ✅ Seu ícone de Treino (mantido) */
function DumbbellIcon({ active }: { active: boolean }) {
  const strokeMain = "rgba(255,255,255,.86)";
  const strokeSoft = "rgba(255,255,255,.52)";
  const plateFill = "rgba(255,255,255,.12)";
  const plateFill2 = "rgba(255,255,255,.07)";

  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g transform="rotate(-32 12 12)">
        <path d="M9.1 12h5.8" stroke={strokeMain} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8.55 10.35v3.3" stroke={strokeMain} strokeWidth="2.4" strokeLinecap="round" />
        <path d="M15.45 10.35v3.3" stroke={strokeMain} strokeWidth="2.4" strokeLinecap="round" />

        <rect x="4.35" y="8.55" width="2.95" height="6.9" rx="1.35" fill={plateFill} stroke={strokeMain} strokeWidth="2.1" />
        <rect x="16.7" y="8.55" width="2.95" height="6.9" rx="1.35" fill={plateFill} stroke={strokeMain} strokeWidth="2.1" />

        <rect x="7.4" y="9.75" width="1.65" height="4.5" rx="0.85" fill={plateFill2} stroke={strokeSoft} strokeWidth="1.7" />
        <rect x="14.95" y="9.75" width="1.65" height="4.5" rx="0.85" fill={plateFill2} stroke={strokeSoft} strokeWidth="1.7" />

        <path d="M3.85 10.05v3.9" stroke={strokeMain} strokeWidth="2.6" strokeLinecap="round" />
        <path d="M20.15 10.05v3.9" stroke={strokeMain} strokeWidth="2.6" strokeLinecap="round" />
      </g>
    </svg>
  );
}
