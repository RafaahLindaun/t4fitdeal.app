import React, { useEffect, useRef, useState } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import { supabase } from "../lib/supabase";

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

const TEXT = "#4b5563";

function HomeIcon({ active }: IconProps) {

  const c = active ? "#fff" : ORANGE;

  return (

    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" aria-hidden="true">

      <path

        d="M4.5 10.7 12 4.4l7.5 6.3"

        stroke={c}

        strokeWidth="2.4"

        strokeLinecap="round"

        strokeLinejoin="round"

      />

      <path

        d="M6.7 10.2v8.1c0 .8.6 1.4 1.4 1.4h7.8c.8 0 1.4-.6 1.4-1.4v-8.1"

        stroke={c}

        strokeWidth="2.4"

        strokeLinecap="round"

        strokeLinejoin="round"

      />

      <path

        d="M10 19.7v-5.1h4v5.1"

        stroke={c}

        strokeWidth="2.4"

        strokeLinecap="round"

        strokeLinejoin="round"

      />

    </svg>

  );

}

function NutritionIcon({ active }: IconProps) {

  const c = active ? "#fff" : ORANGE;

  return (

    <svg width="40" height="40" viewBox="0 0 64 64" fill="none" aria-hidden="true">

      <g transform="translate(0,-1)">

        <path

          d="M32 47V28"

          stroke={c}

          strokeWidth="5.2"

          strokeLinecap="round"

        />

        <path

          d="M32.2 35.6C32.2 29.6 36.7 24.9 44.1 22.7C45.8 22.2 47 24.1 45.9 25.6C42.7 31.3 38.5 34.8 32.2 35.6Z"

          stroke={c}

          strokeWidth="4.2"

          strokeLinecap="round"

          strokeLinejoin="round"

        />

        <path

          d="M31.8 35.6C30.6 30 26.3 25.7 19.8 23.6C18.1 23.1 17 25.1 18 26.6C21.3 31.7 25.5 34.8 31.8 35.6Z"

          stroke={c}

          strokeWidth="4.2"

          strokeLinecap="round"

          strokeLinejoin="round"

        />

        <path

          d="M37.8 28.8L42.4 26.1"

          stroke={c}

          strokeWidth="3"

          strokeLinecap="round"

        />

        <path

          d="M39.5 31.9L43.8 30.4"

          stroke={c}

          strokeWidth="3"

          strokeLinecap="round"

        />

        <path

          d="M26.3 28.9L21.9 26.6"

          stroke={c}

          strokeWidth="3"

          strokeLinecap="round"

        />

        <path

          d="M24.5 31.9L20.3 30.5"

          stroke={c}

          strokeWidth="3"

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

  const c = active ? "#fff" : ORANGE;

  return (

    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" aria-hidden="true">

      <rect

        x="3.7"

        y="6.4"

        width="16.6"

        height="11.2"

        rx="2.6"

        stroke={c}

        strokeWidth="2.35"

      />

      <path

        d="M4.2 10h15.6"

        stroke={c}

        strokeWidth="2.35"

        strokeLinecap="round"

      />

      <path

        d="M7.4 14.5h3.5"

        stroke={c}

        strokeWidth="2.35"

        strokeLinecap="round"

      />

    </svg>

  );

}

function UserIcon({ active }: IconProps) {

  const c = active ? "#fff" : ORANGE;

  return (

    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" aria-hidden="true">

      <path

        d="M12 12.2a4.1 4.1 0 1 0 0-8.2 4.1 4.1 0 0 0 0 8.2Z"

        stroke={c}

        strokeWidth="2.35"

      />

      <path

        d="M4.9 20.1c.8-3.6 3.3-5.5 7.1-5.5s6.3 1.9 7.1 5.5"

        stroke={c}

        strokeWidth="2.35"

        strokeLinecap="round"

      />

    </svg>

  );

}

export default function BottomMenu() {

  const { pathname } = useLocation();

  const nav = useNavigate();

  const { user } = useAuth() as any;

  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const [trainHoldProgress, setTrainHoldProgress] = useState(0);

  const [trainHoldBlocked, setTrainHoldBlocked] = useState(false);

  const [trainPressing, setTrainPressing] = useState(false);

  const [hasWorkoutDetailAccess, setHasWorkoutDetailAccess] = useState(false);

  const holdStartTimerRef = useRef<number | null>(null);

  const holdProgressRafRef = useRef<number | null>(null);

  const holdStartAtRef = useRef<number>(0);

  const holdCompletedRef = useRef(false);

  const pressStartedRef = useRef(false);

  const accountTapRef = useRef<number>(0);

  const accountTapTimerRef = useRef<number | null>(null);

  const HOLD_DELAY_MS = 180;

  const HOLD_TOTAL_MS = 1050;

  const items: Item[] = [

    { to: "/dashboard", label: "INÍCIO", Icon: HomeIcon },

    { to: "/nutricao", label: "NUTRIÇÃO", Icon: NutritionIcon },

    { to: "/treino", label: "TREINO", Icon: () => <DumbbellIcon />, main: true },

    { to: "/pagamentos", label: "PLANOS", Icon: CardIcon },

    { to: "/conta", label: "CONTA", Icon: UserIcon },

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

          return ["active", "trialing"].includes(status) && ["basico", "premium"].includes(planKey);

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

    const tick = (now: number) => {

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

    if (!completed) {

      resetHoldState();

    } else {

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

                    <span

                      style={{

                        ...styles.mainIconGlass,

                        boxShadow: trainHoldBlocked

                          ? "0 0 0 4px rgba(255,106,0,.10)"

                          : undefined,

                      }}

                    />

                    <span

                      style={{

                        ...styles.mainIconInner,

                        boxShadow:

                          trainPressing || trainHoldProgress > 0

                            ? "0 20px 48px rgba(255,106,0,.24), inset 0 1px 0 rgba(255,255,255,.7)"

                            : "0 16px 38px rgba(255,106,0,.16), inset 0 1px 0 rgba(255,255,255,.62)",

                      }}

                    >

                      <Icon active={active} />

                    </span>

                  </span>

                  <span style={styles.mainLabel}>{item.label}</span>

                </button>

              );

            }

            return (

              <button

                key={item.to}

                type="button"

                onClick={item.to === "/conta" ? onAccountClick : () => nav(item.to)}

                className="fitdeal-bottom-item"

                style={styles.item}

              >

                <span

                  style={{

                    ...styles.iconWrap,

                    ...(item.to === "/nutricao" ? styles.iconWrapNutri : null),

                    transform: active

                      ? item.to === "/nutricao"

                        ? "translateY(-3px) scale(1.12)"

                        : "translateY(-1px) scale(1.06)"

                      : item.to === "/nutricao"

                        ? "translateY(-2px) scale(1.08)"

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

                    opacity: active ? 1 : 0.92,

                  }}

                >

                  {item.label}

                </span>

              </button>

            );

          })}

        </nav>

      </div>

    </>

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

    minHeight: 72,

    padding: 6,

    gap: 4,

    borderRadius: 36,

    background:

      "linear-gradient(180deg, rgba(255,255,255,.88), rgba(255,255,255,.72))",

    border: "1px solid rgba(255,255,255,.58)",

    boxShadow:

      "0 24px 64px rgba(15,23,42,.14), inset 0 1px 0 rgba(255,255,255,.55)",

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

    borderRadius: 30,

    background: "linear-gradient(180deg, #FF7A1A, #FF9B4A)",

    boxShadow:

      "0 16px 38px rgba(255,106,0,.26), 0 0 0 1px rgba(255,255,255,.22)",

    transition: "transform .38s cubic-bezier(.22,1,.36,1), opacity .22s ease",

    zIndex: 1,

  },

  item: {

    position: "relative",

    zIndex: 2,

    flex: 1,

    height: 58,

    border: "none",

    background: "transparent",

    borderRadius: 28,

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

    height: 58,

    border: "none",

    background: "transparent",

    borderRadius: 28,

    display: "flex",

    flexDirection: "column",

    alignItems: "center",

    justifyContent: "flex-end",

    gap: 0,

    padding: 0,

    paddingBottom: 5,

    cursor: "pointer",

    WebkitTapHighlightColor: "transparent",

  },

  iconWrap: {

    width: 30,

    height: 30,

    display: "grid",

    placeItems: "center",

    transition: "transform .28s cubic-bezier(.22,1,.36,1), filter .26s ease",

  },

  iconWrapNutri: {

    width: 34,

    height: 34,

  },

  label: {

    fontSize: 7.6,

    lineHeight: 1,

    fontWeight: 950,

    letterSpacing: 1.2,

    textTransform: "uppercase",

    transition: "color .26s ease, opacity .26s ease, transform .26s ease",

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

  mainLabel: {

    fontSize: 8.2,

    lineHeight: 1,

    fontWeight: 950,

    letterSpacing: 1.15,

    textTransform: "uppercase",

    color: TEXT,

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

    background:

      "linear-gradient(180deg, rgba(255,255,255,.92), rgba(255,255,255,.86))",

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
