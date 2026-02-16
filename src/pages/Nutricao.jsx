// ✅ COLE (com logo + nome do app no ponto ideal, sem balão, premium/clean/apple)
// ✅ Alteração pedida: adicionar “fitdeal.” + logo (visível e firme) NO TOPO do Dashboard
// - Sem balão / sem pill
// - Tipografia firme, estética clean
// - Sem mexer no resto do layout

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ✅ Coloque seu logo em: /src/assets/fitdeal-mark.png
import LogoMark from "../assets/fitdeal-mark.png";

const ORANGE = "#FF6A00";
const TEXT = "#0f172a";
const MUTED = "#64748b";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function estimateWorkoutKcal(weightKg) {
  const kg = Number(weightKg || 0);
  if (!kg) return 320;
  return Math.round(((6 * 3.5 * kg) / 200) * 45);
}

function calcWeeklyCount(list) {
  const now = new Date();
  return list.filter((k) => {
    const dt = new Date(k);
    const diff = (now.getTime() - dt.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff < 7.0001;
  }).length;
}

function calcStreak(opens, workoutSet) {
  let s = 0;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  while (true) {
    const k = d.toISOString().slice(0, 10);
    if (opens[k] && workoutSet.has(k)) {
      s++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return s;
}

/* ----------------- METAS (balões) ----------------- */
function safeJsonParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function labelFromGoal(g) {
  if (!g) return "";
  if (g.type === "freq") return `${g.value} dias de frequência`;
  if (g.type === "pr") return `${g.value} kg no ${g.exercise || "exercício"}`;
  if (g.type === "peso") return `${g.value} kg de peso-alvo`;
  if (g.type === "cardio") return `${g.value} sessões de cardio/sem`;
  return g.title || "Meta";
}

function iconFromGoal(g) {
  if (!g) return "🎯";
  if (g.type === "freq") return "📅";
  if (g.type === "pr") return "🏋️";
  if (g.type === "peso") return "⚖️";
  if (g.type === "cardio") return "🏃";
  return "🎯";
}

function GoalChip({ goal, onClick }) {
  return (
    <button style={styles.goalChip} onClick={onClick} type="button">
      <div style={styles.goalChipIcon}>{iconFromGoal(goal)}</div>
      <div style={{ minWidth: 0 }}>
        <div style={styles.goalChipTitle}>{labelFromGoal(goal)}</div>
        <div style={styles.goalChipSub}>Toque para ver</div>
      </div>
      <div style={styles.goalChipChev}>›</div>
    </button>
  );
}

function ProgressPill({ value, max, label }) {
  const pct = max <= 0 ? 0 : clamp(value / max, 0, 1);
  return (
    <div style={styles.pill}>
      <div style={styles.pillTop}>
        <div style={styles.pillLabel}>{label}</div>
        <div style={styles.pillValue}>
          {value}/{max}
        </div>
      </div>
      <div style={styles.pillTrack}>
        <div style={{ ...styles.pillFill, width: `${Math.round(pct * 100)}%` }} />
      </div>
    </div>
  );
}

/* ----------------- PAYWALL (CTA preto premium) ----------------- */
function PaywallCard({ onGoPlans }) {
  return (
    <button type="button" onClick={onGoPlans} style={styles.paywallBtnWrap}>
      <div style={styles.paywall}>
        <div style={styles.payGlow} />
        <div style={styles.payShimmer} />

        <div style={styles.payTop}>
          <div style={styles.payIconWrap}>
            <div style={styles.payIcon}>🔒</div>
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={styles.payTitle}>Desbloqueie o app completo</div>
            <div style={styles.paySub}>
              Treino detalhado + cargas + metas no dashboard + cardio guiado.
            </div>
          </div>

          <div style={styles.payChev}>›</div>
        </div>

        <div style={styles.payBullets}>
          <div style={styles.payBulletRow}>
            <span style={styles.payCheck}>✓</span>
            <span style={styles.payBullet}>Treinos e detalhes liberados</span>
          </div>
          <div style={styles.payBulletRow}>
            <span style={styles.payCheck}>✓</span>
            <span style={styles.payBullet}>Registro de cargas e evolução</span>
          </div>
          <div style={styles.payBulletRow}>
            <span style={styles.payCheck}>✓</span>
            <span style={styles.payBullet}>Metas e consistência</span>
          </div>
        </div>

        <div style={styles.payActionRow}>
          <div style={styles.payPill}>
            <span style={styles.payPillDot} />
            Acesso imediato
          </div>

          <div style={styles.payBtn}>
            <span style={styles.payBtnText}>Assinar e liberar tudo</span>
            <span style={styles.payBtnArrow}>›</span>
          </div>
        </div>

        <div style={styles.payFine}>Cancelamento simples. Sem burocracia.</div>
      </div>
    </button>
  );
}

/* ----------------- HIDRATAÇÃO (Nutri+) ----------------- */
function WaterCard({ goalMl, waterPct, waterMl, addWater, resetWater }) {
  return (
    <div style={styles.waterCard}>
      <div style={styles.waterTop}>
        <div>
          <div style={styles.waterTitle}>Hidratação</div>
          <div style={styles.waterSub}>
            Meta sugerida: <b>{goalMl} ml</b>
          </div>
        </div>
        <div style={styles.waterPill}>{Math.round(waterPct * 100)}%</div>
      </div>

      <div style={styles.waterTrack}>
        <div style={{ ...styles.waterFill, width: `${Math.round(waterPct * 100)}%` }} />
      </div>

      <div style={styles.waterRowNutri}>
        <button style={styles.waterBtnNutri} onClick={() => addWater(200)} type="button">
          +200ml
        </button>
        <button style={styles.waterBtnNutri} onClick={() => addWater(300)} type="button">
          +300ml
        </button>
        <button style={styles.waterBtnNutri} onClick={() => addWater(500)} type="button">
          +500ml
        </button>
        <button style={styles.waterGhostNutri} onClick={resetWater} type="button">
          Reset
        </button>
      </div>

      <div style={styles.waterNumNutri}>
        <b>{waterMl}</b> ml hoje
      </div>
    </div>
  );
}

function WaterLocked({ onGoPlans }) {
  return (
    <button style={styles.lockCard} onClick={onGoPlans} type="button">
      <div style={styles.lockTop}>
        <div style={styles.lockIcon}>💧</div>
        <div style={{ minWidth: 0 }}>
          <div style={styles.lockTitle}>Hidratação</div>
          <div style={styles.lockSub}>Acesso bloqueado • disponível no Nutri+</div>
        </div>
        <div style={styles.lockChev}>›</div>
      </div>
    </button>
  );
}

export default function Dashboard() {
  const nav = useNavigate();
  const { user } = useAuth();
  const email = (user?.email || "anon").toLowerCase();

  const paid = useMemo(() => localStorage.getItem(`paid_${email}`) === "1", [email]);

  const hasNutriPlus = useMemo(
    () => localStorage.getItem(`nutri_plus_${email}`) === "1",
    [email]
  );

  const workoutKey = `workout_${email}`;
  const openKey = `open_${email}`;
  const today = useMemo(() => todayKey(), []);

  const [workouts] = useState(() => {
    const raw = localStorage.getItem(workoutKey);
    return raw ? JSON.parse(raw) : [];
  });

  const [opens] = useState(() => {
    const raw = localStorage.getItem(openKey);
    const obj = raw ? JSON.parse(raw) : {};
    obj[today] = (obj[today] || 0) + 1;
    localStorage.setItem(openKey, JSON.stringify(obj));
    return obj;
  });

  const workoutSet = useMemo(() => new Set(workouts), [workouts]);

  const weekGoal = Number(user?.frequencia || 4) || 4;

  const weekly = useMemo(() => calcWeeklyCount(workouts), [workouts]);
  const streak = useMemo(() => calcStreak(opens, workoutSet), [opens, workoutSet]);

  const kcalPerWorkout = useMemo(() => estimateWorkoutKcal(user?.peso), [user?.peso]);
  const kcalThisWeek = useMemo(() => weekly * kcalPerWorkout, [weekly, kcalPerWorkout]);

  const tips = useMemo(
    () => [
      { title: "Treino de hoje", text: "Comece agora. 25 min bem feitos mudam o jogo." },
      { title: "Sem drama", text: "Faça o básico bem feito: execução limpa e constância." },
      { title: "Progresso visível", text: "Registre o treino e deixe o app trabalhar por você." },
      { title: "Você no controle", text: "Pequenas vitórias por dia = resultado inevitável." },
    ],
    []
  );

  const [tipIndex, setTipIndex] = useState(0);
  const [tap, setTap] = useState(false);

  function nextTip() {
    setTap(true);
    setTimeout(() => setTap(false), 140);
    setTipIndex((i) => (i + 1) % tips.length);
  }

  const name = user?.nome ? user.nome.split(" ")[0] : "Você";

  /* ✅ metas ativas */
  const goalsKey = `active_goals_${email}`;
  const goals = useMemo(() => {
    const arr = safeJsonParse(localStorage.getItem(goalsKey), []);
    return Array.isArray(arr) ? arr : [];
  }, [goalsKey]);

  /* ✅ Água */
  const peso = Number(user?.peso || 0) || 80;
  const goalMl = useMemo(() => clamp(Math.round(peso * 35), 1800, 5000), [peso]);

  const waterKey = `water_${email}_${today}`;
  const [waterMl, setWaterMl] = useState(() => Number(localStorage.getItem(waterKey) || 0) || 0);

  function addWater(ml) {
    const next = clamp(waterMl + ml, 0, goalMl * 2);
    setWaterMl(next);
    localStorage.setItem(waterKey, String(next));
  }
  function resetWater() {
    setWaterMl(0);
    localStorage.setItem(waterKey, "0");
  }

  const waterPct = goalMl ? clamp(waterMl / goalMl, 0, 1) : 0;

  return (
    <div className="page" style={styles.page}>
      <style>{`
        @media (min-width: 980px){
          .heroGrid{ grid-template-columns: 1.35fr .65fr; align-items: start; }
        }

        @keyframes payFloat {
          0%,100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes payGlowPulse {
          0%,100% { opacity: .38; }
          50% { opacity: .55; }
        }
        @keyframes payShimmer {
          0% { transform: translateX(0) rotate(14deg); opacity: .0; }
          20% { opacity: .55; }
          55% { opacity: .25; }
          100% { transform: translateX(280%) rotate(14deg); opacity: .0; }
        }
      `}</style>

      <div style={styles.bgGlow} />

      {/* ✅ FITDEAL BRAND (logo + nome, sem balão, clean) */}
      <div style={styles.brandBar}>
        <img
          src={LogoMark}
          alt="fitdeal"
          style={styles.brandLogo}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        <div style={styles.brandName}>
          fitdeal<span style={{ color: ORANGE }}>.</span>
        </div>

        {/* opcional: um mini “status” bem discreto, sem balão */}
        <div style={styles.brandRight}>
          <span style={styles.brandDot} />
          <span style={styles.brandStatus}>{paid ? "Pro" : "Free"}</span>
        </div>
      </div>

      {/* ✅ BALÃO DO PLANO */}
      {paid ? (
        <div style={styles.planCard}>
          <div>
            <div style={styles.planLabel}>Plano</div>
            <div style={styles.planName}>Básico ativo • R$ 12,99/mês</div>
            <div style={styles.planSub}>Treinos liberados. Nutri+ é upgrade.</div>
          </div>
          <button style={styles.planBtnSoft} onClick={() => nav("/planos")} type="button">
            Gerenciar
          </button>
        </div>
      ) : null}

      {/* ✅ HERO: Esquerda = Bem-vindo | Direita = Metas */}
      <div className="heroGrid" style={styles.heroGrid}>
        {/* BEM-VINDO */}
        <button
          onClick={nextTip}
          style={{
            ...styles.motivation,
            marginTop: paid ? 0 : 6,
            transform: tap ? "scale(0.985)" : "scale(1)",
          }}
          type="button"
        >
          <div style={styles.motKicker}>TOQUE PARA MOTIVAÇÃO</div>
          <div style={styles.motTitle}>Bem-vindo, {name}</div>
          <div style={styles.motText}>
            <b>{tips[tipIndex].title}:</b> {tips[tipIndex].text}
          </div>
        </button>

        {/* METAS AO LADO */}
        <div style={styles.sideStack}>
          {!paid ? (
            <button
              style={{ ...styles.goalsHeader, ...styles.goalsHeaderLocked, marginTop: 6 }}
              onClick={() => nav("/planos")}
              type="button"
            >
              <div style={{ minWidth: 0 }}>
                <div style={styles.goalsTitleRow}>
                  <div style={styles.goalsTitle}>Metas</div>
                  <div style={styles.lockPill}>
                    <span style={{ marginRight: 6 }}>🔒</span>Bloqueado
                  </div>
                </div>
                <div style={styles.goalsHint}>Assine para criar e ver metas no dashboard.</div>
              </div>
              <div style={styles.goalsHeaderChev}>›</div>
            </button>
          ) : (
            <>
              <button
                style={{ ...styles.goalsHeader, marginTop: 6 }}
                onClick={() => nav("/metas")}
                type="button"
              >
                <div>
                  <div style={styles.goalsTitle}>Metas</div>
                  <div style={styles.goalsHint}>
                    {goals.length ? `${goals.length} ativa(s) no seu dashboard` : "Crie metas rápidas"}
                  </div>
                </div>
                <div style={styles.goalsHeaderChev}>›</div>
              </button>

              {goals.length === 0 ? (
                <button style={styles.goalsEmpty} onClick={() => nav("/metas")} type="button">
                  <div style={styles.goalsEmptyTop}>
                    <div style={styles.goalsEmptyTitle}>Adicionar metas</div>
                    <div style={styles.goalsEmptyChev}>›</div>
                  </div>
                  <div style={styles.goalsEmptySub}>Ex: 60 dias de frequência • 50kg no supino</div>
                </button>
              ) : (
                <div style={styles.goalsWrap}>
                  {goals.slice(0, 3).map((g) => (
                    <GoalChip key={g.id} goal={g} onClick={() => nav("/metas")} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ✅ CTA premium (preto) para não pagantes */}
      {!paid ? <PaywallCard onGoPlans={() => nav("/planos")} /> : null}

      {/* ✅ Hidratação: só Nutri+. Se não tiver => “Acesso bloqueado” */}
      {hasNutriPlus ? (
        <WaterCard
          goalMl={goalMl}
          waterPct={waterPct}
          waterMl={waterMl}
          addWater={addWater}
          resetWater={resetWater}
        />
      ) : (
        <WaterLocked onGoPlans={() => nav("/planos")} />
      )}

      {/* ✅ resto do dashboard */}
      <div style={styles.progressRow}>
        <ProgressPill value={weekly} max={Math.max(weekGoal, 1)} label="Semana" />
        <ProgressPill value={streak} max={7} label="Streak" />
      </div>

      <div style={styles.grid}>
        <div style={styles.cardSoft}>
          <div style={styles.cardTitle}>Calorias queimadas</div>
          <div style={styles.cardBig}>{kcalThisWeek} kcal</div>
          <div style={styles.cardSub}>{kcalPerWorkout} kcal por treino (estimativa)</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>Consistência</div>
          <div style={styles.cardBig}>{streak} dias</div>
          <div style={styles.cardSub}>Registro de Treino</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>Objetivo</div>
          <div style={styles.cardBig}>{user?.objetivo || "Hipertrofia"}</div>
          <div style={styles.cardSub}>Frequência: {weekGoal}x/sem</div>
        </div>

        {!paid ? (
          <button style={styles.lockedCard} onClick={() => nav("/planos")} type="button">
            <div style={styles.lockedTop}>
              <div style={styles.lockedIcon}>✨</div>
              <div style={{ minWidth: 0 }}>
                <div style={styles.lockedTitle}>Treino detalhado + cargas</div>
                <div style={styles.lockedSub}>Desbloqueie e evolua mais rápido.</div>
              </div>
              <div style={styles.lockedChev}>›</div>
            </div>
          </button>
        ) : null}
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: 18,
    paddingBottom: 120,
    background:
      "radial-gradient(900px 420px at 20% -5%, rgba(255,106,0,.14), rgba(248,250,252,0) 60%), linear-gradient(180deg, #f8fafc, #f7f9fc)",
    position: "relative",
    overflow: "hidden",
  },
  bgGlow: {
    position: "absolute",
    inset: -80,
    background:
      "radial-gradient(520px 260px at 85% 5%, rgba(15,23,42,.06), rgba(255,255,255,0) 65%)",
    pointerEvents: "none",
    filter: "blur(0px)",
  },

  /* ✅ BRAND BAR (sem balão/pill) */
  brandBar: {
    position: "relative",
    zIndex: 3,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 4,
    marginBottom: 14,
  },
  brandLogo: {
    width: 34,
    height: 34,
    objectFit: "contain",
    borderRadius: 10,
    background: "rgba(255,106,0,.10)",
    border: "1px solid rgba(255,106,0,.14)",
    padding: 6,
    flexShrink: 0,
  },
  brandName: {
    flex: 1,
    fontSize: 18,
    fontWeight: 950,
    color: TEXT,
    letterSpacing: -0.45,
    lineHeight: 1,
  },
  brandRight: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: MUTED,
    fontWeight: 900,
    fontSize: 12,
    letterSpacing: -0.1,
    whiteSpace: "nowrap",
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: ORANGE,
    boxShadow: "0 0 0 6px rgba(255,106,0,.10)",
  },
  brandStatus: { color: MUTED },

  heroGrid: {
    position: "relative",
    zIndex: 2,
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 12,
  },
  sideStack: { display: "grid", gap: 10 },

  planCard: {
    position: "relative",
    zIndex: 2,
    borderRadius: 22,
    padding: 16,
    background: "#0B0B0C",
    color: "#fff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    boxShadow: "0 18px 50px rgba(0,0,0,.18)",
    marginTop: 6,
    marginBottom: 14,
  },
  planLabel: { fontSize: 12, fontWeight: 900, opacity: 0.75 },
  planName: { marginTop: 2, fontSize: 14, fontWeight: 950 },
  planSub: { marginTop: 4, fontSize: 12, fontWeight: 750, opacity: 0.8, lineHeight: 1.35 },
  planBtnSoft: {
    padding: "12px 14px",
    borderRadius: 16,
    border: "1px solid rgba(255,106,0,.35)",
    background: "rgba(255,106,0,.14)",
    color: "#fff",
    fontWeight: 950,
    whiteSpace: "nowrap",
  },

  motivation: {
    position: "relative",
    zIndex: 2,
    borderRadius: 26,
    padding: 18,
    textAlign: "left",
    background: "linear-gradient(135deg, rgba(255,106,0,.16), rgba(15,23,42,.03))",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 20px 60px rgba(15,23,42,.10)",
    transition: "transform .12s ease",
  },
  motKicker: {
    display: "inline-flex",
    padding: "8px 12px",
    borderRadius: 999,
    background: "#fff",
    border: "1px solid rgba(255,106,0,.25)",
    color: ORANGE,
    fontWeight: 950,
    fontSize: 11,
  },
  motTitle: { marginTop: 12, fontSize: 22, fontWeight: 950, color: TEXT, letterSpacing: -0.6 },
  motText: { marginTop: 8, fontSize: 14, fontWeight: 750, color: "#334155", lineHeight: 1.55 },

  paywallBtnWrap: {
    position: "relative",
    zIndex: 2,
    marginTop: 12,
    width: "100%",
    border: "none",
    padding: 0,
    background: "transparent",
    textAlign: "left",
    cursor: "pointer",
  },
  paywall: {
    position: "relative",
    borderRadius: 26,
    padding: 16,
    color: "#fff",
    overflow: "hidden",
    background:
      "radial-gradient(900px 380px at 10% -10%, rgba(255,106,0,.25), rgba(255,255,255,0) 55%), linear-gradient(135deg, rgba(10,10,12,.96), rgba(15,23,42,.88))",
    border: "1px solid rgba(255,255,255,.10)",
    boxShadow: "0 26px 90px rgba(15,23,42,.24)",
    animation: "payFloat 5.2s ease-in-out infinite",
    transform: "translateZ(0)",
  },
  payGlow: {
    position: "absolute",
    inset: -80,
    background:
      "radial-gradient(520px 260px at 85% 10%, rgba(255,106,0,.20), rgba(255,255,255,0) 60%)",
    filter: "blur(0px)",
    opacity: 0.45,
    pointerEvents: "none",
    animation: "payGlowPulse 4.2s ease-in-out infinite",
  },
  payShimmer: {
    position: "absolute",
    top: -120,
    left: "-40%",
    width: "40%",
    height: 360,
    background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.14), rgba(255,255,255,0))",
    transform: "rotate(14deg)",
    pointerEvents: "none",
    animation: "payShimmer 5.4s ease-in-out infinite",
    mixBlendMode: "screen",
  },
  payTop: { display: "flex", alignItems: "center", gap: 12 },
  payIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 18,
    background: "rgba(255,255,255,.08)",
    border: "1px solid rgba(255,255,255,.12)",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
  },
  payIcon: { fontSize: 18 },
  payTitle: { fontSize: 16, fontWeight: 950, letterSpacing: -0.2 },
  paySub: { marginTop: 4, fontSize: 12, fontWeight: 750, opacity: 0.86, lineHeight: 1.35 },
  payChev: { marginLeft: "auto", fontSize: 28, fontWeight: 900, opacity: 0.55 },

  payBullets: { marginTop: 12, display: "grid", gap: 8, opacity: 0.92 },
  payBulletRow: { display: "flex", alignItems: "center", gap: 10 },
  payCheck: {
    width: 20,
    height: 20,
    borderRadius: 999,
    background: "rgba(255,106,0,.18)",
    border: "1px solid rgba(255,106,0,.35)",
    display: "grid",
    placeItems: "center",
    fontSize: 12,
    fontWeight: 950,
    color: "#fff",
    flexShrink: 0,
  },
  payBullet: { fontSize: 12, fontWeight: 850 },

  payActionRow: {
    marginTop: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  payPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,.08)",
    border: "1px solid rgba(255,255,255,.12)",
    fontSize: 11,
    fontWeight: 900,
    opacity: 0.92,
    whiteSpace: "nowrap",
  },
  payPillDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: "rgba(255,106,0,1)",
    boxShadow: "0 0 0 6px rgba(255,106,0,.14)",
  },
  payBtn: {
    minWidth: 170,
    padding: "12px 14px",
    borderRadius: 18,
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    color: "#111",
    fontWeight: 950,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    boxShadow: "0 18px 50px rgba(255,106,0,.22)",
    border: "1px solid rgba(255,255,255,.16)",
  },
  payBtnText: { fontSize: 13, fontWeight: 950 },
  payBtnArrow: { fontSize: 22, fontWeight: 950 },

  payFine: { marginTop: 10, fontSize: 12, fontWeight: 750, opacity: 0.72 },

  waterCard: {
    position: "relative",
    zIndex: 1,
    marginTop: 14,
    borderRadius: 24,
    padding: 16,
    background: "#fff",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
  },
  waterTop: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 },
  waterTitle: { fontSize: 16, fontWeight: 950, color: TEXT, letterSpacing: -0.3 },
  waterSub: { marginTop: 6, fontSize: 12, fontWeight: 800, color: MUTED, lineHeight: 1.35 },
  waterPill: {
    padding: "8px 10px",
    borderRadius: 999,
    background: "rgba(255,106,0,.10)",
    border: "1px solid rgba(255,106,0,.22)",
    fontWeight: 950,
    fontSize: 12,
    color: TEXT,
    whiteSpace: "nowrap",
  },
  waterTrack: {
    marginTop: 12,
    height: 12,
    borderRadius: 999,
    background: "rgba(15,23,42,.06)",
    overflow: "hidden",
    border: "1px solid rgba(15,23,42,.06)",
  },
  waterFill: {
    height: "100%",
    borderRadius: 999,
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    transition: "width .25s ease",
  },
  waterRowNutri: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 8,
  },
  waterBtnNutri: {
    padding: 12,
    borderRadius: 16,
    border: "none",
    background: ORANGE,
    color: "#111",
    fontWeight: 950,
    boxShadow: "0 14px 34px rgba(255,106,0,.18)",
  },
  waterGhostNutri: {
    padding: 12,
    borderRadius: 16,
    border: "1px solid rgba(15,23,42,.10)",
    background: "#fff",
    color: TEXT,
    fontWeight: 950,
  },
  waterNumNutri: { marginTop: 10, fontSize: 13, fontWeight: 800, color: MUTED },

  lockCard: {
    position: "relative",
    zIndex: 1,
    marginTop: 14,
    width: "100%",
    border: "1px solid rgba(15,23,42,.06)",
    background: "linear-gradient(135deg, rgba(15,23,42,.03), rgba(255,255,255,.92))",
    borderRadius: 22,
    padding: 14,
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
    textAlign: "left",
  },
  lockTop: { display: "flex", alignItems: "center", gap: 12 },
  lockIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    background: "rgba(15,23,42,.06)",
    border: "1px solid rgba(15,23,42,.10)",
    flexShrink: 0,
    fontSize: 18,
  },
  lockTitle: { fontSize: 14, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  lockSub: { marginTop: 4, fontSize: 12, fontWeight: 800, color: MUTED, lineHeight: 1.3 },
  lockChev: { marginLeft: "auto", fontSize: 26, fontWeight: 900, opacity: 0.45, color: "#111" },

  goalsHeader: {
    position: "relative",
    zIndex: 1,
    marginTop: 14,
    width: "100%",
    border: "1px solid rgba(15,23,42,.06)",
    background: "#fff",
    borderRadius: 22,
    padding: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
    textAlign: "left",
  },
  goalsHeaderLocked: {
    background: "linear-gradient(135deg, rgba(15,23,42,.03), rgba(255,255,255,.92))",
  },
  goalsTitleRow: { display: "flex", alignItems: "center", gap: 10 },
  lockPill: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(15,23,42,.06)",
    border: "1px solid rgba(15,23,42,.10)",
    fontSize: 11,
    fontWeight: 900,
    color: TEXT,
    whiteSpace: "nowrap",
  },
  goalsTitle: { fontSize: 16, fontWeight: 950, color: TEXT, letterSpacing: -0.3 },
  goalsHint: { marginTop: 4, fontSize: 12, fontWeight: 800, color: MUTED, lineHeight: 1.25 },
  goalsHeaderChev: { fontSize: 26, fontWeight: 900, color: "#111", opacity: 0.45 },

  goalsEmpty: {
    position: "relative",
    zIndex: 1,
    marginTop: 10,
    width: "100%",
    border: "1px solid rgba(15,23,42,.06)",
    borderRadius: 22,
    padding: 16,
    textAlign: "left",
    background: "linear-gradient(135deg, rgba(255,106,0,.10), rgba(255,255,255,.92))",
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
  },
  goalsEmptyTop: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },
  goalsEmptyTitle: { fontSize: 14, fontWeight: 950, color: TEXT },
  goalsEmptyChev: { fontSize: 24, fontWeight: 900, opacity: 0.45, color: "#111" },
  goalsEmptySub: { marginTop: 6, fontSize: 12, fontWeight: 800, color: MUTED, lineHeight: 1.35 },

  goalsWrap: { position: "relative", zIndex: 1, marginTop: 10, display: "grid", gap: 10 },
  goalChip: {
    width: "100%",
    borderRadius: 22,
    padding: 12,
    background: "linear-gradient(135deg, rgba(255,106,0,.14), rgba(255,255,255,.90))",
    border: "1px solid rgba(255,106,0,.20)",
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
    display: "flex",
    alignItems: "center",
    gap: 10,
    textAlign: "left",
  },
  goalChipIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,.85)",
    border: "1px solid rgba(15,23,42,.06)",
    flexShrink: 0,
    fontSize: 18,
  },
  goalChipTitle: {
    fontSize: 14,
    fontWeight: 950,
    color: TEXT,
    letterSpacing: -0.2,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  goalChipSub: { marginTop: 3, fontSize: 12, fontWeight: 800, color: MUTED },
  goalChipChev: { marginLeft: "auto", fontSize: 26, fontWeight: 900, opacity: 0.45, color: "#111" },

  progressRow: {
    position: "relative",
    zIndex: 1,
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  pill: {
    borderRadius: 20,
    padding: 14,
    background: "#fff",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 12px 34px rgba(15,23,42,.06)",
  },
  pillTop: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 },
  pillLabel: { fontSize: 12, fontWeight: 950, color: MUTED },
  pillValue: { fontSize: 16, fontWeight: 950, color: TEXT, letterSpacing: -0.4 },
  pillTrack: {
    marginTop: 10,
    height: 10,
    borderRadius: 999,
    background: "rgba(15,23,42,.08)",
    overflow: "hidden",
  },
  pillFill: {
    height: "100%",
    borderRadius: 999,
    background: "linear-gradient(90deg, #FF6A00, #FFB26B)",
    boxShadow: "0 10px 24px rgba(255,106,0,.18)",
    transition: "width .25s ease",
  },

  grid: { position: "relative", zIndex: 1, marginTop: 14, display: "grid", gap: 12 },
  card: {
    background: "#fff",
    borderRadius: 22,
    padding: 16,
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
  },
  cardSoft: {
    background: "linear-gradient(135deg, rgba(255,106,0,.12), rgba(255,106,0,.06))",
    borderRadius: 22,
    padding: 16,
    border: "1px solid rgba(255,106,0,.16)",
  },
  cardTitle: { fontSize: 13, fontWeight: 950, color: MUTED },
  cardBig: { marginTop: 6, fontSize: 28, fontWeight: 950, color: TEXT, letterSpacing: -0.7 },
  cardSub: { marginTop: 4, fontSize: 12, fontWeight: 750, color: MUTED, lineHeight: 1.35 },

  lockedCard: {
    width: "100%",
    border: "none",
    background: "linear-gradient(135deg, rgba(15,23,42,.04), rgba(255,255,255,.92))",
    borderRadius: 22,
    padding: 14,
    textAlign: "left",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
  },
  lockedTop: { display: "flex", alignItems: "center", gap: 12 },
  lockedIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,106,0,.12)",
    border: "1px solid rgba(255,106,0,.20)",
    flexShrink: 0,
  },
  lockedTitle: { fontSize: 14, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  lockedSub: { marginTop: 4, fontSize: 12, fontWeight: 800, color: MUTED, lineHeight: 1.3 },
  lockedChev: { marginLeft: "auto", fontSize: 26, fontWeight: 900, opacity: 0.45, color: "#111" },
};
