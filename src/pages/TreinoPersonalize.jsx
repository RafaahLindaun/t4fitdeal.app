import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ORANGE = "#FF6A00";
const BG = "#f8fafc";
const TEXT = "#0f172a";
const MUTED = "#64748b";

const SPLITS = [
  { id: "AB", days: 2, label: "AB (2 dias)" },
  { id: "ABC", days: 3, label: "ABC (3 dias)" },
  { id: "ABCD", days: 4, label: "ABCD (4 dias)" },
  { id: "ABCDE", days: 5, label: "ABCDE (5 dias)" },
  { id: "ABCDEF", days: 6, label: "ABCDEF (6 dias)" },
];

const MUSCLE_GROUPS = [
  {
    id: "peito_triceps",
    name: "Peito + Tríceps",
    muscles: ["Peito", "Tríceps", "Ombro ant."],
    default: { sets: 4, reps: "6–12", rest: "75–120s" },
    library: [
      { name: "Supino reto", group: "Peito" },
      { name: "Supino inclinado", group: "Peito" },
      { name: "Crucifixo / Peck-deck", group: "Peito" },
      { name: "Crossover", group: "Peito" },
      { name: "Tríceps corda", group: "Tríceps" },
      { name: "Tríceps francês", group: "Tríceps" },
    ],
  },
  {
    id: "costas_biceps",
    name: "Costas + Bíceps",
    muscles: ["Costas", "Bíceps", "Ombro post."],
    default: { sets: 4, reps: "8–12", rest: "75–120s" },
    library: [
      { name: "Puxada (barra/puxador)", group: "Costas" },
      { name: "Remada (máquina/curvada)", group: "Costas" },
      { name: "Remada unilateral", group: "Costas" },
      { name: "Face pull", group: "Ombro/escápulas" },
      { name: "Rosca direta", group: "Bíceps" },
      { name: "Rosca martelo", group: "Bíceps" },
    ],
  },
  {
    id: "pernas",
    name: "Pernas (Quad + geral)",
    muscles: ["Quadríceps", "Glúteos", "Panturrilha"],
    default: { sets: 4, reps: "8–15", rest: "75–150s" },
    library: [
      { name: "Agachamento", group: "Pernas" },
      { name: "Leg press", group: "Pernas" },
      { name: "Cadeira extensora", group: "Quadríceps" },
      { name: "Afundo / passada", group: "Glúteo/Quadríceps" },
      { name: "Panturrilha", group: "Panturrilha" },
      { name: "Core (prancha)", group: "Core" },
    ],
  },
  {
    id: "posterior_gluteo",
    name: "Posterior + Glúteo",
    muscles: ["Posterior", "Glúteos", "Core"],
    default: { sets: 4, reps: "8–12", rest: "75–150s" },
    library: [
      { name: "Terra romeno", group: "Posterior" },
      { name: "Mesa flexora", group: "Posterior" },
      { name: "Hip thrust", group: "Glúteo" },
      { name: "Abdução", group: "Glúteo médio" },
      { name: "Passada (foco glúteo)", group: "Glúteo" },
      { name: "Core (dead bug)", group: "Core" },
    ],
  },
  {
    id: "ombro_core",
    name: "Ombro + Core",
    muscles: ["Ombros", "Trapézio", "Core"],
    default: { sets: 3, reps: "10–15", rest: "60–90s" },
    library: [
      { name: "Desenvolvimento", group: "Ombros" },
      { name: "Elevação lateral", group: "Ombros" },
      { name: "Posterior (reverse)", group: "Ombro posterior" },
      { name: "Encolhimento", group: "Trapézio" },
      { name: "Pallof press", group: "Core" },
      { name: "Abdominal", group: "Core" },
    ],
  },
  {
    id: "fullbody",
    name: "Full body (seguro / saúde)",
    muscles: ["Corpo todo"],
    default: { sets: 3, reps: "10–15", rest: "45–90s" },
    library: [
      { name: "Agachamento (leve)", group: "Pernas" },
      { name: "Supino (leve)", group: "Peito" },
      { name: "Remada (leve)", group: "Costas" },
      { name: "Desenvolvimento (leve)", group: "Ombros" },
      { name: "Posterior (leve)", group: "Posterior" },
      { name: "Core (prancha)", group: "Core" },
    ],
  },
];

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function dayLetter(i) {
  const letters = ["A", "B", "C", "D", "E", "F"];
  return letters[i % letters.length] || "A";
}

function pickDefaultSplit(days) {
  // default inteligente
  if (days <= 2) return ["fullbody", "fullbody"];
  if (days === 3) return ["peito_triceps", "costas_biceps", "pernas"];
  if (days === 4) return ["peito_triceps", "pernas", "costas_biceps", "posterior_gluteo"];
  if (days === 5) return ["peito_triceps", "costas_biceps", "pernas", "ombro_core", "posterior_gluteo"];
  return ["peito_triceps", "costas_biceps", "pernas", "ombro_core", "posterior_gluteo", "fullbody"];
}

function calcWeeklyVolume(daysConfig) {
  // soma sets por músculo “macro”
  const volume = {};
  for (const day of daysConfig) {
    const sets = Number(day?.prescription?.sets || 0) || 0;
    const g = day?.groupObj;
    if (!g) continue;
    // distribui sets pros “muscles” do grupo
    const muscles = Array.isArray(g.muscles) ? g.muscles : [];
    const share = muscles.length ? sets / muscles.length : 0;
    for (const m of muscles) {
      volume[m] = (volume[m] || 0) + share;
    }
  }
  // arredonda bonito
  const out = {};
  Object.keys(volume).forEach((k) => (out[k] = Math.round(volume[k] * 10) / 10));
  return out;
}

export default function TreinoPersonalize() {
  const nav = useNavigate();
  const { user } = useAuth();
  const email = (user?.email || "anon").toLowerCase();
  const paid = localStorage.getItem(`paid_${email}`) === "1";

  const storageKey = `custom_split_${email}`;

  // --------- não pagante ----------
  if (!paid) {
    return (
      <div style={S.page}>
        <div style={S.head}>
          <button style={S.back} onClick={() => nav("/treino")}>←</button>
          <div>
            <div style={S.hTitle}>Personalizar treino</div>
            <div style={S.hSub}>Disponível somente para assinantes.</div>
          </div>
        </div>

        <div style={S.lockCard}>
          <div style={S.lockIcon}>🔒</div>
          <div style={S.lockTitle}>Recurso exclusivo</div>
          <div style={S.lockText}>
            Assine para montar seu treino do seu jeito: split, músculos, séries, reps, descanso e volume semanal.
          </div>

          <button style={S.cta} onClick={() => nav("/planos")}>
            Ver planos
          </button>

          <button style={S.ghost} onClick={() => nav("/treino")}>
            Voltar
          </button>
        </div>
      </div>
    );
  }

  // --------- pagante ----------
  const saved = useMemo(() => {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : null;
  }, [storageKey]);

  const initialDays = saved?.days || Number(user?.frequencia || 4) || 4;
  const initialSplit = saved?.splitId || (initialDays === 2 ? "AB" : initialDays === 3 ? "ABC" : initialDays === 4 ? "ABCD" : initialDays === 5 ? "ABCDE" : "ABCDEF");

  const [daysPerWeek, setDaysPerWeek] = useState(clamp(initialDays, 2, 6));
  const [splitId, setSplitId] = useState(initialSplit);

  const [dayGroups, setDayGroups] = useState(() => {
    // se tiver salvo, usa; senão, default
    const base = saved?.dayGroups;
    if (Array.isArray(base) && base.length) return base;
    return pickDefaultSplit(clamp(initialDays, 2, 6));
  });

  const [prescriptions, setPrescriptions] = useState(() => {
    const base = saved?.prescriptions;
    if (base && typeof base === "object") return base;

    // default por grupo
    const obj = {};
    const baseGroups = pickDefaultSplit(clamp(initialDays, 2, 6));
    for (let i = 0; i < baseGroups.length; i++) {
      const g = MUSCLE_GROUPS.find((x) => x.id === baseGroups[i]);
      obj[i] = g?.default || { sets: 4, reps: "6–12", rest: "75–120s" };
    }
    return obj;
  });

  // sempre garantir que dayGroups tenha o tamanho certo quando mudar days/split
  function ensureDaysConfig(nextDays) {
    const n = clamp(nextDays, 2, 6);
    setDayGroups((prev) => {
      const base = Array.isArray(prev) ? [...prev] : [];
      if (base.length === n) return base;
      if (base.length < n) {
        const add = pickDefaultSplit(n).slice(base.length);
        return [...base, ...add];
      }
      return base.slice(0, n);
    });

    setPrescriptions((prev) => {
      const out = { ...(prev || {}) };
      for (let i = 0; i < n; i++) {
        if (!out[i]) {
          const gid = (Array.isArray(dayGroups) && dayGroups[i]) || pickDefaultSplit(n)[i];
          const g = MUSCLE_GROUPS.find((x) => x.id === gid);
          out[i] = g?.default || { sets: 4, reps: "6–12", rest: "75–120s" };
        }
      }
      // remove extras
      Object.keys(out).forEach((k) => {
        const idx = Number(k);
        if (idx >= n) delete out[k];
      });
      return out;
    });
  }

  function changeSplit(nextSplitId) {
    setSplitId(nextSplitId);
    const d = SPLITS.find((s) => s.id === nextSplitId)?.days || daysPerWeek;
    setDaysPerWeek(d);
    ensureDaysConfig(d);
  }

  function changeDays(d) {
    const next = clamp(d, 2, 6);
    setDaysPerWeek(next);

    // ajusta splitId coerente
    const map = next === 2 ? "AB" : next === 3 ? "ABC" : next === 4 ? "ABCD" : next === 5 ? "ABCDE" : "ABCDEF";
    setSplitId(map);
    ensureDaysConfig(next);
  }

  function setDayGroup(dayIndex, groupId) {
    setDayGroups((prev) => {
      const arr = [...prev];
      arr[dayIndex] = groupId;
      return arr;
    });

    // se trocar grupo, dá default de sets/reps/rest se ainda não mexeu muito
    setPrescriptions((prev) => {
      const out = { ...(prev || {}) };
      const g = MUSCLE_GROUPS.find((x) => x.id === groupId);
      out[dayIndex] = {
        sets: out[dayIndex]?.sets ?? g?.default?.sets ?? 4,
        reps: out[dayIndex]?.reps ?? g?.default?.reps ?? "6–12",
        rest: out[dayIndex]?.rest ?? g?.default?.rest ?? "75–120s",
      };
      return out;
    });
  }

  function setPrescription(dayIndex, patch) {
    setPrescriptions((prev) => {
      const out = { ...(prev || {}) };
      out[dayIndex] = { ...(out[dayIndex] || {}), ...patch };
      return out;
    });
  }

  const daysConfig = useMemo(() => {
    const n = clamp(daysPerWeek, 2, 6);
    const arr = [];
    for (let i = 0; i < n; i++) {
      const gid = dayGroups[i] || pickDefaultSplit(n)[i];
      const groupObj = MUSCLE_GROUPS.find((x) => x.id === gid);
      arr.push({
        dayIndex: i,
        letter: dayLetter(i),
        groupId: gid,
        groupObj,
        prescription: prescriptions[i] || groupObj?.default || { sets: 4, reps: "6–12", rest: "75–120s" },
      });
    }
    return arr;
  }, [daysPerWeek, dayGroups, prescriptions]);

  const weeklyVolume = useMemo(() => calcWeeklyVolume(daysConfig), [daysConfig]);

  function save() {
    const payload = {
      splitId,
      days: daysPerWeek,
      dayGroups,
      prescriptions,
      updatedAt: Date.now(),
    };
    localStorage.setItem(storageKey, JSON.stringify(payload));
    nav("/treino", { replace: true });
  }

  function reset() {
    const d = clamp(Number(user?.frequencia || 4) || 4, 2, 6);
    const sid = d === 2 ? "AB" : d === 3 ? "ABC" : d === 4 ? "ABCD" : d === 5 ? "ABCDE" : "ABCDEF";
    setDaysPerWeek(d);
    setSplitId(sid);
    setDayGroups(pickDefaultSplit(d));

    const obj = {};
    const base = pickDefaultSplit(d);
    for (let i = 0; i < base.length; i++) {
      const g = MUSCLE_GROUPS.find((x) => x.id === base[i]);
      obj[i] = g?.default || { sets: 4, reps: "6–12", rest: "75–120s" };
    }
    setPrescriptions(obj);
    localStorage.removeItem(storageKey);
  }

  return (
    <div style={S.page}>
      <div style={S.head}>
        <button style={S.back} onClick={() => nav("/treino")}>←</button>
        <div style={{ minWidth: 0 }}>
          <div style={S.hTitle}>Personalizar treino</div>
          <div style={S.hSub}>Monte seu split e seu volume semanal.</div>
        </div>
      </div>

      {/* CARD: Split */}
      <div style={S.card}>
        <div style={S.cardTitle}>1) Split</div>

        <div style={S.splitRow}>
          {SPLITS.map((s) => (
            <button
              key={s.id}
              onClick={() => changeSplit(s.id)}
              style={{
                ...S.pill,
                ...(splitId === s.id ? S.pillOn : S.pillOff),
              }}
            >
              {s.id}
            </button>
          ))}
        </div>

        <div style={S.smallNote}>
          Dias/semana:
          <div style={S.daysRow}>
            {[2, 3, 4, 5, 6].map((d) => (
              <button
                key={d}
                onClick={() => changeDays(d)}
                style={{
                  ...S.dayBtn,
                  ...(daysPerWeek === d ? S.dayOn : S.dayOff),
                }}
              >
                {d}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CARD: Dias */}
      <div style={S.card}>
        <div style={S.cardTitle}>2) Músculos por dia</div>

        <div style={S.daysGrid}>
          {daysConfig.map((d) => (
            <div key={d.dayIndex} style={S.dayCard}>
              <div style={S.dayTop}>
                <div style={S.badge}>{d.letter}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={S.dayLabel}>Dia {d.letter}</div>
                  <div style={S.daySub}>Escolha o foco do dia</div>
                </div>
              </div>

              <select
                value={d.groupId}
                onChange={(e) => setDayGroup(d.dayIndex, e.target.value)}
                style={S.select}
              >
                {MUSCLE_GROUPS.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>

              <div style={S.musclesLine}>
                {d.groupObj?.muscles?.join(" • ") || "—"}
              </div>

              <div style={S.presRow}>
                <div style={S.presBox}>
                  <div style={S.presLabel}>Séries</div>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={d.prescription.sets}
                    onChange={(e) => setPrescription(d.dayIndex, { sets: clamp(Number(e.target.value || 1), 1, 8) })}
                    style={S.input}
                  />
                </div>

                <div style={S.presBox}>
                  <div style={S.presLabel}>Reps</div>
                  <input
                    value={d.prescription.reps}
                    onChange={(e) => setPrescription(d.dayIndex, { reps: e.target.value })}
                    placeholder="ex: 6–12"
                    style={S.input}
                  />
                </div>

                <div style={S.presBox}>
                  <div style={S.presLabel}>Descanso</div>
                  <input
                    value={d.prescription.rest}
                    onChange={(e) => setPrescription(d.dayIndex, { rest: e.target.value })}
                    placeholder="ex: 75–120s"
                    style={S.input}
                  />
                </div>
              </div>

              <div style={S.previewBox}>
                <div style={S.previewTitle}>Prévia de exercícios</div>
                <div style={S.previewList}>
                  {(d.groupObj?.library || []).slice(0, 6).map((x, i) => (
                    <div key={i} style={S.previewItem}>
                      <span style={S.dot} />
                      <div style={{ minWidth: 0 }}>
                        <div style={S.previewName}>{x.name}</div>
                        <div style={S.previewSub}>{x.group}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CARD: Volume semanal */}
      <div style={S.card}>
        <div style={S.cardTitle}>3) Volume semanal (estimativa)</div>
        <div style={S.volGrid}>
          {Object.keys(weeklyVolume).length === 0 ? (
            <div style={S.volEmpty}>Defina os dias acima para ver o volume.</div>
          ) : (
            Object.entries(weeklyVolume).map(([m, v]) => (
              <div key={m} style={S.volCard}>
                <div style={S.volName}>{m}</div>
                <div style={S.volVal}>{v} sets/sem</div>
              </div>
            ))
          )}
        </div>

        <div style={S.volTip}>
          Dica: hipertrofia costuma responder bem a volume semanal consistente por músculo + progressão de carga ao longo das semanas.
        </div>
      </div>

      {/* Actions */}
      <div style={S.actions}>
        <button style={S.save} onClick={save}>Salvar</button>
        <button style={S.reset} onClick={reset}>Restaurar padrão</button>
      </div>

      <div style={{ height: 120 }} />
    </div>
  );
}

/* -------------------- styles (Apple clean) -------------------- */
const S = {
  page: { padding: 18, paddingBottom: 120, background: BG },

  head: {
    borderRadius: 24,
    padding: 16,
    background: "#fff",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 16px 50px rgba(15,23,42,.08)",
    display: "flex",
    gap: 12,
    alignItems: "center",
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 16,
    border: "none",
    background: "rgba(15,23,42,.06)",
    color: TEXT,
    fontWeight: 950,
    fontSize: 16,
  },
  hTitle: { fontSize: 18, fontWeight: 950, color: TEXT, letterSpacing: -0.4 },
  hSub: { marginTop: 4, fontSize: 12, fontWeight: 800, color: MUTED, lineHeight: 1.35 },

  card: {
    marginTop: 12,
    borderRadius: 24,
    padding: 16,
    background: "#fff",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
  },
  cardTitle: { fontSize: 16, fontWeight: 950, color: TEXT, letterSpacing: -0.3 },

  splitRow: { marginTop: 12, display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 },
  pill: {
    border: "none",
    padding: "10px 12px",
    borderRadius: 999,
    fontWeight: 950,
    whiteSpace: "nowrap",
    transition: "transform .12s ease",
  },
  pillOn: { background: "rgba(255,106,0,.14)", border: "1px solid rgba(255,106,0,.35)", color: ORANGE },
  pillOff: { background: "rgba(15,23,42,.04)", border: "1px solid rgba(15,23,42,.06)", color: TEXT },

  smallNote: { marginTop: 12, fontSize: 12, fontWeight: 900, color: MUTED },
  daysRow: { marginTop: 10, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 },
  dayBtn: { padding: 12, borderRadius: 18, border: "1px solid rgba(15,23,42,.08)", fontWeight: 950 },
  dayOn: { background: ORANGE, color: "#111", border: "none", boxShadow: "0 14px 34px rgba(255,106,0,.22)" },
  dayOff: { background: "#fff", color: TEXT },

  daysGrid: { marginTop: 12, display: "grid", gap: 12 },
  dayCard: {
    borderRadius: 22,
    padding: 16,
    background: "linear-gradient(135deg, rgba(15,23,42,.03), rgba(255,106,0,.05))",
    border: "1px solid rgba(15,23,42,.06)",
  },
  dayTop: { display: "flex", gap: 12, alignItems: "center" },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    background: "linear-gradient(135deg, rgba(255,106,0,.95), rgba(255,106,0,.60))",
    color: "#fff",
    fontWeight: 950,
    display: "grid",
    placeItems: "center",
  },
  dayLabel: { fontSize: 14, fontWeight: 950, color: TEXT },
  daySub: { marginTop: 2, fontSize: 12, fontWeight: 800, color: MUTED },

  select: {
    marginTop: 12,
    width: "100%",
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,.10)",
    outline: "none",
    fontWeight: 900,
    color: TEXT,
    background: "#fff",
  },
  musclesLine: { marginTop: 10, fontSize: 12, fontWeight: 800, color: MUTED, lineHeight: 1.35 },

  presRow: { marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 },
  presBox: { borderRadius: 18, padding: 12, background: "#fff", border: "1px solid rgba(15,23,42,.06)" },
  presLabel: { fontSize: 11, fontWeight: 950, color: MUTED },
  input: {
    marginTop: 6,
    width: "100%",
    padding: "12px 12px",
    borderRadius: 14,
    border: "1px solid rgba(15,23,42,.10)",
    outline: "none",
    fontWeight: 900,
    color: TEXT,
  },

  previewBox: {
    marginTop: 12,
    borderRadius: 18,
    padding: 14,
    background: "rgba(15,23,42,.03)",
    border: "1px solid rgba(15,23,42,.06)",
  },
  previewTitle: { fontSize: 12, fontWeight: 950, color: TEXT, opacity: 0.9 },
  previewList: { marginTop: 10, display: "grid", gap: 8 },
  previewItem: { display: "flex", gap: 10, alignItems: "flex-start" },
  dot: { width: 10, height: 10, borderRadius: 999, background: ORANGE, marginTop: 4, flexShrink: 0 },
  previewName: { fontSize: 13, fontWeight: 950, color: TEXT, lineHeight: 1.2 },
  previewSub: { marginTop: 2, fontSize: 11, fontWeight: 800, color: MUTED },

  volGrid: { marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  volCard: { borderRadius: 18, padding: 12, background: "#fff", border: "1px solid rgba(15,23,42,.06)" },
  volName: { fontSize: 12, fontWeight: 950, color: MUTED },
  volVal: { marginTop: 6, fontSize: 16, fontWeight: 950, color: TEXT, letterSpacing: -0.3 },
  volEmpty: { fontSize: 12, fontWeight: 800, color: MUTED },
  volTip: { marginTop: 10, fontSize: 12, fontWeight: 800, color: MUTED, lineHeight: 1.35 },

  actions: { marginTop: 12, display: "grid", gap: 10 },
  save: {
    width: "100%",
    padding: 14,
    borderRadius: 18,
    border: "none",
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    color: "#111",
    fontWeight: 950,
    boxShadow: "0 18px 50px rgba(255,106,0,.22)",
  },
  reset: {
    width: "100%",
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,.10)",
    background: "#fff",
    color: TEXT,
    fontWeight: 950,
  },

  lockCard: {
    marginTop: 12,
    borderRadius: 24,
    padding: 18,
    background: "linear-gradient(135deg, rgba(255,106,0,.16), rgba(15,23,42,.03))",
    border: "1px solid rgba(255,106,0,.22)",
    boxShadow: "0 18px 55px rgba(15,23,42,.12)",
    textAlign: "center",
  },
  lockIcon: { fontSize: 34 },
  lockTitle: { marginTop: 10, fontSize: 18, fontWeight: 950, color: TEXT },
  lockText: { marginTop: 8, fontSize: 13, fontWeight: 800, color: MUTED, lineHeight: 1.45 },
  cta: {
    marginTop: 14,
    width: "100%",
    padding: 14,
    borderRadius: 18,
    border: "none",
    background: ORANGE,
    color: "#111",
    fontWeight: 950,
    boxShadow: "0 18px 45px rgba(255,106,0,.22)",
  },
  ghost: {
    marginTop: 10,
    width: "100%",
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,.10)",
    background: "#fff",
    color: TEXT,
    fontWeight: 950,
  },
};
