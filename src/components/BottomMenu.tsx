import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const ORANGE = "#FF6A00";
const TEXT = "#5D6472";
const DARK = "#111827";

function isPathActive(pathname, key) {
  const p = String(pathname || "").toLowerCase();

  if (key === "home") {
    return p === "/" || p.startsWith("/dashboard");
  }
  if (key === "nutricao") {
    return p.startsWith("/nutricao");
  }
  if (key === "treino") {
    return p.startsWith("/treino");
  }
  if (key === "planos") {
    return p.startsWith("/pagamentos") || p.startsWith("/planos");
  }
  if (key === "conta") {
    return p.startsWith("/conta");
  }

  return false;
}

function HomeIcon({ active }) {
  const color = active ? "#fff" : ORANGE;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4.75 10.4L12 4.75l7.25 5.65"
        stroke={color}
        strokeWidth="2.15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.75 9.9v8.25c0 .69.56 1.25 1.25 1.25h2.2v-4.55c0-.55.45-1 1-1h1.6c.55 0 1 .45 1 1v4.55H16c.69 0 1.25-.56 1.25-1.25V9.9"
        stroke={color}
        strokeWidth="2.15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NutritionIcon({ active }) {
  const color = active ? "#fff" : ORANGE;

  return (
    <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      {/* Garfo */}
      <path
        d="M6.2 5.5v4.15"
        stroke={color}
        strokeWidth="2.05"
        strokeLinecap="round"
      />
      <path
        d="M7.55 5.5v4.15"
        stroke={color}
        strokeWidth="2.05"
        strokeLinecap="round"
      />
      <path
        d="M8.9 5.5v4.15"
        stroke={color}
        strokeWidth="2.05"
        strokeLinecap="round"
      />
      <path
        d="M7.55 9.65v9"
        stroke={color}
        strokeWidth="2.05"
        strokeLinecap="round"
      />

      {/* Prato */}
      <circle
        cx="14.2"
        cy="13.8"
        r="6.45"
        stroke={color}
        strokeWidth="2.05"
      />
      <circle
        cx="14.2"
        cy="13.8"
        r="3.25"
        stroke={color}
        strokeWidth="1.75"
      />

      {/* Faca */}
      <path
        d="M21.15 5.65c-1.5.45-2.45 1.95-2.45 3.9 0 1.45.54 2.55 1.5 3.2v5.9"
        stroke={color}
        strokeWidth="2.05"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20.2 18.65v1.15"
        stroke={color}
        strokeWidth="2.05"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DumbbellIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <g
        stroke={ORANGE}
        strokeWidth="2.15"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 10.2l6 3.6" />
        <path d="M10.2 9l3.6 6" />

        <path d="M4.9 8.85l1.55-.95" />
        <path d="M6.15 10.95l1.55-.95" />
        <path d="M3.85 7.15l1.55-.95" />
        <path d="M7.2 12.65l1.55-.95" />

        <path d="M15.3 11.3l1.55-.95" />
        <path d="M16.55 13.4l1.55-.95" />
        <path d="M14.25 9.6l1.55-.95" />
        <path d="M17.6 15.1l1.55-.95" />
      </g>
    </svg>
  );
}

function CardIcon({ active }) {
  const color = active ? "#fff" : ORANGE;
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="3.8"
        y="6.2"
        width="16.4"
        height="11.6"
        rx="3.2"
        stroke={color}
        strokeWidth="2.1"
      />
      <path
        d="M3.8 10.3h16.4"
        stroke={color}
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <path
        d="M7.2 14.25h3.15"
        stroke={color}
        strokeWidth="2.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UserIcon({ active }) {
  const color = active ? "#fff" : ORANGE;
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 12.1a3.85 3.85 0 1 0 0-7.7 3.85 3.85 0 0 0 0 7.7Z"
        stroke={color}
        strokeWidth="2.1"
      />
      <path
        d="M5.1 19.2c1.35-2.75 3.8-4.15 6.9-4.15s5.55 1.4 6.9 4.15"
        stroke={color}
        strokeWidth="2.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function NavItem({ active, label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...S.itemButton,
        ...(active ? S.itemButtonActive : null),
      }}
      className="bm-press"
    >
      <div style={S.iconWrap}>{children}</div>
      <div
        style={{
          ...S.itemLabel,
          color: active ? "#fff" : TEXT,
          opacity: active ? 1 : 0.98,
        }}
      >
        {label}
      </div>
    </button>
  );
}

export default function BottomMenu() {
  const { pathname } = useLocation();
  const nav = useNavigate();

  const [pressingTrain, setPressingTrain] = useState(false);
  const [trainProgress, setTrainProgress] = useState(0);

  const holdTimerRef = useRef(null);
  const holdFrameRef = useRef(null);
  const holdStartedAtRef = useRef(0);
  const holdTriggeredRef = useRef(false);

  const HOLD_MS = 860;

  const activeKey = useMemo(() => {
    if (isPathActive(pathname, "treino")) return "treino";
    if (isPathActive(pathname, "nutricao")) return "nutricao";
    if (isPathActive(pathname, "planos")) return "planos";
    if (isPathActive(pathname, "conta")) return "conta";
    return "home";
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (holdFrameRef.current) cancelAnimationFrame(holdFrameRef.current);
    };
  }, []);

  function clearTrainHold() {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (holdFrameRef.current) cancelAnimationFrame(holdFrameRef.current);
    holdTimerRef.current = null;
    holdFrameRef.current = null;
    holdStartedAtRef.current = 0;
    setPressingTrain(false);
    setTrainProgress(0);
  }

  function startProgressLoop() {
    const tick = () => {
      if (!holdStartedAtRef.current) return;
      const elapsed = performance.now() - holdStartedAtRef.current;
      const p = Math.max(0, Math.min(1, elapsed / HOLD_MS));
      setTrainProgress(p);

      if (p < 1) {
        holdFrameRef.current = requestAnimationFrame(tick);
      }
    };

    holdFrameRef.current = requestAnimationFrame(tick);
  }

  function startTrainHold() {
    clearTrainHold();
    holdTriggeredRef.current = false;
    setPressingTrain(true);
    holdStartedAtRef.current = performance.now();
    startProgressLoop();

    holdTimerRef.current = setTimeout(() => {
      holdTriggeredRef.current = true;
      setTrainProgress(1);
      setPressingTrain(false);
      nav("/treino-detalhe");
    }, HOLD_MS);
  }

  function stopTrainHold() {
    clearTrainHold();
  }

  function onTrainClick() {
    if (holdTriggeredRef.current) {
      holdTriggeredRef.current = false;
      return;
    }
    nav("/treino");
  }

  const ringRadius = 34;
  const ringCirc = 2 * Math.PI * ringRadius;
  const ringOffset = ringCirc * (1 - trainProgress);

  return (
    <>
      <style>{`
        @keyframes bmFloat {
          0%,100% { transform: translateY(0px); }
          50% { transform: translateY(-1.5px); }
        }
        @keyframes bmGlow {
          0%,100% { box-shadow: 0 18px 44px rgba(255,106,0,.18), 0 1px 0 rgba(255,255,255,.9) inset; }
          50% { box-shadow: 0 22px 54px rgba(255,106,0,.23), 0 1px 0 rgba(255,255,255,.95) inset; }
        }
        .bm-press {
          transition: transform .16s ease, filter .16s ease, box-shadow .25s ease;
        }
        .bm-press:active {
          transform: scale(.975);
          filter: brightness(.985);
        }
      `}</style>

      <div style={S.wrapper}>
        <nav style={S.nav}>
          <div style={S.glow} />

          <div style={S.row}>
            <NavItem
              active={activeKey === "home"}
              label="INÍCIO"
              onClick={() => nav("/dashboard")}
            >
              <HomeIcon active={activeKey === "home"} />
            </NavItem>

            <NavItem
              active={activeKey === "nutricao"}
              label="NUTRIÇÃO"
              onClick={() => nav("/nutricao")}
            >
              <NutritionIcon active={activeKey === "nutricao"} />
            </NavItem>

            <div style={S.centerSlot}>
              <button
                type="button"
                style={S.centerButton}
                className="bm-press"
                onMouseDown={startTrainHold}
                onMouseUp={stopTrainHold}
                onMouseLeave={stopTrainHold}
                onTouchStart={startTrainHold}
                onTouchEnd={stopTrainHold}
                onTouchCancel={stopTrainHold}
                onClick={onTrainClick}
                aria-label="Treino"
              >
                {(pressingTrain || trainProgress > 0) && (
                  <svg
                    width="86"
                    height="86"
                    viewBox="0 0 86 86"
                    style={S.progressRing}
                    aria-hidden="true"
                  >
                    <circle
                      cx="43"
                      cy="43"
                      r={ringRadius}
                      stroke="rgba(255,106,0,.18)"
                      strokeWidth="3.25"
                      fill="none"
                    />
                    <circle
                      cx="43"
                      cy="43"
                      r={ringRadius}
                      stroke={ORANGE}
                      strokeWidth="3.25"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={ringCirc}
                      strokeDashoffset={ringOffset}
                      transform="rotate(-90 43 43)"
                    />
                  </svg>
                )}

                <div
                  style={{
                    ...S.centerInner,
                    ...(activeKey === "treino" ? S.centerInnerActive : null),
                    animation: pressingTrain ? "none" : "bmFloat 3.2s ease-in-out infinite, bmGlow 4.4s ease-in-out infinite",
                  }}
                >
                  <DumbbellIcon />
                </div>
              </button>

              <div
                style={{
                  ...S.centerLabel,
                  color: activeKey === "treino" ? DARK : TEXT,
                }}
              >
                TREINO
              </div>
            </div>

            <NavItem
              active={activeKey === "planos"}
              label="PLANOS"
              onClick={() => nav("/pagamentos")}
            >
              <CardIcon active={activeKey === "planos"} />
            </NavItem>

            <NavItem
              active={activeKey === "conta"}
              label="CONTA"
              onClick={() => nav("/conta")}
            >
              <UserIcon active={activeKey === "conta"} />
            </NavItem>
          </div>
        </nav>
      </div>
    </>
  );
}

const S = {
  wrapper: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    display: "flex",
    justifyContent: "center",
    padding: "0 16px calc(16px + env(safe-area-inset-bottom))",
    pointerEvents: "none",
  },

  nav: {
    pointerEvents: "auto",
    position: "relative",
    width: "100%",
    maxWidth: 430,
    borderRadius: 999,
    padding: "12px 12px 14px",
    background: "rgba(255,255,255,.72)",
    border: "1px solid rgba(255,255,255,.56)",
    boxShadow:
      "0 24px 60px rgba(15,23,42,.14), 0 10px 30px rgba(255,106,0,.06), inset 0 1px 0 rgba(255,255,255,.85)",
    backdropFilter: "blur(28px) saturate(1.15)",
    WebkitBackdropFilter: "blur(28px) saturate(1.15)",
    overflow: "visible",
  },

  glow: {
    position: "absolute",
    inset: -18,
    borderRadius: 999,
    background:
      "radial-gradient(260px 90px at 50% 100%, rgba(255,106,0,.10), rgba(255,255,255,0) 65%)",
    pointerEvents: "none",
  },

  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1.04fr 1fr 1fr",
    alignItems: "end",
    gap: 6,
    minHeight: 92,
  },

  itemButton: {
    height: 78,
    border: "none",
    background: "transparent",
    borderRadius: 999,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "8px 6px 9px",
    cursor: "pointer",
    position: "relative",
    minWidth: 0,
  },

  itemButtonActive: {
    background: "linear-gradient(135deg, #FF7A1A, #FF9A48)",
    boxShadow:
      "0 18px 44px rgba(255,106,0,.22), inset 0 1px 0 rgba(255,255,255,.20)",
  },

  iconWrap: {
    height: 24,
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
  },

  itemLabel: {
    fontSize: 11,
    lineHeight: 1,
    fontWeight: 950,
    letterSpacing: 2.1,
    whiteSpace: "nowrap",
  },

  centerSlot: {
    position: "relative",
    height: 86,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
  },

  centerButton: {
    position: "absolute",
    top: -27,
    width: 86,
    height: 86,
    borderRadius: 999,
    border: "none",
    background: "transparent",
    padding: 0,
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
  },

  progressRing: {
    position: "absolute",
    inset: 0,
    filter: "drop-shadow(0 8px 18px rgba(255,106,0,.16))",
  },

  centerInner: {
    width: 76,
    height: 76,
    borderRadius: 999,
    background:
      "linear-gradient(180deg, rgba(255,255,255,.96), rgba(255,255,255,.90))",
    border: "1px solid rgba(255,255,255,.72)",
    boxShadow:
      "0 18px 44px rgba(15,23,42,.12), 0 6px 18px rgba(255,106,0,.08), inset 0 1px 0 rgba(255,255,255,.98)",
    display: "grid",
    placeItems: "center",
  },

  centerInnerActive: {
    boxShadow:
      "0 20px 50px rgba(255,106,0,.18), 0 8px 22px rgba(15,23,42,.10), inset 0 1px 0 rgba(255,255,255,.98)",
  },

  centerLabel: {
    marginTop: 48,
    fontSize: 11,
    lineHeight: 1,
    fontWeight: 950,
    letterSpacing: 2.1,
    whiteSpace: "nowrap",
  },
};
