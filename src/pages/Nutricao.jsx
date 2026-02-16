// ✅ COLE EM: src/pages/Nutricao.jsx
// Nutri+ — SEM o botão preto do topo (header)
// e SEM a “barra laranja” (track) no botão de baixo (Suplementação)

import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ORANGE = "#FF6A00";
const TEXT = "#0f172a";
const MUTED = "#64748b";

/* ---------------- helpers ---------------- */
function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

/** hash simples (determinístico) */
function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

/** shuffle determinístico pra gerar variedade sem servidor */
function seededShuffle(arr, seedKey) {
  const a = [...arr];
  let seed = hashStr(seedKey) || 1;
  for (let i = a.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------------- banco de receitas base ---------------- */
const RECIPE_BANK = {
  cafe: [
    {
      id: "cafe_pao_queijo_tomate",
      title: "Pão + queijo + tomate",
      tags: ["rápido", "barato", "br"],
      steps: [
        "Toste 1–2 fatias de pão.",
        "Coloque queijo e tomate em rodelas.",
        "Finalize com orégano e um fio de azeite (opcional).",
      ],
      base: { protein: ["queijo"], carb: ["pão"], extra: ["tomate"] },
      tips: ["Se quiser mais proteína: adicione 1 ovo mexido junto."],
    },
    {
      id: "cafe_cuscuz_ovo",
      title: "Cuscuz + ovos + manteiga",
      tags: ["tradicional", "energia", "br"],
      steps: [
        "Prepare o cuscuz (flocão + água + sal) na cuscuzeira.",
        "Faça 2–3 ovos mexidos.",
        "Finalize o cuscuz com manteiga e sirva com os ovos.",
      ],
      base: { protein: ["ovos"], carb: ["cuscuz"], extra: ["manteiga"] },
      tips: ["Para secar: reduza manteiga e adicione salada/legumes no café."],
    },
    {
      id: "cafe_mingau_aveia",
      title: "Mingau de aveia (leite + canela)",
      tags: ["fácil", "digestão", "pré-treino"],
      steps: [
        "Aqueça leite em uma panela.",
        "Adicione aveia e mexa até engrossar.",
        "Finalize com canela e banana (opcional).",
      ],
      base: { protein: ["leite"], carb: ["aveia"], extra: ["canela"] },
      tips: ["Se quiser mais calorias: adicione pasta de amendoim."],
    },
    {
      id: "cafe_crepioca_frango",
      title: "Crepioca recheada com frango",
      tags: ["proteico", "br", "saciedade"],
      steps: [
        "Misture 1 ovo + 2 colheres de tapioca + sal.",
        "Faça a massa na frigideira.",
        "Recheie com frango desfiado e dobre.",
      ],
      base: { protein: ["frango", "ovos"], carb: ["tapioca"], extra: ["tempero"] },
      tips: ["Para mais sabor: requeijão light ou tomate picado."],
    },
    {
      id: "cafe_pao_ovo_abacate",
      title: "Pão + ovos + abacate",
      tags: ["energia", "saciedade", "fitness"],
      steps: [
        "Toste o pão.",
        "Faça 2 ovos (mexidos ou pochê).",
        "Amasse abacate com sal e limão e coloque por cima.",
      ],
      base: { protein: ["ovos"], carb: ["pão"], extra: ["abacate"] },
      tips: ["Se quiser aumentar calorias: adicione azeite ou castanhas."],
    },
    {
      id: "cafe_iogurte_granola_fruta",
      title: "Iogurte + granola + fruta",
      tags: ["rápido", "digestão", "doce"],
      steps: [
        "Coloque iogurte natural na tigela.",
        "Adicione granola.",
        "Finalize com fruta picada (banana/maçã/morango).",
      ],
      base: { protein: ["iogurte"], carb: ["granola"], extra: ["fruta"] },
      tips: ["Para reduzir açúcar: use granola sem açúcar."],
    },
    {
      id: "cafe_sanduiche_atum",
      title: "Sanduíche de atum (rápido)",
      tags: ["proteico", "rápido", "prático"],
      steps: [
        "Misture atum com um pouco de iogurte ou maionese light.",
        "Monte no pão com alface/tomate.",
        "Finalize com sal e limão.",
      ],
      base: { protein: ["atum"], carb: ["pão"], extra: ["salada"] },
      tips: ["Se quiser mais carbo: use pão integral + 1 fruta."],
    },
    {
      id: "cafe_pao_frango_requeijao",
      title: "Pão com frango + requeijão",
      tags: ["br", "proteico", "barato"],
      steps: [
        "Desfie frango cozido (ou use sobras).",
        "Misture com requeijão e temperos.",
        "Monte no pão e toste (opcional).",
      ],
      base: { protein: ["frango"], carb: ["pão"], extra: ["requeijão"] },
      tips: ["Para secar: reduza requeijão e aumente salada."],
    },
    {
      id: "cafe_banana_canela_amendoim",
      title: "Banana + canela + pasta de amendoim",
      tags: ["pré-treino", "energia", "rápido"],
      steps: [
        "Amasse 1 banana.",
        "Polvilhe canela.",
        "Adicione 1 colher de pasta de amendoim por cima.",
      ],
      base: { protein: ["pasta de amendoim"], carb: ["banana"], extra: ["canela"] },
      tips: ["Se quiser mais proteína: adicione iogurte ao lado."],
    },
    {
      id: "cafe_omelete_queijo",
      title: "Omelete simples com queijo",
      tags: ["proteico", "rápido"],
      steps: ["Bata 2–4 ovos com sal.", "Adicione queijo picado.", "Cozinhe na frigideira até firmar."],
      base: { protein: ["ovos", "queijo"], carb: ["nenhum"], extra: ["tempero"] },
      tips: ["Se precisar de carbo: inclua 1 pão ou 1 fruta."],
    },
    {
      id: "cafe_pao_mortadela_tomate",
      title: "Pão + mortadela + tomate (caseiro)",
      tags: ["barato", "rápido", "tradicional"],
      steps: ["Toste o pão (opcional).", "Adicione mortadela e tomate.", "Finalize com mostarda (opcional)."],
      base: { protein: ["mortadela"], carb: ["pão"], extra: ["tomate"] },
      tips: ["Melhor versão: use peito de peru ou frango quando possível."],
    },
    {
      id: "cafe_queijo_minas_fruta",
      title: "Queijo minas + fruta + café",
      tags: ["leve", "tradicional", "rápido"],
      steps: ["Corte queijo minas em cubos/fatias.", "Sirva com 1 fruta.", "Beba café sem açúcar ou com pouco açúcar."],
      base: { protein: ["queijo minas"], carb: ["fruta"], extra: ["café"] },
      tips: ["Se quiser mais carbo: inclua 1 pão."],
    },
    {
      id: "cafe_panq_aveia_ovo",
      title: "Panqueca de aveia (ovo + banana)",
      tags: ["pré-treino", "fácil", "energia"],
      steps: ["Bata 1 banana + 1 ovo + 2 colheres de aveia.", "Cozinhe em frigideira antiaderente.", "Finalize com canela."],
      base: { protein: ["ovos"], carb: ["aveia", "banana"], extra: ["canela"] },
      tips: ["Para ganhar: adicione mel ou pasta de amendoim."],
    },
    {
      id: "cafe_tapioca_ovo",
      title: "Tapioca + ovo mexido",
      tags: ["br", "proteico", "rápido"],
      steps: ["Faça a tapioca na frigideira.", "Prepare 2 ovos mexidos.", "Recheie e dobre."],
      base: { protein: ["ovos"], carb: ["tapioca"], extra: ["tempero"] },
      tips: ["Se quiser mais: adicione queijo e tomate."],
    },
    {
      id: "cafe_iogurte_whey",
      title: "Iogurte + whey + fruta",
      tags: ["proteico", "rápido", "pós-treino"],
      steps: ["Misture iogurte com 1 scoop de whey.", "Adicione fruta picada.", "Finalize com canela (opcional)."],
      base: { protein: ["iogurte", "whey"], carb: ["fruta"], extra: ["canela"] },
      tips: ["Se quiser mais carbo: adicione granola."],
    },
    {
      id: "cafe_pao_pasta_amendoim",
      title: "Pão + pasta de amendoim + banana",
      tags: ["energia", "pré-treino", "rápido"],
      steps: ["Passe pasta de amendoim no pão.", "Adicione banana em rodelas.", "Finalize com canela (opcional)."],
      base: { protein: ["pasta de amendoim"], carb: ["pão", "banana"], extra: ["canela"] },
      tips: ["Para secar: diminua a pasta e use pão integral."],
    },
    {
      id: "cafe_leite_cafe_pao",
      title: "Café com leite + pão + ovo",
      tags: ["tradicional", "br", "rápido"],
      steps: ["Faça café com leite.", "Toste 1 pão.", "Faça 1–2 ovos mexidos e sirva junto."],
      base: { protein: ["ovos", "leite"], carb: ["pão"], extra: ["café"] },
      tips: ["Se quiser mais saciedade: adicione uma fruta."],
    },
    {
      id: "cafe_biscoito_agua_iogurte",
      title: "Iogurte + biscoito água e sal",
      tags: ["simples", "barato", "rápido"],
      steps: ["Sirva iogurte natural em um pote.", "Coma junto com biscoito água e sal.", "Adicione 1 fruta se quiser."],
      base: { protein: ["iogurte"], carb: ["biscoito"], extra: ["fruta"] },
      tips: ["Para reduzir calorias: use iogurte light."],
    },
    {
      id: "cafe_ovos_arroz",
      title: "Ovos + arroz (resto do dia anterior)",
      tags: ["barato", "br", "proteico"],
      steps: ["Aqueça o arroz pronto.", "Faça 2–3 ovos mexidos.", "Misture e finalize com temperos."],
      base: { protein: ["ovos"], carb: ["arroz"], extra: ["tempero"] },
      tips: ["Fica top com tomate e cebola picados."],
    },
    {
      id: "cafe_smoothie_iogurte_fruta",
      title: "Smoothie (iogurte + fruta + aveia)",
      tags: ["rápido", "pré-treino", "digestão"],
      steps: ["Bata iogurte + fruta + aveia.", "Adicione gelo se quiser.", "Sirva na hora."],
      base: { protein: ["iogurte"], carb: ["fruta", "aveia"], extra: ["gelo"] },
      tips: ["Para ganhar: adicione pasta de amendoim."],
    },
    {
      id: "cafe_ovos_pao",
      title: "Ovos + pão + fruta",
      tags: ["rápido", "proteico"],
      steps: ["Faça 2–4 ovos mexidos/omelete (sal e pimenta).", "Toste 1–2 fatias de pão.", "Finalize com 1 fruta (banana/maçã)."],
      base: { protein: ["ovos"], carb: ["pão"], extra: ["fruta"] },
      tips: ["Se quiser aumentar calorias: adicione queijo ou pasta de amendoim."],
    },
    {
      id: "cafe_iogurte_aveia",
      title: "Iogurte + aveia + banana",
      tags: ["fácil", "digestão"],
      steps: ["Em uma tigela: iogurte natural.", "Misture aveia e canela.", "Finalize com banana e (opcional) mel."],
      base: { protein: ["iogurte"], carb: ["aveia"], extra: ["banana"] },
      tips: ["Se quiser mais proteína: use iogurte grego ou adicione whey."],
    },
    {
      id: "cafe_tapioca",
      title: "Tapioca + queijo + fruta",
      tags: ["br", "energia"],
      steps: ["Aqueça a frigideira e espalhe a tapioca.", "Recheie com queijo e dobre.", "Finalize com 1 fruta."],
      base: { protein: ["queijo"], carb: ["tapioca"], extra: ["fruta"] },
      tips: ["Se quiser mais proteína: coloque frango desfiado junto."],
    },
    {
      id: "cafe_vitamina",
      title: "Vitamina rápida (banana + leite + aveia)",
      tags: ["rápido", "pré-treino"],
      steps: ["Bata leite + banana + aveia.", "Opcional: 1 colher de pasta de amendoim.", "Sirva gelado."],
      base: { protein: ["leite"], carb: ["banana", "aveia"], extra: ["pasta de amendoim"] },
      tips: ["Para reduzir açúcar: use leite sem açúcar e aveia."],
    },
  ],

  almoco: [],
  janta: [],
};

const PROTEIN_SWAPS = ["frango", "carne magra", "ovos", "atum", "queijo", "iogurte"];
const CARB_SWAPS = ["arroz", "feijão", "batata", "macarrão", "pão", "tapioca", "aveia"];
const EXTRA_SWAPS = ["salada", "legumes", "fruta", "azeite", "castanhas"];

function makeVariant(recipe, seedKey, objective = "hipertrofia") {
  const seedArrP = seededShuffle(PROTEIN_SWAPS, seedKey + "_p");
  const seedArrC = seededShuffle(CARB_SWAPS, seedKey + "_c");
  const seedArrE = seededShuffle(EXTRA_SWAPS, seedKey + "_e");

  const wantMoreCarb =
    String(objective).toLowerCase().includes("hiper") ||
    String(objective).toLowerCase().includes("cond");

  const wantLean =
    String(objective).toLowerCase().includes("bem") ||
    String(objective).toLowerCase().includes("saud");

  const pickP = seedArrP[0];
  const pickC = seedArrC[wantMoreCarb ? 0 : 2];
  const pickE = seedArrE[wantLean ? 0 : 1];

  return {
    ...recipe,
    variantKey: seedKey,
    title: `${recipe.title} • variação`,
    subtitle: `Trocas: ${pickP} + ${pickC} + ${pickE}`,
    swaps: { protein: pickP, carb: pickC, extra: pickE },
  };
}

function buildLotsOfOptions({ email, day, objective, mealKey, count = 48 }) {
  const baseList = RECIPE_BANK[mealKey] || [];
  if (!baseList.length) return [];
  const shuffled = seededShuffle(baseList, `${email}_${day}_${mealKey}_base`);
  const out = [];
  for (let i = 0; i < count; i++) {
    const base = shuffled[i % shuffled.length];
    const v = makeVariant(base, `${email}_${day}_${mealKey}_${i}`, objective);
    out.push({ id: `${base.id}_${i}`, mealKey, ...v });
  }
  return out;
}

function waterGoalMl(pesoKg = 80) {
  const kg = Number(pesoKg || 0) || 80;
  return clamp(Math.round(kg * 35), 1800, 5000);
}

/* ---------------- component ---------------- */
export default function Nutricao() {
  const nav = useNavigate();
  const { user } = useAuth();
  const email = (user?.email || "anon").toLowerCase();

  const hasNutriPlus = localStorage.getItem(`nutri_plus_${email}`) === "1";

  function todayKeyLocal() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  const [day, setDay] = useState(() => todayKeyLocal());

  const objetivo = String(user?.objetivo || "hipertrofia");
  const peso = Number(user?.peso || 0) || 80;

  const goalMl = useMemo(() => waterGoalMl(peso), [peso]);

  const waterKey = useMemo(() => `water_${email}_${day}`, [email, day]);
  const historyKey = useMemo(() => `water_history_${email}`, [email]);

  function readHistory() {
    try {
      const raw = localStorage.getItem(historyKey);
      const obj = raw ? JSON.parse(raw) : {};
      return obj && typeof obj === "object" ? obj : {};
    } catch {
      return {};
    }
  }

  function writeHistory(obj) {
    try {
      localStorage.setItem(historyKey, JSON.stringify(obj));
    } catch {}
  }

  function persistWater(forDay, ml) {
    try {
      localStorage.setItem(`water_${email}_${forDay}`, String(ml));
    } catch {}

    const h = readHistory();
    h[forDay] = ml;
    writeHistory(h);
  }

  const [waterMl, setWaterMl] = useState(() => {
    const v = Number(localStorage.getItem(`water_${email}_${todayKeyLocal()}`) || 0) || 0;
    persistWater(todayKeyLocal(), v);
    return v;
  });

  useEffect(() => {
    const v = Number(localStorage.getItem(waterKey) || 0) || 0;
    setWaterMl(v);
    persistWater(day, v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waterKey]);

  useEffect(() => {
    function msUntilNextMidnight() {
      const now = new Date();
      const next = new Date(now);
      next.setHours(24, 0, 0, 80);
      return Math.max(250, next.getTime() - now.getTime());
    }

    const t = setTimeout(() => {
      setDay(todayKeyLocal());
    }, msUntilNextMidnight());

    return () => clearTimeout(t);
  }, [day]);

  function addWater(ml) {
    setWaterMl((prev) => {
      const next = clamp(prev + ml, 0, goalMl * 2);
      persistWater(day, next);
      return next;
    });
  }

  function resetWater() {
    setWaterMl(0);
    persistWater(day, 0);
  }

  function goCalendar() {
    nav("/calendario");
  }

  const [openRecipe, setOpenRecipe] = useState(null);

  const [query, setQuery] = useState("");
  const [mealTab, setMealTab] = useState("cafe");
  const [showFavOnly, setShowFavOnly] = useState(false);

  const favKey = `nutri_fav_${email}`;
  const [fav, setFav] = useState(() => {
    const raw = localStorage.getItem(favKey);
    return raw ? JSON.parse(raw) : {};
  });

  function toggleFav(id) {
    const next = { ...fav, [id]: !fav[id] };
    setFav(next);
    localStorage.setItem(favKey, JSON.stringify(next));
  }

  const [visibleCount, setVisibleCount] = useState(16);
  useEffect(() => setVisibleCount(16), [mealTab, showFavOnly, query]);

  const options = useMemo(() => {
    const countPerMeal = 80;
    return buildLotsOfOptions({
      email,
      day,
      objective: objetivo,
      mealKey: mealTab,
      count: countPerMeal,
    });
  }, [email, day, objetivo, mealTab]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = options;

    if (showFavOnly) list = list.filter((x) => fav[x.id]);
    if (q) {
      list = list.filter((x) => {
        const hay = `${x.title} ${x.subtitle || ""} ${(x.tags || []).join(" ")}`.toLowerCase();
        return hay.includes(q);
      });
    }
    return list;
  }, [options, query, showFavOnly, fav]);

  const shown = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  const suggestion = useMemo(() => {
    const base = buildLotsOfOptions({
      email,
      day,
      objective: objetivo,
      mealKey: mealTab,
      count: 12,
    });
    if (!base.length) return null;
    const pick = seededShuffle(base, `${email}_${day}_${mealTab}_suggest`)[0];
    return pick || null;
  }, [email, day, objetivo, mealTab]);

  const waterPct = goalMl ? clamp(waterMl / goalMl, 0, 1) : 0;
  const pctLabel = Math.round(waterPct * 100);
  const leftMl = clamp(goalMl - waterMl, 0, goalMl);

  function goSupp() {
    nav("/suplementacao");
  }

  // ✅ NÃO PAGANTE / SEM NUTRI+
  if (!hasNutriPlus) {
    return (
      <div style={S.page}>
        <div style={S.bgGlow} />

        <div style={S.head}>
          <div style={{ minWidth: 0 }}>
            <div style={S.kicker}>Nutrição</div>
            <div style={S.title}>
              Nutri+<span style={{ color: ORANGE }}>.</span>
            </div>
            <div style={S.sub}>Refeições + receitas + hidratação em um fluxo simples e rápido.</div>
          </div>

          <div style={S.headRight}>
            {/* ✅ removido: botão preto do header */}
            <button style={S.backBtn} onClick={() => nav("/dashboard")} type="button">
              Voltar
            </button>
          </div>
        </div>

        {/* ✅ botão de baixo continua, mas SEM barra laranja */}
        <button style={S.suppHero} onClick={goSupp} type="button">
          <div style={S.suppHeroGlow} />
          <div style={S.suppHeroTop}>
            <div style={S.suppHeroLabel}>SUPLEMENTAÇÃO</div>
            <div style={S.suppHeroChev}>›</div>
          </div>

          <div style={S.suppHeroTitle}>
            Plano de suplementos<span style={S.orangeDot}>.</span>
          </div>

          <div style={S.suppHeroSub}>Recomendado por objetivo e ajustado ao seu peso. Toque para abrir.</div>
          {/* ✅ removido: track/fill (barra laranja) */}
        </button>

        <div style={S.lockCard}>
          <div style={S.lockTitle}>Nutri+ é exclusivo para assinantes</div>
          <div style={S.lockText}>
            Libera: combinações de refeições, receitas detalhadas, favoritos e contador de água.
          </div>

          <button style={S.ctaBtn} onClick={() => nav("/planos#nutri")} type="button">
            Liberar Nutri+ (R$ 65,99)
          </button>

          <div style={S.smallNote}>Você mantém o treino gratuito — Nutri+ é um módulo extra premium.</div>
        </div>

        <div style={S.previewCard}>
          <div style={S.previewTitle}>Prévia</div>
          <div style={S.previewRow}>
            <PreviewPill label="Receitas" value="1000+" />
            <PreviewPill label="Favoritos" value="★" />
            <PreviewPill label="Água" value="ml" />
          </div>
          <div style={S.previewHint}>Um toque e você tem uma refeição pronta, com trocas e passos claros.</div>
        </div>

        <div style={{ height: 120 }} />
      </div>
    );
  }

  // ✅ PAGANTE NUTRI+
  return (
    <div style={S.page}>
      <div style={S.bgGlow} />

      <div style={S.head}>
        <div style={{ minWidth: 0 }}>
          <div style={S.kicker}>Nutri+</div>
          <div style={S.title}>
            Refeições & Hidratação<span style={{ color: ORANGE }}>.</span>
          </div>
          <div style={S.sub}>Escolha refeições, salve favoritas e acompanhe sua água do dia.</div>
        </div>

        <div style={S.headRight}>
          {/* ✅ removido: botão preto do header */}
          <button style={S.backBtn} onClick={() => nav("/dashboard")} type="button">
            Voltar
          </button>
        </div>
      </div>

      {/* ✅ botão de baixo continua, mas SEM barra laranja */}
      <button style={S.suppHero} onClick={goSupp} type="button">
        <div style={S.suppHeroGlow} />
        <div style={S.suppHeroTop}>
          <div style={S.suppHeroLabel}>SUPLEMENTAÇÃO</div>
          <div style={S.suppHeroChev}>›</div>
        </div>

        <div style={S.suppHeroTitle}>
          Plano de suplementos<span style={S.orangeDot}>.</span>
        </div>

        <div style={S.suppHeroSub}>Recomendado por objetivo e ajustado ao seu peso. Toque para abrir.</div>
        {/* ✅ removido: track/fill (barra laranja) */}
      </button>

      {suggestion ? (
        <button style={S.suggestCard} onClick={() => setOpenRecipe(suggestion)} type="button">
          <div style={S.suggestTop}>
            <div style={S.suggestTag}>SUGESTÃO</div>
            <div style={S.suggestChev}>›</div>
          </div>

          <div style={S.suggestTitle}>{suggestion.title}</div>
          <div style={S.suggestSub}>{suggestion.subtitle}</div>

          <div style={S.suggestChips}>
            {(suggestion.tags || []).slice(0, 2).map((t) => (
              <span key={t} style={S.chip}>
                {t}
              </span>
            ))}
            <span style={S.chipSoft}>{mealTab.toUpperCase()}</span>
            <span style={S.chipSoft}>Toque para abrir</span>
          </div>
        </button>
      ) : null}

      <div style={S.card}>
        <div style={S.cardTop}>
          <div>
            <div style={S.cardTitle}>Hidratação</div>
            <div style={S.cardSub}>
              Meta sugerida: <b>{goalMl} ml</b> • faltam <b>{leftMl} ml</b>
            </div>
          </div>

          <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
            <div style={S.pill}>{pctLabel}%</div>

            <button style={S.calendarBtn} onClick={goCalendar} type="button">
              Ver no calendário <span style={S.calendarChev}>›</span>
            </button>
          </div>
        </div>

        <div style={S.progressWrap}>
          <div style={{ ...S.progressBar, width: `${Math.round(waterPct * 100)}%` }} />
        </div>

        <div style={S.waterRow}>
          <button style={S.waterBtnSoft} onClick={() => addWater(200)} type="button">
            +200
          </button>
          <button style={S.waterBtnSoft} onClick={() => addWater(300)} type="button">
            +300
          </button>
          <button style={S.waterBtnSoft} onClick={() => addWater(500)} type="button">
            +500
          </button>
          <button style={S.waterGhost} onClick={resetWater} type="button">
            Reset
          </button>
        </div>

        <div style={S.waterNum}>
          <b>{waterMl}</b> ml hoje
        </div>

        <div style={S.waterMiniRow}>
          <button style={S.waterMini} onClick={() => addWater(150)} type="button">
            +150
          </button>
          <button style={S.waterMini} onClick={() => addWater(750)} type="button">
            +750
          </button>
          <button style={S.waterMiniGhost} onClick={() => addWater(leftMl)} type="button" title="Completar meta">
            Completar meta
          </button>
        </div>
      </div>

      <div style={S.card}>
        <div style={S.tabs}>
          {[
            { k: "cafe", t: "Café" },
            { k: "almoco", t: "Almoço" },
            { k: "janta", t: "Janta" },
          ].map((x) => {
            const on = mealTab === x.k;
            return (
              <button
                key={x.k}
                onClick={() => setMealTab(x.k)}
                style={{ ...S.tabBtn, ...(on ? S.tabOn : S.tabOff) }}
                type="button"
              >
                {x.t}
              </button>
            );
          })}
        </div>

        <div style={S.searchRow}>
          <div style={S.searchWrap}>
            <span style={S.searchIcon}>
              <SearchIcon />
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar (ex: frango, rápido, tradicional...)"
              style={S.search}
            />
          </div>

          <button
            style={{ ...S.favToggle, ...(showFavOnly ? S.favOn : S.favOff) }}
            onClick={() => setShowFavOnly((v) => !v)}
            title="Mostrar só favoritos"
            type="button"
          >
            ★
          </button>
        </div>

        <div style={S.meta}>
          Mostrando <b>{filtered.length}</b> opções • exibindo <b>{shown.length}</b>
        </div>
      </div>

      <div style={S.list}>
        {shown.map((r) => {
          const isFav = !!fav[r.id];

          return (
            <button key={r.id} style={S.recipeCard} onClick={() => setOpenRecipe(r)} type="button">
              <div style={S.recipeTop}>
                <div style={{ minWidth: 0 }}>
                  <div style={S.recipeTitle}>{r.title}</div>
                  <div style={S.recipeSub}>{r.subtitle}</div>
                </div>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFav(r.id);
                  }}
                  style={{ ...S.star, ...(isFav ? S.starOn : S.starOff) }}
                  aria-label="Favoritar"
                  type="button"
                >
                  ★
                </button>
              </div>

              <div style={S.chipRow}>
                {(r.tags || []).slice(0, 3).map((t) => (
                  <div key={t} style={S.chip}>
                    {t}
                  </div>
                ))}
                <div style={S.chipSoft}>{mealTab.toUpperCase()}</div>
              </div>

              <div style={S.openHint}>Abrir receita →</div>
            </button>
          );
        })}
      </div>

      {shown.length < filtered.length ? (
        <button style={S.loadMore} onClick={() => setVisibleCount((v) => clamp(v + 16, 16, 9999))} type="button">
          Ver mais opções
        </button>
      ) : null}

      {openRecipe ? (
        <div style={S.modalOverlay} onClick={() => setOpenRecipe(null)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalHead}>
              <div style={{ minWidth: 0 }}>
                <div style={S.modalTitle}>{openRecipe.title}</div>
                <div style={S.modalSub}>{openRecipe.subtitle}</div>
              </div>
              <button style={S.modalClose} onClick={() => setOpenRecipe(null)} type="button">
                ✕
              </button>
            </div>

            <div style={S.modalScroll}>
              <div style={S.modalBox}>
                <div style={S.modalBoxTitle}>Trocas sugeridas</div>
                <div style={S.modalBoxText}>
                  Proteína: <b>{openRecipe.swaps?.protein}</b> • Carbo: <b>{openRecipe.swaps?.carb}</b> • Extra:{" "}
                  <b>{openRecipe.swaps?.extra}</b>
                </div>
              </div>

              <div style={S.modalBox2}>
                <div style={S.modalBoxTitle}>Como fazer</div>
                <div style={S.steps}>
                  {(openRecipe.steps || []).map((s, i) => (
                    <div key={i} style={S.step}>
                      <div style={S.stepNum}>{i + 1}</div>
                      <div style={S.stepText}>{s}</div>
                    </div>
                  ))}
                </div>
              </div>

              {!!(openRecipe.tips || []).length ? (
                <div style={S.modalBox3}>
                  <div style={S.modalBoxTitle}>Dicas</div>
                  <div style={S.modalBoxText}>{(openRecipe.tips || []).join(" ")}</div>
                </div>
              ) : null}
            </div>

            <button style={S.modalPrimary} onClick={() => setOpenRecipe(null)} type="button">
              Entendi
            </button>
          </div>
        </div>
      ) : null}

      <div style={{ height: 140 }} />
    </div>
  );
}

/* ---------- micro components ---------- */
function PreviewPill({ label, value }) {
  return (
    <div style={S.previewPill}>
      <div style={S.previewPillTop}>{label}</div>
      <div style={S.previewPillVal}>{value}</div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke="#64748b" strokeWidth="2.2" />
      <path d="M21 21l-4.35-4.35" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

/* ---------------- styles ---------------- */
const S = {
  page: {
    padding: 18,
    paddingBottom: 140,
    background:
      "radial-gradient(900px 480px at 18% -10%, rgba(255,106,0,.12), rgba(248,250,252,0) 60%), linear-gradient(180deg, #f8fafc, #f7f9fc)",
    position: "relative",
    overflow: "hidden",
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
  headRight: { display: "flex", gap: 10, alignItems: "center", flexShrink: 0 },

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
  },

  orangeDot: { color: ORANGE, marginLeft: 1, fontWeight: 950 },

  // HERO suplementação (sem barra/track)
  suppHero: {
    position: "relative",
    zIndex: 1,
    marginTop: 14,
    width: "100%",
    border: "1px solid rgba(255,255,255,.10)",
    borderRadius: 26,
    padding: 16,
    textAlign: "left",
    background: "linear-gradient(180deg, #0B0C0F 0%, #14161B 55%, #0E0F13 100%)",
    boxShadow: "0 20px 70px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.06)",
    overflow: "hidden",
    WebkitTapHighlightColor: "transparent",
  },
  suppHeroGlow: {
    position: "absolute",
    inset: -2,
    pointerEvents: "none",
    background:
      "radial-gradient(520px 220px at 18% 0%, rgba(255,106,0,.18), rgba(255,255,255,0) 60%), radial-gradient(520px 220px at 92% 12%, rgba(255,255,255,.10), rgba(255,255,255,0) 55%)",
    opacity: 0.9,
  },
  suppHeroTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  suppHeroLabel: {
    display: "inline-flex",
    padding: "7px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,.06)",
    border: "1px solid rgba(255,255,255,.10)",
    color: "rgba(255,255,255,.92)",
    fontWeight: 950,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  suppHeroChev: { fontSize: 26, fontWeight: 900, opacity: 0.55, color: "rgba(255,255,255,.92)" },
  suppHeroTitle: { marginTop: 12, fontSize: 16, fontWeight: 950, color: "#fff", letterSpacing: -0.2 },
  suppHeroSub: { marginTop: 6, fontSize: 12, fontWeight: 850, color: "rgba(255,255,255,.68)", lineHeight: 1.35 },

  calendarBtn: {
    padding: "10px 12px",
    borderRadius: 999,
    border: "1px solid rgba(15,23,42,.10)",
    background: "rgba(255,255,255,.92)",
    color: TEXT,
    fontWeight: 950,
    fontSize: 12,
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    boxShadow: "0 10px 24px rgba(15,23,42,.06)",
    WebkitTapHighlightColor: "transparent",
  },
  calendarChev: { fontSize: 18, fontWeight: 950, opacity: 0.55, marginTop: -1 },

  card: {
    position: "relative",
    zIndex: 1,
    marginTop: 14,
    borderRadius: 24,
    padding: 16,
    background: "rgba(255,255,255,.92)",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
  },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: 950, color: TEXT, letterSpacing: -0.3 },
  cardSub: { marginTop: 6, fontSize: 12, fontWeight: 800, color: MUTED, lineHeight: 1.35 },

  pill: {
    padding: "8px 10px",
    borderRadius: 999,
    background: "rgba(255,106,0,.10)",
    border: "1px solid rgba(255,106,0,.22)",
    fontWeight: 950,
    fontSize: 12,
    color: TEXT,
    whiteSpace: "nowrap",
  },

  progressWrap: {
    marginTop: 12,
    height: 12,
    borderRadius: 999,
    background: "rgba(15,23,42,.06)",
    overflow: "hidden",
    border: "1px solid rgba(15,23,42,.06)",
  },
  progressBar: {
    height: "100%",
    borderRadius: 999,
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    transition: "width .25s ease",
  },

  waterRow: { marginTop: 12, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 },
  waterBtnSoft: {
    padding: 12,
    borderRadius: 16,
    border: "1px solid rgba(255,106,0,.22)",
    background: "rgba(255,106,0,.12)",
    color: TEXT,
    fontWeight: 950,
  },
  waterGhost: {
    padding: 12,
    borderRadius: 16,
    border: "1px solid rgba(15,23,42,.10)",
    background: "#fff",
    color: TEXT,
    fontWeight: 950,
  },
  waterNum: { marginTop: 10, fontSize: 13, fontWeight: 800, color: MUTED },

  waterMiniRow: { marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" },
  waterMini: {
    padding: "10px 12px",
    borderRadius: 999,
    border: "1px solid rgba(15,23,42,.10)",
    background: "rgba(255,255,255,.92)",
    color: TEXT,
    fontWeight: 950,
  },
  waterMiniGhost: {
    marginLeft: "auto",
    padding: "10px 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,106,0,.22)",
    background: "rgba(255,106,0,.12)",
    color: TEXT,
    fontWeight: 950,
  },

  suggestCard: {
    position: "relative",
    zIndex: 1,
    marginTop: 14,
    width: "100%",
    borderRadius: 26,
    padding: 16,
    textAlign: "left",
    border: "1px solid rgba(255,106,0,.22)",
    background: "linear-gradient(135deg, rgba(255,106,0,.14), rgba(255,255,255,.92))",
    boxShadow: "0 18px 60px rgba(15,23,42,.10)",
  },
  suggestTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  suggestTag: {
    display: "inline-flex",
    padding: "7px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,.75)",
    border: "1px solid rgba(255,106,0,.22)",
    color: ORANGE,
    fontWeight: 950,
    fontSize: 11,
    letterSpacing: 0.6,
  },
  suggestChev: { fontSize: 26, fontWeight: 900, opacity: 0.45, color: "#111" },
  suggestTitle: { marginTop: 12, fontSize: 16, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  suggestSub: { marginTop: 6, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35 },
  suggestChips: { marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" },

  tabs: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 },
  tabBtn: {
    padding: 12,
    borderRadius: 999,
    border: "1px solid rgba(15,23,42,.10)",
    fontWeight: 950,
    transition: "transform .12s ease",
  },
  tabOn: { background: "rgba(255,106,0,.12)", borderColor: "rgba(255,106,0,.28)", color: TEXT },
  tabOff: { background: "#fff", color: MUTED },

  searchRow: { marginTop: 10, display: "grid", gridTemplateColumns: "1fr 46px", gap: 10 },
  searchWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0 12px",
    borderRadius: 16,
    border: "1px solid rgba(15,23,42,.10)",
    background: "#fff",
  },
  searchIcon: { display: "grid", placeItems: "center", opacity: 0.9 },
  search: {
    width: "100%",
    padding: "12px 0",
    border: "none",
    outline: "none",
    fontSize: 13,
    fontWeight: 850,
    background: "transparent",
    color: TEXT,
  },

  favToggle: {
    width: 46,
    height: 46,
    borderRadius: 16,
    border: "1px solid rgba(15,23,42,.10)",
    fontWeight: 950,
    fontSize: 16,
  },
  favOn: { background: ORANGE, color: "#111", border: "none" },
  favOff: { background: "#fff", color: MUTED },

  meta: { marginTop: 10, fontSize: 12, fontWeight: 800, color: MUTED },

  list: { position: "relative", zIndex: 1, marginTop: 14, display: "grid", gap: 12 },

  recipeCard: {
    textAlign: "left",
    width: "100%",
    borderRadius: 22,
    padding: 16,
    background: "rgba(255,255,255,.92)",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
  },
  recipeTop: { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" },
  recipeTitle: { fontSize: 15, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  recipeSub: { marginTop: 6, fontSize: 12, fontWeight: 800, color: MUTED, lineHeight: 1.35 },

  star: {
    width: 42,
    height: 42,
    borderRadius: 16,
    fontWeight: 950,
    border: "1px solid rgba(15,23,42,.10)",
    background: "#fff",
  },
  starOn: { background: ORANGE, border: "none", color: "#111" },
  starOff: { background: "#fff", color: MUTED },

  chipRow: { marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 },
  chip: {
    padding: "8px 10px",
    borderRadius: 999,
    background: "rgba(255,106,0,.10)",
    border: "1px solid rgba(255,106,0,.18)",
    fontWeight: 900,
    fontSize: 11,
    color: TEXT,
  },
  chipSoft: {
    padding: "8px 10px",
    borderRadius: 999,
    background: "rgba(15,23,42,.05)",
    border: "1px solid rgba(15,23,42,.06)",
    fontWeight: 900,
    fontSize: 11,
    color: MUTED,
  },
  openHint: { marginTop: 10, fontSize: 12, fontWeight: 900, color: ORANGE },

  loadMore: {
    position: "relative",
    zIndex: 1,
    marginTop: 12,
    width: "100%",
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,.10)",
    background: "rgba(255,255,255,.92)",
    color: TEXT,
    fontWeight: 950,
    boxShadow: "0 12px 34px rgba(15,23,42,.06)",
  },

  lockCard: {
    position: "relative",
    zIndex: 1,
    marginTop: 14,
    borderRadius: 22,
    padding: 16,
    background: "linear-gradient(135deg, rgba(255,106,0,.16), rgba(255,106,0,.08))",
    border: "1px solid rgba(255,106,0,.22)",
    boxShadow: "0 18px 50px rgba(15,23,42,.10)",
    textAlign: "center",
  },
  lockTitle: { fontSize: 16, fontWeight: 950, color: TEXT },
  lockText: { marginTop: 8, fontSize: 13, color: MUTED, fontWeight: 850, lineHeight: 1.4 },
  ctaBtn: {
    marginTop: 12,
    width: "100%",
    padding: 14,
    borderRadius: 18,
    border: "none",
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    color: "#111",
    fontWeight: 950,
    boxShadow: "0 16px 40px rgba(255,106,0,.22)",
  },
  smallNote: { marginTop: 10, fontSize: 12, fontWeight: 800, color: MUTED },

  previewCard: {
    position: "relative",
    zIndex: 1,
    marginTop: 14,
    borderRadius: 22,
    padding: 16,
    background: "rgba(255,255,255,.82)",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
  },
  previewTitle: { fontSize: 14, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  previewRow: { marginTop: 10, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 },
  previewPill: {
    borderRadius: 18,
    padding: 12,
    background: "rgba(15,23,42,.03)",
    border: "1px solid rgba(15,23,42,.06)",
    textAlign: "center",
  },
  previewPillTop: { fontSize: 11, fontWeight: 900, color: MUTED },
  previewPillVal: { marginTop: 6, fontSize: 16, fontWeight: 950, color: TEXT },
  previewHint: { marginTop: 10, fontSize: 12, fontWeight: 800, color: MUTED, lineHeight: 1.35 },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,.45)",
    display: "grid",
    placeItems: "center",
    padding: 18,
    zIndex: 9999,
  },
  modal: {
    width: "100%",
    maxWidth: 560,
    borderRadius: 24,
    background: "rgba(255,255,255,.96)",
    border: "1px solid rgba(15,23,42,.10)",
    boxShadow: "0 30px 120px rgba(15,23,42,.35)",
    overflow: "hidden",
  },
  modalHead: {
    padding: 16,
    borderBottom: "1px solid rgba(15,23,42,.06)",
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
    background: "rgba(255,255,255,.88)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  },
  modalTitle: { fontSize: 16, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  modalSub: { marginTop: 6, fontSize: 12, fontWeight: 800, color: MUTED, lineHeight: 1.35 },

  modalClose: {
    width: 44,
    height: 44,
    borderRadius: 16,
    border: "1px solid rgba(15,23,42,.10)",
    background: "#fff",
    fontWeight: 950,
  },

  modalScroll: { padding: 16, maxHeight: "64vh", overflow: "auto" },

  modalBox: {
    borderRadius: 18,
    padding: 14,
    background: "rgba(255,106,0,.10)",
    border: "1px solid rgba(255,106,0,.20)",
  },
  modalBox2: {
    marginTop: 10,
    borderRadius: 18,
    padding: 14,
    background: "rgba(15,23,42,.03)",
    border: "1px solid rgba(15,23,42,.06)",
  },
  modalBox3: {
    marginTop: 10,
    borderRadius: 18,
    padding: 14,
    background: "rgba(15,23,42,.02)",
    border: "1px solid rgba(15,23,42,.06)",
  },
  modalBoxTitle: { fontSize: 12, fontWeight: 950, color: TEXT, opacity: 0.9 },
  modalBoxText: { marginTop: 6, fontSize: 13, fontWeight: 850, color: "#334155", lineHeight: 1.45 },

  steps: { marginTop: 8, display: "grid", gap: 10 },
  step: { display: "flex", gap: 10, alignItems: "flex-start" },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 10,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,106,0,.14)",
    border: "1px solid rgba(255,106,0,.22)",
    fontWeight: 950,
    color: TEXT,
    flexShrink: 0,
  },
  stepText: { fontSize: 13, fontWeight: 850, color: "#334155", lineHeight: 1.45 },

  modalPrimary: {
    margin: 16,
    marginTop: 0,
    width: "calc(100% - 32px)",
    padding: 14,
    borderRadius: 18,
    border: "none",
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    color: "#111",
    fontWeight: 950,
    boxShadow: "0 16px 40px rgba(255,106,0,.22)",
  },
};
