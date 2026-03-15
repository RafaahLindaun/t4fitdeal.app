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
    {
      id: "cafe-iogurte-frutas",
      title: "Iogurte com frutas e granola",
      subtitle: "Leve, prático e fácil de repetir",
      minutes: 5,
      tags: ["leve", "rápido", "rotina"],
      goals: ["Emagrecimento", "Performance"],
      calories: 320,
      ingredients: ["1 iogurte natural", "frutas picadas", "granola", "chia"],
      steps: [
        "Coloque o iogurte em uma tigela.",
        "Adicione frutas, granola e chia.",
        "Mexa levemente e consuma na hora.",
      ],
      hydration: "Boa opção para manhãs corridas sem perder qualidade.",
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

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getGoalWater(profile) {
  const peso = Number(profile?.peso || 0);
  if (!peso) return 2500;
  const suggested = Math.round(peso * 35);
  return Math.max(2000, Math.min(suggested, 4500));
}

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

  const [waterMl, setWaterMl] = useState(() => {
    const raw = localStorage.getItem(`nutri_water_${email}_${todayKey()}`);
    return raw ? Number(raw) : 0;
  });

  const waterGoal = useMemo(() => getGoalWater(profile), [profile]);
  const waterLeft = Math.max(0, waterGoal - waterMl);
  const waterPct = Math.max(0, Math.min(100, Math.round((waterMl / waterGoal) * 100)));

  function addWater() {
    setWaterMl((prev) => Math.min(waterGoal, prev + WATER_STEP));
  }

  function removeWater() {
    setWaterMl((prev) => Math.max(0, prev - WATER_STEP));
  }

  useEffect(() => {
    localStorage.setItem(`nutri_water_${email}_${todayKey()}`, String(waterMl));
  }, [waterMl, email]);

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <div style={styles.brand}>
          fitdeal<span style={{ color: ORANGE }}>.</span>
        </div>

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

          <div style={styles.waterBarWrap}>
            <div
              style={{
                ...styles.waterBarFill,
                width: `${waterPct}%`,
              }}
            />
          </div>

          <div style={styles.waterCard}>
            <button style={styles.waterBtnSoft} onClick={removeWater}>
              − 1 copo
            </button>

            <div style={styles.waterCenter}>
              <div style={styles.waterBig}>{waterMl} ml</div>

              <div style={styles.waterSub}>
                cerca de {Math.round(waterMl / WATER_STEP)} copos
              </div>
            </div>

            <button style={styles.waterBtn} onClick={addWater}>
              + 1 copo
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: LIGHT,
    padding: 18,
  },

  wrap: {
    maxWidth: 620,
    margin: "0 auto",
  },

  brand: {
    fontSize: 32,
    fontWeight: 800,
    letterSpacing: -1,
    marginBottom: 16,
    color: BLACK,
  },

  hydrationSection: {
    padding: 18,
    borderRadius: 24,
    background: WHITE,
    border: `1px solid ${BORDER}`,
  },

  hydrationHeader: {
    display: "flex",
    justifyContent: "space-between",
  },

  hydrationTitle: {
    fontSize: 24,
    fontWeight: 800,
    color: BLACK,
  },

  hydrationSub: {
    marginTop: 6,
    fontSize: 13,
    color: GRAY,
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
    marginTop: 14,
    marginBottom: 14,
  },

  waterBarFill: {
    height: "100%",
    background: "linear-gradient(90deg,#FF6A00,#FF8A3C)",
  },

  waterCard: {
    display: "grid",
    gridTemplateColumns: "110px 1fr 110px",
    gap: 10,
    alignItems: "center",
  },

  waterCenter: {
    textAlign: "center",
  },

  waterBig: {
    fontSize: 28,
    fontWeight: 800,
  },

  waterSub: {
    fontSize: 12,
    color: GRAY,
  },

  waterBtn: {
    height: 44,
    borderRadius: 14,
    border: "none",
    background: ORANGE,
    color: BLACK,
    fontWeight: 800,
  },

  waterBtnSoft: {
    height: 44,
    borderRadius: 14,
    border: `1px solid ${BORDER}`,
    background: "#FAFAF8",
    color: BLACK,
    fontWeight: 800,
  },
};
