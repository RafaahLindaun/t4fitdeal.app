import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ORANGE = "#FF6A00";
const BG = "#f8fafc";
const TEXT = "#0f172a";
const MUTED = "#64748b";
const BORDER = "rgba(15,23,42,.08)";

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

const MUSCLE_GROUPS = [
  { id: "peito_triceps", name: "Peito + Tríceps" },
  { id: "costas_biceps", name: "Costas + Bíceps" },
  { id: "pernas", name: "Pernas (Quad + geral)" },
  { id: "posterior_gluteo", name: "Posterior + Glúteo" },
  { id: "ombro_core", name: "Ombro + Core" },
  { id: "fullbody", name: "Full body (saúde / base)" },
];

const PRESETS = [
  { id: "Hipertrofia", sets: 4, reps: "6–12", rest: "75–120s" },
  { id: "Força", sets: 5, reps: "3–6", rest: "120–180s" },
  { id: "Saúde", sets: 3, reps: "10–15", rest: "60–90s" },
];

export default function TreinoPersonalizar() {
  const nav = useNavigate();
  const { user } = useAuth();
  const email = (user?.email || "anon").toLowerCase();

  const paid = localStorage.getItem(`paid_${email}`) === "1";
  const key = `custom_split_${email}`;

  const existing = useMemo(() => safeJsonParse(localStorage.getItem(key), null), [key]);

  const [days, setDays] = useState(() => clamp(Number(existing?.days || 3), 2, 6));
  const [splitId, setSplitId] = useState(() => String(existing?.splitId || "Hipertrofia"));

  const [dayGroups, setDayGroups] = useState(() => {
    const arr = Array.isArray(existing?.dayGroups) ? existing.dayGroups : [];
    const out = [];
    for (let i = 0; i < clamp(Number(existing?.days || 3), 2, 6); i++) out.push(arr[i] || arr[i % arr.length] || "fullbody");
    return out;
  });

  const [prescriptions, setPrescriptions] = useState(() => {
    // {0:{sets,reps,rest}, 1:{...}}
    return existing?.prescriptions && typeof existing.prescriptions === "object" ? existing.prescriptions : {};
  });

  // ao mudar days, ajusta dayGroups sem perder o que já foi setado
  function applyDays(nextDays) {
    const d = clamp(Number(nextDays), 2, 6);
    setDays(d);

    setDayGroups((prev) => {
      const out = [];
      for (let i = 0; i < d; i++) out.push(prev[i] || prev[i % prev.length] || "fullbody");
      return out;
    });
  }

  function presetFor(id) {
    return PRESETS.find((p) => p.id === id) || PRESETS[0];
  }

  function applyPresetToAll(presetId) {
    setSplitId(presetId);
    const p = presetFor(presetId);

    const next = {};
    for (let i = 0; i < days; i++) next[i] = { sets: p.sets, reps: p.reps, rest: p.rest };
    setPrescriptions(next);
  }

  function setDayGroup(i, gid) {
    setDayGroups((prev) => {
      const n = [...prev];
      n[i] = gid;
      return n;
    });
  }

  function setDayPrescription(i, patch) {
    setPrescriptions((prev) => {
      const cur = prev[i] || presetFor(splitId);
      return { ...prev, [i]: { ...cur, ...patch } };
    });
  }

  function save() {
    const normalizedDays = clamp(days, 2, 6);
    const dg = [];
    for (let i = 0; i < normalizedDays; i++) dg.push(dayGroups[i] || "fullbody");

    // garante prescription por dia
    const p = presetFor(splitId);
    const pr = {};
    for (let i = 0; i < normalizedDays; i++) {
      const cur = prescriptions[i] || {};
      pr[i] = {
        sets: Number(cur.sets || p.sets),
        reps: String(cur.reps || p.reps),
        rest: String(cur.rest || p.rest),
      };
    }

    localStorage.setItem(
      key,
      JSON.stringify({
        splitId,
        days: normalizedDays,
        dayGroups: dg,
        prescriptions: pr,
      })
    );

    nav("/treino");
  }

  function clearCustom() {
    localStorage.removeItem(key);
    nav("/treino");
  }

  if (!paid) {
    return (
      <div style={S.page}>
        <div style={S.card}>
          <div style={S.title}>Personalização</div>
          <div style={S.sub}>Assine para liberar personalização do treino.</div>
          <button style={S.primary} onClick={() => nav("/planos")} type="button">
            Ver planos
          </button>
          <button style={S.ghost} onClick={() => nav("/treino")} type="button">
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <div style={S.header}>
        <button style={S.back} onClick={() => nav("/treino")} type="button">
          ←
        </button>
        <div>
          <div style={S.kicker}>Treino</div>
          <div style={S.hTitle}>Personalizar split</div>
          <div style={S.hSub}>Isso altera o Treino e o TreinoDetalhe automaticamente.</div>
        </div>
      </div>

      <div style={S.card}>
        <div style={S.row}>
          <div>
            <div style={S.label}>Dias por semana</div>
            <div style={S.help}>Entre 2 e 6.</div>
          </div>

          <select value={days} onChange={(e) => applyDays(e.target.value)} style={S.select}>
            {[2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n} dias
              </option>
            ))}
          </select>
        </div>

        <div style={{ height: 12 }} />

        <div style={S.label}>Preset (aplica sets/reps/rest)</div>
        <div style={S.grid2}>
          {PRESETS.map((p) => {
            const on = splitId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPresetToAll(p.id)}
                style={{ ...S.preset, ...(on ? S.presetOn : S.presetOff) }}
              >
                <div style={S.presetTitle}>{p.id}</div>
                <div style={S.presetSub}>
                  {p.sets} séries • {p.reps} • {p.rest}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {Array.from({ length: days }).map((_, i) => {
        const curGroup = dayGroups[i] || "fullbody";
        const curPres = prescriptions[i] || presetFor(splitId);

        return (
          <div key={i} style={S.card}>
            <div style={S.dayTitle}>Dia {i + 1}</div>

            <div style={S.row}>
              <div style={{ minWidth: 0 }}>
                <div style={S.label}>Grupo muscular</div>
                <div style={S.help}>Isso define os exercícios do dia.</div>
              </div>

              <select value={curGroup} onChange={(e) => setDayGroup(i, e.target.value)} style={S.select}>
                {MUSCLE_GROUPS.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={S.grid3}>
              <div>
                <div style={S.label}>Séries</div>
                <input
                  value={curPres.sets}
                  onChange={(e) => setDayPrescription(i, { sets: clamp(Number(e.target.value || 0), 1, 12) })}
                  style={S.input}
                  inputMode="numeric"
                />
              </div>

              <div>
                <div style={S.label}>Reps</div>
                <input value={curPres.reps} onChange={(e) => setDayPrescription(i, { reps: e.target.value })} style={S.input} />
              </div>

              <div>
                <div style={S.label}>Descanso</div>
                <input value={curPres.rest} onChange={(e) => setDayPrescription(i, { rest: e.target.value })} style={S.input} />
              </div>
            </div>
          </div>
        );
      })}

      <div style={{ height: 10 }} />

      <div style={S.actions}>
        <button style={S.primary} onClick={save} type="button">
          Salvar
        </button>
        <button style={S.ghost} onClick={clearCustom} type="button" title="Volta pro treino padrão">
          Remover custom
        </button>
      </div>

      <div style={{ height: 30 }} />
    </div>
  );
}

const S = {
  page: { padding: 18, background: BG, minHeight: "100vh" },

  header: {
    borderRadius: 24,
    padding: 16,
    background: "linear-gradient(135deg, rgba(255,106,0,.16), rgba(255,255,255,.95))",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 18px 60px rgba(15,23,42,.08)",
    display: "flex",
    gap: 12,
    alignItems: "center",
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 16,
    border: `1px solid ${BORDER}`,
    background: "rgba(255,255,255,.92)",
    fontWeight: 950,
  },
  kicker: { fontSize: 11, fontWeight: 900, color: MUTED, textTransform: "uppercase", letterSpacing: 0.8 },
  hTitle: { marginTop: 6, fontSize: 20, fontWeight: 950, color: TEXT, letterSpacing: -0.6 },
  hSub: { marginTop: 6, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35 },

  card: {
    marginTop: 12,
    borderRadius: 24,
    padding: 16,
    background: "#fff",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 14px 44px rgba(15,23,42,.06)",
  },

  title: { fontSize: 18, fontWeight: 950, color: TEXT },
  sub: { marginTop: 6, fontSize: 13, fontWeight: 850, color: MUTED, lineHeight: 1.35 },

  dayTitle: { fontSize: 14, fontWeight: 950, color: TEXT, marginBottom: 10 },

  row: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" },
  label: { fontSize: 12, fontWeight: 900, color: MUTED },
  help: { marginTop: 4, fontSize: 12, fontWeight: 800, color: "#475569" },

  select: {
    padding: "12px 12px",
    borderRadius: 16,
    border: `1px solid ${BORDER}`,
    background: "rgba(255,255,255,.98)",
    fontWeight: 900,
    color: TEXT,
    minWidth: 150,
  },
  input: {
    width: "100%",
    marginTop: 6,
    padding: "12px 12px",
    borderRadius: 16,
    border: `1px solid ${BORDER}`,
    fontWeight: 900,
    color: TEXT,
    outline: "none",
    background: "rgba(255,255,255,.98)",
  },

  grid2: { marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 },
  preset: { borderRadius: 18, padding: 12, border: `1px solid ${BORDER}`, textAlign: "left" },
  presetOn: { background: "rgba(255,106,0,.14)", border: "1px solid rgba(255,106,0,.28)" },
  presetOff: { background: "rgba(15,23,42,.03)" },
  presetTitle: { fontSize: 13, fontWeight: 950, color: TEXT },
  presetSub: { marginTop: 6, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35 },

  grid3: { marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 },

  actions: { marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  primary: {
    padding: 14,
    borderRadius: 20,
    border: "none",
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    color: "#111",
    fontWeight: 950,
    boxShadow: "0 18px 55px rgba(255,106,0,.22)",
  },
  ghost: {
    padding: 14,
    borderRadius: 20,
    border: `1px solid ${BORDER}`,
    background: "rgba(255,255,255,.92)",
    color: TEXT,
    fontWeight: 950,
  },
};
