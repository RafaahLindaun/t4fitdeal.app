import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const ORANGE = "#FF6A00";
const TEXT = "#0f172a";

function HomeIcon({ active }) {
  const c = active ? "#fff" : ORANGE;

  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4.4 10.65 12 4.25l7.6 6.4"
        stroke={c}
        strokeWidth="2.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.75 10.25v8.05c0 .85.65 1.5 1.5 1.5h7.5c.85 0 1.5-.65 1.5-1.5v-8.05"
        stroke={c}
        strokeWidth="2.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 19.75v-5h4v5"
        stroke={c}
        strokeWidth="2.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NutritionIcon({ active }) {
  const c = active ? "#fff" : ORANGE;
  const accent = active ? "#fff" : ORANGE;

  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <path d="M13.2 12.5v14.1" stroke={c} strokeWidth="4.1" strokeLinecap="round" />
      <path
        d="M8.8 12.5v13.1c0 3.4 2 5.6 4.4 6.8"
        stroke={c}
        strokeWidth="4.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.6 12.5v13.1c0 3.4-2 5.6-4.4 6.8"
        stroke={c}
        strokeWidth="4.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M13.2 32.4v19.1" stroke={c} strokeWidth="4.1" strokeLinecap="round" />

      <circle cx="32" cy="32" r="12.3" stroke={c} strokeWidth="4.2" />
      <circle
        cx="32"
        cy="32"
        r="7.1"
        stroke={c}
        strokeWidth="2.9"
        opacity={active ? "0.82" : "0.72"}
      />

      <path
        d="M35.2 39.1c3.5-1.1 6.1-3.8 7.2-7.35"
        stroke={accent}
        strokeWidth="3.3"
        strokeLinecap="round"
        opacity={active ? "0.9" : "1"}
      />
      <circle cx="31.7" cy="40" r="1.65" fill={accent} opacity={active ? "0.85" : "1"} />

      <path
        d="M51.8 12.8c-3.4 2.7-5 6.65-5 11.8v5.3c0 2.5 1.2 4.1 3.3 5.1"
        stroke={c}
        strokeWidth="4.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M50.1 35v16.5" stroke={c} strokeWidth="4.1" strokeLinecap="round" />
    </svg>
  );
}

function DumbbellIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <g transform="rotate(-35 32 32)">
        <rect x="8" y="25" width="7" height="14" rx="2.5" fill={ORANGE} opacity="0.94" />
        <rect x="16" y="21" width="8" height="22" rx="3" fill={ORANGE} />
        <rect x="25" y="29" width="14" height="6" rx="3" fill={ORANGE} />
        <rect x="40" y="21" width="8" height="22" rx="3" fill={ORANGE} />
        <rect x="49" y="25" width="7" height="14" rx="2.5" fill={ORANGE} opacity="0.94" />
      </g>
    </svg>
  );
}

function CardIcon({ active }) {
  const c = active ? "#fff" : ORANGE;

  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="3.7"
        y="6.45"
        width="16.6"
        height="11.1"
        rx="2.65"
        stroke={c}
        strokeWidth="2.3"
      />
      <path d="M4.25 10h15.5" stroke={c} strokeWidth="2.3" strokeLinecap="round" />
      <path d="M7.45 14.45h3.45" stroke={c} strokeWidth="2.3" strokeLinecap="round" />
    </svg>
  );
}

function UserIcon({ active }) {
  const c = active ? "#fff" : ORANGE;

  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 12.15a4.05 4.05 0 1 0 0-8.1 4.05 4.05 0 0 0 0 8.1Z"
        stroke={c}
        strokeWidth="2.3"
      />
      <path
        d="M4.85 20.05c.8-3.55 3.35-5.45 7.15-5.45s6.35 1.9 7.15 5.45"
        stroke={c}
        strokeWidth="2.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function BottomMenu() {
  const { pathname } = useLocation();
  const nav = useNavigate();

  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [trainHoldProgress, setTrainHoldProgress] = useState(0);
  const [trainPressing, setTrainPressing] = useState(false);

  const holdStartTimerRef = useRef(null);
  const holdProgressRafRef = useRef(null);
  const holdStartAtRef = useRef(0);
  const holdCompletedRef = useRef(false);
  const pressStartedRef = useRef(false);
  const suppressNextTrainClickRef = useRef(false);

  const accountTapRef = useRef(0);
  const accountTapTimerRef = useRef(null);

  const HOLD_DELAY_MS = 220;
  const HOLD_TOTAL_MS = 850;

  const items = [
    { to: "/dashboard", label: "Início", Icon: HomeIcon },
    { to: "/nutricao", label: "Nutrição", Icon: NutritionIcon },
    { to: "/treino", label: "Treino", Icon: DumbbellIcon, main: true },
    { to: "/pagamentos", label: "Planos", Icon: CardIcon },
    { to: "/conta", label: "Conta", Icon: UserIcon },
  ];

  const activeIndex = Math.max(
    0,
    items.findIndex((it) => pathname === it.to || pathname.startsWith(`${it.to}/`))
  );

  useEffect(() => {
    return () => {
      if (holdStartTimerRef.current) window.clearTimeout(holdStartTimerRef.current);
      if (holdProgressRafRef.current) window.cancelAnimationFrame(holdProgressRafRef.current);
      if (accountTapTimerRef.current) window.clearTimeout(accountTapTimerRef.current);
    };
  }, []);

  if (pathname.startsWith("/treino/detalhe")) return null;

  function go(to) {
    nav(to);
  }

  function clearHoldTimers() {
    if (holdStartTimerRef.current) {
      window.clearTimeout(holdStartTimerRef.current);
      holdStartTimerRef.current = null;
    }

    if (holdProgressRafRef.current) {
      window.cancelAnimationFrame(holdProgressRafRef.current);
      holdProgressRafRef.current = null;
    }
  }

  function resetHoldState() {
    clearHoldTimers();
    pressStartedRef.current = false;
    setTrainHoldProgress(0);
    setTrainPressing(false);
  }

  function runHoldProgress() {
    const tick = (now) => {
      if (!pressStartedRef.current) return;

      const elapsed = now - holdStartAtRef.current;
      const pct = Math.min(1, elapsed / HOLD_TOTAL_MS);

      setTrainHoldProgress(pct);

      if (pct >= 1) {
        holdCompletedRef.current = true;
        suppressNextTrainClickRef.current = true;
        pressStartedRef.current = false;

        clearHoldTimers();
        setTrainPressing(false);
        setTrainHoldProgress(0);

        nav("/treino/detalhe");
        return;
      }

      holdProgressRafRef.current = window.requestAnimationFrame(tick);
    };

    holdProgressRafRef.current = window.requestAnimationFrame(tick);
  }

  function startTrainHold() {
    resetHoldState();

    holdCompletedRef.current = false;
    suppressNextTrainClickRef.current = false;
    pressStartedRef.current = true;
    setTrainPressing(true);

    holdStartTimerRef.current = window.setTimeout(() => {
      if (!pressStartedRef.current) return;

      holdStartAtRef.current = performance.now();
      runHoldProgress();
    }, HOLD_DELAY_MS);
  }

  function endTrainHold() {
    if (!holdCompletedRef.current) {
      resetHoldState();
      return;
    }

    clearHoldTimers();
    pressStartedRef.current = false;
    setTrainHoldProgress(0);
    setTrainPressing(false);
  }

  function onTrainClick() {
    if (suppressNextTrainClickRef.current) {
      suppressNextTrainClickRef.current = false;
      holdCompletedRef.current = false;
      return;
    }

    if (holdCompletedRef.current) {
      holdCompletedRef.current = false;
      return;
    }

    nav("/treino");
  }

  function onAccountClick() {
    accountTapRef.current += 1;

    if (accountTapTimerRef.current) {
      window.clearTimeout(accountTapTimerRef.current);
    }

    accountTapTimerRef.current = window.setTimeout(() => {
      if (accountTapRef.current >= 2) {
        setShowAccountMenu((v) => !v);
      } else {
        nav("/conta");
      }

      accountTapRef.current = 0;
    }, 220);
  }

  function closeAccountMenu() {
    setShowAccountMenu(false);
  }

  function goCloseAccount() {
    setShowAccountMenu(false);
    nav("/conta?modal=close-account");
  }

  const ringRadius = 31;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - trainHoldProgress);

  return (
    <>
      {showAccountMenu ? (
        <div style={styles.sheetOverlay} onClick={closeAccountMenu}>
          <div style={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div style={styles.sheetGrab} />
            <div style={styles.sheetTitle}>Conta</div>

            <button type="button" style={styles.sheetActionDanger} onClick={goCloseAccount}>
              Fechar conta
            </button>

            <button type="button" style={styles.sheetActionSoft} onClick={closeAccountMenu}>
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

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
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.currentTarget.setPointerCapture?.(e.pointerId);
                    startTrainHold();
                  }}
                  onPointerUp={(e) => {
                    e.preventDefault();
                    e.currentTarget.releasePointerCapture?.(e.pointerId);
                    endTrainHold();
                  }}
                  onPointerCancel={(e) => {
                    e.preventDefault();
                    endTrainHold();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    onTrainClick();
                  }}
                  className="fitdeal-bottom-item fitdeal-main-item"
                  style={styles.mainItem}
                >
                  <span
                    style={{
                      ...styles.mainIconWrap,
                      transform:
                        trainPressing || trainHoldProgress > 0
                          ? "translateY(-8px) scale(1.045)"
                          : active
                            ? "translateY(-8px) scale(1.05)"
                            : "translateY(-7px) scale(1)",
                    }}
                  >
                    <svg
                      width="72"
                      height="72"
                      viewBox="0 0 72 72"
                      style={styles.progressSvg}
                      aria-hidden="true"
                    >
                      <circle
                        cx="36"
                        cy="36"
                        r={ringRadius}
                        fill="none"
                        stroke="rgba(255,106,0,.10)"
                        strokeWidth="2.5"
                      />
                      <circle
                        cx="36"
                        cy="36"
                        r={ringRadius}
                        fill="none"
                        stroke="rgba(255,106,0,.96)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={ringCircumference}
                        strokeDashoffset={ringOffset}
                        transform="rotate(-90 36 36)"
                        style={{
                          opacity: trainHoldProgress > 0 ? 1 : 0,
                          transition: "opacity .14s ease",
                        }}
                      />
                    </svg>

                    <span style={styles.mainIconGlass} />

                    <span
                      style={{
                        ...styles.mainIconInner,
                        boxShadow:
                          trainPressing || trainHoldProgress > 0
                            ? "0 20px 48px rgba(255,106,0,.24), inset 0 1px 0 rgba(255,255,255,.7)"
                            : active
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

            const isAccount = item.to === "/conta";

            return (
              <button
                key={item.to}
                type="button"
                onClick={isAccount ? onAccountClick : () => go(item.to)}
                className="fitdeal-bottom-item"
                style={styles.item}
              >
                <span
                  style={{
                    ...styles.iconWrap,
                    ...(item.to === "/nutricao" ? styles.iconWrapNutri : null),
                    transform: active ? "translateY(-1px) scale(1.035)" : "translateY(0) scale(1)",
                    filter: active
                      ? "drop-shadow(0 8px 13px rgba(0,0,0,.08))"
                      : "drop-shadow(0 8px 14px rgba(255,106,0,.10))",
                  }}
                >
                  <Icon active={active} />
                </span>

                <span
                  style={{
                    ...styles.label,
                    ...(item.to === "/nutricao" ? styles.labelNutri : null),
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
            transition: transform .16s cubic-bezier(.2,.9,.2,1), filter .16s ease;
            text-decoration: none;
            user-select: none;
            -webkit-user-select: none;
            touch-action: manipulation;
          }

          .fitdeal-bottom-item:active {
            transform: scale(.92);
            filter: brightness(.985);
          }

          .fitdeal-main-item:active {
            transform: scale(.97);
          }

          @keyframes fitdealFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-2px); }
          }

          @keyframes fitdealGlow {
            0%, 100% {
              box-shadow: 0 16px 38px rgba(255,106,0,.16), inset 0 1px 0 rgba(255,255,255,.62);
            }

            50% {
              box-shadow: 0 18px 42px rgba(255,106,0,.22), inset 0 1px 0 rgba(255,255,255,.68);
            }
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
    </>
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
    minHeight: 72,
    padding: 6,
    gap: 4,
    borderRadius: 36,
    background: "linear-gradient(180deg, rgba(255,255,255,.88), rgba(255,255,255,.70))",
    border: "1px solid rgba(255,255,255,.58)",
    boxShadow:
      "0 28px 70px rgba(15,23,42,.16), 0 8px 24px rgba(15,23,42,.08), inset 0 1px 0 rgba(255,255,255,.62)",
    backdropFilter: "blur(34px) saturate(1.35)",
    WebkitBackdropFilter: "blur(34px) saturate(1.35)",
    overflow: "visible",
    pointerEvents: "auto",
  },

  activePill: {
    position: "absolute",
    top: 6,
    bottom: 6,
    left: 6,
    borderRadius: 30,
    background:
      "radial-gradient(circle at 30% 15%, rgba(255,255,255,.34), rgba(255,255,255,0) 34%), linear-gradient(135deg, rgba(255,106,0,1), rgba(255,126,36,1))",
    boxShadow:
      "0 16px 36px rgba(255,106,0,.32), 0 6px 18px rgba(255,106,0,.18), inset 0 1px 0 rgba(255,255,255,.30)",
    transition: "transform .38s cubic-bezier(.22,1,.36,1), opacity .22s ease",
    zIndex: 1,
  },

  item: {
    position: "relative",
    zIndex: 2,
    flex: 1,
    height: 60,
    border: "none",
    background: "transparent",
    borderRadius: 30,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    padding: 0,
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
  },

  mainItem: {
    position: "relative",
    zIndex: 3,
    flex: 1,
    height: 60,
    border: "none",
    background: "transparent",
    borderRadius: 30,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 0,
    padding: 0,
    paddingBottom: 7,
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
  },

  iconWrap: {
    width: 31,
    height: 31,
    display: "grid",
    placeItems: "center",
    transition: "transform .32s cubic-bezier(.22,1,.36,1), filter .26s ease",
  },

  iconWrapNutri: {
    width: 34,
    height: 34,
    marginBottom: -1,
  },

  label: {
    fontSize: 8,
    lineHeight: 1,
    fontWeight: 950,
    letterSpacing: 0.78,
    textTransform: "uppercase",
    transition:
      "color .26s ease, opacity .26s ease, transform .32s cubic-bezier(.22,1,.36,1)",
  },

  labelNutri: {
    letterSpacing: 0.64,
  },

  mainIconWrap: {
    position: "absolute",
    top: -25,
    width: 72,
    height: 72,
    display: "grid",
    placeItems: "center",
    transition: "transform .22s cubic-bezier(.22,1,.36,1)",
  },

  progressSvg: {
    position: "absolute",
    inset: 0,
    overflow: "visible",
    pointerEvents: "none",
  },

  mainIconGlass: {
    position: "absolute",
    inset: 2,
    borderRadius: 999,
    background: "linear-gradient(180deg, rgba(255,255,255,.84), rgba(255,255,255,.56))",
    border: "1px solid rgba(255,255,255,.74)",
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

  mainLabel: {
    fontSize: 8,
    lineHeight: 1,
    fontWeight: 950,
    letterSpacing: 0.85,
    textTransform: "uppercase",
    transition:
      "color .26s ease, opacity .26s ease, transform .32s cubic-bezier(.22,1,.36,1)",
  },

  sheetOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 11000,
    background: "rgba(2,6,23,.22)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    display: "grid",
    alignItems: "end",
    padding: 12,
    paddingBottom: "calc(96px + env(safe-area-inset-bottom))",
  },

  sheet: {
    width: "100%",
    maxWidth: 430,
    margin: "0 auto",
    borderRadius: 26,
    background: "linear-gradient(180deg, rgba(255,255,255,.92), rgba(255,255,255,.86))",
    border: "1px solid rgba(255,255,255,.58)",
    boxShadow: "0 28px 80px rgba(15,23,42,.16)",
    padding: 14,
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
  },

  sheetGrab: {
    width: 44,
    height: 5,
    borderRadius: 999,
    background: "rgba(100,116,139,.24)",
    margin: "0 auto 10px",
  },

  sheetTitle: {
    textAlign: "center",
    fontSize: 15,
    fontWeight: 950,
    color: TEXT,
    marginBottom: 12,
  },

  sheetActionDanger: {
    width: "100%",
    padding: 15,
    borderRadius: 18,
    border: "1px solid rgba(255,106,0,.18)",
    background: "rgba(255,106,0,.10)",
    color: ORANGE,
    fontWeight: 950,
    fontSize: 14,
    marginBottom: 10,
  },

  sheetActionSoft: {
    width: "100%",
    padding: 15,
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,.08)",
    background: "rgba(255,255,255,.72)",
    color: TEXT,
    fontWeight: 950,
    fontSize: 14,
  },
};
