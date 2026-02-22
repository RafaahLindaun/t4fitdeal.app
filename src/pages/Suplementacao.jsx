// ✅ COLE EM: src/pages/Suplementacao.jsx
// Suplementação (pagantes) — estética “Apple / Jony Ive”
// ✅ inclui:
// - recomendações por objetivo / nível / peso
// - doses calculadas por kg (quando aplicável)
// - “Meu stack” salvo em localStorage: supp_stack_<email>
// - bottom sheet (detalhes) com:
//    • topo com nome do app (fitdeal.) no estilo do print
//    • botão FECHAR no topo (X)
//    • 1 único botão grande "Voltar" no rodapé (fecha o sheet e volta pra página)
//    • animações leves (fade + slide + micro-scale) + redução automática em "prefers-reduced-motion"
// - sem libs

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/IMG_5692.png"; // troque .png por .jpg se for o caso

const APP_NAME = "fitdeal";
const ORANGE = "#FF6A00";
const BG = "#f8fafc";
const TEXT = "#0f172a";
const MUTED = "#64748b";

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function safeJsonParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function getGoal(user) {
  const raw = String(user?.objetivo || "hipertrofia").toLowerCase();
  if (raw.includes("power")) return "powerlifting";
  if (raw.includes("body")) return "bodybuilding";
  if (raw.includes("cond")) return "condicionamento";
  if (raw.includes("saud") || raw.includes("bem")) return "saude";
  return "hipertrofia";
}

function getLevel(user) {
  const raw = String(user?.nivel || "iniciante").toLowerCase();
  if (raw.includes("avan")) return "avancado";
  if (raw.includes("inter")) return "intermediario";
  return "iniciante";
}

function fmtG(n) {
  const v = Number(n || 0);
  if (!Number.isFinite(v)) return "0 g";
  if (v < 1) return `${Math.round(v * 1000)} mg`;
  if (v % 1 === 0) return `${v.toFixed(0)} g`;
  return `${v.toFixed(1)} g`;
}
function fmtMg(n) {
  const v = Number(n || 0);
  if (!Number.isFinite(v)) return "0 mg";
  return `${Math.round(v)} mg`;
}

function groupTitle(key) {
  if (key === "base") return "Base";
  if (key === "performance") return "Performance";
  if (key === "recovery") return "Recuperação";
  if (key === "health") return "Saúde";
  return "Suplementos";
}

/**
 * Doses por kg (aprox. e usadas na prática esportiva)
 * ⚠️ A página é informativa — ajuste final deve ser individual.
 */
function buildDoseCards({ id, weightKg, goal, level }) {
  const w = clamp(Number(weightKg || 70), 35, 200);

  // Heurística leve de intensidade pelo objetivo/nível
  let intensity = 1.0;
  if (goal === "condicionamento") intensity *= 1.08;
  if (goal === "bodybuilding") intensity *= 1.03;
  if (goal === "powerlifting") intensity *= 0.98;
  if (goal === "saude") intensity *= 0.92;

  if (level === "iniciante") intensity *= 0.92;
  if (level === "avancado") intensity *= 1.06;

  const protein = () => {
    let low = 1.6;
    let high = 2.2;
    if (goal === "saude") {
      low = 1.2;
      high = 1.6;
    }
    if (goal === "condicionamento") {
      low = 1.4;
      high = 2.0;
    }
    if (level === "iniciante") high -= 0.1;

    const dayMin = w * low;
    const dayMax = w * high;

    const perMealLow = w * 0.25; // 0.25 g/kg
    const perMealHigh = w * 0.4; // 0.4 g/kg

    return {
      headline: `${Math.round(dayMin)}–${Math.round(dayMax)} g/dia`,
      sub: `Por refeição: ${Math.round(perMealLow)}–${Math.round(perMealHigh)} g`,
      details: [
        { k: "Objetivo", v: "Bater a meta diária de proteína (comida primeiro)." },
        { k: "Dose prática", v: `${Math.round(dayMin)}–${Math.round(dayMax)} g/dia (ajuste por dieta).` },
        { k: "Por refeição", v: `${Math.round(perMealLow)}–${Math.round(perMealHigh)} g (2–4 refeições).` },
        { k: "Quando usar", v: "Quando a alimentação não fecha a meta com facilidade." },
        { k: "Observações", v: "Whey, caseína ou blend — escolha pelo conforto e rotina." },
      ],
      timing: [
        { t: "Manhã", v: "Opção fácil se você treina cedo." },
        { t: "Pós-treino", v: "Útil se a refeição completa demora." },
        { t: "Noite", v: "Caseína pode ajudar quem fica muitas horas sem comer." },
      ],
      cautions: [
        "Se você tem doença renal diagnosticada, converse com médico/nutri antes.",
        "Priorize alimentos; suplemento é praticidade, não obrigação.",
      ],
    };
  };

  const creatine = () => {
    const maintKg = w * 0.1;
    const loadingKg = w * 0.3;
    return {
      headline: `${fmtG(clamp(maintKg, 3, 10))}/dia`,
      sub: `Opcional: fase de saturação ${fmtG(loadingKg)}/dia (5–7 dias)`,
      details: [
        { k: "Objetivo", v: "Força, potência e volume de treino (ATP/fosfocreatina)." },
        { k: "Manutenção", v: `3–5 g/dia (ou ~0,1 g/kg/dia ≈ ${fmtG(maintKg)}).` },
        { k: "Saturação (opcional)", v: `0,3 g/kg/dia ≈ ${fmtG(loadingKg)} por 5–7 dias; depois manutenção.` },
        { k: "Tipo", v: "Creatina monohidratada (padrão ouro)." },
        { k: "O que esperar", v: "Melhora gradual em semanas; consistência > timing." },
      ],
      timing: [
        { t: "Qualquer horário", v: "O melhor horário é o que você não esquece." },
        { t: "Com refeição", v: "Mais confortável para o estômago de alguns." },
      ],
      cautions: [
        "Hidrate bem. Pode aumentar peso por água intramuscular (normal).",
        "Se você tem doença renal diagnosticada, converse com médico antes.",
      ],
    };
  };

  const caffeine = () => {
    const low = w * 3;
    const mid = w * 4.5;
    const high = w * 6;

    const scale = clamp(intensity, 0.85, 1.15);
    const sug = clamp(mid * scale, low, high);

    return {
      headline: `${fmtMg(sug)} (≈ ${Math.round(sug / w)} mg/kg)`,
      sub: `Faixa: ${fmtMg(low)}–${fmtMg(high)} (3–6 mg/kg)`,
      details: [
        { k: "Objetivo", v: "Atenção, percepção de esforço, desempenho (endurance/HIIT)." },
        { k: "Dose sugerida", v: `~${fmtMg(sug)} (ajuste individual). Faixa comum: 3–6 mg/kg.` },
        { k: "Timing", v: "30–60 min antes do treino." },
        { k: "Dica", v: "Teste em treino comum antes de usar em treinos-chave." },
        { k: "Evitar", v: "Se afeta seu sono, reduza dose ou use mais cedo." },
      ],
      timing: [
        { t: "Pré-treino", v: "30–60 min antes." },
        { t: "Evite à noite", v: "Sono ruim derruba performance e recuperação." },
      ],
      cautions: [
        "Pode causar ansiedade, taquicardia, tremor, refluxo ou insônia.",
        "Se você usa medicação para pressão/coração/ansiedade, confirme com profissional.",
      ],
    };
  };

  const betaAlanine = () => {
    const low = 3.2;
    const high = 6.4;

    let sug = 3.2;
    if (goal === "condicionamento") sug = 4.8;
    if (goal === "bodybuilding") sug = 4.8;
    if (level === "avancado") sug = 6.4;

    return {
      headline: `${fmtG(sug)}/dia`,
      sub: `Faixa: ${fmtG(low)}–${fmtG(high)}/dia (dividido)`,
      details: [
        { k: "Objetivo", v: "Buffer muscular (carnosina), ajuda em esforços intensos de 1–4 min." },
        { k: "Dose", v: `3,2–6,4 g/dia por 4–8+ semanas (efeito acumulativo).` },
        { k: "Como tomar", v: "Divida em 2–4 doses (ex.: 1,6 g 2–4x/dia)." },
        { k: "Sensação", v: "Formigamento (parestesia) é comum e inofensivo; dividir dose ajuda." },
      ],
      timing: [
        { t: "Durante o dia", v: "Não depende do horário do treino." },
        { t: "Com comida", v: "Pode ser mais confortável." },
      ],
      cautions: ["Se o formigamento incomodar, reduza a dose por tomada."],
    };
  };

  const bicarbonate = () => {
    const low = w * 0.2;
    const high = w * 0.3;
    const sug = w * 0.2;

    return {
      headline: `${fmtG(sug)} (0,2 g/kg)`,
      sub: `Faixa: ${fmtG(low)}–${fmtG(high)} (0,2–0,3 g/kg)`,
      details: [
        { k: "Objetivo", v: "Buffer extracelular; útil em esforços intensos repetidos." },
        { k: "Dose", v: "0,2–0,3 g/kg, geralmente 60–180 min antes." },
        { k: "Estratégia", v: "Divida em 2–3 tomadas para reduzir desconforto gastrointestinal." },
        { k: "Quando faz sentido", v: "Treinos intervalados fortes / séries muito densas." },
      ],
      timing: [{ t: "Pré-treino", v: "60–180 min antes (teste o timing ideal)." }],
      cautions: [
        "Pode dar náusea/diarreia — teste com dose menor primeiro.",
        "Atenção a sódio se você tem restrição médica.",
      ],
    };
  };

  const electrolytes = () => {
    const sweat = goal === "condicionamento" ? "alto" : level === "avancado" ? "moderado/alto" : "moderado";
    return {
      headline: "Durante treinos longos",
      sub: "Sódio + água (e carbo quando necessário)",
      details: [
        { k: "Objetivo", v: "Manter hidratação e desempenho quando há muito suor." },
        { k: "Quando usar", v: "Treinos longos, calor, suor intenso, câimbras recorrentes." },
        { k: "Composição", v: "Sódio (principal), às vezes potássio/magnésio em doses menores." },
        { k: "Dica prática", v: `Se você sua ${sweat}, considere eletrólitos em treinos >60–90 min.` },
      ],
      timing: [
        { t: "Durante", v: "Em goles regulares, especialmente no calor." },
        { t: "Após", v: "Repor líquidos e sódio se o treino foi muito suado." },
      ],
      cautions: ["Se você tem hipertensão/insuficiência cardíaca, confirme com profissional."],
    };
  };

  const omega3 = () => {
    return {
      headline: "1–2 g/dia (EPA+DHA)",
      sub: "Suporte geral (inflamação, saúde cardiovascular)",
      details: [
        { k: "Objetivo", v: "Saúde geral e possível suporte à recuperação (efeitos variam)." },
        { k: "Dose prática", v: "Mire em 1–2 g/dia de EPA+DHA (olhe o rótulo)." },
        { k: "Como tomar", v: "Com refeição (melhor tolerância)." },
      ],
      timing: [{ t: "Com almoço/janta", v: "Rotina simples." }],
      cautions: [
        "Se você usa anticoagulante ou tem cirurgia marcada, confirme antes.",
        "Prefira marcas com controle de qualidade (odor/oxidação).",
      ],
    };
  };

  const vitaminD = () => {
    return {
      headline: "Somente se necessário",
      sub: "Baseado em exame / orientação",
      details: [
        { k: "Objetivo", v: "Saúde óssea, imunidade; faz sentido se houver deficiência." },
        { k: "Regra de ouro", v: "Ajustar dose com base em exame (25(OH)D) e orientação." },
        { k: "Como tomar", v: "Com refeição (lipossolúvel)." },
      ],
      timing: [{ t: "Diário", v: "No mesmo horário facilita aderência." }],
      cautions: ["Excesso pode ser prejudicial — evite megadoses sem acompanhamento."],
    };
  };

  const magnesium = () => {
    return {
      headline: "Se dieta/sono pedem",
      sub: "Conforto muscular e sono (efeitos variam)",
      details: [
        { k: "Objetivo", v: "Se há baixa ingestão na dieta, pode ajudar (principalmente em deficientes)." },
        { k: "Forma", v: "Glicinato/citrato tendem a ser mais toleráveis que óxido." },
        { k: "Dica", v: "Foque em alimentação; use suplemento se houver necessidade real." },
      ],
      timing: [{ t: "Noite", v: "Alguns preferem pela rotina/sono." }],
      cautions: ["Pode soltar o intestino dependendo da forma e dose."],
    };
  };

  if (id === "protein") return protein();
  if (id === "creatine") return creatine();
  if (id === "caffeine") return caffeine();
  if (id === "beta_alanine") return betaAlanine();
  if (id === "bicarb") return bicarbonate();
  if (id === "electrolytes") return electrolytes();
  if (id === "omega3") return omega3();
  if (id === "vitamin_d") return vitaminD();
  if (id === "magnesium") return magnesium();
  return { headline: "", sub: "", details: [], timing: [], cautions: [] };
}

const CATALOG = [
  { id: "protein", group: "base", name: "Proteína (Whey/Caseína)", tag: "Evidência forte", accent: "soft", what: "Praticidade para bater proteína diária." },
  { id: "creatine", group: "base", name: "Creatina Monohidratada", tag: "Evidência forte", accent: "orange", what: "Força, potência e volume de treino." },

  { id: "caffeine", group: "performance", name: "Cafeína", tag: "Evidência forte", accent: "soft", what: "Energia, foco e desempenho (dose por kg)." },
  { id: "beta_alanine", group: "performance", name: "Beta-alanina", tag: "Boa evidência", accent: "soft", what: "Ajuda em esforços intensos repetidos (acúmulo)." },
  { id: "bicarb", group: "performance", name: "Bicarbonato de sódio", tag: "Boa evidência", accent: "soft", what: "Buffer; útil em treinos muito densos (GI limita)." },

  { id: "electrolytes", group: "recovery", name: "Eletrólitos", tag: "Contexto-dependente", accent: "soft", what: "Treinos longos/calor/suor: hidratação inteligente." },
  { id: "omega3", group: "health", name: "Ômega-3 (EPA/DHA)", tag: "Suporte geral", accent: "soft", what: "Saúde cardiovascular; possível suporte à recuperação." },
  { id: "vitamin_d", group: "health", name: "Vitamina D", tag: "Somente se necessário", accent: "soft", what: "Melhor com exame e orientação." },
  { id: "magnesium", group: "health", name: "Magnésio", tag: "Somente se necessário", accent: "soft", what: "Pode ajudar se ingestão baixa; forma importa." },
];

function uniq(arr) {
  return Array.from(new Set(arr));
}

function Icon({ id }) {
  const stroke = "rgba(15,23,42,.78)";
  const stroke2 = "rgba(15,23,42,.60)";
  const w = 22;

  if (id === "creatine") {
    return (
      <svg width={w} height={w} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 7h10v14H7z" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9 3h6v4H9z" stroke={stroke2} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9 11h6" stroke={stroke2} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (id === "protein") {
    return (
      <svg width={w} height={w} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M8 3h8l1.4 4H6.6L8 3Z" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M7 7h10l-1 14H8L7 7Z" stroke={stroke2} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M10 11h4" stroke={stroke2} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (id === "caffeine") {
    return (
      <svg width={w} height={w} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 8h10v9a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3V8Z" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M17 10h1a2 2 0 0 1 0 4h-1" stroke={stroke2} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M9 4c0 1-1 1-1 2s1 1 1 2" stroke={stroke2} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M12 4c0 1-1 1-1 2s1 1 1 2" stroke={stroke2} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M15 4c0 1-1 1-1 2s1 1 1 2" stroke={stroke2} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (id === "beta_alanine") {
    return (
      <svg width={w} height={w} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 17c2.2-6.4 7.8-6.4 10 0" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M8.5 13c1.6-3.8 5.4-3.8 7 0" stroke={stroke2} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M6 20h12" stroke={stroke2} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (id === "bicarb") {
    return (
      <svg width={w} height={w} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M8 3h8l1.5 5H6.5L8 3Z" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M7 8h10v13H7V8Z" stroke={stroke2} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M10 12h4" stroke={stroke2} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (id === "electrolytes") {
    return (
      <svg width={w} height={w} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3c3.8 4.6 6 7.3 6 10a6 6 0 1 1-12 0c0-2.7 2.2-5.4 6-10Z" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M10 14h4" stroke={stroke2} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (id === "omega3") {
    return (
      <svg width={w} height={w} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 14c5-7 11-7 16 0" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M6 16c3.6-4.8 8.4-4.8 12 0" stroke={stroke2} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M12 18v3" stroke={stroke2} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (id === "vitamin_d") {
    return (
      <svg width={w} height={w} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke={stroke2} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M12 7a5 5 0 1 0 0 10a5 5 0 0 0 0-10Z" stroke={stroke} strokeWidth="1.8" />
      </svg>
    );
  }

  if (id === "magnesium") {
    return (
      <svg width={w} height={w} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 6h10v12H7V6Z" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9 10h6M9 14h6" stroke={stroke2} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg width={w} height={w} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3l8 7-8 11L4 10l8-7Z" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function BrandMark() {
  return (
    <div style={S.brandMark} aria-hidden="true">
      <img
        src={logo}
        alt=""
        style={{
          width: 18,
          height: 18,
          objectFit: "contain",
          display: "block",
        }}
      />
    </div>
  );
}

export default function Suplementacao() {
  const nav = useNavigate();
  const { user } = useAuth();
  const email = (user?.email || "anon").toLowerCase();

  // Paywall (opcional)
  const paid = localStorage.getItem(`paid_${email}`) === "1";
const hasNutriPlus = paid && localStorage.getItem(`nutri_plus_${email}`) === "1";

  const goal = useMemo(() => getGoal(user), [user]);
  const level = useMemo(() => getLevel(user), [user]);
  const weightKg = useMemo(() => clamp(Number(user?.peso || 70), 35, 200), [user]);

  const storageKey = `supp_stack_${email}`;
  const [stack, setStack] = useState(() => {
    const init = safeJsonParse(localStorage.getItem(storageKey), []);
    return Array.isArray(init) ? init : [];
  });

  // UI state
  const [group, setGroup] = useState("base");

  // sheet
  const [openId, setOpenId] = useState(null);
  const [sheetOn, setSheetOn] = useState(false);

  // ref para travar scroll quando sheet está aberto
  const prevOverflowRef = useRef("");

  function persist(next) {
    const clean = uniq(next).slice(0, 10);
    setStack(clean);
    localStorage.setItem(storageKey, JSON.stringify(clean));
  }

  function toggleInStack(id) {
    const on = stack.includes(id);
    if (on) return persist(stack.filter((x) => x !== id));
    return persist([id, ...stack]);
  }

  function openSheet(id) {
    setOpenId(id);
    setSheetOn(true);
  }

  function closeSheet() {
    setSheetOn(false);
    // transição suave; depois limpa openId
    setTimeout(() => {
      setOpenId(null);
    }, 190);
  }

  // data
  const grouped = useMemo(() => {
    const map = { base: [], performance: [], recovery: [], health: [] };
    CATALOG.forEach((x) => {
      if (!map[x.group]) map[x.group] = [];
      map[x.group].push(x);
    });
    return map;
  }, []);

  const focus = useMemo(() => {
    if (!openId) return null;
    return CATALOG.find((x) => x.id === openId) || null;
  }, [openId]);

  const focusDose = useMemo(() => {
    if (!focus) return null;
    return buildDoseCards({ id: focus.id, weightKg, goal, level });
  }, [focus, weightKg, goal, level]);

  // recomendação leve
  const recommended = useMemo(() => {
    const base = ["creatine"];
    if (goal === "bodybuilding" || goal === "hipertrofia") base.push("protein");
    if (goal === "condicionamento") base.push("electrolytes");

    const perf = [];
    if (goal === "condicionamento") perf.push("caffeine");
    if (goal !== "saude" && level !== "iniciante") perf.push("beta_alanine");
    if (goal === "condicionamento" && level === "avancado") perf.push("bicarb");

    const health = [];
    health.push("omega3");
    if (goal === "saude") health.push("magnesium");

    return uniq([...base, ...perf, ...health]).slice(0, 6);
  }, [goal, level]);

  // animações leves + taps + reduced motion
  useEffect(() => {
    if (typeof document === "undefined") return;
    const id = "fitdeal-supp-ui";
    if (document.getElementById(id)) return;

    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = `
      /* sheet open/close */
      @keyframes sheetIn { 
        from { transform: translateY(14px) scale(.995); opacity: 0; } 
        to { transform: translateY(0) scale(1); opacity: 1; } 
      }
      @keyframes sheetOut { 
        from { transform: translateY(0) scale(1); opacity: 1; } 
        to { transform: translateY(12px) scale(.996); opacity: 0; } 
      }

      /* overlay fade */
      @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes overlayOut { from { opacity: 1; } to { opacity: 0; } }

      .tap { transition: transform .12s ease; }
      .tap:active { transform: scale(.99); }

      .sheetIn { animation: sheetIn .18s ease both; }
      .sheetOut { animation: sheetOut .18s ease both; }

      .overlayIn { animation: overlayIn .18s ease both; }
      .overlayOut { animation: overlayOut .18s ease both; }

      /* Reduced motion: respeita iOS/OS settings */
      @media (prefers-reduced-motion: reduce) {
        .tap, .sheetIn, .sheetOut, .overlayIn, .overlayOut { 
          animation: none !important; 
          transition: none !important; 
        }
      }
    `;
    document.head.appendChild(style);
  }, []);

  // trava scroll quando sheet está aberto (UX premium)
  useEffect(() => {
    if (typeof document === "undefined") return;

    if (sheetOn) {
      prevOverflowRef.current = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflowRef.current || "";
      };
    }
  }, [sheetOn]);

  // fecha com ESC (web)
  useEffect(() => {
    if (!sheetOn) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeSheet();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheetOn]);

  if (!hasNutriPlus) {
    return (
      <div style={S.page}>
        <div style={S.head}>
          <button style={S.back} className="tap" onClick={() => nav("/nutricao")} aria-label="Voltar" type="button">
            ←
          </button>
          <div style={{ minWidth: 0 }}>
            <div style={S.hTitle}>Suplementação</div>
            <div style={S.hSub}>Disponível para assinantes.</div>
          </div>
          <button style={S.pillBtn} className="tap" onClick={() => nav("/planos")} type="button">
            Ver planos
          </button>
        </div>

        <div style={S.lockCard}>
          <div style={S.lockTitle}>Conteúdo bloqueado</div>
          <div style={S.lockText}>
            A suplementação personalizada usa seu objetivo, nível e peso para sugerir doses e rotinas seguras.
          </div>
          <button style={S.lockBtn} className="tap" onClick={() => nav("/planos")} type="button">
            Liberar Suplementação
          </button>
        </div>

        <div style={{ height: 120 }} />
      </div>
    );
  }

  return (
    <div style={S.page}>
      {/* HEADER */}
      <div style={S.head}>
        <button style={S.back} className="tap" onClick={() => nav("/nutricao")} aria-label="Voltar" type="button">
          ←
        </button>

        <div style={{ minWidth: 0 }}>
          <div style={S.hTitle}>Suplementação</div>
          <div style={S.hSub}>
            Objetivo: <b>{goal}</b> • Nível: <b>{level}</b> • Peso: <b>{weightKg} kg</b>
          </div>
        </div>

        <button style={S.pillBtn} className="tap" onClick={() => nav("/dashboard")} type="button">
          Dashboard
        </button>
      </div>

      {/* MY STACK */}
      <div style={S.sectionTitle}>Meu stack</div>
      {stack.length === 0 ? (
        <div style={S.emptyCard}>
          <div style={S.emptyBig}>Sem suplementos selecionados.</div>
          <div style={S.emptySmall}>Abra um item e toque em “Adicionar ao stack”.</div>
        </div>
      ) : (
        <div style={S.stackWrap}>
          {stack.map((id) => {
            const it = CATALOG.find((x) => x.id === id);
            if (!it) return null;
            return (
              <button key={id} style={S.stackPill} className="tap" onClick={() => openSheet(id)} type="button">
                <div style={S.stackIcon}>
                  <Icon id={id} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={S.stackName}>{it.name}</div>
                  <div style={S.stackSub}>Toque para ver doses</div>
                </div>
                <div style={S.chev}>›</div>
              </button>
            );
          })}
        </div>
      )}

      {/* SUGGESTION */}
      <div style={S.sectionTitle}>Sugestão (baseada no seu perfil)</div>
      <div style={S.suggestCard}>
        <div style={S.suggestTop}>
          <div>
            <div style={S.suggestTitle}>Rotina simples, sofisticada</div>
            <div style={S.suggestSub}>
              Escolhas comuns na suplementação esportiva — sem exageros, focando no que costuma ter melhor custo/benefício.
            </div>
          </div>

          <button style={S.softBtn} className="tap" onClick={() => persist(recommended)} type="button" aria-label="Aplicar sugestão">
            Aplicar
          </button>
        </div>

        <div style={S.suggestRow}>
          {recommended.map((id) => {
            const it = CATALOG.find((x) => x.id === id);
            if (!it) return null;
            const on = stack.includes(id);

            return (
              <button
                key={id}
                style={{ ...S.miniChip, ...(on ? S.miniChipOn : S.miniChipOff) }}
                className="tap"
                onClick={() => (on ? openSheet(id) : toggleInStack(id))}
                type="button"
              >
                <span style={S.miniDot} />
                {it.name.split(" ")[0]}
              </button>
            );
          })}
        </div>

        <div style={S.disclaimer}>
          Informação educativa. Se você tem condição médica, usa medicação ou é menor de idade, confirme com profissional.
        </div>
      </div>

      {/* GROUP TABS */}
      <div style={S.tabsWrap}>
        {["base", "performance", "recovery", "health"].map((k) => {
          const on = group === k;
          return (
            <button key={k} style={{ ...S.tab, ...(on ? S.tabOn : S.tabOff) }} className="tap" onClick={() => setGroup(k)} type="button">
              {groupTitle(k)}
            </button>
          );
        })}
      </div>

      {/* LIST */}
      <div style={S.grid}>
        {(grouped[group] || []).map((it) => {
          const on = stack.includes(it.id);
          const orange = it.accent === "orange";

          return (
            <div
              key={it.id}
              style={{
                ...S.card,
                ...(orange ? S.cardOrange : S.cardSoft),
                ...(on ? S.cardOn : null),
              }}
            >
              <div style={S.cardTop}>
                <div style={S.cardIcon}>
                  <Icon id={it.id} />
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={S.cardName}>{it.name}</div>
                  <div style={S.cardTag}>{it.tag}</div>
                </div>

                <button
                  style={{ ...S.smallBtn, ...(on ? S.smallBtnOn : S.smallBtnOff) }}
                  className="tap"
                  onClick={() => toggleInStack(it.id)}
                  type="button"
                >
                  {on ? "No stack" : "Adicionar"}
                </button>
              </div>

              <div style={S.cardWhat}>{it.what}</div>

              <div style={S.cardActions}>
                <button style={S.detailBtn} className="tap" onClick={() => openSheet(it.id)} type="button">
                  Ver doses e como usar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ height: 150 }} />

      {/* BOTTOM SHEET */}
      {openId && (
        <div
          style={{ ...S.sheetOverlay, ...(sheetOn ? S.overlayOn : S.overlayOff) }}
          className={sheetOn ? "overlayIn" : "overlayOut"}
          onClick={closeSheet}
          role="presentation"
        >
          <div
            style={{ ...S.sheet, ...(sheetOn ? S.sheetOn : S.sheetOff) }}
            className={sheetOn ? "sheetIn" : "sheetOut"}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div style={S.sheetGrab} />

            {/* TOPO COM NOME DO APP (igual referência) */}
            <div style={S.brandBar}>
              <div style={S.brandLeft}>
                <BrandMark />
                <div style={S.brandText}>
                  {APP_NAME}
                  <span style={S.brandDot}>.</span>
                </div>
              </div>
            </div>

            {/* HEADER DO SUPLEMENTO */}
            <div style={S.sheetHead}>
              <div style={S.sheetIcon}>
                <Icon id={openId} />
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={S.sheetTitle}>{focus?.name}</div>

                <div style={S.sheetSub}>
                  {focusDose?.headline ? (
                    <>
                      <b>{focusDose.headline}</b> <span style={{ opacity: 0.7 }}>•</span> {focusDose.sub}
                    </>
                  ) : (
                    focus?.tag
                  )}
                </div>
              </div>

              <button style={S.sheetX} className="tap" onClick={closeSheet} aria-label="Fechar" type="button">
                ✕
              </button>
            </div>

            {/* CTA principal (sem botão extra de voltar) */}
            <div style={S.sheetCtasSingle}>
              <button
                style={{
                  ...S.primaryBtn,
                  ...(stack.includes(openId) ? S.primaryBtnOn : S.primaryBtnOff),
                }}
                className="tap"
                onClick={() => toggleInStack(openId)}
                type="button"
              >
                {stack.includes(openId) ? "Remover do stack" : "Adicionar ao stack"}
              </button>
            </div>

            {/* BODY (rolagem interna para não “vazar” do enquadramento) */}
            <div style={S.sheetBodyScroll}>
              {/* DETAILS */}
              <div style={S.sheetSection}>
                <div style={S.sheetSectionTitle}>Como isso pode ajudar</div>
                <div style={S.kvGrid}>
                  {(focusDose?.details || []).map((x, idx) => (
                    <div key={idx} style={S.kv}>
                      <div style={S.k}>{x.k}</div>
                      <div style={S.v}>{x.v}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={S.sheetSection}>
                <div style={S.sheetSectionTitle}>Rotina sugerida</div>
                <div style={S.timeline}>
                  {(focusDose?.timing || []).map((x, idx) => (
                    <div key={idx} style={S.timeRow}>
                      <div style={S.timeDot} />
                      <div style={{ minWidth: 0 }}>
                        <div style={S.timeTitle}>{x.t}</div>
                        <div style={S.timeSub}>{x.v}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={S.sheetSection}>
                <div style={S.sheetSectionTitle}>Atenções</div>
                <div style={S.warnBox}>
                  {(focusDose?.cautions || []).map((t, i) => (
                    <div key={i} style={S.warnLine}>
                      <span style={S.warnDot} />
                      <span style={S.warnTxt}>{t}</span>
                    </div>
                  ))}
                </div>

                <div style={S.qa}>
                  <div style={S.qaTitle}>Qualidade e segurança</div>
                  <div style={S.qaText}>
                    Prefira marcas com controle de qualidade e transparência (lote/terceira parte quando possível).
                    Evite “blends” misteriosos e “doses proprietárias”.
                  </div>
                </div>
              </div>

              <div style={{ height: 10 }} />
            </div>

            {/* Rodapé: 1 único botão grande "Voltar" (fecha o sheet) */}
            <div style={S.sheetFooterSingle}>
              <button style={S.footerBack} className="tap" onClick={closeSheet} type="button">
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------- styles (apple, clean, único) ----------------- */
const S = {
  page: { padding: 18, paddingBottom: 130, background: BG },

  head: {
    borderRadius: 22,
    padding: 16,
    background: "rgba(255,255,255,.92)",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 18px 60px rgba(15,23,42,.08)",
    display: "flex",
    alignItems: "center",
    gap: 12,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 16,
    border: "none",
    background: "rgba(255,106,0,.14)",
    color: TEXT,
    fontWeight: 950,
    fontSize: 16,
  },
  hTitle: { fontSize: 18, fontWeight: 950, color: TEXT, letterSpacing: -0.4 },
  hSub: { marginTop: 4, fontSize: 12, color: MUTED, fontWeight: 850, lineHeight: 1.35 },
  pillBtn: {
    marginLeft: "auto",
    padding: "10px 12px",
    borderRadius: 999,
    border: "1px solid rgba(15,23,42,.10)",
    background: "#fff",
    fontWeight: 950,
    color: TEXT,
  },

  sectionTitle: { marginTop: 14, fontSize: 16, fontWeight: 950, color: TEXT, letterSpacing: -0.3 },

  emptyCard: {
    marginTop: 10,
    borderRadius: 22,
    padding: 16,
    background: "#fff",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
  },
  emptyBig: { fontSize: 14, fontWeight: 950, color: TEXT },
  emptySmall: { marginTop: 6, fontSize: 12, fontWeight: 800, color: MUTED, lineHeight: 1.35 },

  stackWrap: { marginTop: 10, display: "grid", gap: 10 },
  stackPill: {
    width: "100%",
    textAlign: "left",
    border: "none",
    borderRadius: 22,
    padding: 12,
    background: "linear-gradient(135deg, rgba(255,255,255,.95), rgba(255,255,255,.86))",
    borderTop: "1px solid rgba(255,255,255,.70)",
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  stackIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    background: "rgba(15,23,42,.04)",
    border: "1px solid rgba(15,23,42,.06)",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
  },
  stackName: { fontSize: 14, fontWeight: 950, color: TEXT, letterSpacing: -0.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  stackSub: { marginTop: 3, fontSize: 12, fontWeight: 800, color: MUTED },
  chev: {
    marginLeft: "auto",
    width: 36,
    height: 36,
    borderRadius: 16,
    background: "rgba(15,23,42,.06)",
    display: "grid",
    placeItems: "center",
    color: TEXT,
    fontWeight: 950,
    flexShrink: 0,
  },

  suggestCard: {
    marginTop: 10,
    borderRadius: 24,
    padding: 16,
    background: "linear-gradient(135deg, rgba(255,106,0,.14), rgba(255,255,255,.94))",
    border: "1px solid rgba(255,106,0,.18)",
    boxShadow: "0 18px 60px rgba(15,23,42,.08)",
  },
  suggestTop: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  suggestTitle: { fontSize: 16, fontWeight: 950, color: TEXT, letterSpacing: -0.3 },
  suggestSub: { marginTop: 6, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35 },
  softBtn: {
    padding: "10px 12px",
    borderRadius: 16,
    border: "1px solid rgba(15,23,42,.10)",
    background: "rgba(255,255,255,.85)",
    color: TEXT,
    fontWeight: 950,
    flexShrink: 0,
  },
  suggestRow: { marginTop: 12, display: "flex", flexWrap: "wrap", gap: 10 },
  miniChip: {
    border: "none",
    borderRadius: 999,
    padding: "10px 12px",
    fontWeight: 950,
    fontSize: 12,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    boxShadow: "0 12px 34px rgba(15,23,42,.08)",
  },
  miniChipOn: { background: "#0B0B0C", color: "#fff", border: "1px solid rgba(255,255,255,.10)" },
  miniChipOff: { background: "rgba(255,255,255,.88)", color: TEXT, border: "1px solid rgba(15,23,42,.08)" },
  miniDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: "rgba(255,106,0,.95)",
    boxShadow: "0 0 0 6px rgba(255,106,0,.14)",
  },
  disclaimer: { marginTop: 12, fontSize: 12, fontWeight: 800, color: MUTED, lineHeight: 1.35 },

  tabsWrap: { marginTop: 14, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 },
  tab: { border: "none", borderRadius: 16, padding: "10px 10px", fontWeight: 950, fontSize: 12, letterSpacing: 0.1 },
  tabOn: {
    background: "#0B0B0C",
    color: "#fff",
    boxShadow: "0 16px 50px rgba(0,0,0,.16)",
    border: "1px solid rgba(255,255,255,.10)",
  },
  tabOff: {
    background: "rgba(255,255,255,.86)",
    color: TEXT,
    border: "1px solid rgba(15,23,42,.08)",
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
  },

  grid: { marginTop: 12, display: "grid", gap: 12 },

  card: { borderRadius: 24, padding: 14, background: "#fff", border: "1px solid rgba(15,23,42,.06)", boxShadow: "0 14px 40px rgba(15,23,42,.06)" },
  cardSoft: { background: "#fff" },
  cardOrange: { background: "linear-gradient(135deg, rgba(255,106,0,.16), rgba(255,255,255,.94))", border: "1px solid rgba(255,106,0,.18)" },
  cardOn: { boxShadow: "0 18px 60px rgba(255,106,0,.14)", borderTop: "1px solid rgba(255,255,255,.70)" },

  cardTop: { display: "flex", alignItems: "center", gap: 12 },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 18,
    background: "rgba(15,23,42,.04)",
    border: "1px solid rgba(15,23,42,.06)",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
  },
  cardName: { fontSize: 15, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  cardTag: { marginTop: 4, fontSize: 12, fontWeight: 850, color: MUTED },

  smallBtn: {
    marginLeft: "auto",
    padding: "10px 12px",
    borderRadius: 16,
    fontWeight: 950,
    border: "1px solid rgba(15,23,42,.10)",
    background: "rgba(255,255,255,.86)",
    color: TEXT,
    flexShrink: 0,
  },
  smallBtnOn: { background: "rgba(255,106,0,.14)", borderColor: "rgba(255,106,0,.22)" },
  smallBtnOff: { background: "rgba(255,255,255,.86)" },

  cardWhat: { marginTop: 10, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35 },
  cardActions: { marginTop: 12, display: "flex" },
  detailBtn: { width: "100%", padding: 14, borderRadius: 18, border: "none", background: "#0B0B0C", color: "#fff", fontWeight: 950, boxShadow: "0 18px 55px rgba(0,0,0,.16)" },

  // LOCK
  lockCard: { marginTop: 14, borderRadius: 22, padding: 16, background: "linear-gradient(135deg, rgba(255,106,0,.16), rgba(255,106,0,.08))", border: "1px solid rgba(255,106,0,.22)", boxShadow: "0 18px 50px rgba(15,23,42,.10)" },
  lockTitle: { fontSize: 16, fontWeight: 950, color: TEXT },
  lockText: { marginTop: 6, fontSize: 13, color: MUTED, fontWeight: 850, lineHeight: 1.4 },
  lockBtn: { marginTop: 12, width: "100%", padding: 14, borderRadius: 18, border: "none", background: ORANGE, color: "#111", fontWeight: 950, boxShadow: "0 14px 36px rgba(255,106,0,.22)" },

  // SHEET OVERLAY (safe-area + enquadramento)
  sheetOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    display: "grid",
    alignItems: "end",
    padding: "12px",
    paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
    paddingTop: "calc(12px + env(safe-area-inset-top))",
  },
  overlayOn: { background: "rgba(2,6,23,.44)" },
  overlayOff: { background: "rgba(2,6,23,0)" },

  sheet: {
    width: "100%",
    maxWidth: 520,
    margin: "0 auto",
    borderRadius: 26,
    background: "rgba(255,255,255,.92)",
    border: "1px solid rgba(255,255,255,.35)",
    boxShadow: "0 28px 90px rgba(0,0,0,.28)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    maxHeight: "calc(100dvh - 24px - env(safe-area-inset-top) - env(safe-area-inset-bottom))",
  },
  sheetOn: { opacity: 1 },
  sheetOff: { opacity: 0.98 },

  sheetGrab: { width: 52, height: 6, borderRadius: 999, background: "rgba(15,23,42,.12)", margin: "10px auto 0" },

  // Brand top
  brandBar: {
    padding: "10px 14px 2px",
    display: "flex",
    justifyContent: "center",
  },
  brandLeft: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    background: "rgba(15,23,42,.04)",
    border: "1px solid rgba(15,23,42,.06)",
    borderRadius: 999,
    padding: "8px 12px",
  },
  brandText: { fontSize: 14, fontWeight: 950, color: TEXT, letterSpacing: -0.3 },
  brandDot: { color: ORANGE },

  brandMark: {
    width: 28,
    height: 28,
    borderRadius: 10,
    background: "linear-gradient(180deg, rgba(255,106,0,.28), rgba(255,106,0,.12))",
    border: "1px solid rgba(255,106,0,.22)",
    display: "grid",
    placeItems: "center",
    boxShadow: "0 10px 24px rgba(255,106,0,.14)",
  },
  brandMarkLetter: { fontSize: 14, fontWeight: 950, color: "rgba(15,23,42,.86)" },

  sheetHead: { padding: 14, display: "flex", alignItems: "center", gap: 12 },
  sheetIcon: { width: 44, height: 44, borderRadius: 18, background: "rgba(15,23,42,.04)", border: "1px solid rgba(15,23,42,.06)", display: "grid", placeItems: "center", flexShrink: 0 },
  sheetTitle: { fontSize: 16, fontWeight: 950, color: TEXT, letterSpacing: -0.3 },
  sheetSub: { marginTop: 4, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35 },
  sheetX: { marginLeft: "auto", width: 40, height: 40, borderRadius: 16, border: "none", background: "rgba(15,23,42,.06)", color: TEXT, fontWeight: 950, flexShrink: 0 },

  sheetCtasSingle: { padding: "0 14px 12px" },

  primaryBtn: { width: "100%", padding: 14, borderRadius: 18, border: "none", fontWeight: 950, letterSpacing: 0.1 },
  primaryBtnOn: { background: ORANGE, color: "#111", boxShadow: "0 16px 40px rgba(255,106,0,.22)" },
  primaryBtnOff: { background: "#0B0B0C", color: "#fff", boxShadow: "0 16px 40px rgba(0,0,0,.18)" },

  // Conteúdo rolável (enquadrado)
  sheetBodyScroll: {
    flex: 1,
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    paddingBottom: 2,
  },

  sheetSection: { padding: "14px 14px 0" },
  sheetSectionTitle: { fontSize: 13, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },

  kvGrid: { marginTop: 10, display: "grid", gap: 10 },
  kv: { borderRadius: 18, padding: 12, background: "rgba(255,255,255,.86)", border: "1px solid rgba(15,23,42,.06)", boxShadow: "0 12px 34px rgba(15,23,42,.06)" },
  k: { fontSize: 12, fontWeight: 950, color: MUTED, letterSpacing: 0.2, textTransform: "uppercase" },
  v: { marginTop: 6, fontSize: 13, fontWeight: 900, color: TEXT, lineHeight: 1.35 },

  timeline: { marginTop: 10, borderRadius: 22, padding: 12, background: "rgba(15,23,42,.03)", border: "1px solid rgba(15,23,42,.06)" },
  timeRow: { display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 4px" },
  timeDot: { width: 10, height: 10, borderRadius: 999, background: "rgba(255,106,0,.95)", boxShadow: "0 0 0 6px rgba(255,106,0,.14)", marginTop: 4, flexShrink: 0 },
  timeTitle: { fontSize: 13, fontWeight: 950, color: TEXT },
  timeSub: { marginTop: 4, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35 },

  warnBox: { marginTop: 10, borderRadius: 22, padding: 12, background: "linear-gradient(135deg, rgba(2,6,23,.06), rgba(255,255,255,.86))", border: "1px solid rgba(15,23,42,.08)", boxShadow: "0 14px 40px rgba(15,23,42,.06)" },
  warnLine: { display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 4px" },
  warnDot: { width: 7, height: 7, borderRadius: 999, background: "rgba(15,23,42,.55)", marginTop: 6, flexShrink: 0 },
  warnTxt: { fontSize: 12, fontWeight: 850, color: TEXT, lineHeight: 1.35, opacity: 0.92 },

  qa: { marginTop: 12, borderRadius: 22, padding: 12, background: "rgba(255,255,255,.86)", border: "1px solid rgba(15,23,42,.06)", boxShadow: "0 12px 34px rgba(15,23,42,.06)" },
  qaTitle: { fontSize: 13, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  qaText: { marginTop: 6, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35 },

  // footer do sheet (1 botão só)
  sheetFooterSingle: {
    padding: "12px 14px",
    borderTop: "1px solid rgba(15,23,42,.06)",
    background: "rgba(255,255,255,.86)",
  },
  footerBack: {
    width: "100%",
    padding: 14,
    borderRadius: 18,
    border: "none",
    background: "#0B0B0C",
    color: "#fff",
    fontWeight: 950,
    boxShadow: "0 16px 40px rgba(0,0,0,.18)",
  },
};
