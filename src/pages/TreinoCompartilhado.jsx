import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

const ORANGE = "#FF6A00";
const BG = "#f8fafc";
const TEXT = "#0f172a";
const MUTED = "#64748b";

function dayLetter(i) {
  const letters = ["A", "B", "C", "D", "E", "F"];
  return letters[i % letters.length] || "A";
}

function safeDate(iso) {
  try {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return "—";
  }
}

export default function TreinoCompartilhado() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [payload, setPayload] = useState(null);
  const [selectedDay, setSelectedDay] = useState(0);

  const code = useMemo(() => {
    return String(searchParams.get("code") || "").trim().toUpperCase();
  }, [searchParams]);

  useEffect(() => {
    let active = true;

    async function loadSharedWorkout() {
      if (!code) {
        if (!active) return;
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("shared_workouts")
          .select("payload, share_code, created_at, is_active")
          .eq("share_code", code)
          .eq("is_active", true)
          .maybeSingle();

        if (error || !data?.payload) {
          console.error("TreinoCompartilhado load error:", error);
          if (!active) return;
          setNotFound(true);
          setLoading(false);
          return;
        }

        const p = data.payload;

        if (!active) return;
        setPayload(p);
        setSelectedDay(0);
        setNotFound(false);
        setLoading(false);
      } catch (err) {
        console.error("TreinoCompartilhado catch:", err);
        if (!active) return;
        setNotFound(true);
        setLoading(false);
      }
    }

    loadSharedWorkout();

    return () => {
      active = false;
    };
  }, [code]);

  const days = payload?.plan?.days || [];
  const currentDay = days[selectedDay] || null;
  const exercises = currentDay?.exercises || [];

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.centerWrap}>
          <div style={styles.logo}>
            fitdeal<span style={{ color: ORANGE }}>.</span>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !payload) {
    return (
      <div style={styles.page}>
        <div style={styles.wrap}>
          <div style={styles.topBar}>
            <button
              type="button"
              style={styles.backBtn}
              onClick={() => nav("/")}
              aria-label="Voltar"
            >
              ←
            </button>
            <div style={styles.topTitle}>Treino compartilhado</div>
          </div>

          <div style={styles.emptyCard}>
            <div style={styles.emptyIcon}>🏋️</div>
            <div style={styles.emptyTitle}>Treino não encontrado</div>
            <div style={styles.emptyText}>
              Esse link pode estar inválido, expirado ou o treino não está mais disponível.
            </div>

            <button type="button" style={styles.primaryBtn} onClick={() => nav("/")}>
              Voltar ao app
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <div style={styles.topBar}>
          <button
            type="button"
            style={styles.backBtn}
            onClick={() => nav("/")}
            aria-label="Voltar"
          >
            ←
          </button>
          <div style={styles.topTitle}>Treino compartilhado</div>
        </div>

        <div style={styles.hero}>
          <div style={styles.heroKicker}>fitdeal compartilhado</div>
          <div style={styles.heroTitle}>
            Treino de {payload?.nome || "usuário"}
          </div>
          <div style={styles.heroSub}>
            {payload?.plan?.splitLabel || "Plano atual"} • criado em{" "}
            {safeDate(payload?.createdAt)}
          </div>

          <div style={styles.heroChips}>
            <div style={styles.heroChip}>
              {days.length || 0} dia{days.length === 1 ? "" : "s"}
            </div>
            <div style={styles.heroChip}>
              código {code}
            </div>
          </div>
        </div>

        {days.length > 0 ? (
          <>
            <div style={styles.sectionTitle}>Dias do treino</div>

            <div style={styles.daysRow}>
              {days.map((day, idx) => {
                const active = idx === selectedDay;

                return (
                  <button
                    key={day.id || `${day.dayKey}-${idx}`}
                    type="button"
                    onClick={() => setSelectedDay(idx)}
                    style={{
                      ...styles.dayPill,
                      ...(active ? styles.dayPillActive : null),
                    }}
                  >
                    {day.title || `Treino ${dayLetter(idx)}`}
                  </button>
                );
              })}
            </div>

            <div style={styles.dayCard}>
              <div style={styles.dayHeader}>
                <div>
                  <div style={styles.dayTitle}>
                    {currentDay?.title || `Treino ${dayLetter(selectedDay)}`}
                  </div>
                  <div style={styles.daySub}>
                    {currentDay?.groupName || "Treino atual"} • {exercises.length} exercício
                    {exercises.length === 1 ? "" : "s"}
                  </div>
                </div>

                <div style={styles.dayBadge}>
                  {currentDay?.dayKey || dayLetter(selectedDay)}
                </div>
              </div>

              <div style={styles.exerciseList}>
                {exercises.map((ex, idx) => (
                  <div key={`${ex.name}-${idx}`} style={styles.exerciseCard}>
                    <div style={styles.exerciseTop}>
                      <div style={styles.exerciseNum}>{idx + 1}</div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={styles.exerciseName}>{ex.name}</div>

                        <div style={styles.exerciseMeta}>
                          {ex.groupName || "Exercício"}
                        </div>

                        {ex.reps ? (
                          <div style={styles.exerciseInfo}>{ex.reps}</div>
                        ) : null}

                        {ex.notes ? (
                          <div style={styles.exerciseNotes}>{ex.notes}</div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div style={styles.emptyCard}>
            <div style={styles.emptyIcon}>📄</div>
            <div style={styles.emptyTitle}>Esse treino está vazio</div>
            <div style={styles.emptyText}>
              O dono do treino ainda não salvou exercícios suficientes para compartilhar.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(900px 420px at 20% -5%, rgba(255,106,0,.14), rgba(248,250,252,0) 60%), linear-gradient(180deg, #f8fafc, #f7f9fc)",
    padding: 18,
    paddingBottom: 120,
  },

  wrap: {
    maxWidth: 780,
    margin: "0 auto",
  },

  centerWrap: {
    minHeight: "80vh",
    display: "grid",
    placeItems: "center",
  },

  logo: {
    fontSize: 36,
    fontWeight: 900,
    color: TEXT,
    letterSpacing: -0.8,
  },

  topBar: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },

  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    border: "1px solid rgba(15,23,42,.08)",
    background: "rgba(255,255,255,.86)",
    color: TEXT,
    fontWeight: 950,
    fontSize: 16,
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
  },

  topTitle: {
    fontSize: 18,
    fontWeight: 950,
    color: TEXT,
    letterSpacing: -0.3,
  },

  hero: {
    borderRadius: 26,
    padding: 18,
    background: "linear-gradient(135deg, rgba(255,106,0,.18), rgba(255,255,255,.92))",
    border: "1px solid rgba(255,106,0,.18)",
    boxShadow: "0 24px 80px rgba(15,23,42,.10)",
  },

  heroKicker: {
    fontSize: 12,
    fontWeight: 900,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  heroTitle: {
    marginTop: 8,
    fontSize: 28,
    fontWeight: 950,
    color: TEXT,
    letterSpacing: -0.7,
    lineHeight: 1.05,
  },

  heroSub: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: 800,
    color: MUTED,
    lineHeight: 1.4,
  },

  heroChips: {
    marginTop: 12,
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },

  heroChip: {
    padding: "8px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,.82)",
    border: "1px solid rgba(15,23,42,.08)",
    fontWeight: 900,
    fontSize: 12,
    color: TEXT,
  },

  sectionTitle: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: 950,
    color: TEXT,
    letterSpacing: -0.3,
  },

  daysRow: {
    marginTop: 10,
    display: "flex",
    gap: 10,
    overflowX: "auto",
    paddingBottom: 4,
  },

  dayPill: {
    padding: "12px 14px",
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,.08)",
    background: "rgba(255,255,255,.86)",
    color: TEXT,
    fontWeight: 900,
    whiteSpace: "nowrap",
    boxShadow: "0 12px 34px rgba(15,23,42,.06)",
  },

  dayPillActive: {
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    color: "#111",
    border: "1px solid rgba(255,106,0,.28)",
    boxShadow: "0 18px 40px rgba(255,106,0,.18)",
  },

  dayCard: {
    marginTop: 12,
    borderRadius: 24,
    padding: 16,
    background: "rgba(255,255,255,.92)",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 18px 60px rgba(15,23,42,.06)",
  },

  dayHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },

  dayTitle: {
    fontSize: 20,
    fontWeight: 950,
    color: TEXT,
    letterSpacing: -0.4,
  },

  daySub: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: 800,
    color: MUTED,
    lineHeight: 1.35,
  },

  dayBadge: {
    minWidth: 44,
    height: 44,
    padding: "0 14px",
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,106,0,.12)",
    border: "1px solid rgba(255,106,0,.20)",
    fontSize: 14,
    fontWeight: 950,
    color: TEXT,
  },

  exerciseList: {
    marginTop: 14,
    display: "grid",
    gap: 12,
  },

  exerciseCard: {
    borderRadius: 22,
    padding: 14,
    background: "#fff",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 12px 34px rgba(15,23,42,.05)",
  },

  exerciseTop: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
  },

  exerciseNum: {
    width: 44,
    height: 44,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, rgba(255,106,0,.95), rgba(255,106,0,.60))",
    color: "#fff",
    fontWeight: 950,
    fontSize: 15,
    flexShrink: 0,
  },

  exerciseName: {
    fontSize: 16,
    fontWeight: 950,
    color: TEXT,
    letterSpacing: -0.3,
  },

  exerciseMeta: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: 800,
    color: MUTED,
  },

  exerciseInfo: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: 900,
    color: TEXT,
    lineHeight: 1.35,
  },

  exerciseNotes: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: 800,
    color: MUTED,
    lineHeight: 1.4,
  },

  emptyCard: {
    marginTop: 18,
    borderRadius: 24,
    padding: 22,
    background: "rgba(255,255,255,.92)",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 18px 60px rgba(15,23,42,.06)",
    textAlign: "center",
  },

  emptyIcon: {
    fontSize: 28,
  },

  emptyTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: 950,
    color: TEXT,
    letterSpacing: -0.3,
  },

  emptyText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: 800,
    color: MUTED,
    lineHeight: 1.45,
  },

  primaryBtn: {
    marginTop: 16,
    padding: "14px 16px",
    borderRadius: 18,
    border: "none",
    background: "#0B0B0C",
    color: "#fff",
    fontWeight: 950,
    boxShadow: "0 16px 40px rgba(0,0,0,.16)",
  },
};
