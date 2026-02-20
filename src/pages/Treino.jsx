import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/* ---------------- utils ---------------- */
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

function mod(n, m) {
  if (!m) return 0;
  return ((n % m) + m) % m;
}

function dayLetter(i) {
  const letters = ["A", "B", "C", "D", "E", "F"];
  return letters[i % letters.length] || "A";
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function calcDayIndex(email) {
  const key = `treino_day_${email}`;
  const raw = localStorage.getItem(key);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) ? n : 0;
}

function bumpDayIndex(email, max) {
  const key = `treino_day_${email}`;
  const raw = localStorage.getItem(key);
  const n = raw ? Number(raw) : 0;
  const next = (Number.isFinite(n) ? n : 0) + 1;
  localStorage.setItem(key, String(next % Math.max(max, 1)));
}

/* ---------------- mapping (groupId -> nome) ---------------- */
const GROUP_LABEL = {
  peito_triceps: "Peito + Tríceps",
  costas_biceps: "Costas + Bíceps",
  pernas: "Pernas",
  posterior_gluteo: "Posterior + Glúteo",
  ombro_core: "Ombro + Core",
  fullbody: "Full body",
};

/* ---------------- NORMALIZA / CONVERTE dayExercises -> exercícios do treino ---------------- */
function uniq(arr) {
  const s = new Set();
  const out = [];
  for (const x of arr || []) {
    const v = String(x || "").trim();
    if (!v || s.has(v)) continue;
    s.add(v);
    out.push(v);
  }
  return out;
}

/**
 * ✅ FONTE ÚNICA REAL:
 * - Seu Personalizer salva em: custom_split_${email}
 * - Nós montamos split[] baseado em dayExercises (o que você escolheu)
 */
export function getTreinoPlan(email) {
  const e = String(email || "anon").toLowerCase();
  const storageKey = `custom_split_${e}`;
  const saved = safeJsonParse(localStorage.getItem(storageKey), null);

  // fallback mínimo caso não tenha nada salvo
  const fallback = {
    days: 3,
    dayGroups: ["peito_triceps", "costas_biceps", "pernas"],
    prescriptions: {
      0: { sets: 4, reps: "6–12", rest: "75–120s" },
      1: { sets: 4, reps: "8–12", rest: "75–120s" },
      2: { sets: 4, reps: "8–15", rest: "75–150s" },
    },
    dayExercises: {
      0: ["Supino reto com barra", "Tríceps corda"],
      1: ["Puxada frente (puxador)", "Rosca direta (barra)"],
      2: ["Agachamento livre", "Leg press 45°", "Panturrilha sentado"],
    },
  };

  const data = saved && typeof saved === "object" ? saved : fallback;

  const days = clamp(Number(data.days || 3) || 3, 2, 6);
  const dayGroups = Array.isArray(data.dayGroups) ? data.dayGroups.slice(0, days) : fallback.dayGroups;
  const prescriptions = data.prescriptions && typeof data.prescriptions === "object" ? data.prescriptions : fallback.prescriptions;
  const dayExercises = data.dayExercises && typeof data.dayExercises === "object" ? data.dayExercises : fallback.dayExercises;

  // monta split: array de dias, cada dia = array de objetos exercício
  const split = [];
  for (let i = 0; i < days; i++) {
    const groupId = dayGroups[i] || "fullbody";
    const groupLabel = GROUP_LABEL[groupId] || groupId;

    const pres = prescriptions?.[i] || { sets: 4, reps: "6–12", rest: "75–120s" };

    // ✅ aqui é o ponto-chave: usa dayExercises do personalizer
    const chosenNames = uniq(Array.isArray(dayExercises?.[i]) ? dayExercises[i] : []);

    const exList = chosenNames.map((name) => ({
      name,
      group: groupLabel,
      sets: pres.sets,
      reps: pres.reps,
      rest: pres.rest,
    }));

    split.push(exList);
  }

  return {
    days,
    splitId: data.splitId || null,
    dayGroups,
    prescriptions,
    dayExercises,
    split,
    updatedAt: data.updatedAt || null,
    source: "custom_split(dayExercises)",
  };
}

/* ---------------- UI ---------------- */
export default function Treino() {
  const nav = useNavigate();
  const { user } = useAuth();
  const email = (user?.email || "anon").toLowerCase();

  const paid = localStorage.getItem(`paid_${email}`) === "1";

  const plan = useMemo(() => getTreinoPlan(email), [email]);
  const split = plan?.split || [];

  const dayIndex = useMemo(() => calcDayIndex(email), [email]);
  const [viewIdx, setViewIdx] = useState(dayIndex);

  const safeIdx = useMemo(() => mod(viewIdx, split.length || 1), [viewIdx, split.length]);
  const viewingIsToday = safeIdx === mod(dayIndex, split.length || 1);

  const workout = useMemo(() => split?.[safeIdx] || [], [split, safeIdx]);

  function openDetalhe() {
    // TreinoDetalhe deve ler o mesmo getTreinoPlan(email) e usar ?d=
    nav(`/treino/detalhe?d=${safeIdx}`, { state: { from: "/treino" } });
  }

  function finishWorkout() {
    if (!viewingIsToday) return;

    bumpDayIndex(email, split.length || 1);

    const wkKey = `workout_${email}`;
    const today = todayKey();
    const list = safeJsonParse(localStorage.getItem(wkKey), []);
    const arr = Array.isArray(list) ? list : [];
    if (!arr.includes(today)) localStorage.setItem(wkKey, JSON.stringify([...arr, today]));

    nav("/dashboard");
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>Fonte: {plan?.source}</div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>
            Treino {dayLetter(safeIdx)} {viewingIsToday ? "• hoje" : ""}
          </div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>
            Exercícios: <b>{workout.length}</b>
          </div>
        </div>

        <button onClick={() => nav("/treino/personalizar")} style={{ padding: "10px 12px", borderRadius: 12 }}>
          Personalizar
        </button>
      </div>

      <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {split.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setViewIdx(idx)}
            style={{
              padding: "10px 12px",
              borderRadius: 999,
              border: idx === safeIdx ? "2px solid #ff6a00" : "1px solid #ddd",
              background: idx === safeIdx ? "rgba(255,106,0,.12)" : "#fff",
              fontWeight: 800,
            }}
          >
            Treino {dayLetter(idx)}
          </button>
        ))}
      </div>

      <button
        onClick={openDetalhe}
        style={{
          marginTop: 14,
          width: "100%",
          padding: 14,
          borderRadius: 16,
          background: "#ff6a00",
          color: "#111",
          fontWeight: 900,
          border: "none",
        }}
      >
        Abrir detalhes do Treino {dayLetter(safeIdx)}
      </button>

      <div style={{ marginTop: 14 }}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Prévia</div>

        {workout.length === 0 ? (
          <div style={{ padding: 12, borderRadius: 14, border: "1px solid #eee", opacity: 0.8 }}>
            Nenhum exercício salvo nesse dia.
            <div style={{ marginTop: 6, fontSize: 12 }}>
              Vá em <b>Personalizar</b> → “Escolher exercícios” → <b>Salvar</b>.
            </div>
          </div>
        ) : (
          workout.slice(0, 12).map((ex, i) => (
            <div key={i} style={{ padding: 12, borderRadius: 14, border: "1px solid #eee", marginBottom: 8 }}>
              <div style={{ fontWeight: 900 }}>{ex.name}</div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>
                {ex.group || "—"} • {ex.sets ?? 4} • {ex.reps ?? "6–12"} • {ex.rest ?? "75–120s"}
              </div>
            </div>
          ))
        )}
      </div>

      {paid ? (
        <button
          onClick={finishWorkout}
          disabled={!viewingIsToday}
          style={{
            marginTop: 14,
            width: "100%",
            padding: 14,
            borderRadius: 16,
            background: viewingIsToday ? "#0f172a" : "#94a3b8",
            color: "#fff",
            fontWeight: 900,
            border: "none",
          }}
          title={!viewingIsToday ? "Volte para hoje para concluir" : "Concluir"}
        >
          Concluir treino (avança o ciclo)
        </button>
      ) : (
        <div style={{ marginTop: 14, padding: 12, borderRadius: 14, background: "rgba(255,106,0,.10)" }}>
          Modo gratuito: assine para liberar treino completo/personalização.
        </div>
      )}
    </div>
  );
}
