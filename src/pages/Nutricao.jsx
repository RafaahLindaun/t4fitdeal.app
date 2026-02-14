import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ORANGE = "#FF6A00";
const BG = "#f8fafc";
const TEXT = "#0f172a";
const MUTED = "#64748b";

/* ---------------- helpers ---------------- */
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
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
      // --- NOVAS (CAFÉ) ---
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
    steps: [
      "Bata 2–4 ovos com sal.",
      "Adicione queijo picado.",
      "Cozinhe na frigideira até firmar.",
    ],
    base: { protein: ["ovos", "queijo"], carb: ["nenhum"], extra: ["tempero"] },
    tips: ["Se precisar de carbo: inclua 1 pão ou 1 fruta."],
  },
  {
    id: "cafe_pao_mortadela_tomate",
    title: "Pão + mortadela + tomate (caseiro)",
    tags: ["barato", "rápido", "tradicional"],
    steps: [
      "Toste o pão (opcional).",
      "Adicione mortadela e tomate.",
      "Finalize com mostarda (opcional).",
    ],
    base: { protein: ["mortadela"], carb: ["pão"], extra: ["tomate"] },
    tips: ["Melhor versão: use peito de peru ou frango quando possível."],
  },
  {
    id: "cafe_queijo_minas_fruta",
    title: "Queijo minas + fruta + café",
    tags: ["leve", "tradicional", "rápido"],
    steps: [
      "Corte queijo minas em cubos/fatias.",
      "Sirva com 1 fruta.",
      "Beba café sem açúcar ou com pouco açúcar.",
    ],
    base: { protein: ["queijo minas"], carb: ["fruta"], extra: ["café"] },
    tips: ["Se quiser mais carbo: inclua 1 pão."],
  },
  {
    id: "cafe_panq_aveia_ovo",
    title: "Panqueca de aveia (ovo + banana)",
    tags: ["pré-treino", "fácil", "energia"],
    steps: [
      "Bata 1 banana + 1 ovo + 2 colheres de aveia.",
      "Cozinhe em frigideira antiaderente.",
      "Finalize com canela.",
    ],
    base: { protein: ["ovos"], carb: ["aveia", "banana"], extra: ["canela"] },
    tips: ["Para ganhar: adicione mel ou pasta de amendoim."],
  },
  {
    id: "cafe_tapioca_ovo",
    title: "Tapioca + ovo mexido",
    tags: ["br", "proteico", "rápido"],
    steps: [
      "Faça a tapioca na frigideira.",
      "Prepare 2 ovos mexidos.",
      "Recheie e dobre.",
    ],
    base: { protein: ["ovos"], carb: ["tapioca"], extra: ["tempero"] },
    tips: ["Se quiser mais: adicione queijo e tomate."],
  },
  {
    id: "cafe_iogurte_whey",
    title: "Iogurte + whey + fruta",
    tags: ["proteico", "rápido", "pós-treino"],
    steps: [
      "Misture iogurte com 1 scoop de whey.",
      "Adicione fruta picada.",
      "Finalize com canela (opcional).",
    ],
    base: { protein: ["iogurte", "whey"], carb: ["fruta"], extra: ["canela"] },
    tips: ["Se quiser mais carbo: adicione granola."],
  },
  {
    id: "cafe_pao_pasta_amendoim",
    title: "Pão + pasta de amendoim + banana",
    tags: ["energia", "pré-treino", "rápido"],
    steps: [
      "Passe pasta de amendoim no pão.",
      "Adicione banana em rodelas.",
      "Finalize com canela (opcional).",
    ],
    base: { protein: ["pasta de amendoim"], carb: ["pão", "banana"], extra: ["canela"] },
    tips: ["Para secar: diminua a pasta e use pão integral."],
  },
  {
    id: "cafe_leite_cafe_pao",
    title: "Café com leite + pão + ovo",
    tags: ["tradicional", "br", "rápido"],
    steps: [
      "Faça café com leite.",
      "Toste 1 pão.",
      "Faça 1–2 ovos mexidos e sirva junto.",
    ],
    base: { protein: ["ovos", "leite"], carb: ["pão"], extra: ["café"] },
    tips: ["Se quiser mais saciedade: adicione uma fruta."],
  },
  {
    id: "cafe_biscoito_agua_iogurte",
    title: "Iogurte + biscoito água e sal",
    tags: ["simples", "barato", "rápido"],
    steps: [
      "Sirva iogurte natural em um pote.",
      "Coma junto com biscoito água e sal.",
      "Adicione 1 fruta se quiser.",
    ],
    base: { protein: ["iogurte"], carb: ["biscoito"], extra: ["fruta"] },
    tips: ["Para reduzir calorias: use iogurte light."],
  },
  {
    id: "cafe_ovos_arroz",
    title: "Ovos + arroz (resto do dia anterior)",
    tags: ["barato", "br", "proteico"],
    steps: [
      "Aqueça o arroz pronto.",
      "Faça 2–3 ovos mexidos.",
      "Misture e finalize com temperos.",
    ],
    base: { protein: ["ovos"], carb: ["arroz"], extra: ["tempero"] },
    tips: ["Fica top com tomate e cebola picados."],
  },
  {
    id: "cafe_smoothie_iogurte_fruta",
    title: "Smoothie (iogurte + fruta + aveia)",
    tags: ["rápido", "pré-treino", "digestão"],
    steps: [
      "Bata iogurte + fruta + aveia.",
      "Adicione gelo se quiser.",
      "Sirva na hora.",
    ],
    base: { protein: ["iogurte"], carb: ["fruta", "aveia"], extra: ["gelo"] },
    tips: ["Para ganhar: adicione pasta de amendoim."],
  },
    {
      id: "cafe_ovos_pao",
      title: "Ovos + pão + fruta",
      tags: ["rápido", "proteico"],
      steps: [
        "Faça 2–4 ovos mexidos/omelete (sal e pimenta).",
        "Toste 1–2 fatias de pão.",
        "Finalize com 1 fruta (banana/maçã).",
      ],
      base: { protein: ["ovos"], carb: ["pão"], extra: ["fruta"] },
      tips: ["Se quiser aumentar calorias: adicione queijo ou pasta de amendoim."],
    },
    {
      id: "cafe_iogurte_aveia",
      title: "Iogurte + aveia + banana",
      tags: ["fácil", "digestão"],
      steps: [
        "Em uma tigela: iogurte natural.",
        "Misture aveia e canela.",
        "Finalize com banana e (opcional) mel.",
      ],
      base: { protein: ["iogurte"], carb: ["aveia"], extra: ["banana"] },
      tips: ["Se quiser mais proteína: use iogurte grego ou adicione whey."],
    },
    {
      id: "cafe_tapioca",
      title: "Tapioca + queijo + fruta",
      tags: ["br", "energia"],
      steps: [
        "Aqueça a frigideira e espalhe a tapioca.",
        "Recheie com queijo e dobre.",
        "Finalize com 1 fruta.",
      ],
      base: { protein: ["queijo"], carb: ["tapioca"], extra: ["fruta"] },
      tips: ["Se quiser mais proteína: coloque frango desfiado junto."],
    },
    {
      id: "cafe_vitamina",
      title: "Vitamina rápida (banana + leite + aveia)",
      tags: ["rápido", "pré-treino"],
      steps: [
        "Bata leite + banana + aveia.",
        "Opcional: 1 colher de pasta de amendoim.",
        "Sirva gelado.",
      ],
      base: { protein: ["leite"], carb: ["banana", "aveia"], extra: ["pasta de amendoim"] },
      tips: ["Para reduzir açúcar: use leite sem açúcar e aveia."],
    },
  ],
  almoco: [
      // --- NOVAS (ALMOÇO) ---
  {
    id: "almoco_frango_batata_doce",
    title: "Frango + batata-doce + salada",
    tags: ["fit", "tradicional", "definição"],
    steps: [
      "Grelhe frango com sal e alho.",
      "Cozinhe batata-doce e corte em rodelas.",
      "Complete com salada e legumes.",
    ],
    base: { protein: ["frango"], carb: ["batata-doce"], extra: ["salada"] },
    tips: ["Para ganhar: adicione azeite e aumente a batata."],
  },
  {
    id: "almoco_ovo_feijao_arroz",
    title: "Arroz + feijão + ovos + salada",
    tags: ["barato", "br", "proteico"],
    steps: [
      "Monte arroz e feijão.",
      "Adicione 2–4 ovos (cozidos ou mexidos).",
      "Complete com salada.",
    ],
    base: { protein: ["ovos"], carb: ["arroz", "feijão"], extra: ["salada"] },
    tips: ["Versão seca: menos arroz, mais salada."],
  },
  {
    id: "almoco_tilapia_arroz_legumes",
    title: "Peixe (tilápia) + arroz + legumes",
    tags: ["leve", "saúde", "proteico"],
    steps: [
      "Tempere a tilápia com limão, sal e alho.",
      "Grelhe ou asse até dourar.",
      "Sirva com arroz e legumes.",
    ],
    base: { protein: ["peixe"], carb: ["arroz"], extra: ["legumes"] },
    tips: ["Se quiser mais calorias: adicione azeite ou feijão."],
  },
  {
    id: "almoco_carne_moida_arroz",
    title: "Carne moída + arroz + salada",
    tags: ["simples", "br", "ganho"],
    steps: [
      "Refogue carne moída com cebola e alho.",
      "Sirva com arroz.",
      "Complete com salada.",
    ],
    base: { protein: ["carne moída"], carb: ["arroz"], extra: ["salada"] },
    tips: ["Para secar: diminua arroz e use carne mais magra."],
  },
  {
    id: "almoco_frango_macarrao",
    title: "Macarrão + frango + molho simples",
    tags: ["energia", "rápido", "prático"],
    steps: [
      "Cozinhe o macarrão.",
      "Misture frango desfiado.",
      "Finalize com molho simples de tomate + alho.",
    ],
    base: { protein: ["frango"], carb: ["macarrão"], extra: ["tomate"] },
    tips: ["Para ganhar: finalize com queijo ralado."],
  },
  {
    id: "almoco_bife_arroz_feijao",
    title: "Bife + arroz + feijão + salada",
    tags: ["tradicional", "força", "br"],
    steps: [
      "Grelhe bife (patinho/coxão mole).",
      "Sirva com arroz e feijão.",
      "Complete com salada.",
    ],
    base: { protein: ["carne magra"], carb: ["arroz", "feijão"], extra: ["salada"] },
    tips: ["Para secar: aumente salada e reduza arroz."],
  },
  {
    id: "almoco_omelete_legumes_feijao",
    title: "Omelete com legumes + feijão",
    tags: ["proteico", "leve", "prático"],
    steps: [
      "Faça omelete com ovos + legumes picados.",
      "Sirva com feijão ao lado.",
    ],
    base: { protein: ["ovos"], carb: ["feijão"], extra: ["legumes"] },
    tips: ["Boa opção sem arroz quando quer comer mais leve."],
  },
  {
    id: "almoco_frango_farofa_sal",
    title: "Frango + arroz + farofa + salada",
    tags: ["br", "ganho", "tradicional"],
    steps: [
      "Grelhe frango temperado.",
      "Monte arroz e salada.",
      "Finalize com uma porção pequena de farofa.",
    ],
    base: { protein: ["frango"], carb: ["arroz"], extra: ["farofa"] },
    tips: ["Para secar: troque farofa por legumes."],
  },
  {
    id: "almoco_atuM_arroz_saladA",
    title: "Atum + arroz + salada (rápido)",
    tags: ["rápido", "proteico", "prático"],
    steps: [
      "Aqueça o arroz.",
      "Misture atum com limão e sal.",
      "Sirva com salada.",
    ],
    base: { protein: ["atum"], carb: ["arroz"], extra: ["salada"] },
    tips: ["Se quiser mais carbo: adicione feijão."],
  },
  {
    id: "almoco_frango_mandioca",
    title: "Frango + mandioca + legumes",
    tags: ["energia", "br", "força"],
    steps: [
      "Cozinhe mandioca até ficar macia.",
      "Grelhe frango.",
      "Sirva com legumes ou salada.",
    ],
    base: { protein: ["frango"], carb: ["mandioca"], extra: ["legumes"] },
    tips: ["Para ganhar: adicione azeite ou feijão."],
  },
  {
    id: "almoco_salmao_batata",
    title: "Salmão (ou peixe) + batata + salada",
    tags: ["saúde", "leve", "proteico"],
    steps: [
      "Tempere o peixe com sal e limão.",
      "Asse/grelhe até dourar.",
      "Sirva com batata cozida e salada.",
    ],
    base: { protein: ["peixe"], carb: ["batata"], extra: ["salada"] },
    tips: ["Se quiser mais calorias: coloque azeite e castanhas na salada."],
  },
  {
    id: "almoco_frango_arroz_legumes",
    title: "Frango + arroz + legumes na frigideira",
    tags: ["prático", "rápido", "ganho"],
    steps: [
      "Grelhe frango em cubos.",
      "Aqueça arroz pronto.",
      "Salteie legumes com alho e azeite.",
    ],
    base: { protein: ["frango"], carb: ["arroz"], extra: ["legumes"] },
    tips: ["Para secar: diminua arroz e aumente legumes."],
  },
  {
    id: "almoco_carne_batata_salada",
    title: "Carne magra + batata + salada",
    tags: ["força", "simples", "tradicional"],
    steps: [
      "Grelhe carne magra.",
      "Cozinhe batata.",
      "Complete com salada.",
    ],
    base: { protein: ["carne magra"], carb: ["batata"], extra: ["salada"] },
    tips: ["Para ganho: adicione feijão ou azeite."],
  },
  {
    id: "almoco_strogonoff_frango_fit",
    title: "Strogonoff simples de frango (leve)",
    tags: ["rápido", "br", "prático"],
    steps: [
      "Refogue frango em cubos com alho e cebola.",
      "Adicione creme (ou iogurte) e molho de tomate.",
      "Sirva com arroz e salada.",
    ],
    base: { protein: ["frango"], carb: ["arroz"], extra: ["salada"] },
    tips: ["Se quiser mais leve: use iogurte no lugar do creme."],
  },
  {
    id: "almoco_feijao_tropeiro_light",
    title: "Feijão tropeiro (versão leve) + salada",
    tags: ["br", "energia", "tradicional"],
    steps: [
      "Misture feijão cozido com ovos e farinha (pouca).",
      "Tempere com cebola e cheiro-verde.",
      "Sirva com salada.",
    ],
    base: { protein: ["ovos"], carb: ["feijão"], extra: ["salada"] },
    tips: ["Para secar: use pouca farinha e mais salada."],
  },

    {
      id: "almoco_arroz_feijao_frango",
      title: "Arroz + feijão + frango + salada",
      tags: ["tradicional", "ganho"],
      steps: [
        "Monte o prato: arroz e feijão (porção do seu objetivo).",
        "Adicione frango grelhado/desfiado.",
        "Complete com salada e legumes.",
      ],
      base: { protein: ["frango"], carb: ["arroz", "feijão"], extra: ["salada"] },
      tips: ["Para secar: reduza arroz, mantenha feijão e capriche na salada."],
    },
    {
      id: "almoco_carne_batata",
      title: "Carne magra + batata + legumes",
      tags: ["simples", "força"],
      steps: [
        "Grelhe a carne magra (patinho/coxão mole).",
        "Cozinhe batata/mandioca.",
        "Faça legumes no vapor/na frigideira.",
      ],
      base: { protein: ["carne magra"], carb: ["batata"], extra: ["legumes"] },
      tips: ["Para ganhar: aumente a porção de batata e inclua azeite."],
    },
    {
      id: "almoco_macarrao",
      title: "Macarrão simples + proteína + salada",
      tags: ["rápido", "energia"],
      steps: [
        "Cozinhe o macarrão al dente.",
        "Adicione proteína (frango/atum/carne).",
        "Finalize com salada.",
      ],
      base: { protein: ["frango", "atum"], carb: ["macarrão"], extra: ["salada"] },
      tips: ["Molho simples: alho + azeite + tomate."],
    },
    {
      id: "almoco_omelete_arroz",
      title: "Omelete completo + arroz + salada",
      tags: ["proteico", "prático"],
      steps: ["Faça omelete 3–5 ovos com tomate/cebola.", "Sirva com arroz e salada."],
      base: { protein: ["ovos"], carb: ["arroz"], extra: ["salada"] },
      tips: ["Se estiver em déficit: diminua arroz e mantenha salada."],
    },
  ],
  janta: [
      // --- NOVAS (JANTA) ---
  {
    id: "janta_sopa_frango_legumes",
    title: "Sopa de frango com legumes",
    tags: ["leve", "noite", "digestão"],
    steps: [
      "Cozinhe frango e desfie.",
      "Adicione legumes (cenoura, batata, abobrinha).",
      "Tempere e deixe engrossar levemente.",
    ],
    base: { protein: ["frango"], carb: ["batata"], extra: ["legumes"] },
    tips: ["Se quiser mais leve: reduza batata e aumente legumes."],
  },
  {
    id: "janta_omelete_frango",
    title: "Omelete + frango desfiado + salada",
    tags: ["proteico", "saciedade", "leve"],
    steps: [
      "Faça omelete 2–4 ovos.",
      "Recheie com frango desfiado.",
      "Sirva com salada.",
    ],
    base: { protein: ["ovos", "frango"], carb: ["nenhum"], extra: ["salada"] },
    tips: ["Se precisar de carbo: inclua 1 pão."],
  },
  {
    id: "janta_arroz_ovo_feijao",
    title: "Arroz + feijão + ovo (janta simples)",
    tags: ["barato", "br", "tradicional"],
    steps: [
      "Aqueça arroz e feijão.",
      "Faça 1–2 ovos (frito na frigideira antiaderente ou cozido).",
      "Complete com salada se tiver.",
    ],
    base: { protein: ["ovos"], carb: ["arroz", "feijão"], extra: ["salada"] },
    tips: ["Para secar: reduza arroz e mantenha feijão + salada."],
  },
  {
    id: "janta_frango_salada_azeite",
    title: "Frango + salada grande + azeite",
    tags: ["definição", "leve", "saúde"],
    steps: [
      "Grelhe frango com temperos.",
      "Monte salada grande (folhas + tomate + cebola).",
      "Finalize com azeite e limão.",
    ],
    base: { protein: ["frango"], carb: ["nenhum"], extra: ["salada", "azeite"] },
    tips: ["Se estiver com fome: coloque 1 pão ou 1 batata."],
  },
  {
    id: "janta_tapioca_frango",
    title: "Tapioca com frango + queijo",
    tags: ["rápido", "br", "proteico"],
    steps: [
      "Faça a tapioca.",
      "Recheie com frango e queijo.",
      "Dobre e sirva.",
    ],
    base: { protein: ["frango", "queijo"], carb: ["tapioca"], extra: ["tempero"] },
    tips: ["Se quiser mais leve: use pouco queijo."],
  },
  {
    id: "janta_iogurte_aveia_castanhas",
    title: "Iogurte + aveia + castanhas",
    tags: ["leve", "digestão", "rápido"],
    steps: [
      "Coloque iogurte na tigela.",
      "Adicione aveia e castanhas.",
      "Finalize com canela.",
    ],
    base: { protein: ["iogurte"], carb: ["aveia"], extra: ["castanhas"] },
    tips: ["Para reduzir calorias: diminua castanhas."],
  },
  {
    id: "janta_sanduiche_frango_salada",
    title: "Sanduíche de frango com salada",
    tags: ["rápido", "leve", "prático"],
    steps: [
      "Monte pão + frango desfiado.",
      "Adicione alface e tomate.",
      "Finalize com azeite ou requeijão (opcional).",
    ],
    base: { protein: ["frango"], carb: ["pão"], extra: ["salada"] },
    tips: ["Se quiser mais proteína: adicione 1 ovo."],
  },
  {
    id: "janta_arroz_peixe_salada",
    title: "Arroz + peixe + salada (leve)",
    tags: ["saúde", "leve", "proteico"],
    steps: [
      "Grelhe peixe com limão e sal.",
      "Sirva com arroz.",
      "Complete com salada.",
    ],
    base: { protein: ["peixe"], carb: ["arroz"], extra: ["salada"] },
    tips: ["Jantar tarde? reduza arroz e aumente salada."],
  },
  {
    id: "janta_carne_moida_legumes",
    title: "Carne moída + legumes (sem arroz)",
    tags: ["definição", "proteico", "leve"],
    steps: [
      "Refogue carne moída com alho e cebola.",
      "Adicione legumes picados e cozinhe junto.",
      "Finalize com temperos.",
    ],
    base: { protein: ["carne moída"], carb: ["nenhum"], extra: ["legumes"] },
    tips: ["Se quiser carbo: coloque 1 batata ou 1 pão."],
  },
  {
    id: "janta_ovos_batata",
    title: "Ovos + batata cozida + salada",
    tags: ["barato", "prático", "br"],
    steps: [
      "Cozinhe batata.",
      "Faça 2–3 ovos mexidos.",
      "Sirva com salada.",
    ],
    base: { protein: ["ovos"], carb: ["batata"], extra: ["salada"] },
    tips: ["Para secar: menos batata, mais salada."],
  },
  {
    id: "janta_macarrao_atum",
    title: "Macarrão + atum (janta rápida)",
    tags: ["rápido", "energia", "prático"],
    steps: [
      "Cozinhe macarrão.",
      "Misture atum e temperos.",
      "Finalize com tomate (opcional).",
    ],
    base: { protein: ["atum"], carb: ["macarrão"], extra: ["tomate"] },
    tips: ["Para ficar leve: use porção menor de macarrão."],
  },
  {
    id: "janta_saladinha_com_ovo",
    title: "Salada completa com ovo + queijo",
    tags: ["leve", "saciedade", "saúde"],
    steps: [
      "Monte salada com folhas, tomate e cebola.",
      "Adicione ovos cozidos fatiados.",
      "Finalize com queijo em cubos (opcional).",
    ],
    base: { protein: ["ovos", "queijo"], carb: ["nenhum"], extra: ["salada"] },
    tips: ["Se quiser carbo: inclua 1 pão ou 1 fruta."],
  },
  {
    id: "janta_frango_arroz_pouco",
    title: "Frango + arroz (pouco) + legumes",
    tags: ["tradicional", "leve", "simples"],
    steps: [
      "Grelhe frango.",
      "Sirva com pouco arroz.",
      "Complete com legumes.",
    ],
    base: { protein: ["frango"], carb: ["arroz"], extra: ["legumes"] },
    tips: ["Jantar tarde? mantenha só frango + legumes."],
  },
  {
    id: "janta_tapioca_queijo_tomate",
    title: "Tapioca + queijo + tomate",
    tags: ["rápido", "br", "leve"],
    steps: [
      "Faça a tapioca na frigideira.",
      "Adicione queijo e tomate.",
      "Dobre e sirva.",
    ],
    base: { protein: ["queijo"], carb: ["tapioca"], extra: ["tomate"] },
    tips: ["Se quiser mais proteína: adicione frango ou 1 ovo."],
  },
  {
    id: "janta_creme_legumes_iogurte",
    title: "Creme de legumes (com iogurte opcional)",
    tags: ["digestão", "leve", "noite"],
    steps: [
      "Cozinhe legumes e bata no liquidificador.",
      "Aqueça e tempere.",
      "Finalize com 1 colher de iogurte (opcional).",
    ],
    base: { protein: ["iogurte"], carb: ["legumes"], extra: ["tempero"] },
    tips: ["Se quiser mais proteína: coloque frango desfiado."],
  },
    {
      id: "janta_sanduiche_proteico",
      title: "Sanduíche proteico (frango/ovo)",
      tags: ["rápido", "leve"],
      steps: [
        "Monte pão + frango desfiado ou ovo.",
        "Adicione salada e um fio de azeite.",
      ],
      base: { protein: ["frango", "ovos"], carb: ["pão"], extra: ["salada"] },
      tips: ["Se estiver com muita fome: inclua uma fruta."],
    },
    {
      id: "janta_arroz_frango",
      title: "Arroz + frango + salada (porção moderada)",
      tags: ["tradicional", "simples"],
      steps: ["Arroz + frango grelhado/desfiado + salada e legumes."],
      base: { protein: ["frango"], carb: ["arroz"], extra: ["salada"] },
      tips: ["Jantar tarde? reduza carbo e mantenha proteína/salada."],
    },
    {
      id: "janta_ovos_salada",
      title: "Ovos mexidos + salada + pão",
      tags: ["muito rápido", "barato"],
      steps: ["Ovos mexidos + salada + 1 pão (ou 1 fruta)."],
      base: { protein: ["ovos"], carb: ["pão"], extra: ["salada"] },
      tips: ["Se quiser mais proteína: +1 ovo."],
    },
    {
      id: "janta_iogurte_fruta",
      title: "Iogurte + fruta + aveia",
      tags: ["leve", "digestão"],
      steps: ["Iogurte + fruta + aveia + canela."],
      base: { protein: ["iogurte"], carb: ["aveia"], extra: ["fruta"] },
      tips: ["Boa opção se você não quer comer pesado."],
    },
  ],
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

  // nutri+ pago
  const hasNutriPlus = localStorage.getItem(`nutri_plus_${email}`) === "1";

  const day = todayKey();
  const objetivo = String(user?.objetivo || "hipertrofia");
  const peso = Number(user?.peso || 0) || 80;

  // ✅ Água
  const goalMl = useMemo(() => waterGoalMl(peso), [peso]);
  const waterKey = `water_${email}_${day}`;
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

  // ✅ Modal
  const [openRecipe, setOpenRecipe] = useState(null);

  // ✅ Busca/filtro
  const [query, setQuery] = useState("");
  const [mealTab, setMealTab] = useState("cafe");
  const [showFavOnly, setShowFavOnly] = useState(false);

  // favoritos
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

  // ✅ “ver mais” incremental (melhora performance e sensação de leveza)
  const [visibleCount, setVisibleCount] = useState(16);
  useEffect(() => setVisibleCount(16), [mealTab, showFavOnly, query]);

  // ✅ lista grande (combinações)
  const options = useMemo(() => {
    // gera bastante, mas não renderiza tudo de cara
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

  // ✅ bloco novo: “Sugestão do dia”
  const suggestion = useMemo(() => {
    const base = buildLotsOfOptions({
      email,
      day,
      objective: objetivo,
      mealKey: mealTab,
      count: 12,
    });
    const pick = seededShuffle(base, `${email}_${day}_${mealTab}_suggest`)[0];
    return pick || null;
  }, [email, day, objetivo, mealTab]);

  // ✅ métricas rápidas de água
  const waterPct = goalMl ? clamp(waterMl / goalMl, 0, 1) : 0;
  const pctLabel = Math.round(waterPct * 100);
  const leftMl = clamp(goalMl - waterMl, 0, goalMl);

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
            <div style={S.sub}>
              Refeições + receitas + hidratação em um fluxo simples e rápido.
            </div>
          </div>

          <button style={S.backBtn} onClick={() => nav("/dashboard")}>
            Voltar
          </button>
        </div>

        <div style={S.lockCard}>
          <div style={S.lockIcon}>🍽️</div>
          <div style={S.lockTitle}>Nutri+ é exclusivo para assinantes</div>
          <div style={S.lockText}>
            Libera: combinações de refeições, receitas detalhadas, favoritos e
            contador de água.
          </div>

          <button style={S.ctaBtn} onClick={() => nav("/planos#nutri")}>
            Liberar Nutri+ (R$ 65,99)
          </button>

          <div style={S.smallNote}>
            Você mantém o treino gratuito — Nutri+ é um módulo extra premium.
          </div>
        </div>

        {/* prévia elegante */}
        <div style={S.previewCard}>
          <div style={S.previewTitle}>Prévia</div>
          <div style={S.previewRow}>
            <PreviewPill label="Receitas" value="1000+" />
            <PreviewPill label="Favoritos" value="★" />
            <PreviewPill label="Água" value="ml" />
          </div>
          <div style={S.previewHint}>
            Um toque e você tem uma refeição pronta, com trocas e passos claros.
          </div>
        </div>

        <div style={{ height: 120 }} />
      </div>
    );
  }

  // ✅ PAGANTE NUTRI+
  return (
    <div style={S.page}>
      <div style={S.bgGlow} />

      {/* Header */}
      <div style={S.head}>
        <div style={{ minWidth: 0 }}>
          <div style={S.kicker}>Nutri+</div>
          <div style={S.title}>
            Refeições & Hidratação<span style={{ color: ORANGE }}>.</span>
          </div>
          <div style={S.sub}>
            Escolha refeições, salve favoritas e acompanhe sua água do dia.
          </div>
        </div>

        <button style={S.backBtn} onClick={() => nav("/dashboard")}>
          Voltar
        </button>
      </div>

      {/* Bloco novo: Sugestão do dia */}
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
              <span key={t} style={S.chip}>{t}</span>
            ))}
            <span style={S.chipSoft}>{mealTab.toUpperCase()}</span>
            <span style={S.chipSoft}>Toque para abrir</span>
          </div>
        </button>
      ) : null}

      {/* Água */}
      <div style={S.card}>
        <div style={S.cardTop}>
          <div>
            <div style={S.cardTitle}>Hidratação</div>
            <div style={S.cardSub}>
              Meta sugerida: <b>{goalMl} ml</b> • faltam <b>{leftMl} ml</b>
            </div>
          </div>

          <div style={S.pill}>{pctLabel}%</div>
        </div>

        <div style={S.progressWrap}>
          <div style={{ ...S.progressBar, width: `${Math.round(waterPct * 100)}%` }} />
        </div>

        {/* botões mais elegantes e consistentes */}
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

        {/* Atalhos extra (leve, mas útil) */}
        <div style={S.waterMiniRow}>
          <button style={S.waterMini} onClick={() => addWater(150)} type="button">
            +150
          </button>
          <button style={S.waterMini} onClick={() => addWater(750)} type="button">
            +750
          </button>
          <button
            style={S.waterMiniGhost}
            onClick={() => addWater(leftMl)}
            type="button"
            title="Completar meta"
          >
            Completar meta
          </button>
        </div>
      </div>

      {/* Tabs + Search */}
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

      {/* Lista de refeições */}
      <div style={S.list}>
        {shown.map((r) => {
          const isFav = !!fav[r.id];

          return (
            <button
              key={r.id}
              style={S.recipeCard}
              onClick={() => setOpenRecipe(r)}
              type="button"
            >
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
                  <div key={t} style={S.chip}>{t}</div>
                ))}
                <div style={S.chipSoft}>{mealTab.toUpperCase()}</div>
              </div>

              <div style={S.openHint}>Abrir receita →</div>
            </button>
          );
        })}
      </div>

      {/* Ver mais */}
      {shown.length < filtered.length ? (
        <button
          style={S.loadMore}
          onClick={() => setVisibleCount((v) => clamp(v + 16, 16, 9999))}
          type="button"
        >
          Ver mais opções
        </button>
      ) : null}

      {/* Modal Receita */}
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
      <path
        d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"
        stroke="#64748b"
        strokeWidth="2.2"
      />
      <path
        d="M21 21l-4.35-4.35"
        stroke="#64748b"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
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

  /* cards */
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

  waterRow: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 8,
  },
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

  /* sugestão */
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

  /* tabs + search */
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

  /* list */
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

  /* lock */
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
  lockIcon: { fontSize: 34, marginBottom: 10 },
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

  /* modal */
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
