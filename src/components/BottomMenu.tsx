import React, { useEffect, useRef, useState } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

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

  return (

    <svg width="30" height="30" viewBox="0 0 64 64" fill="none" aria-hidden="true">

      <g transform="translate(0,1)">

        <path

          d="M32 46V24"

          stroke={active ? "#fff" : ORANGE}

          strokeWidth="3.8"

          strokeLinecap="round"

        />

        <path

          d="M32 34.3C32 27.9 36.7 23 44.3 20.8C45.7 20.4 46.8 22 46 23.3C42.7 29.2 38.3 32.9 32 34.3Z"

          fill={active ? "#fff" : ORANGE}

        />

        <path

          d="M31.9 34.5C30.8 28.8 26.4 24.7 19.7 22.6C18.2 22.1 17 23.9 18 25.2C21.5 30.4 25.9 33.6 31.9 34.5Z"

          fill={active ? "#fff" : ORANGE}

          opacity="0.96"

        />

        <path

          d="M32.4 39.9C32.8 36.8 35.1 34.1 39.2 32.7"

          stroke={active ? "rgba(255,255,255,.56)" : "rgba(255,255,255,.28)"}

          strokeWidth="2"

          strokeLinecap="round"

        />

        <path

          d="M31.6 40.8C30.9 37.8 28.8 35.4 25.2 34.1"

          stroke={active ? "rgba(255,255,255,.56)" : "rgba(255,255,255,.28)"}

          strokeWidth="2"

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

  const { user } = useAuth() as any;

  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const [trainHoldProgress, setTrainHoldProgress] = useState(0);

  const [trainHoldBlocked, setTrainHoldBlocked] = useState(false);

  const holdStartTimerRef = useRef<number | null>(null);

  const holdProgressIntervalRef = useRef<number | null>(null);

  const holdCompletedRef = useRef(false);

  const pressStartedRef = useRef(false);

  const accountTapRef = useRef<number>(0);

  const accountTapTimerRef = useRef<number | null>(null);

  const HOLD_DELAY_MS = 240;

  const HOLD_TOTAL_MS = 1250;

  const items: Item[] = [

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

  const isPaid =

    user?.is_paid === true ||

    user?.plan === "premium" ||

    user?.plan === "basico" ||

    user?.plan === "nutri" ||

    user?.role === "premium";

  useEffect(() => {

    return () => {

      if (holdStartTimerRef.current) window.clearTimeout(holdStartTimerRef.current);

      if (holdProgressIntervalRef.current) window.clearInterval(holdProgressIntervalRef.current);

      if (accountTapTimerRef.current) window.clearTimeout(accountTapTimerRef.current);

    };

  }, []);

  function go(to: string) {

    nav(to);

  }

  function clearHoldTimers() {

    if (holdStartTimerRef.current) {

      window.clearTimeout(holdStartTimerRef.current);

      holdStartTimerRef.current = null;

    }

    if (holdProgressIntervalRef.current) {

      window.clearInterval(holdProgressIntervalRef.current);

      holdProgressIntervalRef.current = null;

    }

  }

  function resetHoldState() {

    clearHoldTimers();

    pressStartedRef.current = false;

    setTrainHoldProgress(0);

  }

  function startTrainHold() {

    resetHoldState();

    holdCompletedRef.current = false;

    setTrainHoldBlocked(false);

    pressStartedRef.current = true;

    holdStartTimerRef.current = window.setTimeout(() => {

      if (!pressStartedRef.current) return;

      if (!isPaid) {

        setTrainHoldBlocked(true);

        window.setTimeout(() => setTrainHoldBlocked(false), 900);

        pressStartedRef.current = false;

        setTrainHoldProgress(0);

        return;

      }

      const startedAt = performance.now();

      setTrainHoldProgress(0);

      holdProgressIntervalRef.current = window.setInterval(() => {

        if (!pressStartedRef.current) return;

        const elapsed = performance.now() - startedAt;

        const pct = Math.min(1, elapsed / HOLD_TOTAL_MS);

        setTrainHoldProgress(pct);

        if (pct >= 1) {

          clearHoldTimers();

          holdCompletedRef.current = true;

          pressStartedRef.current = false;

          setTrainHoldProgress(1);

          nav("/treino-detalhe");

        }

      }, 16);

    }, HOLD_DELAY_MS);

  }

  function endTrainHold() {

    const completed = holdCompletedRef.current;

    if (!completed) {

      resetHoldState();

    } else {

      setTrainHoldProgress(0);

      holdCompletedRef.current = false;

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

                  onMouseDown={startTrainHold}

                  onMouseUp={endTrainHold}

                  onMouseLeave={endTrainHold}

                  onTouchStart={startTrainHold}

                  onTouchEnd={endTrainHold}

                  onTouchCancel={endTrainHold}

                  onClick={onTrainClick}

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

                        stroke="rgba(255,106,0,.12)"

                        strokeWidth="2.5"

                      />

                      <circle

                        cx="36"

                        cy="36"

                        r={ringRadius}

                        fill="none"

                        stroke="rgba(255,106,0,.96)"

                        strokeWidth="2.8"

                        strokeLinecap="round"

                        strokeDasharray={ringCircumference}

                        strokeDashoffset={ringOffset}

                        transform="rotate(-90 36 36)"

                        style={{

                          opacity: trainHoldProgress > 0 ? 1 : 0,

                          transition: "opacity .16s ease",

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

            if (item.to === "/conta") {

              return (

                <button

                  key={item.to}

                  type="button"

                  onClick={onAccountClick}

                  className="fitdeal-bottom-item"

                  style={styles.item}

                >

                  <span

                    style={{

                      ...styles.iconWrap,

                      transform: active

                        ? "translateY(-1px) scale(1.06)"

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

                    transform: active

                      ? "translateY(-1px) scale(1.06)"

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

  mainIconWrap: {

    position: "absolute",

    top: -24,

    width: 72,

    height: 72,

    display: "grid",

    placeItems: "center",

    transition: "transform .34s cubic-bezier(.22,1,.36,1)",

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
