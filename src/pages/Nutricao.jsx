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

const MEAL_LABELS = {
  cafe: "Café da manhã",
  almoco: "Almoço",
  janta: "Janta",
};

const BASE_RECIPES = recipeBank;

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

  for (let i = 0; i < count; i += 1) {
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

function getSupplements(profile) {
  const objetivo = profile?.objetivo || "Hipertrofia";
  const peso = Number(profile?.peso || 70);

  if (objetivo === "Emagrecimento") {
    return [
      `Whey protein conforme necessidade de proteína diária`,
      `Creatina 3g a 5g por dia`,
      `Cafeína em dias de treino`,
    ];
  }

  if (objetivo === "Performance") {
    return [
      `Creatina 3g a 5g por dia`,
      `Whey protein no pós treino`,
      `Cafeína em dias de treino forte`,
    ];
  }

  return [
    `Creatina 3g a 5g por dia`,
    `Whey protein para complementar proteína`,
    `Meta proteína diária cerca de ${Math.round(peso * 1.8)}g`,
  ];
}

function generateMealOptions({ mealKey, profile, search, activeChip }) {

  const base = BASE_RECIPES[mealKey] || [];
  const objetivo = profile?.objetivo || "Hipertrofia";

  let items = base.map((recipe) => {

    let emphasis = "";

    if (objetivo === "Hipertrofia")
      emphasis = "Boa para apoiar ganho de massa.";

    if (objetivo === "Emagrecimento")
      emphasis = "Boa para controle calórico.";

    if (objetivo === "Performance")
      emphasis = "Boa para melhorar rendimento.";

    return {
      ...recipe,
      stableId: recipe.id,
      mealKey,
      emphasis,
      favoriteHint: `Salvar ${recipe.title}`,
    };
  });

  if (activeChip && activeChip !== "todos") {

    items = items.filter((item) =>
      item.tags.some((tag) =>
        normalizeText(tag).includes(normalizeText(activeChip))
      )
    );
  }

  if (search.trim()) {

    const q = normalizeText(search);

    items = items.filter((item) =>
      normalizeText(item.title).includes(q) ||
      normalizeText(item.subtitle).includes(q)
    );
  }

  return items;
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
  const [activeChip, setActiveChip] = useState("todos");

  const [expandedId, setExpandedId] = useState(null);

  const [favorites, setFavorites] = useState(() => {
    const raw = localStorage.getItem(`nutri_fav_${email}`);
    return raw ? JSON.parse(raw) : [];
  });

  const [waterMl, setWaterMl] = useState(() => {
    const raw = localStorage.getItem(`nutri_water_${email}_${todayKey()}`);
    return raw ? Number(raw) : 0;
  });

  const paidNutriPlus = localStorage.getItem(`nutri_plus_${email}`) === "1";

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
        nome: data?.nome || user.email.split("@")[0],
        objetivo: data?.objetivo || "Hipertrofia",
        peso: data?.peso || "",
        frequencia: data?.frequencia || 3,
      });

      setLoadingProfile(false);
    }

    loadProfile();

  }, [user]);

  useEffect(() => {
    localStorage.setItem(`nutri_fav_${email}`, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem(`nutri_water_${email}_${todayKey()}`, String(waterMl));
  }, [waterMl]);

  const waterGoal = useMemo(() => getGoalWater(profile), [profile]);

  const waterLeft = Math.max(0, waterGoal - waterMl);

  const waterPct = Math.max(
    0,
    Math.min(100, Math.round((waterMl / waterGoal) * 100))
  );

  const weekStrip = useMemo(
    () => buildWeekStrip(profile?.frequencia || 3),
    [profile?.frequencia]
  );

  const options = useMemo(() => {
    return generateMealOptions({
      mealKey: mealTab,
      profile,
      search,
      activeChip,
    });
  }, [mealTab, profile, search, activeChip]);

  const supplements = useMemo(
    () => getSupplements(profile),
    [profile]
  );

  function addWater() {
    setWaterMl((prev) => Math.min(waterGoal, prev + WATER_STEP));
  }

  function removeWater() {
    setWaterMl((prev) => Math.max(0, prev - WATER_STEP));
  }

  if (!paidNutriPlus) {
    return (
      <div style={styles.page}>
        <div style={styles.wrap}>
          <div style={styles.headerRow}>
            <div style={styles.brandFit}>fitdeal<span style={{color:ORANGE}}>.</span></div>
            <div style={styles.brand}>Nutri<span style={{color:ORANGE}}>+</span></div>
          </div>

          <section style={styles.lockedHero}>
            <h1 style={styles.titleLocked}>Leve sua alimentação para outro nível.</h1>
            <p style={styles.subLocked}>
              Receitas, hidratação e organização alimentar dentro do FitDeal.
            </p>

            <button style={styles.mainCta} onClick={()=>nav("/planos#nutri")}>
              Liberar Nutri+
            </button>
          </section>
        </div>
      </div>
    );
  }

  return (

    <div style={styles.page}>

      <div style={styles.wrap}>

        <div style={styles.headerRow}>
          <div style={styles.brandFit}>fitdeal<span style={{color:ORANGE}}>.</span></div>
          <div style={styles.brand}>Nutri<span style={{color:ORANGE}}>+</span></div>
        </div>

        <section style={styles.heroCard}>
          <div>
            <div style={styles.heroTitle}>
              {loadingProfile
                ? "Sua nutrição"
                : `${profile.nome}, sua nutrição`}
            </div>

            <div style={styles.heroSub}>
              Rotina alimentar alinhada ao seu objetivo.
            </div>
          </div>

          <div style={styles.heroMini}>
            <div style={styles.heroMiniLabel}>Objetivo</div>
            <div style={styles.heroMiniValue}>{profile.objetivo}</div>
          </div>
        </section>

        <section style={styles.section}>

          <div style={styles.sectionTitle}>Hidratação</div>

          <div style={styles.waterCard}>

            <div style={styles.waterProgressBar}>
              <div
                style={{
                  ...styles.waterProgressFill,
                  width: `${waterPct}%`
                }}
              />
            </div>

            <div style={styles.waterNumbers}>
              <div style={styles.waterBig}>{waterMl} ml</div>
              <div style={styles.waterSub}>
                Meta {waterGoal} ml • faltam {waterLeft} ml
              </div>
            </div>

            <div style={styles.waterActions}>
              <button style={styles.waterBtnSoft} onClick={removeWater}>
                −250 ml
              </button>

              <button style={styles.waterBtn} onClick={addWater}>
                +250 ml
              </button>
            </div>

          </div>

        </section>

        <section style={styles.section}>
          <div style={styles.sectionTitle}>Receitas</div>

          {options.map((item)=>{

            const open = expandedId === item.stableId;

            return(

              <div key={item.stableId} style={styles.recipeCard}>

                <button
                  style={styles.recipeMainButton}
                  onClick={()=>setExpandedId(open?null:item.stableId)}
                >
                  <div style={styles.recipeTitle}>{item.title}</div>
                  <div style={styles.recipeSub}>{item.subtitle}</div>
                </button>

                {open && (

                  <div style={styles.expandArea}>

                    <div style={styles.expandText}>
                      {item.emphasis}
                    </div>

                    <div style={styles.expandBlockTitle}>Ingredientes</div>

                    {item.ingredients.map((v)=>(
                      <div key={v}>{v}</div>
                    ))}

                  </div>

                )}

              </div>

            )

          })}

        </section>

        <section style={styles.section}>

          <div style={styles.sectionTitle}>Suplementação</div>

          {supplements.map((item)=>(
            <div key={item} style={styles.simpleBulletRow}>
              <div style={styles.simpleDot}/>
              <div style={styles.simpleBulletText}>{item}</div>
            </div>
          ))}

        </section>

      </div>

    </div>

  );

}

const styles = {

page:{
minHeight:"100vh",
background:LIGHT,
padding:18
},

wrap:{
maxWidth:620,
margin:"0 auto"
},

headerRow:{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
marginBottom:12
},

brandFit:{
fontSize:28,
fontWeight:900,
color:BLACK
},

brand:{
fontSize:28,
fontWeight:800
},

heroCard:{
display:"flex",
justifyContent:"space-between",
padding:18,
borderRadius:24,
background:WHITE,
border:`1px solid ${BORDER}`
},

heroTitle:{
fontSize:28,
fontWeight:800
},

heroSub:{
fontSize:14,
color:GRAY
},

heroMiniLabel:{
fontSize:11,
color:SOFT
},

heroMiniValue:{
fontSize:16,
fontWeight:800
},

section:{
marginTop:20
},

sectionTitle:{
fontSize:18,
fontWeight:800,
marginBottom:10
},

waterCard:{
padding:18,
borderRadius:22,
background:WHITE,
border:`1px solid ${BORDER}`
},

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

waterNumbers:{
marginBottom:10
},

waterBig:{
fontSize:24,
fontWeight:800
},

waterSub:{
fontSize:13,
color:GRAY
},

waterActions:{
display:"flex",
gap:10
},

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
background:"#FAFAF8"
},

recipeCard:{
padding:16,
borderRadius:20,
border:`1px solid ${BORDER}`,
background:WHITE,
marginBottom:10
},

recipeTitle:{
fontSize:16,
fontWeight:800
},

recipeSub:{
fontSize:13,
color:GRAY
},

expandArea:{
marginTop:10
},

expandText:{
fontSize:13,
color:GRAY
},

expandBlockTitle:{
fontSize:12,
fontWeight:800,
marginTop:10
},

simpleBulletRow:{
display:"flex",
gap:10,
marginBottom:6
},

simpleDot:{
width:8,
height:8,
background:ORANGE,
borderRadius:999,
marginTop:6
},

simpleBulletText:{
fontSize:14
}

};
