import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const ORANGE = "#FF6A00";
const TEXT = "#0f172a";

function HomeIcon({ active }) {
  const c = active ? "#fff" : ORANGE;

  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4.5 10.7 12 4.4l7.5 6.3" stroke={c} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.7 10.2v8.1c0 .8.6 1.4 1.4 1.4h7.8c.8 0 1.4-.6 1.4-1.4v-8.1" stroke={c} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 19.7v-5.1h4v5.1" stroke={c} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NutritionIcon({ active }) {
  const c = active ? "#fff" : ORANGE;

  return (
    <svg
      width="31"
      height="31"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ display: "block", overflow: "visible" }}
    >
      <g transform="rotate(-18 12 12)">
        {/* contorno */}
        <path
          d="M7.95 19.15
             C7.45 19.15 7.15 19.03 6.95 18.85
             C6.62 18.55 6.63 18.11 6.98 17.53
             L8.02 15.84
             C6.98 14.3 6.42 12.48 6.42 10.36
             C6.42 6.72 8.56 4.08 12.43 2.86
             C12.65 2.79 12.85 2.75 13.03 2.75
             C13.45 2.75 13.75 2.89 13.95 3.17
             C14.14 3.44 14.18 3.79 14.06 4.2
             C13.54 5.95 13.96 7.5 14.38 8.99
             C14.59 9.73 14.79 10.43 14.89 11.13
             C15.28 13.66 14.73 15.92 13.24 17.79
             C11.71 19.72 9.53 20.85 8.16 20.85
             C8.09 20.85 8.02 20.85 7.95 20.84Z"
          stroke={c}
          strokeWidth="1.95"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* nervura central */}
        <path
          d="M8.25 18.1 15.18 6.35"
          stroke={c}
          strokeWidth="1.52"
          strokeLinecap="round"
        />

        {/* nervuras esquerdas */}
        <path
          d="M10.05 14.45c-.98-.6-1.73-1.43-2.12-2.5"
          stroke={c}
          strokeWidth="1.02"
          strokeLinecap="round"
        />
        <path
          d="M11.4 12.15c-.76-.46-1.3-1.09-1.62-1.93"
          stroke={c}
          strokeWidth="0.96"
          strokeLinecap="round"
        />
        <path
          d="M12.52 10.25c-.34-.67-.44-1.47-.28-2.42"
          stroke={c}
          strokeWidth="0.92"
          strokeLinecap="round"
        />

        {/* nervuras direitas */}
        <path
          d="M11.15 15.02c1.34-.08 2.64-.5 3.95-1.28"
          stroke={c}
          strokeWidth="1.02"
          strokeLinecap="round"
        />
        <path
          d="M12.42 12.95c1.08-.1 2.04-.44 3-1.02"
          stroke={c}
          strokeWidth="0.96"
          strokeLinecap="round"
        />

        {/* pecíolo */}
        <path
          d="M8.04 18.55 7.28 19.33"
          stroke={c}
          strokeWidth="1.02"
          strokeLinecap="round"
        />
      </g>
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
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.7" y="6.4" width="16.6" height="11.2" rx="2.6" stroke={c} strokeWidth="2.25" />
      <path d="M4.2 10h15.6" stroke={c} strokeWidth="2.25" strokeLinecap="round" />
      <path d="M7.4 14.5h3.5" stroke={c} strokeWidth="2.25" strokeLinecap="round" />
    </svg>
  );
}

function UserIcon({ active }) {
  const c = active ? "#fff" : ORANGE;

  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 12.2a4.1 4.1 0 1 0 0-8.2 4.1 4.1 0 0 0 0 8.2Z" stroke={c} strokeWidth="2.25" />
      <path d="M4.9 20.1c.8-3.6 3.3-5.5 7.1-5.5s6.3 1.9 7.1 5.5" stroke={c} strokeWidth="2.25" strokeLinecap="round" />
    </svg>
  );
}

export default function BottomMenu() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const { user } = useAuth() || {};

  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [trainHoldProgress, setTrainHoldProgress] = useState(0);
  const [trainHoldBlocked, setTrainHoldBlocked] = useState(false);
  const [trainPressing, setTrainPressing] = useState(false);
  const [hasWorkoutDetailAccess, setHasWorkoutDetailAccess] = useState(false);

  const holdStartTimerRef = useRef(null);
  const holdProgressRafRef = useRef(null);
  const holdStartAtRef = useRef(0);
  const holdCompletedRef = useRef(false);
  const pressStartedRef = useRef(false);

  const accountTapRef = useRef(0);
  const accountTapTimerRef = useRef(null);

  const HOLD_DELAY_MS = 260;
  const HOLD_TOTAL_MS = 1200;

  const items = [
    { to: "/dashboard", label: "Início", Icon: HomeIcon },
    { to: "/nutricao", label: "Nutrição", Icon: NutritionIcon },
    { to: "/treino", label: "Treino", Icon: () => <DumbbellIcon />, main: true },
    { to: "/pagamentos", label: "Planos", Icon: CardIcon },
    { to: "/conta", label: "Conta", Icon: UserIcon },
  ];

  const activeIndex = Math.max(
    0,
    items.findIndex((it) => pathname === it.to || pathname.startsWith(`${it.to}/`))
  );

  useEffect(() => {
    let mounted = true;

    async function loadPaidAccess() {
      if (!user?.id) {
        if (mounted) setHasWorkoutDetailAccess(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_subscriptions")
          .select("plan_key, status")
          .eq("user_id", user.id)
          .in("status", ["active", "trialing"])
          .limit(5);

        if (error) {
          console.error("BottomMenu loadPaidAccess error:", error);
          if (mounted) setHasWorkoutDetailAccess(false);
          return;
        }

        const rows = Array.isArray(data) ? data : [];
        const allowed = rows.some((row) => {
          const planKey = String(row?.plan_key || "").toLowerCase();
          const status = String(row?.status || "").toLowerCase();
          return ["active", "trialing"].includes(status) && ["basico", "premium", "nutri"].includes(planKey);
        });

        if (mounted) setHasWorkoutDetailAccess(allowed);
      } catch (err) {
        console.error("BottomMenu loadPaidAccess catch:", err);
        if (mounted) setHasWorkoutDetailAccess(false);
      }
    }

    loadPaidAccess();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    return () => {
      if (holdStartTimerRef.current) window.clearTimeout(holdStartTimerRef.current);
      if (holdProgressRafRef.current) window.cancelAnimationFrame(holdProgressRafRef.current);
      if (accountTapTimerRef.current) window.clearTimeout(accountTapTimerRef.current);
    };
  }, []);

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
        pressStartedRef.current = false;
        setTrainPressing(false);
        nav("/treino-detalhe");
        return;
      }

      holdProgressRafRef.current = window.requestAnimationFrame(tick);
    };

    holdProgressRafRef.current = window.requestAnimationFrame(tick);
  }

  function startTrainHold() {
    resetHoldState();
    holdCompletedRef.current = false;
    setTrainHoldBlocked(false);
    pressStartedRef.current = true;
    setTrainPressing(true);

    holdStartTimerRef.current = window.setTimeout(() => {
      if (!pressStartedRef.current) return;

      if (!hasWorkoutDetailAccess) {
        setTrainHoldBlocked(true);
        setTrainPressing(false);
        pressStartedRef.current = false;
        window.setTimeout(() => setTrainHoldBlocked(false), 900);
        return;
      }

      holdStartAtRef.current = performance.now();
      runHoldProgress();
    }, HOLD_DELAY_MS);
  }

  function endTrainHold() {
    const completed = holdCompletedRef.current;
    if (!completed) resetHoldState();
    else {
      holdCompletedRef.current = false;
      setTrainHoldProgress(0);
      setTrainPressing(false);
    }
  }

  function onTrainClick() {
    if (holdCompletedRef.current) {
      holdCompletedRef.current = false;
      return;
    }
    nav("/treino");
  }

  function onAccountClick() {
    accountTapRef.current += 1;

    if (accountTapTimerRef.current) window.clearTimeout(accountTapTimerRef.current);

    accountTapTimerRef.current = window.setTimeout(() => {
      if (accountTapRef.current >= 2) setShowAccountMenu((v) => !v);
      else nav("/conta");
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
            const handleClick = item.to === "/conta" ? onAccountClick : () => go(item.to);

            if (item.main) {
              return (
                <button
                  key={item.to}
                  type="button"
                  onPointerDown={startTrainHold}
                  onPointerUp={endTrainHold}
                  onPointerLeave={endTrainHold}
                  onPointerCancel={endTrainHold}
                  onClick={onTrainClick}
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
                    <svg width="72" height="72" viewBox="0 0 72 72" style={styles.progressSvg} aria-hidden="true">
                      <circle cx="36" cy="36" r={ringRadius} fill="none" stroke="rgba(255,106,0,.10)" strokeWidth="2.5" />
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
                        style={{ opacity: trainHoldProgress > 0 ? 1 : 0, transition: "opacity .14s ease" }}
                      />
                    </svg>

                    <span
                      style={{
                        ...styles.mainIconGlass,
                        boxShadow: trainHoldBlocked ? "0 0 0 4px rgba(255,106,0,.10)" : undefined,
                      }}
                    />
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

                  <span style={{ ...styles.mainLabel, color: active ? ORANGE : TEXT, opacity: active ? 1 : 0.74 }}>
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={item.to}
                type="button"
                onClick={handleClick}
                className="fitdeal-bottom-item"
                style={styles.item}
              >
                <span
                  style={{
                    ...styles.iconWrap,
                    ...(item.to === "/nutricao" ? styles.iconWrapNutri : null),
                    transform:
                      active
                        ? item.to === "/nutricao"
                          ? "translateY(-1px) scale(1.16)"
                          : "translateY(-1px) scale(1.06)"
                        : item.to === "/nutricao"
                          ? "translateY(0px) scale(1.08)"
                          : "translateY(0) scale(1)",
                    filter: active
                      ? "drop-shadow(0 8px 16px rgba(255,255,255,.14))"
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
          }
          .fitdeal-bottom-item:active {
            transform: scale(.91);
            filter: brightness(.98);
          }
          .fitdeal-main-item:active {
            transform: scale(.97);
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
    minHeight: 70,
    padding: 6,
    gap: 4,
    borderRadius: 34,
    background: "linear-gradient(180deg, rgba(255,255,255,.84), rgba(255,255,255,.66))",
    border: "1px solid rgba(255,255,255,.52)",
    boxShadow: "0 28px 70px rgba(15,23,42,.16), inset 0 1px 0 rgba(255,255,255,.55)",
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
    background: "linear-gradient(135deg, rgba(255,106,0,1), rgba(255,138,61,1))",
    boxShadow: "0 16px 38px rgba(255,106,0,.30), 0 0 0 1px rgba(255,255,255,.22)",
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
    width: 30,
    height: 30,
    display: "grid",
    placeItems: "center",
    transition: "transform .32s cubic-bezier(.22,1,.36,1), filter .26s ease",
  },

  iconWrapNutri: {
    width: 36,
    height: 36,
    marginBottom: -1,
  },

  label: {
    fontSize: 8,
    lineHeight: 1,
    fontWeight: 950,
    letterSpacing: 0.85,
    textTransform: "uppercase",
    transition: "color .26s ease, opacity .26s ease, transform .32s cubic-bezier(.22,1,.36,1)",
  },

  labelNutri: {
    letterSpacing: 0.66,
    fontSize: 7.65,
  },

  mainIconWrap: {
    position: "absolute",
    top: -24,
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
    background: "linear-gradient(180deg, rgba(255,255,255,.82), rgba(255,255,255,.54))",
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

  mainLabel: {
    fontSize: 8,
    lineHeight: 1,
    fontWeight: 950,
    letterSpacing: 0.85,
    textTransform: "uppercase",
    transition: "color .26s ease, opacity .26s ease, transform .32s cubic-bezier(.22,1,.36,1)",
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
