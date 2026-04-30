import React, { useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

// ajuste o caminho se no seu projeto estiver diferente

import { useAuth } from "../context/AuthContext";

// ajuste o caminho do supabase se no seu projeto estiver diferente

import { supabase } from "../lib/supabase";

/* =========================

   THEME

========================= */

const ORANGE = "#FF6A00";

const ORANGE_2 = "#FF8A33";

const BLACK = "#0F172A";

const TEXT = "#0F172A";

const MUTED = "#64748B";

const BG = "#F5F6FA";

const CARD = "#FFFFFF";

const BORDER = "rgba(15,23,42,.08)";

const SOFT = "rgba(255,106,0,.08)";

const SHADOW = "0 10px 30px rgba(15,23,42,.06)";

/* =========================

   HELPERS

========================= */

function clamp(n, min, max) {

  return Math.max(min, Math.min(max, n));

}

function getSeriesCount(seriesText) {

  if (!seriesText) return 0;

  const match = String(seriesText).match(/\d+/);

  return match ? Number(match[0]) : 0;

}

function getAverageReps(repsText) {

  if (!repsText) return 0;

  const str = String(repsText).replace(/\s/g, "");

  const range = str.match(/(\d+)-(\d+)/);

  if (range) {

    const min = Number(range[1]);

    const max = Number(range[2]);

    return Math.round((min + max) / 2);

  }

  const single = str.match(/\d+/);

  return single ? Number(single[0]) : 0;

}

function resolveExerciseMedia(exercise) {

  if (!exercise) return "";

  const candidates = [

    exercise.gif,

    exercise.GIF,

    exercise.image,

    exercise.img,

    exercise.thumbnail,

    exercise.thumb,

    exercise.media,

    exercise.preview,

    exercise.photo,

  ].filter(Boolean);

  if (!candidates.length) return "";

  const src = candidates[0];

  // se vier sem extensão, tenta normalizar

  if (

    typeof src === "string" &&

    !src.endsWith(".gif") &&

    !src.endsWith(".GIF") &&

    !src.endsWith(".png") &&

    !src.endsWith(".PNG") &&

    !src.endsWith(".jpg") &&

    !src.endsWith(".jpeg") &&

    !src.endsWith(".webp")

  ) {

    return src;

  }

  return src;

}

function generateId() {

  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

}

function normalizeExercise(ex) {

  return {

    id: ex.id || generateId(),

    nome: ex.nome || "Exercício",

    categoria: ex.categoria || "Geral",

    series: ex.series || "4x",

    reps: ex.reps || "8-12",

    descanso: ex.descanso || "60-90s",

    gif: ex.gif || ex.GIF || ex.image || "",

    group: ex.group || ex.categoria || "Geral",

  };

}

/* =========================

   MOCK / BASE DE EXERCÍCIOS

   (se você já tiver lista no banco,

    pode trocar depois)

========================= */

const EXERCISE_LIBRARY = [

  {

    id: "supino-reto-barra",

    nome: "Supino reto com barra",

    categoria: "Peito",

    series: "4x",

    reps: "8-12",

    descanso: "75-120s",

    image: "/exercises/supino-reto.gif",

  },

  {

    id: "supino-inclinado-halteres",

    nome: "Supino inclinado com halteres",

    categoria: "Peito",

    series: "4x",

    reps: "8-12",

    descanso: "75-120s",

    image: "/exercises/supino-inclinado.gif",

  },

  {

    id: "peck-deck",

    nome: "Peck-deck",

    categoria: "Peito",

    series: "4x",

    reps: "8-12",

    descanso: "60-90s",

    image: "/exercises/peck-deck.gif",

  },

  {

    id: "crossover-alto",

    nome: "Crossover na polia (alto)",

    categoria: "Peito",

    series: "4x",

    reps: "10-15",

    descanso: "60-90s",

    image: "/exercises/crossover-alto.gif",

  },

  {

    id: "triceps-corda",

    nome: "Tríceps corda",

    categoria: "Tríceps",

    series: "4x",

    reps: "8-12",

    descanso: "60-90s",

    image: "/exercises/triceps-corda.gif",

  },

  {

    id: "triceps-frances-halter",

    nome: "Tríceps francês (halter)",

    categoria: "Tríceps",

    series: "4x",

    reps: "8-12",

    descanso: "60-90s",

    image: "/exercises/triceps-frances.gif",

  },

  {

    id: "puxada-frente",

    nome: "Puxada frente",

    categoria: "Costas",

    series: "4x",

    reps: "8-12",

    descanso: "75-120s",

    image: "/exercises/puxada-frente.gif",

  },

  {

    id: "remada-baixa",

    nome: "Remada baixa",

    categoria: "Costas",

    series: "4x",

    reps: "8-12",

    descanso: "75-120s",

    image: "/exercises/remada-baixa.gif",

  },

  {

    id: "remada-unilateral",

    nome: "Remada unilateral",

    categoria: "Costas",

    series: "4x",

    reps: "8-12",

    descanso: "75-120s",

    image: "/exercises/remada-unilateral.gif",

  },

  {

    id: "rosca-direta",

    nome: "Rosca direta",

    categoria: "Bíceps",

    series: "4x",

    reps: "8-12",

    descanso: "60-90s",

    image: "/exercises/rosca-direta.gif",

  },

  {

    id: "rosca-martelo",

    nome: "Rosca martelo",

    categoria: "Bíceps",

    series: "4x",

    reps: "8-12",

    descanso: "60-90s",

    image: "/exercises/rosca-martelo.gif",

  },

  {

    id: "agachamento-livre",

    nome: "Agachamento livre",

    categoria: "Quadríceps",

    series: "4x",

    reps: "8-12",

    descanso: "90-120s",

    image: "/exercises/agachamento-livre.gif",

  },

  {

    id: "leg-press",

    nome: "Leg press",

    categoria: "Quadríceps",

    series: "4x",

    reps: "10-15",

    descanso: "90-120s",

    image: "/exercises/leg-press.gif",

  },

  {

    id: "stiff",

    nome: "Stiff",

    categoria: "Posterior",

    series: "4x",

    reps: "8-12",

    descanso: "75-120s",

    image: "/exercises/stiff.gif",

  },

  {

    id: "mesa-flexora",

    nome: "Mesa flexora",

    categoria: "Posterior",

    series: "4x",

    reps: "10-15",

    descanso: "60-90s",

    image: "/exercises/mesa-flexora.gif",

  },

  {

    id: "panturrilha-em-pe",

    nome: "Panturrilha em pé",

    categoria: "Panturrilha",

    series: "4x",

    reps: "12-20",

    descanso: "45-60s",

    image: "/exercises/panturrilha-em-pe.gif",

  },

  {

    id: "abdominal-maquina",

    nome: "Abdominal máquina",

    categoria: "Abdômen",

    series: "4x",

    reps: "12-20",

    descanso: "45-60s",

    image: "/exercises/abdominal-maquina.gif",

  },

];

/* =========================

   TEMPLATES

========================= */

const DEFAULT_TREINOS = [

  {

    id: "A",

    nome: "Treino A",

    categoria: "Peito + Tríceps",

    exercicios: [

      normalizeExercise(EXERCISE_LIBRARY[0]),

      normalizeExercise(EXERCISE_LIBRARY[1]),

      normalizeExercise(EXERCISE_LIBRARY[2]),

      normalizeExercise(EXERCISE_LIBRARY[3]),

      normalizeExercise(EXERCISE_LIBRARY[4]),

      normalizeExercise(EXERCISE_LIBRARY[5]),

    ],

  },

  {

    id: "B",

    nome: "Treino B",

    categoria: "Costas + Bíceps",

    exercicios: [

      normalizeExercise(EXERCISE_LIBRARY[6]),

      normalizeExercise(EXERCISE_LIBRARY[7]),

      normalizeExercise(EXERCISE_LIBRARY[8]),

      normalizeExercise(EXERCISE_LIBRARY[9]),

      normalizeExercise(EXERCISE_LIBRARY[10]),

    ],

  },

  {

    id: "C",

    nome: "Treino C",

    categoria: "Pernas",

    exercicios: [

      normalizeExercise(EXERCISE_LIBRARY[11]),

      normalizeExercise(EXERCISE_LIBRARY[12]),

      normalizeExercise(EXERCISE_LIBRARY[13]),

      normalizeExercise(EXERCISE_LIBRARY[14]),

      normalizeExercise(EXERCISE_LIBRARY[15]),

      normalizeExercise(EXERCISE_LIBRARY[16]),

    ],

  },

];

export default function TreinoPersonalize() {

  const navigate = useNavigate();

  const { user } = useAuth();

  const [treinos, setTreinos] = useState(DEFAULT_TREINOS);

  const [treinoIndexAtual, setTreinoIndexAtual] = useState(0);

  const [showPicker, setShowPicker] = useState(false);

  const [search, setSearch] = useState("");

  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState("");

  const treinoEditando = treinos[treinoIndexAtual];

  useEffect(() => {

    let active = true;

    async function loadFromSupabase() {

      if (!user?.id) return;

      try {

        const { data, error } = await supabase

          .from("user_training_plans")

          .select("*")

          .eq("user_id", user.id)

          .order("updated_at", { ascending: false })

          .limit(1)

          .maybeSingle();

        if (error) throw error;

        if (data?.payload?.treinos && active) {

          setTreinos(data.payload.treinos);

        }

      } catch (err) {

        console.log("TreinoPersonalize load warning:", err?.message || err);

      }

    }

    loadFromSupabase();

    return () => {

      active = false;

    };

  }, [user?.id]);

  useEffect(() => {

    if (!toast) return;

    const t = setTimeout(() => setToast(""), 2400);

    return () => clearTimeout(t);

  }, [toast]);

  const treinoAtual = treinoEditando?.exercicios || [];

  const totalExercicios = useMemo(() => treinoAtual.length, [treinoAtual]);

  const totalSeries = useMemo(() => {

    return treinoAtual.reduce((acc, ex) => {

      return acc + getSeriesCount(ex.series);

    }, 0);

  }, [treinoAtual]);

  const volumeTreino = useMemo(() => {

    return treinoAtual.reduce((acc, ex) => {

      const sets = getSeriesCount(ex.series);

      const reps = getAverageReps(ex.reps);

      return acc + sets * reps;

    }, 0);

  }, [treinoAtual]);

  const volumePorGrupo = useMemo(() => {

    return treinoAtual.reduce((acc, ex) => {

      const grupo = ex.categoria || "Outros";

      const sets = getSeriesCount(ex.series);

      acc[grupo] = (acc[grupo] || 0) + sets;

      return acc;

    }, {});

  }, [treinoAtual]);

  const gruposOrdenados = useMemo(() => {

    return Object.entries(volumePorGrupo)

      .sort((a, b) => b[1] - a[1])

      .slice(0, 4);

  }, [volumePorGrupo]);

  const filteredLibrary = useMemo(() => {

    const q = search.trim().toLowerCase();

    if (!q) return EXERCISE_LIBRARY;

    return EXERCISE_LIBRARY.filter((item) => {

      return (

        item.nome.toLowerCase().includes(q) ||

        item.categoria.toLowerCase().includes(q)

      );

    });

  }, [search]);

  function updateTreinoAt(index, updater) {

    setTreinos((prev) => {

      const next = [...prev];

      next[index] = typeof updater === "function" ? updater(next[index]) : updater;

      return next;

    });

  }

  function handleAddExercise(exercise) {

    const item = normalizeExercise(exercise);

    updateTreinoAt(treinoIndexAtual, (oldTreino) => ({

      ...oldTreino,

      exercicios: [...(oldTreino.exercicios || []), { ...item, id: generateId() }],

    }));

    setShowPicker(false);

    setSearch("");

  }

  function handleRemoveExercise(id) {

    updateTreinoAt(treinoIndexAtual, (oldTreino) => ({

      ...oldTreino,

      exercicios: (oldTreino.exercicios || []).filter((ex) => ex.id !== id),

    }));

  }

  function moveExercise(fromIndex, toIndex) {

    updateTreinoAt(treinoIndexAtual, (oldTreino) => {

      const list = [...(oldTreino.exercicios || [])];

      if (

        fromIndex < 0 ||

        toIndex < 0 ||

        fromIndex >= list.length ||

        toIndex >= list.length

      ) {

        return oldTreino;

      }

      const [item] = list.splice(fromIndex, 1);

      list.splice(toIndex, 0, item);

      return {

        ...oldTreino,

        exercicios: list,

      };

    });

  }

  async function handleSalvarTreino() {

    setSaving(true);

    try {

      if (!user?.id) {

        localStorage.setItem(

          "fitdeal_treinos_personalizados",

          JSON.stringify({ treinos })

        );

        setToast("Treino salvo localmente");

        return;

      }

      const payload = { treinos };

      const { error } = await supabase.from("user_training_plans").upsert(

        {

          user_id: user.id,

          payload,

          updated_at: new Date().toISOString(),

        },

        {

          onConflict: "user_id",

        }

      );

      if (error) throw error;

      setToast("Treino salvo com sucesso");

    } catch (err) {

      console.log(err);

      setToast("Não foi possível salvar agora");

    } finally {

      setSaving(false);

    }

  }

  return (

    <div style={S.page}>

      <div style={S.phone}>

        {/* HEADER */}

        <section style={S.headerCard}>

          <button style={S.backBtn} onClick={() => navigate(-1)}>

            ←

          </button>

          <div style={S.headerInfo}>

            <div style={S.headerTag}>PERSONALIZAR TREINO</div>

            <h1 style={S.headerTitle}>Monte seu treino do seu jeito</h1>

            <p style={S.headerSub}>

              Escolha o treino, organize os exercícios e acompanhe as

              estatísticas em tempo real.

            </p>

          </div>

        </section>

        {/* BLOCO TOPO */}

        <section style={S.topCard}>

          <div style={S.topCardLeft}>

            <div style={S.trainingLabel}>Treino ativo</div>

            <div style={S.trainingTitle}>{treinoEditando?.nome || "Treino A"}</div>

            <div style={S.trainingSubtitle}>

              {treinoEditando?.categoria || "Peito + Tríceps"}

            </div>

          </div>

          <button style={S.addBtn} onClick={() => setShowPicker(true)}>

            + Exercício

          </button>

          <div style={S.dayTabs}>

            {treinos.map((treino, idx) => {

              const ativo = idx === treinoIndexAtual;

              const letter =

                treino.nome?.replace("Treino ", "") ||

                String.fromCharCode(65 + idx);

              return (

                <button

                  key={treino.id || idx}

                  onClick={() => setTreinoIndexAtual(idx)}

                  style={{

                    ...S.dayTab,

                    ...(ativo ? S.dayTabActive : {}),

                  }}

                >

                  <span

                    style={{

                      ...S.dayTabBadge,

                      ...(ativo ? S.dayTabBadgeActive : {}),

                    }}

                  >

                    {letter}

                  </span>

                  <span style={S.dayTabText}>{treino.categoria}</span>

                </button>

              );

            })}

          </div>

        </section>

        {/* LISTA DE EXERCÍCIOS */}

        <section style={S.listWrap}>

          {treinoAtual.map((exercicio, index) => {

            const mediaSrc = resolveExerciseMedia(exercicio);

            return (

              <div key={exercicio.id || index} style={S.exerciseCard}>

                <div style={S.exerciseLeft}>

                  <div style={S.exerciseMediaBox}>

                    {mediaSrc ? (

                      <img

                        src={mediaSrc}

                        alt={exercicio.nome}

                        style={S.exerciseMedia}

                        onError={(e) => {

                          const current = e.currentTarget.getAttribute("src") || "";

                          if (current.endsWith(".gif")) {

                            e.currentTarget.src = current.replace(".gif", ".GIF");

                            return;

                          }

                          if (current.endsWith(".GIF")) {

                            e.currentTarget.src = current.replace(".GIF", ".gif");

                            return;

                          }

                          e.currentTarget.style.display = "none";

                        }}

                      />

                    ) : (

                      <div style={S.exerciseFallback}>GIF</div>

                    )}

                  </div>

                  <div style={S.exerciseTextWrap}>

                    <div style={S.exerciseTitle}>{exercicio.nome}</div>

                    <div style={S.exerciseMeta}>

                      <span>{exercicio.categoria}</span>

                      <span>•</span>

                      <span>{exercicio.series}</span>

                      <span>•</span>

                      <span>{exercicio.reps}</span>

                      <span>•</span>

                      <span>{exercicio.descanso}</span>

                    </div>

                  </div>

                </div>

                <div style={S.exerciseRight}>

                  <div style={S.orderBadge}>{index + 1}</div>

                  <div style={S.exerciseActions}>

                    <button

                      style={S.iconBtn}

                      onClick={() => moveExercise(index, index - 1)}

                      disabled={index === 0}

                      title="Subir"

                    >

                      ↑

                    </button>

                    <button

                      style={S.iconBtn}

                      onClick={() => moveExercise(index, index + 1)}

                      disabled={index === treinoAtual.length - 1}

                      title="Descer"

                    >

                      ↓

                    </button>

                    <button

                      style={{ ...S.iconBtn, ...S.deleteBtn }}

                      onClick={() => handleRemoveExercise(exercicio.id)}

                      title="Remover"

                    >

                      ×

                    </button>

                  </div>

                </div>

              </div>

            );

          })}

        </section>

        {/* ESTATÍSTICAS */}

        <section style={S.statsWrap}>

          <div style={S.statsHeader}>

            <div style={S.statsTitle}>Estatísticas do treino</div>

            <div style={S.statsSubtitle}>Resumo automático do treino montado</div>

          </div>

          <div style={S.statsGrid}>

            <div style={S.statCard}>

              <div style={S.statValue}>{totalExercicios}</div>

              <div style={S.statLabel}>Exercícios</div>

            </div>

            <div style={S.statCard}>

              <div style={S.statValue}>{totalSeries}</div>

              <div style={S.statLabel}>Séries totais</div>

            </div>

            <div style={S.statCard}>

              <div style={S.statValue}>{volumeTreino}</div>

              <div style={S.statLabel}>Volume total</div>

            </div>

          </div>

          {!!gruposOrdenados.length && (

            <div style={S.statsMuscles}>

              <div style={S.statsMiniTitle}>Volume por grupo</div>

              <div style={S.groupList}>

                {gruposOrdenados.map(([grupo, total]) => (

                  <div key={grupo} style={S.groupRow}>

                    <span style={S.groupName}>{grupo}</span>

                    <span style={S.groupValue}>{total} séries</span>

                  </div>

                ))}

              </div>

            </div>

          )}

        </section>

        {/* BOTÃO SALVAR */}

        <button

          onClick={handleSalvarTreino}

          style={{

            ...S.saveButton,

            opacity: saving ? 0.75 : 1,

          }}

          disabled={saving}

        >

          <span style={S.saveButtonInner}>

            {saving ? "Salvando..." : "Salvar treino"}

          </span>

        </button>

        {/* FOOTER */}

        <div style={S.fitdealFooter}>

          <img

            src="/logo/logo_app_4k.png"

            alt="FitDeal"

            style={S.fitdealLogoImg}

          />

          <div style={S.fitdealBrand}>

            <span style={S.fitdealBrandText}>fitdeal</span>

            <span style={S.fitdealBrandDot}>.</span>

          </div>

        </div>

      </div>

      {/* PICKER */}

      {showPicker && (

        <div style={S.overlay} onClick={() => setShowPicker(false)}>

          <div style={S.sheet} onClick={(e) => e.stopPropagation()}>

            <div style={S.sheetHandle} />

            <div style={S.sheetTitle}>Adicionar exercício</div>

            <div style={S.sheetSub}>

              Escolha um exercício para incluir no treino atual

            </div>

            <input

              style={S.searchInput}

              placeholder="Buscar exercício ou categoria..."

              value={search}

              onChange={(e) => setSearch(e.target.value)}

            />

            <div style={S.pickerList}>

              {filteredLibrary.map((item) => (

                <button

                  key={item.id}

                  style={S.pickerItem}

                  onClick={() => handleAddExercise(item)}

                >

                  <div style={S.pickerItemLeft}>

                    <div style={S.pickerItemName}>{item.nome}</div>

                    <div style={S.pickerItemMeta}>

                      {item.categoria} • {item.series} • {item.reps}

                    </div>

                  </div>

                  <div style={S.pickerAdd}>Adicionar</div>

                </button>

              ))}

            </div>

          </div>

        </div>

      )}

      {toast ? <div style={S.toast}>{toast}</div> : null}

    </div>

  );

}

/* =========================

   STYLES

========================= */

const S = {

  page: {

    minHeight: "100vh",

    background: BG,

    display: "flex",

    justifyContent: "center",

    padding: "14px 10px 28px",

  },

  phone: {

    width: "100%",

    maxWidth: 430,

  },

  headerCard: {

    position: "relative",

    background: "linear-gradient(180deg, #FFFDFB 0%, #FFF7F1 100%)",

    border: `1px solid rgba(255,106,0,.14)`,

    borderRadius: 30,

    padding: "24px 18px 18px 18px",

    boxShadow: SHADOW,

    overflow: "hidden",

  },

  backBtn: {

    width: 54,

    height: 54,

    borderRadius: 18,

    border: `1px solid ${BORDER}`,

    background: "#fff",

    color: BLACK,

    fontSize: 28,

    fontWeight: 900,

    display: "grid",

    placeItems: "center",

    marginBottom: 16,

  },

  headerInfo: {

    maxWidth: 320,

  },

  headerTag: {

    fontSize: 13,

    fontWeight: 950,

    letterSpacing: 2,

    color: ORANGE,

    marginBottom: 8,

  },

  headerTitle: {

    margin: 0,

    fontSize: 27,

    lineHeight: 1.02,

    letterSpacing: -1,

    color: BLACK,

    fontWeight: 1000,

  },

  headerSub: {

    margin: "14px 0 0",

    fontSize: 15,

    lineHeight: 1.35,

    color: MUTED,

    fontWeight: 800,

  },

  topCard: {

    marginTop: 14,

    background: CARD,

    border: `1px solid ${BORDER}`,

    borderRadius: 28,

    padding: 18,

    boxShadow: SHADOW,

  },

  topCardLeft: {

    marginBottom: 14,

  },

  trainingLabel: {

    fontSize: 12,

    fontWeight: 900,

    textTransform: "uppercase",

    letterSpacing: 1.4,

    color: ORANGE,

    marginBottom: 4,

  },

  trainingTitle: {

    fontSize: 24,

    fontWeight: 980,

    letterSpacing: -0.8,

    color: BLACK,

    lineHeight: 1,

  },

  trainingSubtitle: {

    marginTop: 8,

    fontSize: 15,

    fontWeight: 800,

    color: MUTED,

  },

  addBtn: {

    width: "100%",

    minHeight: 56,

    borderRadius: 18,

    border: "none",

    background: BLACK,

    color: "#fff",

    fontSize: 18,

    fontWeight: 950,

    marginBottom: 14,

  },

  dayTabs: {

    display: "flex",

    gap: 10,

    overflowX: "auto",

    paddingBottom: 4,

  },

  dayTab: {

    minWidth: 170,

    minHeight: 58,

    borderRadius: 18,

    border: `1px solid ${BORDER}`,

    background: "#fff",

    display: "flex",

    alignItems: "center",

    gap: 10,

    padding: "0 14px",

    flexShrink: 0,

    boxShadow: "0 1px 0 rgba(15,23,42,.02)",

  },

  dayTabActive: {

    border: `1.5px solid ${ORANGE}`,

    background: "rgba(255,106,0,.08)",

    boxShadow: "0 10px 24px rgba(255,106,0,.10)",

  },

  dayTabBadge: {

    width: 34,

    height: 34,

    borderRadius: 12,

    background: "rgba(15,23,42,.12)",

    color: BLACK,

    display: "grid",

    placeItems: "center",

    fontSize: 16,

    fontWeight: 1000,

    flexShrink: 0,

  },

  dayTabBadgeActive: {

    background: BLACK,

    color: "#fff",

  },

  dayTabText: {

    fontSize: 15,

    fontWeight: 900,

    color: BLACK,

    whiteSpace: "nowrap",

  },

  listWrap: {

    marginTop: 16,

    display: "flex",

    flexDirection: "column",

    gap: 14,

  },

  exerciseCard: {

    background: CARD,

    border: `1px solid ${BORDER}`,

    borderRadius: 28,

    padding: 14,

    boxShadow: SHADOW,

    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: 12,

  },

  exerciseLeft: {

    display: "flex",

    alignItems: "center",

    gap: 14,

    minWidth: 0,

    flex: 1,

  },

  exerciseMediaBox: {

    width: 82,

    height: 82,

    borderRadius: 22,

    background: "#fff",

    border: `1px solid ${BORDER}`,

    overflow: "hidden",

    flexShrink: 0,

    display: "grid",

    placeItems: "center",

  },

  exerciseMedia: {

    width: "100%",

    height: "100%",

    objectFit: "cover",

    display: "block",

  },

  exerciseFallback: {

    fontSize: 14,

    fontWeight: 900,

    color: MUTED,

  },

  exerciseTextWrap: {

    minWidth: 0,

    flex: 1,

  },

  exerciseTitle: {

    margin: 0,

    fontSize: 18,

    lineHeight: 1.08,

    fontWeight: 950,

    letterSpacing: -0.5,

    color: BLACK,

    wordBreak: "break-word",

  },

  exerciseMeta: {

    marginTop: 7,

    display: "flex",

    flexWrap: "wrap",

    gap: 6,

    fontSize: 13,

    color: MUTED,

    fontWeight: 850,

  },

  exerciseRight: {

    display: "flex",

    flexDirection: "column",

    alignItems: "center",

    gap: 10,

    flexShrink: 0,

  },

  orderBadge: {

    minWidth: 48,

    height: 48,

    padding: "0 10px",

    borderRadius: 16,

    background: "#FFF1E6",

    color: ORANGE,

    display: "grid",

    placeItems: "center",

    fontSize: 24,

    fontWeight: 1000,

  },

  exerciseActions: {

    display: "flex",

    flexDirection: "column",

    gap: 8,

  },

  iconBtn: {

    width: 36,

    height: 36,

    borderRadius: 12,

    border: `1px solid ${BORDER}`,

    background: "#fff",

    color: BLACK,

    fontWeight: 900,

    fontSize: 18,

    display: "grid",

    placeItems: "center",

  },

  deleteBtn: {

    color: "#DC2626",

  },

  statsWrap: {

    marginTop: 18,

    borderRadius: 28,

    background: "#fff",

    border: `1px solid ${BORDER}`,

    padding: 16,

    boxShadow: SHADOW,

  },

  statsHeader: {

    marginBottom: 12,

  },

  statsTitle: {

    fontSize: 18,

    fontWeight: 950,

    color: BLACK,

    letterSpacing: -0.4,

  },

  statsSubtitle: {

    marginTop: 4,

    fontSize: 13,

    fontWeight: 700,

    color: MUTED,

  },

  statsGrid: {

    display: "grid",

    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",

    gap: 10,

  },

  statCard: {

    borderRadius: 20,

    background: "rgba(255,106,0,.06)",

    border: "1px solid rgba(255,106,0,.12)",

    padding: "14px 10px",

    textAlign: "center",

  },

  statValue: {

    fontSize: 22,

    fontWeight: 1000,

    color: BLACK,

    lineHeight: 1,

  },

  statLabel: {

    marginTop: 6,

    fontSize: 12,

    fontWeight: 800,

    color: MUTED,

  },

  statsMuscles: {

    marginTop: 14,

    borderTop: `1px solid ${BORDER}`,

    paddingTop: 14,

  },

  statsMiniTitle: {

    fontSize: 13,

    fontWeight: 900,

    color: BLACK,

    marginBottom: 8,

  },

  groupList: {

    display: "flex",

    flexDirection: "column",

    gap: 8,

  },

  groupRow: {

    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    padding: "10px 12px",

    borderRadius: 14,

    background: "#F8FAFC",

  },

  groupName: {

    fontSize: 13,

    fontWeight: 850,

    color: BLACK,

  },

  groupValue: {

    fontSize: 13,

    fontWeight: 950,

    color: ORANGE,

  },

  saveButton: {

    width: "100%",

    marginTop: 18,

    border: "none",

    background: BLACK,

    borderRadius: 28,

    padding: 12,

    boxShadow: "0 14px 30px rgba(15,23,42,.18)",

  },

  saveButtonInner: {

    width: "100%",

    minHeight: 64,

    borderRadius: 20,

    background: `linear-gradient(135deg, ${ORANGE} 0%, ${ORANGE_2} 100%)`,

    color: "#111827",

    display: "grid",

    placeItems: "center",

    fontSize: 19,

    fontWeight: 1000,

    letterSpacing: -0.4,

  },

  fitdealFooter: {

    marginTop: 18,

    padding: "8px 0 8px",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    gap: 10,

  },

  fitdealLogoImg: {

    width: 32,

    height: 32,

    objectFit: "contain",

    display: "block",

  },

  fitdealBrand: {

    display: "flex",

    alignItems: "baseline",

    gap: 0,

    fontSize: 22,

    fontWeight: 950,

    letterSpacing: -0.7,

  },

  fitdealBrandText: {

    color: "rgba(15,23,42,.72)",

  },

  fitdealBrandDot: {

    color: ORANGE,

  },

  overlay: {

    position: "fixed",

    inset: 0,

    background: "rgba(15,23,42,.35)",

    zIndex: 50,

    display: "flex",

    alignItems: "flex-end",

    justifyContent: "center",

    padding: 8,

  },

  sheet: {

    width: "100%",

    maxWidth: 430,

    background: "#fff",

    borderRadius: "26px 26px 0 0",

    padding: "12px 16px 18px",

    maxHeight: "78vh",

    overflow: "auto",

  },

  sheetHandle: {

    width: 48,

    height: 5,

    borderRadius: 999,

    background: "rgba(15,23,42,.14)",

    margin: "0 auto 12px",

  },

  sheetTitle: {

    fontSize: 22,

    fontWeight: 1000,

    color: BLACK,

    letterSpacing: -0.6,

  },

  sheetSub: {

    marginTop: 4,

    fontSize: 14,

    color: MUTED,

    fontWeight: 700,

  },

  searchInput: {

    width: "100%",

    marginTop: 14,

    height: 52,

    borderRadius: 16,

    border: `1px solid ${BORDER}`,

    background: "#F8FAFC",

    padding: "0 14px",

    outline: "none",

    fontSize: 15,

    color: BLACK,

    fontWeight: 700,

  },

  pickerList: {

    marginTop: 14,

    display: "flex",

    flexDirection: "column",

    gap: 10,

  },

  pickerItem: {

    width: "100%",

    border: `1px solid ${BORDER}`,

    background: "#fff",

    borderRadius: 18,

    padding: 14,

    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: 12,

    textAlign: "left",

  },

  pickerItemLeft: {

    minWidth: 0,

    flex: 1,

  },

  pickerItemName: {

    fontSize: 16,

    fontWeight: 900,

    color: BLACK,

    letterSpacing: -0.3,

  },

  pickerItemMeta: {

    marginTop: 4,

    fontSize: 13,

    color: MUTED,

    fontWeight: 800,

  },

  pickerAdd: {

    flexShrink: 0,

    borderRadius: 14,

    background: SOFT,

    color: ORANGE,

    fontSize: 13,

    fontWeight: 950,

    padding: "10px 12px",

  },

  toast: {

    position: "fixed",

    left: "50%",

    bottom: 22,

    transform: "translateX(-50%)",

    background: BLACK,

    color: "#fff",

    padding: "12px 16px",

    borderRadius: 14,

    fontSize: 14,

    fontWeight: 900,

    zIndex: 80,

    boxShadow: "0 12px 24px rgba(15,23,42,.22)",

  },

};
