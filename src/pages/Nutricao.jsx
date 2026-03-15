import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const ORANGE = "#FF6A00";
const BLACK = "#111111";
const GRAY = "#6B6B6B";
const SOFT = "#8A8A8A";
const LIGHT = "#F7F7F5";
const WHITE = "#FFFFFF";
const BORDER = "#E9E9E7";

const WATER_STEP = 250;

const MEAL_LABELS = {
  cafe: "Café da manhã",
  almoco: "Almoço",
  janta: "Janta",
};

/* ========================================
   RECIPE BANK (mantido igual ao seu)
======================================== */

const BASE_RECIPES = {
  cafe: [
    {
      id: "cafe-omelete-aveia",
      title: "Omelete com aveia",
      subtitle: "Proteína + energia logo cedo",
      minutes: 10,
      tags: ["proteína", "rápido", "manhã"],
      goals: ["Hipertrofia", "Performance"],
      calories: 420,
      ingredients: ["2 ovos", "3 colheres de aveia", "1 banana", "canela"],
      steps: [
        "Misture os ovos com a aveia.",
        "Faça a omelete em fogo baixo.",
        "Sirva com banana e canela ao lado.",
      ],
      hydration: "Combine com 500 ml de água ao acordar.",
    },
  ],

  almoco: [
    {
      id: "almoco-frango-arroz",
      title: "Frango, arroz e legumes",
      subtitle: "Base forte para uma rotina consistente",
      minutes: 18,
      tags: ["base", "equilíbrio", "consistência"],
      goals: ["Hipertrofia", "Performance", "Emagrecimento"],
      calories: 560,
      ingredients: ["frango grelhado", "arroz", "legumes", "azeite"],
      steps: [
        "Monte o prato com frango, arroz e legumes.",
        "Adicione azeite por cima dos legumes.",
        "Ajuste a porção ao seu objetivo.",
      ],
      hydration: "Almoço fácil de repetir ao longo da semana.",
    },
  ],

  janta: [
    {
      id: "janta-crepioca-frango",
      title: "Crepioca com frango",
      subtitle: "Janta prática e com boa proteína",
      minutes: 12,
      tags: ["noite", "prático", "proteína"],
      goals: ["Hipertrofia", "Emagrecimento"],
      calories: 410,
      ingredients: ["1 ovo", "goma de tapioca", "frango desfiado"],
      steps: [
        "Misture o ovo com a goma.",
        "Prepare a base da crepioca.",
        "Recheie com frango.",
      ],
      hydration: "Boa escolha para uma noite mais prática.",
    },
  ],
};

/* ========================================
   HELPERS
======================================== */

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getGoalWater(profile) {
  const peso = Number(profile?.peso || 0);
  if (!peso) return 2500;
  const suggested = Math.round(peso * 35);
  return Math.max(2000, Math.min(suggested, 4500));
}

/* ========================================
   COMPONENT
======================================== */

export default function Nutricao() {
  const nav = useNavigate();
  const { user } = useAuth();

  const email = (user?.email || "anon").toLowerCase();

  const [profile, setProfile] = useState({
    nome: "",
    objetivo: "Hipertrofia",
    peso: "",
    frequencia: 3,
  });

  /* ========================================
     HIDRATAÇÃO
  ======================================== */

  const [waterMl, setWaterMl] = useState(() => {
    const raw = localStorage.getItem(`nutri_water_${email}_${todayKey()}`);
    return raw ? Number(raw) : 0;
  });

  const waterGoal = useMemo(() => getGoalWater(profile), [profile]);

  const waterLeft = Math.max(0, waterGoal - waterMl);

  const waterPct = Math.max(
    0,
    Math.min(100, Math.round((waterMl / waterGoal) * 100))
  );

  function addWater(v) {
    setWaterMl((prev) => Math.min(waterGoal, prev + v));
  }

  function removeWater(v) {
    setWaterMl((prev) => Math.max(0, prev - v));
  }

  function completeGoal() {
    setWaterMl(waterGoal);
  }

  useEffect(() => {
    localStorage.setItem(`nutri_water_${email}_${todayKey()}`, String(waterMl));
  }, [waterMl, email]);

  /* ========================================
     RENDER
  ======================================== */

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <div style={styles.brand}>
          fitdeal<span style={{ color: ORANGE }}>.</span>
        </div>

        {/* =============================
            HIDRATAÇÃO
        ============================== */}

        <section style={styles.hydrationSection}>
          <div style={styles.hydrationHeader}>
            <div>
              <div style={styles.hydrationTitle}>
                Hidratação<span style={{ color: ORANGE }}>.</span>
              </div>

              <div style={styles.hydrationSub}>
                {waterMl} ml de {waterGoal} ml • faltam {waterLeft} ml
              </div>
            </div>

            <div style={styles.hydrationPct}>{waterPct}%</div>
          </div>

          {/* barra */}

          <div style={styles.waterBarWrap}>
            <div
              style={{
                ...styles.waterBarFill,
                width: `${waterPct}%`,
              }}
            />
          </div>

          {/* botões */}

          <div style={styles.waterButtonsRow}>
            <button
              style={styles.waterBtnSoft}
              onClick={() => removeWater(100)}
            >
              −100 ml
            </button>

            <button style={styles.waterBtnSoft} onClick={() => addWater(100)}>
              +100 ml
            </button>

            <button style={styles.waterBtnSoft} onClick={() => addWater(200)}>
              +200 ml
            </button>

            <button style={styles.waterBtnSoft} onClick={() => addWater(300)}>
              +300 ml
            </button>

            <button style={styles.waterBtnSoft} onClick={() => addWater(450)}>
              +450 ml
            </button>
          </div>

          {/* centro */}

          <div style={styles.waterCenter}>
            <div style={styles.waterBig}>{waterMl} ml</div>

            <div style={styles.waterSub}>
              cerca de {Math.round(waterMl / WATER_STEP)} copos
            </div>
          </div>

          {/* ações */}

          <div style={styles.waterActions}>
            <button style={styles.waterBtn} onClick={completeGoal}>
              Completar meta
            </button>

            <button
              style={styles.waterBtnSoft}
              onClick={() => nav("/nutricao-calendario")}
            >
              Ver calendário
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ========================================
   STYLES
======================================== */

const styles = {
  page: {
    minHeight: "100vh",
    background: LIGHT,
    padding: 18,
    paddingBottom: 120,
  },

  wrap: {
    maxWidth: 620,
    margin: "0 auto",
  },

  brand: {
    fontSize: 32,
    fontWeight: 800,
    letterSpacing: -1,
    marginBottom: 18,
    color: BLACK,
  },

  hydrationSection: {
    padding: 20,
    borderRadius: 24,
    background: WHITE,
    border: `1px solid ${BORDER}`,
    boxShadow: "0 10px 28px rgba(0,0,0,.04)",
  },

  hydrationHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  hydrationTitle: {
    fontSize: 24,
    fontWeight: 800,
    color: BLACK,
  },

  hydrationSub: {
    fontSize: 13,
    color: GRAY,
    marginTop: 4,
  },

  hydrationPct: {
    fontSize: 26,
    fontWeight: 800,
    color: ORANGE,
  },

  waterBarWrap: {
    height: 10,
    width: "100%",
    borderRadius: 999,
    background: "#EFEFEF",
    overflow: "hidden",
    marginTop: 12,
    marginBottom: 18,
  },

  waterBarFill: {
    height: "100%",
    background: "linear-gradient(90deg,#FF6A00,#FF8A3C)",
    borderRadius: 999,
  },

  waterButtonsRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 16,
  },

  waterCenter: {
    textAlign: "center",
    marginBottom: 16,
  },

  waterBig: {
    fontSize: 30,
    fontWeight: 800,
    color: BLACK,
  },

  waterSub: {
    fontSize: 12,
    color: GRAY,
  },

  waterActions: {
    display: "flex",
    gap: 10,
  },

  waterBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    border: "none",
    background: ORANGE,
    color: BLACK,
    fontWeight: 800,
  },

  waterBtnSoft: {
    height: 42,
    borderRadius: 12,
    border: `1px solid ${BORDER}`,
    background: "#FAFAF8",
    padding: "0 12px",
    fontWeight: 700,
    color: BLACK,
  },
};
