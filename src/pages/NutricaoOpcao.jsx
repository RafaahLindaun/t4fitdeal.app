// ✅ COLE EM: src/pages/NutricaoOpcao.jsx
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ORANGE = "#FF6A00";
const BG = "#f8fafc";
const TEXT = "#0f172a";
const MUTED = "#64748b";

function keyOfToday() {
  return new Date().toISOString().slice(0, 10);
}

function dayIndexFromDate(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const seed = day + month * 3;
  return seed % 7;
}

function getPaid(email) {
  return localStorage.getItem(`paid_${email}`) === "1";
}

function safeJsonParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

/* ----------------- Dietas (filtro) ----------------- */
const DIETS = [
  { id: "hipertrofia", label: "Hipertrofia", hint: "mais proteína e energia" },
  { id: "emagrecimento", label: "Emagrecer", hint: "saciedade + controle" },
  { id: "manutencao", label: "Manutenção", hint: "equilibrado" },
  { id: "lowcarb", label: "Low carb", hint: "menos carbo, mais saciedade" },
  { id: "sem_lactose", label: "Sem lactose", hint: "alternativas fáceis" },
  { id: "vegetariana", label: "Vegetariana", hint: "sem carne" },
];

/* ----------------- Banco premium (autoral) -----------------
   - Várias receitas por refeição
   - Medidas claras
   - Tags de dieta (para filtros)
   - Tempo + dificuldade
   - Macros aproximados (por porção)
----------------------------------------------------------- */

function recipe(title, tags, timeMin, diff, ing, how, macros) {
  return { title, tags, timeMin, diff, ing, how, macros };
}

function buildPremiumBank(option) {
  const O = option === "2";

  const cafes = [
    recipe(
      O ? "Iogurte + banana + aveia (cremoso)" : "Ovos mexidos + pão + fruta",
      ["hipertrofia", "manutencao"],
      6,
      "fácil",
      ["2 ovos", "1 fatia de pão", "1 fruta (banana/maçã)", "1 pitada de sal"],
      ["Mexa os ovos em fogo baixo.", "Sirva com pão e fruta."],
      { kcal: 420, p: 22, c: 45, g: 14 }
    ),
    recipe(
      "Vitamina proteica (liquidificador)",
      ["hipertrofia", "manutencao", "sem_lactose"],
      5,
      "fácil",
      ["250 ml leite (ou água)", "1 banana", "2 colheres (sopa) aveia", "opcional: 1 scoop whey"],
      ["Bata tudo.", "Ajuste água/leite até ficar do seu jeito."],
      { kcal: 380, p: 26, c: 52, g: 6 }
    ),
    recipe(
      "Panqueca de banana (sem frescura)",
      ["manutencao", "emagrecimento", "sem_lactose"],
      10,
      "fácil",
      ["1 banana amassada", "1 ovo", "1 colher (sopa) aveia", "canela (opcional)"],
      ["Misture tudo.", "Grelhe 2–3 min de cada lado."],
      { kcal: 260, p: 10, c: 35, g: 9 }
    ),
    recipe(
      "Overnight oats (rápido e top)",
      ["emagrecimento", "manutencao", "hipertrofia"],
      3,
      "fácil",
      ["170 g iogurte", "3 colheres (sopa) aveia", "1 colher (chá) mel", "fruta picada"],
      ["Misture.", "Espere 10–20 min (ou deixe pronto)."],
      { kcal: 330, p: 18, c: 48, g: 7 }
    ),
    recipe(
      "Tapioca com queijo + tomate",
      ["manutencao", "sem_lactose"],
      8,
      "fácil",
      ["2 colheres (sopa) goma de tapioca", "30–50 g queijo (ou sem lactose)", "tomate em rodelas"],
      ["Aqueça a frigideira.", "Monte a tapioca, recheie e dobre."],
      { kcal: 340, p: 16, c: 44, g: 10 }
    ),
  ];

  const almocos = [
    recipe(
      "Arroz + feijão + frango grelhado + salada",
      ["hipertrofia", "manutencao", "emagrecimento"],
      18,
      "fácil",
      ["120 g frango", "4 colheres (sopa) arroz", "1 concha feijão", "salada à vontade"],
      ["Grelhe o frango.", "Monte o prato com base + proteína + salada."],
      { kcal: 620, p: 45, c: 70, g: 14 }
    ),
    recipe(
      "Batata + frango + legumes (marmita boa)",
      ["hipertrofia", "manutencao"],
      25,
      "médio",
      ["200 g batata", "120 g frango", "1 xícara legumes", "sal e temperos"],
      ["Cozinhe a batata.", "Grelhe o frango.", "Refogue legumes e monte."],
      { kcal: 640, p: 45, c: 78, g: 12 }
    ),
    recipe(
      "Macarrão + carne moída + salada",
      ["manutencao", "hipertrofia"],
      22,
      "médio",
      ["1 prato (sobremesa) macarrão", "120 g carne moída", "molho simples", "salada"],
      ["Cozinhe macarrão.", "Refogue carne com molho.", "Sirva com salada."],
      { kcal: 720, p: 40, c: 85, g: 20 }
    ),
    recipe(
      "Low carb: carne + salada grande + azeite",
      ["lowcarb", "emagrecimento"],
      18,
      "fácil",
      ["150 g carne/frango", "salada grande (2–3 xícaras)", "1 colher (sopa) azeite"],
      ["Grelhe a proteína.", "Monte salada e finalize com azeite."],
      { kcal: 520, p: 42, c: 18, g: 30 }
    ),
    recipe(
      "Vegetariana: arroz + feijão + ovos + salada",
      ["vegetariana", "manutencao", "hipertrofia"],
      15,
      "fácil",
      ["2 ovos", "3–4 colheres (sopa) arroz", "1 concha feijão", "salada"],
      ["Prepare ovos.", "Monte com arroz+feijão e salada."],
      { kcal: 610, p: 28, c: 72, g: 18 }
    ),
  ];

  const jantas = [
    recipe(
      "Omelete + salada (bem leve)",
      ["emagrecimento", "manutencao", "lowcarb"],
      10,
      "fácil",
      ["2–3 ovos", "tomate/cebola", "salada à vontade"],
      ["Bata ovos.", "Grelhe e finalize com salada."],
      { kcal: 420, p: 26, c: 12, g: 28 }
    ),
    recipe(
      "Sanduíche de frango (premium simples)",
      ["hipertrofia", "manutencao"],
      12,
      "fácil",
      ["2 fatias pão", "120 g frango desfiado", "folhas", "1 colher (sopa) iogurte/maionese"],
      ["Misture frango com o creme.", "Monte com folhas e feche."],
      { kcal: 540, p: 40, c: 50, g: 16 }
    ),
    recipe(
      "Wrap de atum (rápido)",
      ["manutencao", "emagrecimento"],
      10,
      "fácil",
      ["1 wrap", "1 lata atum (escorrido)", "folhas", "tomate", "limão/sal"],
      ["Tempere o atum.", "Recheie o wrap e enrole."],
      { kcal: 470, p: 35, c: 42, g: 14 }
    ),
    recipe(
      "Sopa + proteína (sem drama)",
      ["emagrecimento", "manutencao"],
      12,
      "fácil",
      ["1 prato sopa", "120 g frango (opcional)", "temperos"],
      ["Aqueça a sopa.", "Adicione proteína se quiser."],
      { kcal: 380, p: 28, c: 32, g: 14 }
    ),
    recipe(
      "Sem lactose: carne + legumes + arroz pequeno",
      ["sem_lactose", "manutencao"],
      20,
      "médio",
      ["120–150 g carne", "1 xícara legumes", "2 colheres (sopa) arroz"],
      ["Refogue legumes.", "Grelhe carne.", "Monte com porção menor de arroz."],
      { kcal: 560, p: 38, c: 40, g: 22 }
    ),
  ];

  // snacks extras (premium)
  const snacks = [
    recipe(
      "Lanche: fruta + castanhas",
      ["emagrecimento", "manutencao", "lowcarb"],
      2,
      "fácil",
      ["1 fruta", "10–15 g castanhas"],
      ["Coma e pronto."],
      { kcal: 190, p: 4, c: 22, g: 10 }
    ),
    recipe(
      "Lanche: iogurte + mel + granola",
      ["hipertrofia", "manutencao"],
      3,
      "fácil",
      ["170 g iogurte", "1 colher (chá) mel", "2 colheres (sopa) granola"],
      ["Misture tudo."],
      { kcal: 260, p: 14, c: 34, g: 7 }
    ),
    recipe(
      "Lanche: pão + ovo",
      ["hipertrofia", "manutencao"],
      7,
      "fácil",
      ["1 pão", "1–2 ovos", "sal"],
      ["Prepare os ovos e monte."],
      { kcal: 340, p: 18, c: 34, g: 12 }
    ),
    recipe(
      "Lanche: shake de whey (opcional)",
      ["hipertrofia", "sem_lactose"],
      2,
      "fácil",
      ["200–300 ml água/leite", "1 scoop whey (opcional)", "canela (opcional)"],
      ["Misture bem e tome."],
      { kcal: 180, p: 24, c: 6, g: 3 }
    ),
  ];

  return { cafes, almocos, jantas, snacks };
}

/**
 * Semana premium:
 * - Cada dia mostra 2 opções por refeição (mas tem muito mais na “Trocar receitas”)
 * - O banco é grande; o dia escolhe de forma estável (por índice + seed)
 */
function buildWeeklyMenus(option) {
  const bank = buildPremiumBank(option);

  const week = [];
  for (let d = 0; d < 7; d++) {
    // pegada estável: “gira” o banco por dia (sem ficar repetindo)
    const pick2 = (arr) => {
      const a = arr[(d * 2) % arr.length];
      const b = arr[(d * 2 + 1) % arr.length];
      return [a, b].filter(Boolean);
    };

    week.push({
      day: `Dia ${d + 1}`,
      cafes: pick2(bank.cafes),
      almocos: pick2(bank.almocos),
      jantas: pick2(bank.jantas),
      snacks: pick2(bank.snacks),
    });
  }
  return week;
}

/* ------------------ UI helpers ------------------ */
function pillStyle(active) {
  return {
    ...S.pill,
    ...(active ? S.pillOn : S.pillOff),
  };
}

function matchesDiet(recipe, dietId) {
  if (!dietId || dietId === "all") return true;
  return Array.isArray(recipe.tags) && recipe.tags.includes(dietId);
}

function matchesSearch(recipe, q) {
  if (!q) return true;
  const s = q.trim().toLowerCase();
  if (!s) return true;
  const inTitle = String(recipe.title || "").toLowerCase().includes(s);
  const inIng = (recipe.ing || []).some((x) => String(x).toLowerCase().includes(s));
  return inTitle || inIng;
}

export default function NutricaoOpcao() {
  const nav = useNavigate();
  const { user } = useAuth();
  const { id } = useParams(); // "1" | "2"
  const option = id === "2" ? "2" : "1";

  const email = (user?.email || "anon").toLowerCase();
  const paid = useMemo(() => getPaid(email), [email]);

  const week = useMemo(() => buildWeeklyMenus(option), [option]);

  // dia automático + override
  const overrideKey = `nutri_day_override_${email}_opt${option}`;
  const [override, setOverride] = useState(() => {
    const raw = localStorage.getItem(overrideKey);
    if (!raw) return null;
    const j = safeJsonParse(raw, null);
    if (j?.date === keyOfToday()) return Number(j?.idx);
    return null;
  });

  const idxAuto = useMemo(() => dayIndexFromDate(keyOfToday()), []);
  const dayIdx = useMemo(() => {
    const v = Number(override);
    return Number.isFinite(v) ? ((v % 7) + 7) % 7 : idxAuto;
  }, [override, idxAuto]);

  const day = week[dayIdx];

  // concluído
  const doneKey = `nutri_done_${email}_opt${option}_${keyOfToday()}`;
  const [done, setDone] = useState(() => localStorage.getItem(doneKey) === "1");

  // filtros premium
  const [diet, setDiet] = useState("all");
  const [q, setQ] = useState("");

  // favoritos
  const favKey = `nutri_favs_${email}_opt${option}`;
  const [favs, setFavs] = useState(() => safeJsonParse(localStorage.getItem(favKey), {}));

  function toggleFav(r) {
    const k = String(r?.title || "").toLowerCase();
    const next = { ...(favs || {}) };
    next[k] = !next[k];
    setFavs(next);
    localStorage.setItem(favKey, JSON.stringify(next));
  }

  function markDone() {
    localStorage.setItem(doneKey, "1");
    setDone(true);
  }

  // “Trocar receitas” (override no dia para ver outras sugestões)
  function moreOptions() {
    const next = (dayIdx + 1) % 7;
    const payload = { date: keyOfToday(), idx: next };
    localStorage.setItem(overrideKey, JSON.stringify(payload));
    setOverride(next);
  }

  // reset override (voltar pro dia real)
  function resetToTodayAuto() {
    localStorage.removeItem(overrideKey);
    setOverride(null);
  }

  if (!paid) {
    return (
      <div style={S.page}>
        <div style={S.lockCard}>
          <div style={S.lockTitle}>Aba Premium</div>
          <div style={S.lockText}>Assine para liberar receitas, medidas e filtros de dieta.</div>
          <button style={S.lockBtn} onClick={() => nav("/planos")}>
            Ver planos
          </button>
        </div>
      </div>
    );
  }

  // filtra receitas do dia (cada seção com 2 opções, mas com busca + dieta)
  const filtered = {
    cafes: day.cafes.filter((r) => matchesDiet(r, diet)).filter((r) => matchesSearch(r, q)),
    almocos: day.almocos.filter((r) => matchesDiet(r, diet)).filter((r) => matchesSearch(r, q)),
    jantas: day.jantas.filter((r) => matchesDiet(r, diet)).filter((r) => matchesSearch(r, q)),
    snacks: day.snacks.filter((r) => matchesDiet(r, diet)).filter((r) => matchesSearch(r, q)),
  };

  const showingOverride = Number.isFinite(Number(override));

  return (
    <div style={S.page}>
      {/* TOPBAR premium */}
      <div style={S.topbar}>
        <button style={S.backPill} onClick={() => nav("/nutricao")} aria-label="Voltar">
          <span style={S.backIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="#111" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          Voltar
        </button>

        <div style={{ minWidth: 0 }}>
          <div style={S.titleRow}>
            <div style={S.title}>Nutrição • Opção {option}</div>
            <span style={S.premiumBadge}>PREMIUM</span>
          </div>
          <div style={S.sub}>
            Plano do dia: <b>{day.day}</b> • receitas com medidas • filtros de dieta
          </div>
        </div>
      </div>

      {/* HERO / BANNER premium */}
      <div style={S.hero}>
        <div style={S.heroKicker}>Seu plano de hoje</div>
        <div style={S.heroText}>Escolha, cozinhe e evolua. Um passo por dia.</div>

        <div style={S.heroBottom}>
          <div style={S.heroMini}>
            <span style={S.dot} />
            {showingOverride ? (
              <>
                Visualizando outras opções •{" "}
                <button style={S.linkBtn} onClick={resetToTodayAuto}>
                  voltar pro “dia automático”
                </button>
              </>
            ) : (
              <>Muda automaticamente todos os dias</>
            )}
          </div>

          <button style={S.swapBtn} onClick={moreOptions} title="Ver outras sugestões">
            Trocar receitas
          </button>
        </div>
      </div>

      {/* filtros */}
      <div style={S.filtersCard}>
        <div style={S.searchRow}>
          <div style={S.searchIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                stroke="#64748b"
                strokeWidth="2.2"
              />
              <path d="M21 21l-4.2-4.2" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar receita ou ingrediente (ex: frango, aveia, arroz)"
            style={S.searchInput}
          />
        </div>

        <div style={S.pillsRow}>
          <button style={pillStyle(diet === "all")} onClick={() => setDiet("all")}>
            Tudo
          </button>
          {DIETS.map((d) => (
            <button key={d.id} style={pillStyle(diet === d.id)} onClick={() => setDiet(d.id)}>
              {d.label}
            </button>
          ))}
        </div>

        <div style={S.filtersHint}>
          Dica: escolha um filtro e toque em <b>Trocar receitas</b> para ver mais opções dentro do estilo.
        </div>
      </div>

      {/* Seções */}
      <Section title="Café da manhã" items={filtered.cafes} favs={favs} onFav={toggleFav} />
      <Section title="Almoço" items={filtered.almocos} favs={favs} onFav={toggleFav} />
      <Section title="Janta" items={filtered.jantas} favs={favs} onFav={toggleFav} />
      <Section title="Lanches (extra)" items={filtered.snacks} favs={favs} onFav={toggleFav} />

      {/* Ações */}
      <div style={S.actions}>
        <button style={done ? S.doneBtnOn : S.doneBtn} onClick={markDone}>
          {done ? "Concluído • você tá no caminho 😮‍💨🔥" : "Marcar como concluído"}
        </button>

        <button style={S.secondaryBtn} onClick={() => nav("/cardio")}>
          Abrir cardio (linkado ao progresso)
        </button>
      </div>

      <div style={S.footerNote}>
        * Macros são estimativas simples por porção (pra te orientar, sem complicar). Ajuste quantidades conforme seu objetivo.
      </div>
    </div>
  );
}

function Section({ title, items, favs, onFav }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={S.sectionTitle}>{title}</div>

      {items.length === 0 ? (
        <div style={S.empty}>
          Nada encontrado com esse filtro/busca. Tente outro termo ou toque em <b>Trocar receitas</b>.
        </div>
      ) : (
        <div style={S.grid}>
          {items.map((r, i) => {
            const favKey = String(r?.title || "").toLowerCase();
            const isFav = !!(favs || {})[favKey];

            return (
              <div key={i} style={S.card}>
                <div style={S.cardTop}>
                  <div style={S.chip}>{i + 1}</div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={S.cardTitle}>{r.title}</div>
                    <div style={S.cardSub}>
                      {r.diff} • {r.timeMin} min •{" "}
                      <span style={S.tagLine}>
                        {(r.tags || []).slice(0, 3).map((t) => (
                          <span key={t} style={S.tag}>
                            {tagLabel(t)}
                          </span>
                        ))}
                      </span>
                    </div>
                  </div>

                  <button
                    style={{ ...S.favBtn, ...(isFav ? S.favOn : S.favOff) }}
                    onClick={() => onFav(r)}
                    aria-label={isFav ? "Remover dos favoritos" : "Salvar nos favoritos"}
                    title={isFav ? "Favoritado" : "Favoritar"}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 21s-7-4.4-9.4-8.7C.6 9 2.5 6 5.8 6c1.9 0 3.2 1 4.2 2.2C11 7 12.3 6 14.2 6c3.3 0 5.2 3 3.2 6.3C19 16.6 12 21 12 21Z"
                        stroke={isFav ? "#111" : "#64748b"}
                        strokeWidth="2.2"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>

                {/* macros */}
                <div style={S.macroRow}>
                  <MacroChip label="kcal" value={r.macros?.kcal} />
                  <MacroChip label="P" value={`${r.macros?.p}g`} />
                  <MacroChip label="C" value={`${r.macros?.c}g`} />
                  <MacroChip label="G" value={`${r.macros?.g}g`} />
                </div>

                <div style={S.block}>
                  <div style={S.blockTitle}>Ingredientes (medidas)</div>
                  <ul style={S.list}>
                    {(r.ing || []).map((x, idx) => (
                      <li key={idx} style={S.li}>
                        {x}
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={S.block2}>
                  <div style={S.blockTitle}>Modo de preparo</div>
                  <ol style={S.list}>
                    {(r.how || []).map((x, idx) => (
                      <li key={idx} style={S.li}>
                        {x}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MacroChip({ label, value }) {
  return (
    <span style={S.macroChip}>
      <span style={S.macroLabel}>{label}</span>
      <span style={S.macroValue}>{value ?? "—"}</span>
    </span>
  );
}

function tagLabel(t) {
  const map = {
    hipertrofia: "Hipertrofia",
    emagrecimento: "Emagrecer",
    manutencao: "Manutenção",
    lowcarb: "Low carb",
    sem_lactose: "Sem lactose",
    vegetariana: "Vegetariana",
  };
  return map[t] || t;
}

/* ---------------- styles (Premium Apple-like) ---------------- */
const S = {
  page: { padding: 18, paddingBottom: 120, background: BG },

  topbar: { display: "flex", gap: 12, alignItems: "center" },

  backPill: {
    height: 44,
    padding: "0 14px 0 8px",
    borderRadius: 999,
    border: "1px solid rgba(15,23,42,.08)",
    background: "rgba(255,255,255,.85)",
    boxShadow: "0 10px 30px rgba(15,23,42,.06)",
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontWeight: 950,
    color: TEXT,
    whiteSpace: "nowrap",
  },
  backIcon: {
    width: 34,
    height: 34,
    borderRadius: 999,
    background: "linear-gradient(135deg, rgba(255,106,0,.18), rgba(15,23,42,.04))",
    border: "1px solid rgba(255,106,0,.18)",
    display: "grid",
    placeItems: "center",
  },

  titleRow: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  title: { fontSize: 20, fontWeight: 950, color: TEXT, letterSpacing: -0.5 },
  premiumBadge: {
    padding: "6px 10px",
    borderRadius: 999,
    background: "linear-gradient(135deg, rgba(255,106,0,.22), rgba(255,106,0,.10))",
    border: "1px solid rgba(255,106,0,.22)",
    fontSize: 11,
    fontWeight: 950,
    color: TEXT,
  },
  sub: { marginTop: 4, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35 },

  hero: {
    marginTop: 12,
    borderRadius: 26,
    padding: 16,
    background: "linear-gradient(135deg, rgba(255,106,0,.95), rgba(255,106,0,.62))",
    color: "#fff",
    boxShadow: "0 22px 70px rgba(15,23,42,.12)",
    border: "1px solid rgba(255,255,255,.18)",
  },
  heroKicker: { fontSize: 12, fontWeight: 900, opacity: 0.95 },
  heroText: { marginTop: 8, fontSize: 16, fontWeight: 950, letterSpacing: -0.3, lineHeight: 1.2 },

  heroBottom: { marginTop: 12, display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" },
  heroMini: { fontSize: 12, fontWeight: 850, opacity: 0.95, display: "flex", alignItems: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 99, background: "rgba(255,255,255,.85)" },
  linkBtn: {
    border: "none",
    background: "rgba(255,255,255,.18)",
    color: "#fff",
    fontWeight: 950,
    padding: "6px 10px",
    borderRadius: 999,
  },
  swapBtn: {
    padding: "10px 12px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,.25)",
    background: "rgba(255,255,255,.16)",
    color: "#fff",
    fontWeight: 950,
  },

  filtersCard: {
    marginTop: 12,
    borderRadius: 24,
    padding: 14,
    background: "#fff",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
  },

  searchRow: { display: "flex", alignItems: "center", gap: 10 },
  searchIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    background: "rgba(15,23,42,.04)",
    border: "1px solid rgba(15,23,42,.06)",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
  },
  searchInput: {
    width: "100%",
    height: 44,
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,.08)",
    background: "rgba(15,23,42,.02)",
    padding: "0 12px",
    fontWeight: 900,
    color: TEXT,
    outline: "none",
  },

  pillsRow: { marginTop: 12, display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 },
  pill: {
    border: "none",
    padding: "10px 12px",
    borderRadius: 999,
    fontWeight: 950,
    whiteSpace: "nowrap",
  },
  pillOn: { background: "rgba(255,106,0,.16)", color: TEXT, border: "1px solid rgba(255,106,0,.22)" },
  pillOff: { background: "rgba(15,23,42,.04)", color: "#334155", border: "1px solid rgba(15,23,42,.06)" },

  filtersHint: { marginTop: 10, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35 },

  sectionTitle: { marginTop: 4, fontSize: 20, fontWeight: 950, color: TEXT, letterSpacing: -0.6 },

  empty: {
    marginTop: 10,
    borderRadius: 18,
    padding: 14,
    background: "rgba(15,23,42,.03)",
    border: "1px solid rgba(15,23,42,.06)",
    fontSize: 12,
    fontWeight: 850,
    color: MUTED,
    lineHeight: 1.35,
  },

  grid: { marginTop: 10, display: "grid", gap: 12 },
  card: {
    borderRadius: 22,
    padding: 16,
    background: "#fff",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
  },

  cardTop: { display: "flex", gap: 12, alignItems: "center" },
  chip: {
    width: 44,
    height: 44,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,106,0,.14)",
    border: "1px solid rgba(255,106,0,.22)",
    color: TEXT,
    fontWeight: 950,
    flexShrink: 0,
  },
  cardTitle: { fontSize: 16, fontWeight: 950, color: TEXT, letterSpacing: -0.3 },
  cardSub: { marginTop: 2, fontSize: 12, fontWeight: 800, color: MUTED, lineHeight: 1.35 },
  tagLine: { display: "inline-flex", gap: 6, flexWrap: "wrap", marginLeft: 6 },
  tag: {
    padding: "4px 8px",
    borderRadius: 999,
    background: "rgba(15,23,42,.04)",
    border: "1px solid rgba(15,23,42,.06)",
    fontWeight: 950,
    fontSize: 11,
    color: "#334155",
  },

  favBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    border: "none",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
  },
  favOn: { background: "linear-gradient(135deg, rgba(255,106,0,.35), rgba(255,255,255,.70))", border: "1px solid rgba(255,106,0,.22)" },
  favOff: { background: "rgba(15,23,42,.04)", border: "1px solid rgba(15,23,42,.06)" },

  macroRow: { marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" },
  macroChip: {
    padding: "8px 10px",
    borderRadius: 999,
    background: "rgba(255,106,0,.10)",
    border: "1px solid rgba(255,106,0,.18)",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  },
  macroLabel: { fontSize: 11, fontWeight: 950, color: MUTED, textTransform: "uppercase" },
  macroValue: { fontSize: 12, fontWeight: 950, color: TEXT },

  block: {
    marginTop: 12,
    borderRadius: 18,
    padding: 14,
    background: "rgba(15,23,42,.03)",
    border: "1px solid rgba(15,23,42,.06)",
  },
  block2: {
    marginTop: 10,
    borderRadius: 18,
    padding: 14,
    background: "rgba(255,106,0,.10)",
    border: "1px solid rgba(255,106,0,.22)",
  },
  blockTitle: { fontSize: 12, fontWeight: 950, color: TEXT, opacity: 0.9 },

  list: { marginTop: 8, paddingLeft: 18 },
  li: { fontSize: 13, fontWeight: 800, color: "#334155", lineHeight: 1.45 },

  actions: { marginTop: 14, display: "grid", gap: 10 },
  doneBtn: {
    width: "100%",
    padding: 14,
    borderRadius: 18,
    border: "none",
    background: TEXT,
    color: "#fff",
    fontWeight: 950,
  },
  doneBtnOn: {
    width: "100%",
    padding: 14,
    borderRadius: 18,
    border: "none",
    background: "rgba(15,23,42,.92)",
    color: "#fff",
    fontWeight: 950,
  },
  secondaryBtn: {
    width: "100%",
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(255,106,0,.28)",
    background: "rgba(255,106,0,.12)",
    color: TEXT,
    fontWeight: 950,
  },

  footerNote: { marginTop: 10, fontSize: 11, fontWeight: 800, color: MUTED, lineHeight: 1.35 },

  lockCard: {
    borderRadius: 22,
    padding: 16,
    background: "linear-gradient(135deg, rgba(255,106,0,.16), rgba(15,23,42,.02))",
    border: "1px solid rgba(255,106,0,.22)",
    boxShadow: "0 18px 50px rgba(15,23,42,.08)",
  },
  lockTitle: { fontSize: 18, fontWeight: 950, color: TEXT },
  lockText: { marginTop: 6, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35 },
  lockBtn: { marginTop: 12, width: "100%", padding: 14, borderRadius: 18, border: "none", background: TEXT, color: "#fff", fontWeight: 950 },
};
