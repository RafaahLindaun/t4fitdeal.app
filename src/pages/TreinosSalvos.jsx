import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const ORANGE = "#FF6A00";
const BG = "#f8fafc";
const TEXT = "#0f172a";
const MUTED = "#64748b";
const BORDER = "rgba(15,23,42,.08)";
const BLACK = "#0B0B0C";

export default function TreinosSalvos() {
  const nav = useNavigate();
  const { user } = useAuth();
  const userId = user?.id || null;

  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    document.body.classList.add("fitdeal-hide-bottom-menu");
    return () => document.body.classList.remove("fitdeal-hide-bottom-menu");
  }, []);

  useEffect(() => {
    loadPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function loadPlans() {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("saved_workout_plans")
        .select("id,name,split_label,split_len,times_done,payload,created_at,updated_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPlans(data || []);
    } catch (err) {
      console.error("TreinosSalvos load:", err);
      alert(err?.message || "Não foi possível carregar seus treinos salvos.");
    } finally {
      setLoading(false);
    }
  }

  function startRename(plan) {
    setEditingId(plan.id);
    setEditingName(plan.name || "");
  }

  async function saveRename(planId) {
    const name = editingName.trim();

    if (!name || savingName) return;

    setSavingName(true);

    try {
      const { error } = await supabase
        .from("saved_workout_plans")
        .update({
          name,
          updated_at: new Date().toISOString(),
        })
        .eq("id", planId)
        .eq("user_id", userId);

      if (error) throw error;

      setPlans((prev) =>
        prev.map((plan) =>
          plan.id === planId
            ? {
                ...plan,
                name,
                updated_at: new Date().toISOString(),
              }
            : plan
        )
      );

      setEditingId(null);
      setEditingName("");
    } catch (err) {
      console.error("TreinosSalvos rename:", err);
      alert(err?.message || "Não foi possível renomear agora.");
    } finally {
      setSavingName(false);
    }
  }

  async function incrementDone(plan) {
    try {
      const next = Number(plan.times_done || 0) + 1;

      const { error } = await supabase
        .from("saved_workout_plans")
        .update({
          times_done: next,
          updated_at: new Date().toISOString(),
        })
        .eq("id", plan.id)
        .eq("user_id", userId);

      if (error) throw error;

      setPlans((prev) =>
        prev.map((item) =>
          item.id === plan.id
            ? {
                ...item,
                times_done: next,
              }
            : item
        )
      );
    } catch (err) {
      console.error("TreinosSalvos increment:", err);
      alert(err?.message || "Não foi possível atualizar a quantidade.");
    }
  }

  function countExercises(plan) {
    const days = plan?.payload?.days || [];
    return days.reduce((acc, day) => acc + Number(day?.exercises?.length || 0), 0);
  }

  if (loading) {
    return (
      <main style={S.page}>
        <HideBottomMenuStyle />
        <div style={S.phone}>
          <button style={S.backBtn} onClick={() => nav("/treino")} type="button">
            ←
          </button>

          <section style={S.loadingCard}>
            <div style={S.loadingDot} />
            <b>Carregando treinos</b>
            <span>Buscando seus treinos salvos.</span>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main style={S.page}>
      <HideBottomMenuStyle />

      <div style={S.phone}>
        <header style={S.hero}>
          <button style={S.heroBack} onClick={() => nav("/treino")} type="button">
            ←
          </button>

          <div style={{ minWidth: 0 }}>
            <div style={S.kicker}>FitDeal</div>
            <h1 style={S.title}>Treinos salvos</h1>
            <p style={S.subtitle}>Veja, renomeie e acompanhe quantas vezes você fez cada treino.</p>
          </div>
        </header>

        {!plans.length ? (
          <section style={S.emptyCard}>
            <div style={S.emptyIcon}>+</div>
            <h2>Nenhum treino salvo</h2>
            <p>Monte um treino personalizado e toque em salvar para ele aparecer aqui.</p>
            <button style={S.primaryBtn} onClick={() => nav("/treino-personalize")} type="button">
              Criar treino
            </button>
          </section>
        ) : (
          <section style={S.list}>
            {plans.map((plan) => {
              const editing = editingId === plan.id;
              const daysCount = Number(plan.split_len || plan?.payload?.days?.length || 0);
              const exercisesCount = countExercises(plan);

              return (
                <article key={plan.id} style={S.planCard}>
                  <div style={S.planTop}>
                    <div style={S.planBadge}>{plan.split_label || `${daysCount}D`}</div>

                    <div style={S.planInfo}>
                      {editing ? (
                        <input
                          style={S.nameInput}
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          autoFocus
                        />
                      ) : (
                        <h2 style={S.planName}>{plan.name}</h2>
                      )}

                      <div style={S.planMeta}>
                        {daysCount} treinos • {exercisesCount} exercícios
                      </div>
                    </div>
                  </div>

                  <div style={S.statsRow}>
                    <div style={S.statBox}>
                      <strong>{Number(plan.times_done || 0)}</strong>
                      <span>vezes feito</span>
                    </div>

                    <div style={S.statBox}>
                      <strong>{daysCount}</strong>
                      <span>dias</span>
                    </div>

                    <div style={S.statBox}>
                      <strong>{exercisesCount}</strong>
                      <span>exercícios</span>
                    </div>
                  </div>

                  <div style={S.daysPreview}>
                    {(plan?.payload?.days || []).map((day) => (
                      <div key={day.index} style={S.dayPreview}>
                        <b>Treino {day.letter}</b>
                        <span>{day.groupName}</span>
                      </div>
                    ))}
                  </div>

                  <div style={S.actions}>
                    {editing ? (
                      <>
                        <button style={S.secondaryBtn} onClick={() => setEditingId(null)} type="button">
                          Cancelar
                        </button>

                        <button style={S.orangeBtn} onClick={() => saveRename(plan.id)} disabled={savingName} type="button">
                          {savingName ? "Salvando..." : "Salvar nome"}
                        </button>
                      </>
                    ) : (
                      <>
                        <button style={S.secondaryBtn} onClick={() => startRename(plan)} type="button">
                          Renomear
                        </button>

                        <button style={S.orangeBtn} onClick={() => incrementDone(plan)} type="button">
                          Fiz esse treino
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <FitDealFooter />
      </div>
    </main>
  );
}

function FitDealFooter() {
  return (
    <footer style={S.fitdealFooter}>
      <img src="/logo/logo_app_4k.png" alt="FitDeal" style={S.fitdealLogoImg} />
      <div style={S.fitdealBrandText}>
        <span>fitdeal</span>
        <span style={S.fitdealDot}>.</span>
      </div>
    </footer>
  );
}

function HideBottomMenuStyle() {
  return (
    <style>{`
      body.fitdeal-hide-bottom-menu nav:has(.fitdeal-bottom-item),
      body.fitdeal-hide-bottom-menu div:has(> nav .fitdeal-bottom-item),
      body.fitdeal-hide-bottom-menu .fitdeal-bottom-item,
      body.fitdeal-hide-bottom-menu .fitdeal-main-item,
      body.fitdeal-hide-bottom-menu .bottom-menu,
      body.fitdeal-hide-bottom-menu .bottom-nav,
      body.fitdeal-hide-bottom-menu .tabbar,
      body.fitdeal-hide-bottom-menu .mobile-bottom-nav {
        display: none !important;
      }

      button, input {
        -webkit-tap-highlight-color: transparent;
      }

      button {
        appearance: none;
        -webkit-appearance: none;
      }

      ::-webkit-scrollbar {
        width: 0;
        height: 0;
      }
    `}</style>
  );
}

const S = {
  page: {
    minHeight: "100vh",
    background: BG,
    color: TEXT,
    padding: 12,
    paddingBottom: 34,
    boxSizing: "border-box",
    overflowX: "hidden",
  },

  phone: {
    width: "100%",
    maxWidth: 430,
    margin: "0 auto",
    boxSizing: "border-box",
  },

  hero: {
    display: "flex",
    gap: 11,
    alignItems: "flex-start",
    borderRadius: 26,
    padding: 13,
    background:
      "radial-gradient(circle at 92% 0%, rgba(255,106,0,.20), rgba(255,106,0,0) 34%), linear-gradient(135deg, #fff, #fff7ed)",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 14px 40px rgba(15,23,42,.065)",
    overflow: "hidden",
  },

  heroBack: {
    width: 42,
    height: 42,
    borderRadius: 16,
    border: `1px solid ${BORDER}`,
    background: "rgba(255,255,255,.86)",
    color: TEXT,
    fontSize: 22,
    fontWeight: 950,
    flexShrink: 0,
  },

  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    border: `1px solid ${BORDER}`,
    background: "#fff",
    color: TEXT,
    fontSize: 23,
    fontWeight: 950,
  },

  kicker: {
    color: ORANGE,
    fontSize: 11,
    fontWeight: 950,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },

  title: {
    margin: "5px 0 0",
    fontSize: 27,
    lineHeight: 1.02,
    fontWeight: 980,
    letterSpacing: -1,
    color: TEXT,
  },

  subtitle: {
    margin: "8px 0 0",
    color: MUTED,
    fontSize: 13,
    lineHeight: 1.34,
    fontWeight: 800,
    maxWidth: 310,
  },

  list: {
    marginTop: 12,
    display: "grid",
    gap: 12,
  },

  planCard: {
    borderRadius: 26,
    background: "#fff",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 12px 32px rgba(15,23,42,.05)",
    padding: 14,
    overflow: "hidden",
  },

  planTop: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  planBadge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    color: "#111",
    display: "grid",
    placeItems: "center",
    fontSize: 14,
    fontWeight: 980,
    flexShrink: 0,
  },

  planInfo: {
    minWidth: 0,
    flex: 1,
  },

  planName: {
    margin: 0,
    fontSize: 19,
    lineHeight: 1.05,
    fontWeight: 980,
    letterSpacing: -0.5,
    color: TEXT,
  },

  planMeta: {
    marginTop: 5,
    color: MUTED,
    fontSize: 12,
    fontWeight: 850,
  },

  nameInput: {
    width: "100%",
    boxSizing: "border-box",
    border: `1px solid rgba(255,106,0,.28)`,
    borderRadius: 15,
    background: "rgba(255,106,0,.06)",
    color: TEXT,
    padding: "10px 11px",
    fontSize: 15,
    fontWeight: 900,
    outline: "none",
  },

  statsRow: {
    marginTop: 13,
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 8,
  },

  statBox: {
    borderRadius: 18,
    background: "rgba(15,23,42,.035)",
    border: `1px solid ${BORDER}`,
    padding: "10px 8px",
    display: "grid",
    gap: 4,
    textAlign: "center",
  },

  daysPreview: {
    marginTop: 12,
    display: "grid",
    gap: 8,
  },

  dayPreview: {
    borderRadius: 16,
    background: "rgba(255,106,0,.07)",
    border: "1px solid rgba(255,106,0,.12)",
    padding: "10px 11px",
    display: "grid",
    gap: 4,
  },

  actions: {
    marginTop: 13,
    display: "grid",
    gridTemplateColumns: "1fr 1.25fr",
    gap: 8,
  },

  secondaryBtn: {
    border: `1px solid ${BORDER}`,
    borderRadius: 17,
    background: "#fff",
    color: TEXT,
    padding: "13px 10px",
    fontSize: 13,
    fontWeight: 950,
  },

  orangeBtn: {
    border: "none",
    borderRadius: 17,
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    color: "#111",
    padding: "13px 10px",
    fontSize: 13,
    fontWeight: 980,
    boxShadow: "0 12px 28px rgba(255,106,0,.20)",
  },

  emptyCard: {
    marginTop: 12,
    borderRadius: 26,
    background: "#fff",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 12px 32px rgba(15,23,42,.05)",
    padding: 18,
    textAlign: "center",
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    margin: "0 auto 12px",
    background: "rgba(255,106,0,.12)",
    color: ORANGE,
    display: "grid",
    placeItems: "center",
    fontSize: 28,
    fontWeight: 980,
  },

  primaryBtn: {
    marginTop: 14,
    width: "100%",
    height: 50,
    border: "none",
    borderRadius: 18,
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    color: "#111",
    fontSize: 14,
    fontWeight: 980,
  },

  loadingCard: {
    marginTop: 16,
    borderRadius: 24,
    padding: 16,
    background: "#fff",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 14px 38px rgba(15,23,42,.06)",
    display: "grid",
    gap: 8,
  },

  loadingDot: {
    width: 38,
    height: 38,
    borderRadius: 999,
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
  },

  fitdealFooter: {
    marginTop: 16,
    padding: "8px 0 2px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    color: "rgba(15,23,42,.72)",
    fontSize: 18,
    fontWeight: 950,
    letterSpacing: -0.5,
  },

  fitdealLogoImg: {
    width: 27,
    height: 27,
    objectFit: "contain",
    display: "block",
    borderRadius: 8,
  },

  fitdealBrandText: {
    display: "flex",
    alignItems: "baseline",
    color: "rgba(15,23,42,.72)",
  },

  fitdealDot: {
    color: ORANGE,
  },
};
