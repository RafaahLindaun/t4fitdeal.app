import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import recipeBank from "../data/recipeBank";

const ORANGE = "#FF6A00";
const BLACK = "#111111";
const GRAY = "#6B6B6B";
const SOFT = "#8A8A8A";
const LIGHT = "#F7F7F5";
const WHITE = "#FFFFFF";
const BORDER = "#E9E9E7";

const WATER_STEP = 250;

const BASE_RECIPES = recipeBank;

const MEAL_LABELS = {
  cafe: "Café da manhã",
  almoco: "Almoço",
  janta: "Janta",
};

function normalizeText(v) {
  return String(v || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function buildWeekStrip(daysCount) {
  const labels = ["D", "S", "T", "Q", "Q", "S", "S"];
  const result = [];
  const count = Math.max(3, Math.min(Number(daysCount) || 3, 7));
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);

    result.push({
      key: d.toISOString().slice(0, 10),
      day: d.getDate(),
      label: labels[d.getDay()],
      isToday: i === 0,
    });
  }

  return result;
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

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [mealTab, setMealTab] = useState("cafe");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const [waterMl, setWaterMl] = useState(() => {
    const raw = localStorage.getItem(`nutri_water_${email}_${todayKey()}`);
    return raw ? Number(raw) : 0;
  });

  useEffect(() => {
    localStorage.setItem(
      `nutri_water_${email}_${todayKey()}`,
      String(waterMl)
    );
  }, [waterMl]);

  const waterGoal = useMemo(() => getGoalWater(profile), [profile]);
  const waterLeft = Math.max(0, waterGoal - waterMl);
  const waterPct = Math.min(100, Math.round((waterMl / waterGoal) * 100));

  function addWater() {
    setWaterMl((v) => Math.min(waterGoal, v + WATER_STEP));
  }

  function removeWater() {
    setWaterMl((v) => Math.max(0, v - WATER_STEP));
  }

  useEffect(() => {
    async function loadProfile() {
      if (!user?.id) {
        setLoadingProfile(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("nome, objetivo, peso, frequencia")
        .eq("id", user.id)
        .maybeSingle();

      setProfile({
        nome:
          data?.nome ||
          user?.user_metadata?.nome ||
          user?.email?.split("@")[0] ||
          "",
        objetivo: data?.objetivo || "Hipertrofia",
        peso: data?.peso || "",
        frequencia: data?.frequencia || 3,
      });

      setLoadingProfile(false);
    }

    loadProfile();
  }, [user]);

  const weekStrip = useMemo(
    () => buildWeekStrip(profile?.frequencia),
    [profile]
  );

  const recipes = useMemo(() => {
    const base = BASE_RECIPES[mealTab] || [];

    if (!search) return base;

    const q = normalizeText(search);

    return base.filter(
      (r) =>
        normalizeText(r.title).includes(q) ||
        normalizeText(r.subtitle).includes(q)
    );
  }, [mealTab, search]);

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>

        {/* HEADER */}

        <div style={styles.headerCompact}>
          <div style={styles.headerRow}>
            <div style={styles.brandFit}>
              fitdeal<span style={{ color: ORANGE }}>.</span>
            </div>

            <div style={styles.brand}>
              Nutri<span style={{ color: ORANGE }}>+</span>
            </div>
          </div>
        </div>

        {/* HERO */}

        <section style={styles.heroCard}>
          <div>
            <div style={styles.heroTitle}>
              {loadingProfile
                ? "Sua nutrição"
                : `${profile.nome}, sua nutrição`}
            </div>

            <div style={styles.heroSub}>
              Organização alimentar alinhada ao seu objetivo.
            </div>
          </div>

          <div style={styles.heroMini}>
            <div style={styles.heroMiniLabel}>Objetivo</div>
            <div style={styles.heroMiniValue}>{profile.objetivo}</div>
          </div>
        </section>

        {/* HIDRATAÇÃO */}

        <section style={styles.section}>
          <div style={styles.sectionTitle}>Hidratação</div>

          <div style={styles.waterCard}>

            <div style={styles.waterProgressWrap}>

              <div style={styles.waterProgressBar}>
                <div
                  style={{
                    ...styles.waterProgressFill,
                    width: `${waterPct}%`
                  }}
                />
              </div>

              <div style={styles.waterBig}>
                {waterMl} ml
              </div>

              <div style={styles.waterSub}>
                Meta {waterGoal} ml • faltam {waterLeft} ml
              </div>

            </div>

            <div style={styles.waterActions}>
              <button
                style={styles.waterBtnSoft}
                onClick={removeWater}
              >
                −250 ml
              </button>

              <button
                style={styles.waterBtn}
                onClick={addWater}
              >
                +250 ml
              </button>
            </div>

          </div>
        </section>

        {/* CALENDÁRIO */}

        <section style={styles.section}>
          <div style={styles.sectionTitle}>Próximos dias</div>

          <div style={styles.calendarRow}>
            {weekStrip.map((item) => (
              <div
                key={item.key}
                style={{
                  ...styles.calendarPill,
                  ...(item.isToday && styles.calendarPillActive),
                }}
              >
                <div style={styles.calendarLabel}>{item.label}</div>
                <div style={styles.calendarDay}>{item.day}</div>
              </div>
            ))}
          </div>
        </section>

        {/* TABS */}

        <section style={styles.section}>
          <div style={styles.segmentWrap}>
            {Object.keys(MEAL_LABELS).map((key) => (
              <button
                key={key}
                style={{
                  ...styles.segmentBtn,
                  ...(mealTab === key && styles.segmentBtnActive),
                }}
                onClick={() => setMealTab(key)}
              >
                {MEAL_LABELS[key]}
              </button>
            ))}
          </div>

          <div style={styles.searchWrap}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar receita"
              style={styles.searchInput}
            />
          </div>
        </section>

        {/* RECEITAS */}

        <section style={styles.recipeList}>
          {recipes.map((item) => {
            const open = expandedId === item.id;

            return (
              <div
                key={item.id}
                style={{
                  ...styles.recipeCard,
                  ...(open && styles.recipeCardOpen),
                }}
              >
                <button
                  style={styles.recipeMainButton}
                  onClick={() =>
                    setExpandedId(open ? null : item.id)
                  }
                >
                  <div style={styles.recipeTitle}>
                    {item.title}
                  </div>

                  <div style={styles.recipeSub}>
                    {item.subtitle}
                  </div>
                </button>

                {open && (
                  <div style={styles.expandArea}>
                    <div style={styles.expandBlockTitle}>
                      Ingredientes
                    </div>

                    <div style={styles.inlineList}>
                      {item.ingredients.map((v) => (
                        <span key={v} style={styles.tagSoft}>
                          {v}
                        </span>
                      ))}
                    </div>

                    <div style={styles.expandBlockTitle}>
                      Como fazer
                    </div>

                    <div style={styles.stepsCol}>
                      {item.steps.map((s, i) => (
                        <div key={i} style={styles.stepRow}>
                          <div style={styles.stepIndex}>
                            {i + 1}
                          </div>

                          <div style={styles.stepText}>
                            {s}
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const styles = {

page:{minHeight:"100vh",background:LIGHT,padding:18,paddingBottom:120},

wrap:{maxWidth:620,margin:"0 auto"},

headerCompact:{marginBottom:12},

headerRow:{
display:"flex",
justifyContent:"space-between",
alignItems:"center"
},

brandFit:{fontSize:28,fontWeight:900,color:BLACK},

brand:{fontSize:28,fontWeight:900,color:BLACK},

heroCard:{
display:"flex",
justifyContent:"space-between",
padding:18,
borderRadius:24,
background:WHITE,
border:`1px solid ${BORDER}`
},

heroTitle:{fontSize:26,fontWeight:800,color:BLACK},

heroSub:{marginTop:6,fontSize:14,color:GRAY},

heroMini:{textAlign:"right"},

heroMiniLabel:{fontSize:11,color:SOFT},

heroMiniValue:{fontSize:16,fontWeight:800},

section:{marginTop:14},

sectionTitle:{fontSize:18,fontWeight:800,color:BLACK,marginBottom:10},

waterCard:{
padding:16,
borderRadius:22,
background:WHITE,
border:`1px solid ${BORDER}`
},

waterProgressWrap:{width:"100%"},

waterProgressBar:{
height:10,
borderRadius:999,
background:"#EEE",
overflow:"hidden",
marginBottom:10
},

waterProgressFill:{
height:"100%",
background:ORANGE
},

waterBig:{fontSize:26,fontWeight:800},

waterSub:{fontSize:13,color:GRAY},

waterActions:{display:"flex",gap:8,marginTop:12},

waterBtn:{
height:42,
borderRadius:12,
background:ORANGE,
border:"none",
fontWeight:800
},

waterBtnSoft:{
height:42,
borderRadius:12,
border:`1px solid ${BORDER}`,
background:"#FAFAF8",
fontWeight:800
},

calendarRow:{display:"flex",gap:10},

calendarPill:{
minWidth:60,
padding:10,
borderRadius:16,
border:`1px solid ${BORDER}`,
textAlign:"center"
},

calendarPillActive:{
background:"#FFF7F1",
borderColor:"rgba(255,106,0,.28)"
},

calendarLabel:{fontSize:11,color:SOFT},

calendarDay:{fontSize:18,fontWeight:800},

segmentWrap:{display:"flex",gap:8},

segmentBtn:{
padding:"10px 14px",
borderRadius:12,
border:`1px solid ${BORDER}`,
background:WHITE
},

segmentBtnActive:{background:BLACK,color:WHITE},

searchWrap:{marginTop:10},

searchInput:{
width:"100%",
height:44,
borderRadius:12,
border:`1px solid ${BORDER}`,
padding:"0 12px"
},

recipeList:{marginTop:14,display:"grid",gap:12},

recipeCard:{
borderRadius:18,
background:WHITE,
border:`1px solid ${BORDER}`,
padding:14
},

recipeCardOpen:{
borderColor:"rgba(255,106,0,.3)"
},

recipeMainButton:{
border:"none",
background:"transparent",
textAlign:"left",
width:"100%"
},

recipeTitle:{fontSize:17,fontWeight:800},

recipeSub:{fontSize:13,color:GRAY},

expandArea:{marginTop:10},

expandBlockTitle:{fontSize:12,fontWeight:800,color:SOFT,marginTop:10},

inlineList:{display:"flex",gap:6,flexWrap:"wrap"},

tagSoft:{
padding:"6px 10px",
borderRadius:999,
border:`1px solid ${BORDER}`,
fontSize:12
},

stepsCol:{display:"grid",gap:8},

stepRow:{display:"flex",gap:8},

stepIndex:{
width:20,
height:20,
borderRadius:999,
background:"#FFF1E8",
color:ORANGE,
display:"grid",
placeItems:"center",
fontSize:11,
fontWeight:800
},

stepText:{fontSize:13}

};
