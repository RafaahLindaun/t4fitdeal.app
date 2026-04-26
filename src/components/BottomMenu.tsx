import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const ORANGE = "#FF6A00";
const TEXT = "#656B78";
const DARK = "#0f172a";

function isRouteActive(pathname, to) {
  if (to === "/dashboard") return pathname === "/dashboard" || pathname === "/";
  if (to === "/treino") return pathname.startsWith("/treino");
  return pathname === to || pathname.startsWith(`${to}/`);
}

function HomeIcon({ active }) {
  const stroke = active ? "#fff" : ORANGE;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4.8 10.2L12 4.8l7.2 5.4v8.1a1.2 1.2 0 0 1-1.2 1.2h-3.9v-5.1a1.2 1.2 0 0 0-1.2-1.2h-1.8a1.2 1.2 0 0 0-1.2 1.2v5.1H6a1.2 1.2 0 0 1-1.2-1.2v-8.1Z"
        stroke={stroke}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NutritionIcon({ active }) {
  const stroke = active ? "#fff" : ORANGE;

  return (
    <svg width="28" height="28" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {/* fork */}
      <path
        d="M11 10v7"
        stroke={stroke}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M8.6 10v5.2"
        stroke={stroke}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M13.4 10v5.2"
        stroke={stroke}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M11 17v16"
        stroke={stroke}
        strokeWidth="2.6"
        strokeLinecap="round"
      />

      {/* plate */}
      <circle
        cx="24"
        cy="24"
        r="9.8"
        stroke={stroke}
        strokeWidth="2.7"
      />
      <circle
        cx="24"
        cy="24"
        r="5.5"
        stroke={stroke}
        strokeWidth="2.1"
      />

      {/* knife */}
      <path
        d="M36.2 10.5c-2.1.9-3.8 2.9-3.8 5.7v5.6c0 2 .9 3.2 2.4 4.2v7"
        stroke={stroke}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DumbbellIcon({ active }) {
  const stroke = active ? ORANGE : ORANGE;
  return (
    <svg width="28" height="28" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <g transform="rotate(-22 24 24)">
        <path d="M17 24h14" stroke={stroke} strokeWidth="2.8" strokeLinecap="round" />
        <rect x="8.8" y="18.2" width="3.2" height="11.6" rx="1.2" stroke={stroke} strokeWidth="2.4" />
        <rect x="13.1" y="16.4" width="2.8" height="15.2" rx="1.1" stroke={stroke} strokeWidth="2.4" />
        <rect x="32.1" y="16.4" width="2.8" height="15.2" rx="1.1" stroke={stroke} strokeWidth="2.4" />
        <rect x="36" y="18.2" width="3.2" height="11.6" rx="1.2" stroke={stroke} strokeWidth="2.4" />
      </g>
    </svg>
  );
}

function CardIcon({ active }) {
  const stroke = active ? "#fff" : ORANGE;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="3.5"
        y="5.5"
        width="17"
        height="13"
        rx="3"
        stroke={stroke}
        strokeWidth="2.2"
      />
      <path
        d="M3.5 10h17"
        stroke={stroke}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M7 15h3.2"
        stroke={stroke}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UserIcon({ active }) {
  const stroke = active ? "#fff" : ORANGE;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 12a3.7 3.7 0 1 0 0-7.4 3.7 3.7 0 0 0 0 7.4Z"
        stroke={stroke}
        strokeWidth="2.2"
      />
      <path
        d="M5 19.2c1.8-2.7 4.1-4 7-4s5.2 1.3 7 4"
        stroke={stroke}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MenuItem({ to, label, active, children, specialNutri = false }) {
  return (
    <Link to={to} style={styles.link}>
      <motion.div whileTap={{ scale: 0.965 }} style={styles.item}>
        {active && (
          <motion.div
            layoutId="fitdeal-bottom-pill"
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            style={styles.activeBg}
          />
        )}

        <div style={specialNutri ? styles.iconWrapNutri : styles.iconWrap}>
          {children}
        </div>

        <div
          style={{
            ...(specialNutri ? styles.labelNutri : styles.label),
            color: active ? "#fff" : TEXT,
            opacity: active ? 1 : 1,
          }}
        >
          {label}
        </div>
      </motion.div>
    </Link>
  );
}

export default function BottomMenu() {
  const { pathname } = useLocation();
  const nav = useNavigate();

  const homeActive = isRouteActive(pathname, "/dashboard");
  const nutriActive = isRouteActive(pathname, "/nutricao");
  const treinoActive = isRouteActive(pathname, "/treino");
  const planosActive = isRouteActive(pathname, "/pagamentos");
  const contaActive = isRouteActive(pathname, "/conta");

  return (
    <div style={styles.wrapper}>
      <nav style={styles.nav}>
        <div style={styles.sideGroup}>
          <MenuItem to="/dashboard" label="INÍCIO" active={homeActive}>
            <HomeIcon active={homeActive} />
          </MenuItem>

          <MenuItem
            to="/nutricao"
            label="NUTRIÇÃO"
            active={nutriActive}
            specialNutri
          >
            <NutritionIcon active={nutriActive} />
          </MenuItem>
        </div>

        <div style={styles.centerSlot}>
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => nav("/treino")}
            style={styles.centerBtnWrap}
          >
            <div style={styles.centerBtn}>
              <DumbbellIcon active={treinoActive} />
            </div>
            <div style={{ ...styles.centerLabel, color: treinoActive ? DARK : TEXT }}>
              TREINO
            </div>
          </motion.button>
        </div>

        <div style={styles.sideGroup}>
          <MenuItem to="/pagamentos" label="PLANOS" active={planosActive}>
            <CardIcon active={planosActive} />
          </MenuItem>

          <MenuItem to="/conta" label="CONTA" active={contaActive}>
            <UserIcon active={contaActive} />
          </MenuItem>
        </div>
      </nav>
    </div>
  );
}

const styles = {
  wrapper: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 18,
    display: "flex",
    justifyContent: "center",
    zIndex: 10000,
    padding: "0 14px",
    pointerEvents: "none",
  },

  nav: {
    width: "100%",
    maxWidth: 790,
    minHeight: 108,
    position: "relative",
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "end",
    gap: 8,
    padding: "14px 14px 12px",
    borderRadius: 36,
    background: "rgba(255,255,255,.74)",
    backdropFilter: "blur(28px)",
    WebkitBackdropFilter: "blur(28px)",
    border: "1px solid rgba(255,255,255,.55)",
    boxShadow:
      "0 20px 60px rgba(15,23,42,.10), 0 10px 30px rgba(255,106,0,.06)",
    pointerEvents: "auto",
    overflow: "visible",
  },

  sideGroup: {
    display: "flex",
    alignItems: "end",
    justifyContent: "space-evenly",
    gap: 6,
  },

  centerSlot: {
    position: "relative",
    width: 112,
    display: "flex",
    justifyContent: "center",
    alignItems: "end",
  },

  centerBtnWrap: {
    position: "absolute",
    top: -34,
    left: "50%",
    transform: "translateX(-50%)",
    width: 112,
    background: "transparent",
    border: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: 0,
    cursor: "pointer",
  },

  centerBtn: {
    width: 86,
    height: 86,
    borderRadius: 999,
    background:
      "linear-gradient(180deg, rgba(255,255,255,.98), rgba(246,242,239,.94))",
    border: "1px solid rgba(255,255,255,.92)",
    display: "grid",
    placeItems: "center",
    boxShadow:
      "0 10px 35px rgba(15,23,42,.10), inset 0 1px 0 rgba(255,255,255,.95), 0 0 0 8px rgba(255,255,255,.28)",
  },

  centerLabel: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 1,
    letterSpacing: 2.1,
    fontWeight: 900,
  },

  link: {
    textDecoration: "none",
    flex: 1,
    minWidth: 0,
  },

  item: {
    position: "relative",
    height: 78,
    minWidth: 0,
    borderRadius: 30,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    padding: "8px 10px 10px",
  },

  activeBg: {
    position: "absolute",
    inset: 0,
    borderRadius: 30,
    background: "linear-gradient(180deg, #FF8A32 0%, #FF6A00 100%)",
    boxShadow:
      "0 18px 34px rgba(255,106,0,.30), inset 0 1px 0 rgba(255,255,255,.20)",
    zIndex: 0,
  },

  iconWrap: {
    position: "relative",
    zIndex: 1,
    width: 30,
    height: 30,
    display: "grid",
    placeItems: "center",
    marginBottom: 7,
  },

  iconWrapNutri: {
    position: "relative",
    zIndex: 1,
    width: 32,
    height: 32,
    display: "grid",
    placeItems: "center",
    marginBottom: 8,
    transform: "translateY(1px)",
  },

  label: {
    position: "relative",
    zIndex: 1,
    fontSize: 10.5,
    lineHeight: 1,
    letterSpacing: 2.1,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  labelNutri: {
    position: "relative",
    zIndex: 1,
    fontSize: 10.4,
    lineHeight: 1,
    letterSpacing: 1.95,
    fontWeight: 900,
    whiteSpace: "nowrap",
    transform: "translateY(1px)",
  },
};
