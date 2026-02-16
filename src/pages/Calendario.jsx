// ✅ CRIE/COLE EM: src/pages/Calendario.jsx
// Calendário (Apple vibe) — histórico de água por dia (mês atual)
// Lê: water_history_<email> (salvo pelo Nutricao.jsx)
// ✅ FIX: evita “empurrar pro lado” quando aparece ml/% (minmax(0,1fr) + minWidth:0 + overflowX hidden)

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ORANGE = "#FF6A00";
const TEXT = "#0f172a";
const MUTED = "#64748b";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function dayKeyLocalFromDate(d) {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function waterGoalMl(pesoKg = 80) {
  const kg = Number(pesoKg || 0) || 80;
  return clamp(Math.round(kg * 35), 1800, 5000);
}

export default function Calendario() {
  const nav = useNavigate();
  const { user } = useAuth();
  const email = (user?.email || "anon").toLowerCase();

  const peso = Number(user?.peso || 0) || 80;
  const goalMl = useMemo(() => waterGoalMl(peso), [peso]);

  const historyKey = `water_history_${email}`;
  const history = useMemo(() => {
    try {
      const raw = localStorage.getItem(historyKey);
      const obj = raw ? JSON.parse(raw) : {};
      return obj && typeof obj === "object" ? obj : {};
    } catch {
      return {};
    }
  }, [historyKey]);

  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const monthLabel = useMemo(() => {
    const fmt = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
    return fmt.format(cursor);
  }, [cursor]);

  const days = useMemo(() => {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();

    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const totalDays = last.getDate();

    // 0=dom ... 6=sab
    const startWeekday = first.getDay();

    const grid = [];
    for (let i = 0; i < startWeekday; i++) grid.push(null);

    for (let d = 1; d <= totalDays; d++) {
      const dt = new Date(y, m, d);
      const key = dayKeyLocalFromDate(dt);
      const ml = Number(history[key] || 0) || 0;
      grid.push({ d, key, ml });
    }

    while (grid.length % 7 !== 0) grid.push(null);
    return grid;
  }, [cursor, history]);

  function prevMonth() {
    const d = new Date(cursor);
    d.setMonth(d.getMonth() - 1);
    d.setDate(1);
    setCursor(d);
  }
  function nextMonth() {
    const d = new Date(cursor);
    d.setMonth(d.getMonth() + 1);
    d.setDate(1);
    setCursor(d);
  }

  const todayKey = useMemo(() => dayKeyLocalFromDate(new Date()), []);

  return (
    <div style={S.page}>
      <div style={S.bgGlow} />

      <div style={S.head}>
        <div style={{ minWidth: 0 }}>
          <div style={S.kicker}>Calendário</div>
          <div style={S.title}>
            Hidratação<span style={{ color: ORANGE }}>.</span>
          </div>
          <div style={S.sub}>
            Meta diária sugerida: <b>{goalMl} ml</b>
          </div>
        </div>

        <button style={S.backBtn} onClick={() => nav("/nutricao")} type="button">
          Voltar
        </button>
      </div>

      <div style={S.monthBar}>
        <button style={S.monthBtn} onClick={prevMonth} type="button" aria-label="Mês anterior">
          ‹
        </button>
        <div style={S.monthLabel}>{monthLabel}</div>
        <button style={S.monthBtn} onClick={nextMonth} type="button" aria-label="Próximo mês">
          ›
        </button>
      </div>

      <div style={S.weekRow}>
        {["D", "S", "T", "Q", "Q", "S", "S"].map((w, i) => (
          <div key={`${w}_${i}`} style={S.weekCell}>
            {w}
          </div>
        ))}
      </div>

      <div style={S.grid}>
        {days.map((it, idx) => {
          if (!it) return <div key={`e_${idx}`} style={S.emptyCell} />;

          const pct = goalMl ? clamp(it.ml / goalMl, 0, 1) : 0;
          const isToday = it.key === todayKey;

          return (
            <div key={it.key} style={{ ...S.cell, ...(isToday ? S.todayCell : null) }}>
              <div style={S.cellTop}>
                <div style={S.dayNum}>{it.d}</div>
                <div style={S.ml} title={it.ml ? `${it.ml} ml` : ""}>
                  {it.ml ? `${it.ml}ml` : ""}
                </div>
              </div>

              <div style={S.track} aria-hidden="true">
                <div style={{ ...S.fill, width: `${Math.round(pct * 100)}%` }} />
              </div>

              <div style={S.pct}>{it.ml ? `${Math.round(pct * 100)}%` : "—"}</div>
            </div>
          );
        })}
      </div>

      <div style={S.footerNote}>
        Dica: sua água é salva automaticamente todos os dias. À meia-noite, o contador do dia reseta sozinho.
      </div>

      <div style={{ height: 120 }} />
    </div>
  );
}

const S = {
  page: {
    padding: 18,
    paddingBottom: 140,
    background:
      "radial-gradient(900px 480px at 18% -10%, rgba(255,106,0,.10), rgba(248,250,252,0) 60%), linear-gradient(180deg, #f8fafc, #f7f9fc)",
    position: "relative",
    overflow: "hidden",
    overflowX: "hidden", // ✅ trava scroll lateral
    maxWidth: "100%",
    boxSizing: "border-box",
  },
  bgGlow: {
    position: "absolute",
    inset: -120,
    pointerEvents: "none",
    background: "radial-gradient(520px 260px at 86% 6%, rgba(15,23,42,.06), rgba(255,255,255,0) 70%)",
  },

  head: {
    position: "relative",
    zIndex: 1,
    borderRadius: 24,
    padding: 16,
    background: "rgba(255,255,255,.72)",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 18px 60px rgba(15,23,42,.10)",
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  },

  kicker: { fontSize: 11, fontWeight: 950, color: MUTED, letterSpacing: 0.7, textTransform: "uppercase" },
  title: { marginTop: 4, fontSize: 20, fontWeight: 950, color: TEXT, letterSpacing: -0.5 },
  sub: { marginTop: 8, fontSize: 12, fontWeight: 800, color: MUTED, lineHeight: 1.35 },

  backBtn: {
    padding: "12px 14px",
    borderRadius: 16,
    border: "1px solid rgba(15,23,42,.10)",
    background: "rgba(255,255,255,.92)",
    color: TEXT,
    fontWeight: 950,
    whiteSpace: "nowrap",
    boxShadow: "0 12px 34px rgba(15,23,42,.06)",
    flexShrink: 0,
  },

  monthBar: {
    position: "relative",
    zIndex: 1,
    marginTop: 14,
    borderRadius: 22,
    padding: 12,
    background: "rgba(255,255,255,.92)",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    maxWidth: "100%",
    boxSizing: "border-box",
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: 950,
    color: TEXT,
    letterSpacing: -0.2,
    textTransform: "capitalize",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    minWidth: 0,
  },
  monthBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    border: "1px solid rgba(15,23,42,.10)",
    background: "#fff",
    color: TEXT,
    fontWeight: 950,
    fontSize: 22,
    lineHeight: 1,
    flexShrink: 0,
  },

  weekRow: {
    position: "relative",
    zIndex: 1,
    marginTop: 10,
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))", // ✅ não deixa conteúdo “forçar” largura
    gap: 8,
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
  },
  weekCell: {
    textAlign: "center",
    fontSize: 11,
    fontWeight: 900,
    color: MUTED,
    padding: "6px 0",
    minWidth: 0,
  },

  grid: {
    position: "relative",
    zIndex: 1,
    marginTop: 8,
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))", // ✅ principal correção
    gap: 8,
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
  },

  emptyCell: {
    height: 86,
    borderRadius: 18,
    border: "1px dashed rgba(15,23,42,.06)",
    background: "rgba(255,255,255,.45)",
    minWidth: 0, // ✅
  },

  cell: {
    height: 86,
    borderRadius: 18,
    padding: 10,
    border: "1px solid rgba(15,23,42,.06)",
    background: "rgba(255,255,255,.92)",
    boxShadow: "0 10px 24px rgba(15,23,42,.05)",
    display: "grid",
    gap: 8,
    alignContent: "start",
    minWidth: 0, // ✅
    overflow: "hidden", // ✅ impede conteúdo estourar e empurrar grid
    boxSizing: "border-box",
  },
  todayCell: {
    border: "1px solid rgba(255,106,0,.26)",
    boxShadow: "0 14px 30px rgba(255,106,0,.10)",
  },

  cellTop: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
    minWidth: 0, // ✅
  },
  dayNum: {
    fontSize: 13,
    fontWeight: 950,
    color: TEXT,
    flexShrink: 0,
    whiteSpace: "nowrap",
  },
  ml: {
    fontSize: 11,
    fontWeight: 900,
    color: MUTED,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    minWidth: 0,
    textAlign: "right",
    fontVariantNumeric: "tabular-nums",
  },

  track: {
    height: 10,
    borderRadius: 999,
    background: "rgba(15,23,42,.06)",
    overflow: "hidden",
    border: "1px solid rgba(15,23,42,.06)",
    minWidth: 0, // ✅
  },
  fill: {
    height: "100%",
    borderRadius: 999,
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    transition: "width .25s ease",
  },
  pct: {
    fontSize: 11,
    fontWeight: 950,
    color: TEXT,
    opacity: 0.9,
    whiteSpace: "nowrap",
    fontVariantNumeric: "tabular-nums",
    minWidth: 0, // ✅
  },

  footerNote: {
    position: "relative",
    zIndex: 1,
    marginTop: 14,
    fontSize: 12,
    fontWeight: 800,
    color: MUTED,
    lineHeight: 1.35,
  },
};
