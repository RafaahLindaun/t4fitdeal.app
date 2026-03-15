import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ORANGE = "#FF6A00";
const TEXT = "#0f172a";
const MUTED = "#64748b";

/* banco de receitas será importado depois */
const RECIPE_BANK = {
  cafe: [],
  almoco: [],
  janta: [],
};

/* ---------------- helpers ---------------- */

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function waterGoalMl(pesoKg = 80) {
  const kg = Number(pesoKg || 0) || 80;
  return clamp(Math.round(kg * 35), 1800, 5000);
}

function getBaseRecipeId(id) {
  const parts = id.split("_");
  parts.pop();
  return parts.join("_");
}

/* ---------------- component ---------------- */

export default function Nutricao() {
  const nav = useNavigate();
  const { user } = useAuth();

  const email = (user?.email || "anon").toLowerCase();

  const objetivo = String(user?.objetivo || "hipertrofia");
  const peso = Number(user?.peso || 80);

  const goalMl = useMemo(() => waterGoalMl(peso), [peso]);

  /* ---------------- hidratação ---------------- */

  const today = new Date().toISOString().slice(0, 10);

  const waterKey = `water_${email}_${today}`;

  const [waterMl, setWaterMl] = useState(
    Number(localStorage.getItem(waterKey) || 0)
  );

  function persistWater(v) {
    localStorage.setItem(waterKey, String(v));
  }

  function addWater(ml) {
    setWaterMl((prev) => {
      const next = clamp(prev + ml, 0, goalMl * 2);
      persistWater(next);
      return next;
    });
  }

  function resetWater() {
    setWaterMl(0);
    persistWater(0);
  }

  const waterPct = goalMl ? clamp(waterMl / goalMl, 0, 1) : 0;

  /* ---------------- favoritos ---------------- */

  const favKey = `nutri_fav_${email}`;

  const [fav, setFav] = useState(() => {
    try {
      const raw = localStorage.getItem(favKey);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  function toggleFav(recipe) {
    const baseId = getBaseRecipeId(recipe.id);

    const next = {
      ...fav,
      [baseId]: !fav[baseId],
    };

    setFav(next);

    localStorage.setItem(favKey, JSON.stringify(next));
  }

  /* ---------------- receitas ---------------- */

  const [mealTab, setMealTab] = useState("cafe");
  const [query, setQuery] = useState("");
  const [showFavOnly, setShowFavOnly] = useState(false);

  const options = RECIPE_BANK[mealTab] || [];

  const filtered = useMemo(() => {
    let list = options;

    if (showFavOnly) {
      list = list.filter((x) => {
        const baseId = getBaseRecipeId(x.id);
        return fav[baseId];
      });
    }

    if (query) {
      const q = query.toLowerCase();
      list = list.filter((r) =>
        `${r.title} ${(r.tags || []).join(" ")}`.toLowerCase().includes(q)
      );
    }

    return list;
  }, [options, query, showFavOnly, fav]);

  const [openRecipe, setOpenRecipe] = useState(null);

  /* ---------------- UI ---------------- */

  return (
    <div style={S.page}>
      {/* header */}

      <div style={S.header}>
        <div style={S.brand}>
          fitdeal<span style={{ color: ORANGE }}>.</span>
        </div>

        <button style={S.back} onClick={() => nav("/dashboard")}>
          Voltar
        </button>
      </div>

      {/* hidratação */}

      <div style={S.card}>
        <div style={S.cardTop}>
          <div>
            <div style={S.cardTitle}>Hidratação</div>
            <div style={S.cardSub}>
              Meta diária <b>{goalMl}ml</b>
            </div>
          </div>

          <div style={S.percent}>{Math.round(waterPct * 100)}%</div>
        </div>

        <div style={S.progress}>
          <div
            style={{
              ...S.progressFill,
              width: `${Math.round(waterPct * 100)}%`,
            }}
          />
        </div>

        <div style={S.waterBtns}>
          <button onClick={() => addWater(200)}>+200</button>
          <button onClick={() => addWater(300)}>+300</button>
          <button onClick={() => addWater(500)}>+500</button>
          <button onClick={resetWater}>Reset</button>
        </div>

        <div style={S.waterNum}>{waterMl} ml hoje</div>
      </div>

      {/* tabs */}

      <div style={S.tabs}>
        <button
          onClick={() => setMealTab("cafe")}
          style={mealTab === "cafe" ? S.tabOn : S.tab}
        >
          Café
        </button>

        <button
          onClick={() => setMealTab("almoco")}
          style={mealTab === "almoco" ? S.tabOn : S.tab}
        >
          Almoço
        </button>

        <button
          onClick={() => setMealTab("janta")}
          style={mealTab === "janta" ? S.tabOn : S.tab}
        >
          Janta
        </button>
      </div>

      {/* busca */}

      <div style={S.searchRow}>
        <input
          placeholder="Buscar receita..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={S.search}
        />

        <button
          style={showFavOnly ? S.favOn : S.fav}
          onClick={() => setShowFavOnly(!showFavOnly)}
        >
          ★
        </button>
      </div>

      {/* receitas */}

      <div style={S.list}>
        {filtered.map((r) => {
          const baseId = getBaseRecipeId(r.id);
          const isFav = !!fav[baseId];

          return (
            <button
              key={r.id}
              style={S.recipe}
              onClick={() => setOpenRecipe(r)}
            >
              <div style={S.recipeTop}>
                <div>
                  <div style={S.recipeTitle}>{r.title}</div>

                  <div style={S.recipeTags}>
                    {(r.tags || []).slice(0, 2).map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFav(r);
                  }}
                  style={isFav ? S.starOn : S.star}
                >
                  ★
                </button>
              </div>
            </button>
          );
        })}
      </div>

      {/* modal */}

      {openRecipe && (
        <div style={S.modalOverlay} onClick={() => setOpenRecipe(null)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalTitle}>{openRecipe.title}</div>

            <div style={S.steps}>
              {(openRecipe.steps || []).map((s, i) => (
                <div key={i}>
                  {i + 1}. {s}
                </div>
              ))}
            </div>

            <button style={S.close} onClick={() => setOpenRecipe(null)}>
              Entendi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- styles ---------------- */

const S = {
  page: {
    padding: 18,
    background: "#f8fafc",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  brand: {
    fontSize: 22,
    fontWeight: 900,
    color: TEXT,
  },

  back: {
    border: "1px solid #ddd",
    padding: "10px 14px",
    borderRadius: 12,
    background: "#fff",
    fontWeight: 700,
  },

  card: {
    background: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
  },

  cardTitle: {
    fontWeight: 900,
    fontSize: 16,
  },

  cardSub: {
    fontSize: 12,
    color: MUTED,
  },

  percent: {
    fontWeight: 900,
  },

  progress: {
    height: 10,
    background: "#eee",
    borderRadius: 999,
    marginTop: 12,
  },

  progressFill: {
    height: "100%",
    background: ORANGE,
  },

  waterBtns: {
    display: "flex",
    gap: 8,
    marginTop: 12,
  },

  waterNum: {
    marginTop: 10,
    fontWeight: 700,
  },

  tabs: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 8,
    marginBottom: 12,
  },

  tab: {
    padding: 10,
    borderRadius: 12,
    border: "1px solid #ddd",
    background: "#fff",
  },

  tabOn: {
    padding: 10,
    borderRadius: 12,
    border: `1px solid ${ORANGE}`,
    background: "rgba(255,106,0,0.1)",
  },

  searchRow: {
    display: "grid",
    gridTemplateColumns: "1fr 50px",
    gap: 10,
    marginBottom: 16,
  },

  search: {
    padding: 12,
    borderRadius: 12,
    border: "1px solid #ddd",
  },

  fav: {
    borderRadius: 12,
    border: "1px solid #ddd",
    background: "#fff",
  },

  favOn: {
    borderRadius: 12,
    border: "none",
    background: ORANGE,
  },

  list: {
    display: "grid",
    gap: 10,
  },

  recipe: {
    background: "#fff",
    padding: 14,
    borderRadius: 16,
    border: "1px solid #eee",
    textAlign: "left",
  },

  recipeTop: {
    display: "flex",
    justifyContent: "space-between",
  },

  recipeTitle: {
    fontWeight: 900,
  },

  recipeTags: {
    fontSize: 12,
    color: MUTED,
  },

  star: {
    border: "1px solid #ddd",
    borderRadius: 10,
  },

  starOn: {
    border: "none",
    background: ORANGE,
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    display: "grid",
    placeItems: "center",
  },

  modal: {
    background: "#fff",
    padding: 20,
    borderRadius: 18,
    maxWidth: 400,
  },

  modalTitle: {
    fontWeight: 900,
    marginBottom: 12,
  },

  steps: {
    fontSize: 14,
    color: TEXT,
  },

  close: {
    marginTop: 14,
    background: ORANGE,
    border: "none",
    padding: 12,
    borderRadius: 12,
    fontWeight: 800,
  },
};
