// src/pages/TreinoPorProfessor.jsx
import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

/**
 * TreinoPorProfessor.jsx
 *
 * Página para que um profissional (professor/treinador) busque um aluno por email
 * e atualize o treino dele diretamente no banco (profiles.trainer_custom_split).
 *
 * UX: simples, Apple-like, animações de fade, sheet para escolher exercícios,
 * preview de GIF (carrega de /public/gifs/<slug>.gif se existir — fallback mostrado).
 *
 * Nota técnica: adapta a estrutura do TreinoPersonalize para edição remota.
 */

/* ---------------------------
   CONSTANTES (copiadas / adaptadas do TreinoPersonalize)
   --------------------------- */

/* Paleta / estilos rápidos */
const ORANGE = "#FF6A00";
const ORANGE_SOFT = "rgba(255,106,0,.12)";
const BG = "#f8fafc";
const TEXT = "#0f172a";
const MUTED = "#64748b";

/* Splits / Muscular groups / Catalog simplificado (mantive estrutura) */
const SPLITS = [
  { id: "AB", days: 2, label: "AB (2 dias)" },
  { id: "ABC", days: 3, label: "ABC (3 dias)" },
  { id: "ABCD", days: 4, label: "ABCD (4 dias)" },
  { id: "ABCDE", days: 5, label: "ABCDE (5 dias)" },
  { id: "ABCDEF", days: 6, label: "ABCDEF (6 dias)" },
];

const EXERCISE_CATALOG = {
  peito: ["Supino reto", "Supino inclinado", "Crucifixo", "Crossover"],
  costas: ["Puxada frente", "Remada baixa", "Barra fixa"],
  pernas: ["Agachamento", "Leg press", "Afundo"],
  core: ["Prancha", "Dead bug", "Crunch"],
  ombro: ["Desenvolvimento", "Elevação lateral"],
  biceps: ["Rosca direta", "Rosca martelo"],
  triceps: ["Tríceps corda", "Tríceps testa"],
  gluteo: ["Hip thrust", "Glute bridge"],
  panturrilha: ["Panturrilha em pé", "Panturrilha sentado"],
  posterior: ["Terra romeno", "Stiff"],
};

const MUSCLE_GROUPS = [
  {
    id: "peito_triceps",
    name: "Peito + Tríceps",
    muscles: ["Peito", "Tríceps", "Ombro ant."],
    default: { sets: 4, reps: "6–12", rest: "75–120s" },
    pickerKeys: ["peito", "triceps"],
    library: [{ name: "Supino reto", group: "Peito" }, { name: "Tríceps corda", group: "Tríceps" }],
  },
  {
    id: "costas_biceps",
    name: "Costas + Bíceps",
    muscles: ["Costas", "Bíceps"],
    default: { sets: 4, reps: "8–12", rest: "75–120s" },
    pickerKeys: ["costas", "biceps"],
    library: [{ name: "Puxada frente", group: "Costas" }, { name: "Rosca direta", group: "Bíceps" }],
  },
  {
    id: "pernas",
    name: "Pernas",
    muscles: ["Quadríceps", "Glúteos", "Panturrilha"],
    default: { sets: 4, reps: "8–15", rest: "75–150s" },
    pickerKeys: ["pernas", "gluteo", "panturrilha"],
    library: [{ name: "Agachamento", group: "Pernas" }, { name: "Leg press", group: "Pernas" }],
  },
  {
    id: "fullbody",
    name: "Full body",
    muscles: ["Corpo todo"],
    default: { sets: 3, reps: "10–15", rest: "45–90s" },
    pickerKeys: ["peito", "costas", "pernas", "core"],
    library: [{ name: "Agachamento (leve)", group: "Pernas" }],
  },
];

/* utilidades pequenas */
function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}
function uniq(arr) {
  const s = new Set();
  const out = [];
  for (const x of arr || []) {
    const key = String(x || "").trim();
    if (!key) continue;
    if (s.has(key)) continue;
    s.add(key);
    out.push(key);
  }
  return out;
}
function dayLetter(i) {
  const letters = ["A", "B", "C", "D", "E", "F"];
  return letters[i] || "A";
}
function pickDefaultSplit(days) {
  if (days <= 2) return ["fullbody", "fullbody"];
  if (days === 3) return ["peito_triceps", "costas_biceps", "pernas"];
  if (days === 4) return ["peito_triceps", "pernas", "costas_biceps", "fullbody"];
  if (days === 5) return ["peito_triceps", "costas_biceps", "pernas", "fullbody", "peito_triceps"];
  return ["peito_triceps", "costas_biceps", "pernas", "fullbody", "peito_triceps", "costas_biceps"];
}

/* ---------------------------
   COMPONENTE: TreinoPorProfessor
   --------------------------- */

export default function TreinoPorProfessor() {
  const { user: me } = useAuth();
  const nav = useNavigate();

  // form aluno
  const [studentEmail, setStudentEmail] = useState("");
  const [loadingStudent, setLoadingStudent] = useState(false);
  const [student, setStudent] = useState(null); // perfil completo da profile row
  const [msg, setMsg] = useState("");

  // treino para editar (local states)
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [dayGroups, setDayGroups] = useState(() => pickDefaultSplit(4));
  const [prescriptions, setPrescriptions] = useState({});
  const [dayExercises, setDayExercises] = useState({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerDayIndex, setPickerDayIndex] = useState(0);

  const [saving, setSaving] = useState(false);
  const [sheetGif, setSheetGif] = useState({ open: false, name: null });

  useEffect(() => {
    // small fadein css injection (apple like)
    const id = "tp-prof-style";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id;
      s.innerHTML = `
        .tpFade { animation: tpFade .36s ease both; }
        @keyframes tpFade { from { opacity: 0; transform: translateY(6px); } to { opacity:1; transform:translateY(0);} }
      `;
      document.head.appendChild(s);
    }
  }, []);

  // Busca aluno por email
  async function findStudent() {
    setMsg("");
    setStudent(null);

    const email = String(studentEmail || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      setMsg("Informe um email válido.");
      return;
    }

    setLoadingStudent(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (error) {
        console.error("Erro buscar profile:", error);
        setMsg("Erro ao buscar aluno.");
      } else if (!data) {
        setMsg("Aluno não encontrado no banco.");
      } else {
        setStudent(data);
        // se já houver treino remoto (trainer_custom_split ou custom_split), carregue como inicial
        const remote = data.trainer_custom_split || data.custom_split || null;
        hydrateFromRemote(remote || null, data);
        setMsg("Aluno encontrado — carregando treino para edição.");
      }
    } catch (err) {
      console.error(err);
      setMsg("Falha ao buscar aluno.");
    } finally {
      setLoadingStudent(false);
    }
  }

  // Se o profile tiver treino, usar — senão usar defaults (com base em user.frequencia)
  function hydrateFromRemote(remote, profile) {
    const freq = Number(profile?.frequencia || 4) || 4;

    if (remote && typeof remote === "object") {
      const d = clamp(remote.days || freq, 2, 6);
      setDaysPerWeek(d);
      setDayGroups(Array.isArray(remote.dayGroups) ? remote.dayGroups : pickDefaultSplit(d));
      setPrescriptions(remote.prescriptions || {});
      setDayExercises(remote.dayExercises || {});
    } else {
      const d = clamp(freq, 2, 6);
      setDaysPerWeek(d);
      const groups = pickDefaultSplit(d);
      setDayGroups(groups);
      const pres = {};
      const ex = {};
      for (let i = 0; i < groups.length; i++) {
        const g = MUSCLE_GROUPS.find((x) => x.id === groups[i]);
        pres[i] = g?.default || { sets: 4, reps: "6–12", rest: "75–120s" };
        ex[i] = uniq((g?.library || []).map((x) => x.name)).slice(0, 8);
      }
      setPrescriptions(pres);
      setDayExercises(ex);
    }
  }

  // abrir picker (exercícios)
  function openPicker(dayIndex) {
    setPickerDayIndex(dayIndex);
    setPickerOpen(true);
  }
  function closePicker() {
    setPickerOpen(false);
  }
  function updateDayExercises(dayIndex, list) {
    setDayExercises((prev) => {
      const out = { ...(prev || {}) };
      out[dayIndex] = uniq(list).slice(0, 40);
      return out;
    });
  }

  // salvar treino no profile do aluno (campo JSON: trainer_custom_split)
  async function saveForStudent() {
    if (!student?.id) {
      setMsg("Carregue um aluno antes de salvar.");
      return;
    }

    setSaving(true);
    setMsg("");

    try {
      // normalize prescriptions
      const normalizedPrescriptions = {};
      Object.keys(prescriptions || {}).forEach((k) => {
        const item = prescriptions[k] || {};
        normalizedPrescriptions[k] = {
          ...item,
          sets: clamp(Number(item.sets || 4), 1, 8),
        };
      });

      const payload = {
        splitId: null,
        days: daysPerWeek,
        dayGroups,
        prescriptions: normalizedPrescriptions,
        dayExercises,
        updatedAt: new Date().toISOString(),
        updatedBy: me?.email || null,
      };

      // tentativa de atualizar campo JSON 'trainer_custom_split'
      const { error } = await supabase
        .from("profiles")
        .update({ trainer_custom_split: payload, trainer_last_updated_by: me?.id || null })
        .eq("id", student.id);

      if (error) {
        console.error("Erro ao salvar trainer_custom_split:", error);
        setMsg("Erro ao salvar no banco. Verifique se a coluna 'trainer_custom_split' existe em profiles.");
        setSaving(false);
        return;
      }

      setMsg("Treino do aluno atualizado com sucesso.");
    } catch (err) {
      console.error(err);
      setMsg("Erro inesperado ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  // abrir preview GIF: tenta carregar /public/gifs/<slug>.gif
  function getGifUrlFor(name) {
    // slug básico: remove acentos, substituir espaços por '-', tudo lowercase
    const slug = String(name || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase();
    return `/gifs/${slug}.gif`; // coloque seus GIFs em public/gifs/<slug>.gif
  }

  // UI helpers
  const daysConfig = useMemo(() => {
    const n = clamp(daysPerWeek, 2, 6);
    const arr = [];
    for (let i = 0; i < n; i++) {
      const gid = dayGroups[i] || pickDefaultSplit(n)[i];
      const groupObj = MUSCLE_GROUPS.find((x) => x.id === gid) || MUSCLE_GROUPS[0];
      arr.push({
        dayIndex: i,
        letter: dayLetter(i),
        groupId: gid,
        groupObj,
        prescription: prescriptions[i] || groupObj?.default || { sets: 4, reps: "6–12", rest: "75–120s" },
        chosenExercises: Array.isArray(dayExercises?.[i]) ? dayExercises[i] : [],
      });
    }
    return arr;
  }, [daysPerWeek, dayGroups, prescriptions, dayExercises]);

  /* ---------------------------
     RENDER
     --------------------------- */

  return (
    <div style={styles.page} className="tpFade">
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => nav(-1)} aria-label="voltar">←</button>
        <div style={{ marginLeft: 12 }}>
          <div style={styles.hTitle}>Treino por professor</div>
          <div style={styles.hSub}>Busque por email do aluno e edite o treino remotamente.</div>
        </div>
      </div>

      <div style={styles.searchCard}>
        <input
          placeholder="Email do aluno (ex: aluno@exemplo.com)"
          value={studentEmail}
          onChange={(e) => setStudentEmail(e.target.value)}
          style={styles.inputSearch}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button style={styles.btn} onClick={findStudent} disabled={loadingStudent}>
            {loadingStudent ? "Buscando..." : "Buscar aluno"}
          </button>
          <button style={{ ...styles.btn, background: "transparent", border: "1px solid rgba(15,23,42,.08)" }} onClick={() => { setStudentEmail(""); setStudent(null); setMsg(""); }}>
            Limpar
          </button>
        </div>

        {student ? (
          <div style={styles.studentCard}>
            <div style={styles.studentRow}>
              <div style={styles.avatarFallback}>{(student.nome || student.email || "U")[0].toUpperCase()}</div>
              <div style={{ marginLeft: 12 }}>
                <div style={styles.studentName}>{student.nome || "—"}</div>
                <div style={styles.studentEmail}>{student.email}</div>
              </div>
            </div>
            <div style={{ marginTop: 10, fontSize: 13, color: MUTED }}>
              Último treino salvo: {student.trainer_custom_split?.updatedAt ? new Date(student.trainer_custom_split.updatedAt).toLocaleString() : (student.custom_split?.updatedAt ? new Date(student.custom_split.updatedAt).toLocaleString() : "—")}
            </div>
          </div>
        ) : null}

        {msg ? <div style={styles.msg}>{msg}</div> : null}
      </div>

      {student ? (
        <>
          <div style={styles.card}>
            <div style={styles.cardTitle}>1) Dias por semana</div>
            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
              {[2,3,4,5,6].map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    const next = clamp(d, 2, 6);
                    setDaysPerWeek(next);
                    const groups = pickDefaultSplit(next);
                    setDayGroups((prev) => {
                      const copy = Array.isArray(prev) ? [...prev] : [...groups];
                      if (copy.length === next) return copy;
                      if (copy.length < next) {
                        const add = pickDefaultSplit(next).slice(copy.length);
                        return [...copy, ...add];
                      }
                      return copy.slice(0, next);
                    });
                  }}
                  style={{ ...styles.dayBtn, ...(daysPerWeek === d ? styles.dayBtnOn : {}) }}
                >
                  {d}x
                </button>
              ))}
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>2) Músculos & exercícios</div>
            <div style={styles.daysGrid}>
              {daysConfig.map((d) => (
                <div key={d.dayIndex} style={styles.dayCard}>
                  <div style={styles.dayTop}>
                    <div style={styles.badge}>{d.letter}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={styles.dayLabel}>Dia {d.letter}</div>
                      <div style={styles.daySub}>{d.groupObj?.name || "—"}</div>
                    </div>

                    <button style={styles.appleBtn} onClick={() => openPicker(d.dayIndex)}>Escolher exercícios</button>
                  </div>

                  <select
                    value={d.groupId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDayGroups((prev) => {
                        const arr = [...prev];
                        arr[d.dayIndex] = val;
                        return arr;
                      });
                      const g = MUSCLE_GROUPS.find((x) => x.id === val);
                      setPrescriptions((prev) => ({ ...(prev||{}), [d.dayIndex]: g?.default || { sets: 4, reps: "6–12", rest: "75–120s" } }));
                      setDayExercises((prev) => ({ ...(prev||{}), [d.dayIndex]: uniq((g?.library||[]).map(x => x.name)).slice(0,8) }));
                    }}
                    style={styles.select}
                  >
                    {MUSCLE_GROUPS.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>

                  <div style={styles.presRow}>
                    <div style={styles.presBox}>
                      <div style={styles.presLabel}>Séries</div>
                      <input
                        type="number"
                        value={d.prescription.sets}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (!/^\d*$/.test(raw)) return;
                          setPrescriptions((p) => ({ ...(p||{}), [d.dayIndex]: { ...(p?.[d.dayIndex]||{}), sets: raw } }));
                        }}
                        onBlur={(e) => {
                          const next = clamp(Number(e.target.value||4),1,8);
                          setPrescriptions((p) => ({ ...(p||{}), [d.dayIndex]: { ...(p?.[d.dayIndex]||{}), sets: next } }));
                        }}
                        style={styles.input}
                      />
                    </div>

                    <div style={styles.presBox}>
                      <div style={styles.presLabel}>Reps</div>
                      <input value={d.prescription.reps} onChange={(e) => setPrescriptions((p) => ({ ...(p||{}), [d.dayIndex]: { ...(p?.[d.dayIndex]||{}), reps: e.target.value } }))} style={styles.input} />
                    </div>

                    <div style={styles.presBox}>
                      <div style={styles.presLabel}>Descanso</div>
                      <input value={d.prescription.rest} onChange={(e) => setPrescriptions((p) => ({ ...(p||{}), [d.dayIndex]: { ...(p?.[d.dayIndex]||{}), rest: e.target.value } }))} style={styles.input} />
                    </div>
                  </div>

                  <div style={styles.pickPreview}>
                    <div style={styles.pickPreviewTop}>
                      <div style={styles.previewTitle}>Exercícios selecionados</div>
                      <div style={styles.previewCount}>{(d.chosenExercises||[]).length} itens</div>
                    </div>

                    {(d.chosenExercises||[]).length === 0 ? (
                      <div style={styles.previewEmpty}>Nenhum escolhido — abra "Escolher exercícios".</div>
                    ) : (
                      <div style={styles.previewChips}>
                        {d.chosenExercises.slice(0, 10).map((name) => (
                          <div key={name} style={styles.chip} onClick={() => setSheetGif({ open: true, name })}>
                            {name}
                          </div>
                        ))}
                        {d.chosenExercises.length > 10 ? <div style={styles.moreChip}>+{d.chosenExercises.length - 10}</div> : null}
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          </div>

          <div style={styles.actions}>
            <button style={styles.save} onClick={saveForStudent} disabled={saving}>
              {saving ? "Salvando..." : "Salvar treino para aluno"}
            </button>
            <button style={styles.reset} onClick={() => hydrateFromRemote(null, student)} disabled={saving}>
              Restaurar ao padrão (do aluno)
            </button>
          </div>
        </>
      ) : null}

      {/* Picker sheet */}
      {pickerOpen && (
        <ExercisePickerSheet
          open={pickerOpen}
          onClose={closePicker}
          day={daysConfig[pickerDayIndex]}
          dayIndex={pickerDayIndex}
          onApply={(list) => updateDayExercises(pickerDayIndex, list)}
        />
      )}

      {/* GIF preview sheet */}
      {sheetGif.open && (
        <div style={styles.sheetOverlay} onClick={() => setSheetGif({ open: false, name: null })}>
          <div style={styles.sheetGif} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={styles.sheetTitle}>{sheetGif.name}</div>
              <button style={styles.sheetClose} onClick={() => setSheetGif({ open: false, name: null })}>✕</button>
            </div>
            <div style={{ marginTop: 12 }}>
              <img
                alt={sheetGif.name}
                src={getGifUrlFor(sheetGif.name)}
                style={{ width: "100%", maxHeight: "60vh", objectFit: "contain", borderRadius: 12, background: "#000" }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <div style={{ marginTop: 12, color: MUTED, fontSize: 13 }}>
                Se o GIF não aparecer, coloque um arquivo em <code>/public/gifs/{sheetGif.name.replace(/\s+/g, "-").toLowerCase()}.gif</code> (slug sem acento).
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------
   ExercisePickerSheet (reaproveitado/adaptado)
   --------------------------- */

function ExercisePickerSheet({ open, onClose, day, dayIndex, onApply }) {
  const group = day?.groupObj;
  const pickerKeys = Array.isArray(group?.pickerKeys) ? group.pickerKeys : ["peito"];
  const [tab, setTab] = useState(pickerKeys[0]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(() => (Array.isArray(day?.chosenExercises) ? [...day.chosenExercises] : []));

  useEffect(() => {
    if (open) {
      setSelected(Array.isArray(day?.chosenExercises) ? [...day.chosenExercises] : []);
      setQ("");
      setTab(pickerKeys[0] || "peito");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dayIndex, day?.chosenExercises?.length]);

  const list = useMemo(() => {
    const base = (EXERCISE_CATALOG[tab] || []).map((name) => ({ name, key: tab }));
    const term = String(q || "").trim().toLowerCase();
    if (!term) return base;
    return base.filter((x) => x.name.toLowerCase().includes(term));
  }, [tab, q]);

  const selectedSet = useMemo(() => new Set((selected || []).map((x) => String(x))), [selected]);

  function add(name) {
    setSelected((prev) => uniq([...(prev || []), name]));
  }
  function remove(name) {
    setSelected((prev) => (prev || []).filter((x) => x !== name));
  }
  function clearAll() {
    setSelected([]);
  }
  function apply() {
    onApply(uniq(selected));
    onClose();
  }

  if (!open) return null;

  return (
    <div style={styles.sheetOverlay} onMouseDown={onClose}>
      <div style={styles.sheet} onMouseDown={(e) => e.stopPropagation()}>
        <div style={styles.sheetTop}>
          <div style={{ minWidth: 0 }}>
            <div style={styles.sheetTitle}>Escolher exercícios</div>
            <div style={styles.sheetSub}>{group?.name || ""} • Dia {day?.letter || ""}</div>
          </div>
          <button style={styles.sheetClose} onClick={onClose}>✕</button>
        </div>

        <div style={styles.searchWrap}>
          <div style={styles.searchIcon}>⌕</div>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar exercício..." style={styles.search} />
          {q ? <button style={styles.searchClear} onClick={() => setQ("")}>Limpar</button> : null}
        </div>

        <div style={styles.tabsRow}>
          {pickerKeys.map((k) => (
            <button key={k} onClick={() => setTab(k)} style={{ ...styles.tab, ...(tab === k ? styles.tabOn : styles.tabOff) }}>
              {k}
            </button>
          ))}
        </div>

        <div style={styles.selectedBar}>
          <div style={styles.selectedLeft}>
            <div style={styles.selectedTitle}>Selecionados</div>
            <div style={styles.selectedCount}>{selected.length} exercícios</div>
          </div>
          <button style={styles.clearBtn} onClick={clearAll} disabled={selected.length === 0}>Limpar</button>
        </div>

        {selected.length ? (
          <div style={styles.selectedChips}>
            {selected.slice(0, 20).map((name) => (
              <button key={name} style={styles.selChip} onClick={() => remove(name)}>
                <span style={styles.selChipDot} />
                <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
                <span style={styles.selChipX}>×</span>
              </button>
            ))}
          </div>
        ) : (
          <div style={styles.selectedEmpty}>Nenhum selecionado ainda.</div>
        )}

        <div style={styles.list}>
          {list.map((item) => {
            const isOn = selectedSet.has(item.name);
            return (
              <div key={item.name} style={styles.row}>
                <div style={{ minWidth: 0 }}>
                  <div style={styles.rowName}>{item.name}</div>
                  <div style={styles.rowSub}>{item.key}</div>
                </div>

                {!isOn ? (
                  <button style={styles.addBtn} onClick={() => add(item.name)}>+ Adicionar</button>
                ) : (
                  <button style={styles.addBtnOn} onClick={() => remove(item.name)}>✓ Remover</button>
                )}
              </div>
            );
          })}
          {list.length === 0 ? <div style={styles.listEmpty}>Nada encontrado.</div> : null}
        </div>

        <div style={styles.sheetActions}>
          <button style={styles.sheetGhost} onClick={onClose}>Voltar</button>
          <button style={styles.sheetMain} onClick={apply}>Aplicar</button>
        </div>
        <div style={styles.safeBottom} />
      </div>
    </div>
  );
}

/* ---------------------------
   ESTILOS (copiados / adaptados)
   --------------------------- */

const styles = {
  page: { padding: 18, paddingBottom: 120, background: BG, minHeight: "100vh", position: "relative", overflowX: "hidden" },
  header: { display: "flex", alignItems: "center", gap: 12, marginBottom: 12 },
  backBtn: {
    width: 44, height: 44, borderRadius: 12, border: "none", background: "rgba(15,23,42,.06)", color: TEXT, fontWeight: 950, fontSize: 16, flexShrink: 0
  },
  hTitle: { fontSize: 18, fontWeight: 950, color: TEXT },
  hSub: { fontSize: 12, color: MUTED },

  searchCard: { marginTop: 8, marginBottom: 12, background: "rgba(255,255,255,.92)", padding: 14, borderRadius: 16, boxShadow: "0 10px 30px rgba(15,23,42,.06)" },
  inputSearch: { width: "100%", padding: 12, borderRadius: 12, border: "1px solid rgba(15,23,42,.08)", outline: "none", fontWeight: 900, color: TEXT },

  studentCard: { marginTop: 10, padding: 12, borderRadius: 12, background: "rgba(255,255,255,.96)", border: "1px solid rgba(15,23,42,.06)" },
  studentRow: { display: "flex", alignItems: "center", gap: 12 },
  avatarFallback: { width: 56, height: 56, borderRadius: 12, background: "rgba(15,23,42,.06)", display: "grid", placeItems: "center", fontWeight: 950, color: TEXT, fontSize: 20 },
  studentName: { fontSize: 16, fontWeight: 950 },
  studentEmail: { fontSize: 13, color: MUTED },

  msg: { marginTop: 8, fontSize: 13, color: MUTED },

  card: { marginTop: 12, borderRadius: 16, padding: 14, background: "rgba(255,255,255,.92)", border: "1px solid rgba(15,23,42,.06)", boxShadow: "0 14px 40px rgba(15,23,42,.06)" },
  cardTitle: { fontSize: 15, fontWeight: 950, color: TEXT },

  dayBtn: { padding: 8, borderRadius: 12, border: "1px solid rgba(15,23,42,.06)", background: "#fff", fontWeight: 900 },
  dayBtnOn: { background: ORANGE, color: "#111", border: "none", boxShadow: "0 12px 34px rgba(255,106,0,.18)" },

  daysGrid: { marginTop: 12, display: "grid", gap: 12 },
  dayCard: { borderRadius: 14, padding: 12, background: "linear-gradient(135deg, rgba(255,255,255,.75), rgba(255,106,0,.04))", border: "1px solid rgba(15,23,42,.06)" },
  dayTop: { display: "flex", gap: 12, alignItems: "center" },
  badge: { width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, rgba(255,106,0,.95), rgba(255,106,0,.6))", color: "#fff", display: "grid", placeItems: "center", fontWeight: 950 },
  dayLabel: { fontSize: 14, fontWeight: 950, color: TEXT },
  daySub: { fontSize: 12, color: MUTED },

  appleBtn: { marginLeft: "auto", padding: "8px 10px", borderRadius: 12, background: "rgba(255,255,255,.8)", border: "1px solid rgba(255,106,0,.14)", fontWeight: 950 },
  select: { marginTop: 8, width: "100%", padding: 10, borderRadius: 10, border: "1px solid rgba(15,23,42,.08)", outline: "none" },

  presRow: { marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 },
  presBox: { borderRadius: 10, padding: 8, background: "#fff", border: "1px solid rgba(15,23,42,.06)" },
  presLabel: { fontSize: 11, fontWeight: 800, color: MUTED },
  input: { marginTop: 6, width: "100%", padding: "8px 8px", borderRadius: 8, border: "1px solid rgba(15,23,42,.08)", outline: "none", fontWeight: 900 },

  pickPreview: { marginTop: 12, borderRadius: 12, padding: 10, background: "rgba(255,106,0,.06)", border: "1px solid rgba(255,106,0,.12)" },
  pickPreviewTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  previewTitle: { fontSize: 12, fontWeight: 900, color: TEXT },
  previewCount: { fontSize: 12, fontWeight: 900, color: ORANGE },
  previewEmpty: { marginTop: 8, fontSize: 12, color: MUTED },

  previewChips: { marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" },
  chip: { padding: "8px 10px", borderRadius: 999, background: "rgba(255,255,255,.9)", border: "1px solid rgba(15,23,42,.06)", fontWeight: 900, cursor: "pointer" },
  moreChip: { padding: "8px 10px", borderRadius: 999, background: "rgba(15,23,42,.06)", fontWeight: 950 },

  actions: { marginTop: 12, display: "grid", gap: 10 },
  save: { padding: 12, borderRadius: 12, border: "none", background: "linear-gradient(135deg,#FF6A00,#FF8A3D)", color: "#111", fontWeight: 950 },
  reset: { padding: 12, borderRadius: 12, border: "1px solid rgba(15,23,42,.08)", background: "#fff", fontWeight: 950 },

  /* SHEET / PICKER styles: reutilizáveis (copiados do seu design) */
  sheetOverlay: { position: "fixed", inset: 0, background: "rgba(2,6,23,.38)", zIndex: 9999, display: "grid", alignItems: "end", padding: 12 },
  sheet: { width: "100%", maxWidth: 640, margin: "0 auto", borderRadius: 16, background: "rgba(255,255,255,.96)", padding: 12, maxHeight: "88vh", overflow: "hidden" },
  sheetTop: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" },
  sheetTitle: { fontSize: 16, fontWeight: 950, color: TEXT },
  sheetSub: { marginTop: 4, fontSize: 12, color: MUTED },

  sheetClose: { width: 36, height: 36, borderRadius: 10, border: "1px solid rgba(15,23,42,.08)", background: "rgba(255,255,255,.75)", fontWeight: 950 },

  searchWrap: { marginTop: 12, borderRadius: 12, border: "1px solid rgba(15,23,42,.08)", background: "rgba(255,255,255,.75)", padding: 10, display: "flex", alignItems: "center", gap: 8 },
  searchIcon: { fontWeight: 950, color: MUTED }, search: { border: "none", outline: "none", width: "100%", background: "transparent", fontWeight: 900, color: TEXT }, searchClear: { border: "none", background: ORANGE_SOFT, color: ORANGE, fontWeight: 900, padding: "6px 8px", borderRadius: 999 },

  tabsRow: { marginTop: 12, display: "flex", gap: 8, overflowX: "auto" }, tab: { border: "none", padding: "8px 10px", borderRadius: 999, fontWeight: 900 }, tabOn: { background: "rgba(255,106,0,.12)", border: "1px solid rgba(255,106,0,.22)", color: ORANGE }, tabOff: { background: "rgba(15,23,42,.05)" },

  selectedBar: { marginTop: 12, borderRadius: 12, padding: 10, background: "rgba(255,106,0,.06)", display: "flex", justifyContent: "space-between", alignItems: "center" },
  selectedLeft: { display: "flex", flexDirection: "column" }, selectedTitle: { fontSize: 12, fontWeight: 900 }, selectedCount: { fontSize: 12, fontWeight: 900, color: ORANGE },
  clearBtn: { border: "1px solid rgba(255,106,0,.22)", background: "rgba(255,255,255,.75)", padding: "8px 10px", borderRadius: 10 },

  selectedChips: { marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8, maxHeight: 120, overflow: "auto" },
  selChip: { display: "flex", alignItems: "center", gap: 8, borderRadius: 999, border: "1px solid rgba(15,23,42,.08)", background: "rgba(255,255,255,.9)", padding: "8px 10px", fontWeight: 900 },
  selChipDot: { width: 10, height: 10, borderRadius: 999, background: ORANGE }, selChipX: { marginLeft: 6 },

  list: { marginTop: 12, borderRadius: 12, border: "1px solid rgba(15,23,42,.06)", background: "rgba(255,255,255,.9)", overflow: "auto", maxHeight: "38vh" },
  row: { padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, borderBottom: "1px solid rgba(15,23,42,.06)" },
  rowName: { fontSize: 13, fontWeight: 900, color: TEXT }, rowSub: { fontSize: 11, color: MUTED },

  addBtn: { border: "none", background: "linear-gradient(135deg, rgba(255,106,0,1), rgba(255,138,61,1))", color: "#111", padding: "8px 10px", borderRadius: 999, fontWeight: 900 },
  addBtnOn: { border: "1px solid rgba(15,23,42,.08)", background: "rgba(15,23,42,.06)", color: TEXT, padding: "8px 10px", borderRadius: 999 },

  listEmpty: { padding: 12, fontSize: 13, color: MUTED },

  sheetActions: { marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  sheetGhost: { padding: 10, borderRadius: 10, border: "1px solid rgba(15,23,42,.08)", background: "rgba(255,255,255,.9)" },
  sheetMain: { padding: 10, borderRadius: 10, border: "none", background: "linear-gradient(135deg,#FF6A00,#FF8A3D)", color: "#111" },

  safeBottom: { height: "calc(10px + env(safe-area-inset-bottom))" },

  /* GIF sheet */
  sheetGif: { background: "rgba(255,255,255,.96)", borderRadius: 12, padding: 12, maxWidth: 720, margin: "0 auto" },
};
