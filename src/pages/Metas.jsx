import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const ORANGE = "#FF6A00";
const BG = "#f8fafc";
const TEXT = "#0f172a";
const MUTED = "#64748b";
const BORDER = "rgba(15,23,42,.08)";
const SOFT = "rgba(15,23,42,.04)";

const ICONS = {
  target: "/icons/goal-target-white.png",
  calendar: "/icons/goal-calendar-white.png",
  strength: "/icons/goal-strength-white.png",
  scale: "/icons/goal-scale-white.png",
  cardio: "/icons/goal-cardio-white.png",
  spark: "/icons/goal-spark-white.png",
};

function SafeIcon({ src, alt = "", size = 18 }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        style={{
          width: size,
          height: size,
          display: "grid",
          placeItems: "center",
          color: "#fff",
          fontWeight: 950,
          fontSize: Math.max(12, size - 4),
          lineHeight: 1,
        }}
      >
        ✓
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        display: "block",
      }}
    />
  );
}

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
}

function normalizeNumber(v) {
  const n = Number(String(v || "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function yyyyMmDd(d = new Date()) {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfWeekISO(d = new Date()) {
  const dt = new Date(d);
  const day = dt.getDay();
  const diff = (day === 0 ? -6 : 1) - day;

  dt.setDate(dt.getDate() + diff);
  dt.setHours(0, 0, 0, 0);

  return yyyyMmDd(dt);
}

function daysAgoKey(days) {
  const dt = new Date();
  dt.setDate(dt.getDate() - Number(days || 0));
  return yyyyMmDd(dt);
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function uniqueDates(list) {
  return Array.from(new Set((list || []).filter(Boolean))).sort();
}

function iconSrcFromGoal(g) {
  if (!g) return ICONS.target;
  if (g.type === "freq") return ICONS.calendar;
  if (g.type === "pr") return ICONS.strength;
  if (g.type === "peso") return ICONS.scale;
  if (g.type === "cardio") return ICONS.cardio;
  return ICONS.target;
}

function labelFromGoal(g) {
  if (!g) return "";

  if (g.type === "freq") return `${g.value} dias de frequência`;
  if (g.type === "pr") return `${g.value} kg no ${g.exercise || "exercício"}`;
  if (g.type === "peso") return `${g.value} kg de peso-alvo`;
  if (g.type === "cardio") return `${g.value} sessões de cardio/sem`;

  return g.title || "Meta";
}

function ensureGoalShape(g) {
  const meta = g?.meta && typeof g.meta === "object" ? g.meta : {};

  return {
    id: g?.id || uid(),
    catalogId: g?.catalogId ?? g?.catalog_id ?? meta.catalogId ?? null,
    type: g?.type || meta.type || "freq",
    value: Number(g?.value ?? meta.value ?? 0) || 0,
    exercise: g?.exercise || meta.exercise || null,
    title: g?.title || meta.title || null,
    createdAt: g?.createdAt || g?.created_at || Date.now(),
    status: g?.status || (g?.is_active === false ? "done" : "active"),
    isActive: g?.is_active !== false && String(g?.status || "active") !== "done",
    completedAt: g?.completedAt || g?.completed_at || null,

    days: Array.isArray(g?.days)
      ? g.days
      : Array.isArray(meta.days)
        ? meta.days
        : [],

    weekId: g?.weekId || g?.week_id || meta.weekId || startOfWeekISO(new Date()),
    weekCount: Number(g?.weekCount ?? g?.week_count ?? meta.weekCount ?? 0) || 0,

    cardioLog: Array.isArray(g?.cardioLog || g?.cardio_log)
      ? g?.cardioLog || g?.cardio_log
      : Array.isArray(meta.cardioLog)
        ? meta.cardioLog
        : [],

    bestKg: Number(g?.bestKg ?? g?.best_kg ?? meta.bestKg ?? 0) || 0,
    lastPrAt: g?.lastPrAt || g?.last_pr_at || meta.lastPrAt || null,

    currentWeight: Number(g?.currentWeight ?? g?.current_weight ?? meta.currentWeight ?? 0) || 0,
    startWeight: Number(g?.startWeight ?? g?.start_weight ?? meta.startWeight ?? 0) || 0,
    lastWeightAt: g?.lastWeightAt || g?.last_weight_at || meta.lastWeightAt || null,
    lastActionAt: g?.lastActionAt || g?.last_action_at || meta.lastActionAt || null,
  };
}

function toDbGoal(goal, userId) {
  const g = ensureGoalShape(goal);

  return {
    id: g.id,
    user_id: userId,
    catalog_id: g.catalogId,
    type: g.type,
    value: g.value,
    exercise: g.exercise,
    title: g.title,
    status: g.status,
    is_active: g.status !== "done",
    completed_at: g.completedAt ? new Date(g.completedAt).toISOString() : null,
    days: g.days || [],
    week_id: g.weekId,
    week_count: g.weekCount || 0,
    cardio_log: g.cardioLog || [],
    best_kg: g.bestKg || 0,
    last_pr_at: g.lastPrAt ? new Date(g.lastPrAt).toISOString() : null,
    current_weight: g.currentWeight || 0,
    start_weight: g.startWeight || 0,
    last_weight_at: g.lastWeightAt ? new Date(g.lastWeightAt).toISOString() : null,
    last_action_at: g.lastActionAt ? new Date(g.lastActionAt).toISOString() : null,
    meta: {
      catalogId: g.catalogId,
      type: g.type,
      value: g.value,
      exercise: g.exercise,
      title: g.title,
    },
  };
}

function progressOfGoal(g) {
  const goal = ensureGoalShape(g);

  if (goal.type === "freq") {
    const uniq = new Set(goal.days || []);
    return clamp(uniq.size, 0, goal.value || 0);
  }

  if (goal.type === "cardio") {
    const nowWeek = startOfWeekISO(new Date());
    if (goal.weekId !== nowWeek) return 0;
    return clamp(goal.weekCount || 0, 0, goal.value || 0);
  }

  if (goal.type === "pr") {
    const target = goal.value || 0;
    const best = goal.bestKg || 0;
    if (target <= 0) return 0;
    return clamp(best, 0, target);
  }

  if (goal.type === "peso") {
    const target = goal.value || 0;
    const cur = goal.currentWeight || 0;

    if (target <= 0 || cur <= 0) return 0;

    const distStart = Math.abs((goal.startWeight || cur) - target);
    const distNow = Math.abs(cur - target);

    if (distStart <= 0) return clamp(target, 0, target);

    const ratio = clamp(1 - distNow / distStart, 0, 1);
    return ratio * target;
  }

  return 0;
}

function isCompleted(g) {
  const goal = ensureGoalShape(g);

  if (goal.status === "done") return true;

  if (goal.type === "freq" || goal.type === "cardio") {
    const p = progressOfGoal(goal);
    return p >= (goal.value || 0);
  }

  if (goal.type === "pr") {
    return (goal.bestKg || 0) >= (goal.value || 0);
  }

  if (goal.type === "peso") {
    const target = goal.value || 0;
    const cur = goal.currentWeight || 0;

    if (target <= 0 || cur <= 0) return false;

    return Math.abs(cur - target) <= 0.3;
  }

  return false;
}

function mergedGoalWithDbProgress(goal, workoutDates, cardioDates) {
  const g = ensureGoalShape(goal);

  if (g.type === "freq") {
    const manual = Array.isArray(g.days) ? g.days : [];
    g.days = uniqueDates([...manual, ...(workoutDates || [])]);
  }

  if (g.type === "cardio") {
    const nowWeek = startOfWeekISO(new Date());
    const logs = uniqueDates([...(g.cardioLog || []), ...(cardioDates || [])]);

    g.cardioLog = logs.slice(-240).reverse();
    g.weekId = nowWeek;
    g.weekCount = logs.filter((d) => d >= nowWeek).length;
  }

  if (g.status !== "done" && isCompleted(g)) {
    g.status = "done";
    g.completedAt = g.completedAt || new Date().toISOString();
  }

  return g;
}

function remainingText(g) {
  const goal = ensureGoalShape(g);

  if (goal.type === "freq") {
    const done = progressOfGoal(goal);
    const left = Math.max(0, (goal.value || 0) - done);

    return left === 0 ? "Meta batida" : `Faltam ${left} dia${left === 1 ? "" : "s"}`;
  }

  if (goal.type === "cardio") {
    const done = progressOfGoal(goal);
    const left = Math.max(0, (goal.value || 0) - done);

    return left === 0 ? "Semana completa" : `Faltam ${left} sessão${left === 1 ? "" : "s"} nesta semana`;
  }

  if (goal.type === "pr") {
    const left = Math.max(0, (goal.value || 0) - (goal.bestKg || 0));
    return left === 0 ? "Alvo atingido" : `Faltam ${left} kg`;
  }

  if (goal.type === "peso") {
    const target = goal.value || 0;
    const cur = goal.currentWeight || 0;

    if (!cur) return "Registre seu peso para acompanhar";

    const diff = Math.round(Math.abs(cur - target) * 10) / 10;

    return diff <= 0.3 ? "Peso-alvo atingido" : `Distância: ${diff} kg`;
  }

  return "Progresso";
}

function whyThisMatters(g) {
  const goal = ensureGoalShape(g);

  if (goal.type === "freq") {
    return "Frequência cria o hábito. Hábito vira resultado. Cada treino concluído no app entra nessa contagem.";
  }

  if (goal.type === "cardio") {
    return "Cardio consistente melhora recuperação, disposição e saúde. As sessões salvas entram na semana automaticamente.";
  }

  if (goal.type === "pr") {
    return "PR é prova concreta do seu avanço. Bater o alvo valida seu treino e orienta o próximo ciclo.";
  }

  if (goal.type === "peso") {
    return "Acompanhar o peso com calma ajuda a ajustar o plano sem ansiedade.";
  }

  return "Concluir metas dá direção e clareza. Menos dúvida, mais execução.";
}

const GOALS_CATALOG = [
  {
    id: "g_freq_7",
    type: "freq",
    title: "Frequência",
    subtitle: "Começo rápido",
    value: 7,
    accent: "orange",
  },
  {
    id: "g_freq_30",
    type: "freq",
    title: "Frequência",
    subtitle: "Consistência",
    value: 30,
    accent: "soft",
  },
  {
    id: "g_freq_60",
    type: "freq",
    title: "Frequência",
    subtitle: "Disciplina",
    value: 60,
    accent: "orange",
  },
  {
    id: "g_freq_90",
    type: "freq",
    title: "Frequência",
    subtitle: "Transformação",
    value: 90,
    accent: "soft",
  },
  {
    id: "g_pr_supino_50",
    type: "pr",
    title: "PR — Supino",
    subtitle: "Força no peito",
    exercise: "Supino",
    value: 50,
    accent: "orange",
  },
  {
    id: "g_pr_supino_60",
    type: "pr",
    title: "PR — Supino",
    subtitle: "Meta forte",
    exercise: "Supino",
    value: 60,
    accent: "soft",
  },
  {
    id: "g_pr_agacho_80",
    type: "pr",
    title: "PR — Agachamento",
    subtitle: "Base de pernas",
    exercise: "Agachamento",
    value: 80,
    accent: "soft",
  },
  {
    id: "g_cardio_3",
    type: "cardio",
    title: "Cardio",
    subtitle: "Saúde e corte",
    value: 3,
    accent: "soft",
  },
  {
    id: "g_cardio_5",
    type: "cardio",
    title: "Turbo no shape",
    subtitle: "Cardio forte",
    value: 5,
    accent: "orange",
  },
];

export default function Metas() {
  const nav = useNavigate();
  const { user } = useAuth();

  const [active, setActive] = useState([]);
  const [workoutDates, setWorkoutDates] = useState([]);
  const [cardioDates, setCardioDates] = useState([]);
  const [customKg, setCustomKg] = useState("");
  const [customEx, setCustomEx] = useState("Supino");
  const [sheet, setSheet] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadWorkoutDates(userId) {
    try {
      const { data, error } = await supabase
        .from("workout_sessions")
        .select("session_date, completed, created_at")
        .eq("user_id", userId)
        .eq("completed", true)
        .order("session_date", { ascending: false });

      if (error) {
        console.error("loadWorkoutDates error:", error);
        return [];
      }

      return uniqueDates((data || []).map((row) => row.session_date || yyyyMmDd(row.created_at)));
    } catch (err) {
      console.error("loadWorkoutDates catch:", err);
      return [];
    }
  }

  async function loadCardioDates(userId) {
    try {
      const { data, error } = await supabase
        .from("cardio_sessions")
        .select("date_key, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("loadCardioDates error:", error);
        return [];
      }

      return uniqueDates((data || []).map((row) => row.date_key || yyyyMmDd(row.created_at)));
    } catch (err) {
      console.error("loadCardioDates catch:", err);
      return [];
    }
  }

  async function loadGoals() {
    if (!user?.id) {
      setActive([]);
      setWorkoutDates([]);
      setCardioDates([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const [goalsRes, workoutList, cardioList] = await Promise.all([
        supabase
          .from("user_goals")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),

        loadWorkoutDates(user.id),
        loadCardioDates(user.id),
      ]);

      if (goalsRes.error) {
        console.error("loadGoals error:", goalsRes.error);
        setActive([]);
      } else {
        const shaped = (goalsRes.data || []).map((row) =>
          mergedGoalWithDbProgress(row, workoutList, cardioList)
        );

        setActive(shaped);
      }

      setWorkoutDates(workoutList);
      setCardioDates(cardioList);
    } catch (err) {
      console.error("loadGoals catch:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const id = "metas-apple-keyframes";
    if (document.getElementById(id)) return;

    const style = document.createElement("style");
    style.id = id;

    style.innerHTML = `
      @keyframes toastIn {
        0% { opacity: 0; transform: translateY(-6px); }
        100% { opacity: 1; transform: translateY(0px); }
      }

      @keyframes sheetIn {
        0% { opacity: 0; transform: translateY(10px); }
        100% { opacity: 1; transform: translateY(0px); }
      }

      button:active {
        transform: scale(.99);
      }
    `;

    document.head.appendChild(style);
  }, []);

  async function persistAll(nextRaw) {
    const next = (nextRaw || []).map((g) => mergedGoalWithDbProgress(g, workoutDates, cardioDates));

    setActive(next);

    if (!user?.id) return;

    try {
      const payload = next.map((goal) => toDbGoal(goal, user.id));
      const nextIds = payload.map((x) => x.id);

      if (payload.length > 0) {
        const { error: upsertError } = await supabase
          .from("user_goals")
          .upsert(payload, { onConflict: "id" });

        if (upsertError) {
          console.error("persistAll upsert error:", upsertError);
          showToast("Erro", "Não foi possível salvar a meta no banco.");
          return;
        }
      }

      const oldIds = active.map((x) => x.id);
      const removedIds = oldIds.filter((id) => !nextIds.includes(id));

      if (removedIds.length > 0) {
        const { error: deleteError } = await supabase
          .from("user_goals")
          .delete()
          .eq("user_id", user.id)
          .in("id", removedIds);

        if (deleteError) {
          console.error("persistAll delete error:", deleteError);
        }
      }
    } catch (err) {
      console.error("persistAll catch:", err);
      showToast("Erro", "Falha ao salvar no Supabase.");
    }
  }

  function showToast(title, sub) {
    setToast({ title, sub });
    window.setTimeout(() => setToast(null), 2200);
  }

  async function insertGoal(goal) {
    const shaped = ensureGoalShape(goal);
    const next = [shaped, ...active].slice(0, 12);

    await persistAll(next);
    showToast("Meta ativada", labelFromGoal(shaped));
  }

  async function updateGoal(goalId, updater, toastTitle, toastSub) {
    const next = active.map((g) => {
      if (g.id !== goalId) return g;
      return ensureGoalShape(updater(ensureGoalShape(g)));
    });

    await persistAll(next);

    if (toastTitle) {
      showToast(toastTitle, toastSub);
    }
  }

  async function deleteGoal(goalId) {
    const next = active.filter((g) => g.id !== goalId);

    await persistAll(next);
    showToast("Removida", "Meta removida da lista");
  }

  function isActive(catalogId) {
    return active.some((g) => g.catalogId === catalogId && ensureGoalShape(g).status !== "done");
  }

  async function toggleCatalogGoal(item) {
    const on = isActive(item.id);

    if (on) {
      const next = active.filter((g) => g.catalogId !== item.id);
      await persistAll(next);
      return;
    }

    const goal = ensureGoalShape({
      id: uid(),
      catalogId: item.id,
      type: item.type,
      value: item.value,
      exercise: item.exercise,
      title: item.title,
      createdAt: new Date().toISOString(),
      status: "active",
    });

    if (goal.type === "cardio") {
      goal.weekId = startOfWeekISO(new Date());
      goal.weekCount = 0;
    }

    if (goal.type === "freq") {
      goal.days = uniqueDates(workoutDates);
    }

    await insertGoal(goal);
  }

  async function addCustomPR() {
    const kg = normalizeNumber(customKg);
    const ex = String(customEx || "").trim();

    if (!ex || kg <= 0) return;

    const goal = ensureGoalShape({
      id: uid(),
      catalogId: null,
      type: "pr",
      value: kg,
      exercise: ex,
      title: "PR",
      createdAt: new Date().toISOString(),
      status: "active",
    });

    await insertGoal(goal);
    setCustomKg("");
  }

  async function softComplete(goalId) {
    await updateGoal(
      goalId,
      (gg) => ({
        ...gg,
        status: "done",
        isActive: false,
        completedAt: new Date().toISOString(),
        lastActionAt: new Date().toISOString(),
      }),
      "Concluída",
      "Meta registrada como concluída"
    );
  }

  async function reactivate(goalId) {
    await updateGoal(
      goalId,
      (gg) => ({
        ...gg,
        status: "active",
        isActive: true,
        completedAt: null,
        lastActionAt: new Date().toISOString(),
        ...(gg.type === "cardio"
          ? {
              weekId: startOfWeekISO(new Date()),
              weekCount: 0,
            }
          : {}),
      }),
      "Reativada",
      "Meta voltou para Ativas"
    );
  }

  async function registerToday(goalId) {
    const today = yyyyMmDd(new Date());

    const next = active.map((g) => {
      if (g.id !== goalId) return g;

      const gg = ensureGoalShape(g);

      if (gg.type !== "freq") return gg;

      const set = new Set([...(gg.days || []), ...workoutDates]);
      set.add(today);

      gg.days = Array.from(set).sort().slice(-240);
      gg.lastActionAt = new Date().toISOString();

      if (isCompleted(gg)) {
        gg.status = "done";
        gg.completedAt = new Date().toISOString();
      }

      return gg;
    });

    await persistAll(next);
    showToast("Registrado", remainingText(next.find((x) => x.id === goalId)));
  }

  async function registerCardioSession(goalId) {
    const today = yyyyMmDd(new Date());
    const nowWeek = startOfWeekISO(new Date());

    const next = active.map((g) => {
      if (g.id !== goalId) return g;

      const gg = ensureGoalShape(g);

      if (gg.type !== "cardio") return gg;

      const log = uniqueDates([...(gg.cardioLog || []), ...cardioDates, today]);

      gg.cardioLog = log.slice(-240).reverse();
      gg.weekId = nowWeek;
      gg.weekCount = log.filter((d) => d >= nowWeek).length;
      gg.lastActionAt = new Date().toISOString();

      if (isCompleted(gg)) {
        gg.status = "done";
        gg.completedAt = new Date().toISOString();
      }

      return gg;
    });

    await persistAll(next);
    showToast("Sessão registrada", remainingText(next.find((x) => x.id === goalId)));
  }

  function openPRSheet(goalId) {
    const g = active.find((x) => x.id === goalId);
    const gg = ensureGoalShape(g);

    setSheet({
      goalId,
      kind: "pr",
      value: String(gg.bestKg || ""),
    });
  }

  async function savePR() {
    const v = normalizeNumber(sheet?.value);

    if (!sheet?.goalId || v <= 0) return;

    const targetId = sheet.goalId;

    const next = active.map((g) => {
      if (g.id !== targetId) return g;

      const gg = ensureGoalShape(g);

      gg.bestKg = Math.max(Number(gg.bestKg || 0), v);
      gg.lastPrAt = new Date().toISOString();
      gg.lastActionAt = new Date().toISOString();

      if (isCompleted(gg)) {
        gg.status = "done";
        gg.completedAt = new Date().toISOString();
      }

      return gg;
    });

    await persistAll(next);
    setSheet(null);
    showToast("PR registrado", remainingText(next.find((x) => x.id === targetId)));
  }

  const ranked = useMemo(() => {
    const last7 = daysAgoKey(6);
    const last30 = daysAgoKey(29);

    const workout7 = workoutDates.filter((d) => d >= last7).length;
    const workout30 = workoutDates.filter((d) => d >= last30).length;
    const cardioWeek = cardioDates.filter((d) => d >= startOfWeekISO(new Date())).length;
    const doneCount = active.filter((g) => ensureGoalShape(g).status === "done").length;

    const prScore = active
      .filter((g) => ensureGoalShape(g).type === "pr")
      .reduce((acc, raw) => {
        const g = ensureGoalShape(raw);
        const value = Math.max(1, g.value);
        const ratio = progressOfGoal(g) / value;

        return acc + Math.min(100, Math.round(ratio * 100));
      }, 0);

    const score = workout7 * 12 + workout30 * 3 + cardioWeek * 8 + doneCount * 40 + Math.round(prScore / 10);

    let level = "Bronze";

    if (score >= 320) level = "Elite";
    else if (score >= 220) level = "Ouro";
    else if (score >= 130) level = "Prata";

    return {
      score,
      level,
      workout7,
      workout30,
      cardioWeek,
      doneCount,
    };
  }, [active, workoutDates, cardioDates]);

  const activeList = useMemo(
    () => active.filter((g) => ensureGoalShape(g).status !== "done"),
    [active]
  );

  const doneList = useMemo(
    () => active.filter((g) => ensureGoalShape(g).status === "done"),
    [active]
  );

  return (
    <div style={S.page}>
      {toast ? (
        <div style={S.toast}>
          <div style={S.toastTitle}>{toast.title}</div>
          <div style={S.toastSub}>{toast.sub}</div>
        </div>
      ) : null}

      <section style={S.hero}>
        <button
          style={S.backBtn}
          onClick={() => nav("/dashboard")}
          aria-label="Voltar"
          type="button"
        >
          ←
        </button>

        <div style={S.heroText}>
          <div style={S.kicker}>Metas</div>
          <div style={S.title}>Metas</div>
          <div style={S.sub}>Ative, registre progresso e conclua. Tudo aparece no Dashboard.</div>
        </div>
      </section>

      <section style={S.rankCard}>
        <div style={S.rankTop}>
          <div>
            <div style={S.rankLabel}>Ranking FitDeal</div>
            <div style={S.rankTitle}>{ranked.level}</div>
            <div style={S.rankSub}>Pontuação baseada no banco do app.</div>
          </div>

          <div style={S.rankScore}>{ranked.score}</div>
        </div>

        <div style={S.rankGrid}>
          <div style={S.rankMini}>
            <b>{ranked.workout7}</b>
            <span>treinos/7d</span>
          </div>

          <div style={S.rankMini}>
            <b>{ranked.cardioWeek}</b>
            <span>cardio/sem</span>
          </div>

          <div style={S.rankMini}>
            <b>{ranked.doneCount}</b>
            <span>concluídas</span>
          </div>
        </div>
      </section>

      <section style={S.whyCard}>
        <div style={S.whyIcon}>
          <SafeIcon src={ICONS.spark} size={20} />
        </div>

        <div>
          <div style={S.whyTitle}>Por que concluir</div>
          <div style={S.whySub}>Clareza + direção</div>
          <div style={S.whyText}>
            Metas funcionam quando viram ação simples. Treinos concluídos e cardios salvos entram no progresso automaticamente.
          </div>
        </div>
      </section>

      <section style={S.section}>
        <div style={S.sectionHead}>
          <div style={S.sectionTitle}>Ativas</div>

          <button style={S.syncBtn} onClick={loadGoals} type="button">
            Atualizar
          </button>
        </div>

        {loading ? (
          <div style={S.emptyCard}>Carregando metas...</div>
        ) : activeList.length === 0 ? (
          <div style={S.emptyCard}>
            <div style={S.emptyTitle}>Sem metas ativas.</div>
            <div style={S.emptySub}>
              Escolha uma meta abaixo. Depois, registre progresso aqui com 1 toque.
            </div>
          </div>
        ) : (
          <div style={S.goalList}>
            {activeList.map((raw) => {
              const g = ensureGoalShape(mergedGoalWithDbProgress(raw, workoutDates, cardioDates));
              const p = progressOfGoal(g);
              const ratio = g.value > 0 ? clamp(p / g.value, 0, 1) : 0;
              const canComplete = isCompleted(g);

              return (
                <article key={g.id} style={S.goalCard}>
                  <div style={S.goalTop}>
                    <div style={S.goalIcon}>
                      <SafeIcon src={iconSrcFromGoal(g)} size={19} />
                    </div>

                    <div style={S.goalMain}>
                      <div style={S.goalTitle}>{labelFromGoal(g)}</div>
                      <div style={S.goalSub}>{remainingText(g)}</div>
                    </div>

                    <button
                      style={S.xBtn}
                      onClick={() => deleteGoal(g.id)}
                      aria-label="Remover"
                      type="button"
                    >
                      ✕
                    </button>
                  </div>

                  <div style={S.progressRow}>
                    <span>
                      {g.type === "pr"
                        ? `Melhor: ${g.bestKg || 0} kg • Alvo: ${g.value} kg`
                        : g.type === "cardio"
                          ? `Semana: ${Math.min(p, g.value)}/${g.value}`
                          : `Progresso: ${Math.min(Math.round(p), g.value)}/${g.value}`}
                    </span>

                    <b>{Math.round(ratio * 100)}%</b>
                  </div>

                  <div style={S.bar}>
                    <div style={{ ...S.fill, width: `${Math.round(ratio * 100)}%` }} />
                  </div>

                  <div style={S.reasonBox}>
                    <div style={S.reasonTitle}>Motivo</div>
                    <div style={S.reasonText}>{whyThisMatters(g)}</div>
                  </div>

                  <div style={S.actions}>
                    {g.type === "freq" ? (
                      <button style={S.primary} onClick={() => registerToday(g.id)} type="button">
                        Registrar hoje
                      </button>
                    ) : g.type === "cardio" ? (
                      <button style={S.primary} onClick={() => registerCardioSession(g.id)} type="button">
                        Registrar sessão
                      </button>
                    ) : g.type === "pr" ? (
                      <button style={S.primary} onClick={() => openPRSheet(g.id)} type="button">
                        Registrar PR
                      </button>
                    ) : (
                      <button style={S.primary} onClick={() => openPRSheet(g.id)} type="button">
                        Registrar
                      </button>
                    )}

                    {canComplete ? (
                      <button style={S.ghost} onClick={() => softComplete(g.id)} type="button">
                        Concluir
                      </button>
                    ) : (
                      <button style={S.ghost} onClick={() => nav("/dashboard")} type="button">
                        Ver no Dashboard
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {doneList.length > 0 ? (
        <section style={S.section}>
          <div style={S.sectionTitle}>Concluídas</div>

          <div style={S.doneList}>
            {doneList.slice(0, 10).map((raw) => {
              const g = ensureGoalShape(raw);
              const when = g.completedAt ? new Date(g.completedAt).toLocaleDateString("pt-BR") : "—";

              return (
                <div key={g.id} style={S.doneItem}>
                  <div>
                    <div style={S.doneTitle}>{labelFromGoal(g)}</div>
                    <div style={S.doneSub}>Concluída em {when}</div>
                  </div>

                  <button style={S.doneBtn} onClick={() => reactivate(g.id)} type="button">
                    Reativar
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section style={S.section}>
        <div style={S.sectionTitle}>Escolha rápida</div>

        <div style={S.catalogGrid}>
          {GOALS_CATALOG.map((item) => {
            const on = isActive(item.id);
            const isOrange = item.accent === "orange";

            return (
              <button
                key={item.id}
                onClick={() => toggleCatalogGoal(item)}
                type="button"
                style={{
                  ...S.catalogCard,
                  ...(isOrange ? S.catalogOrange : S.catalogSoft),
                  ...(on ? S.catalogOn : null),
                }}
              >
                <div style={S.catalogTop}>
                  <div style={S.catalogPill}>{on ? "Ativa" : "Ativar"}</div>
                </div>

                <div style={S.catalogTitle}>{item.title}</div>

                <div style={S.catalogValue}>
                  {item.type === "freq"
                    ? `${item.value} dias`
                    : item.type === "pr"
                      ? `${item.value} kg`
                      : `${item.value}x/sem`}
                </div>

                <div style={S.catalogSub}>
                  {item.type === "pr" ? item.exercise : item.subtitle}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section style={S.customCard}>
        <div>
          <div style={S.customTitle}>Meta personalizada</div>
          <div style={S.customSub}>PR (força)</div>
          <div style={S.customText}>
            Ex: “50 kg no supino”. Depois use “Registrar PR” para marcar avanço.
          </div>
        </div>

        <div style={S.customGrid}>
          <label style={S.label}>
            Exercício

            <select value={customEx} onChange={(e) => setCustomEx(e.target.value)} style={S.input}>
              <option>Supino</option>
              <option>Agachamento</option>
              <option>Levantamento terra</option>
              <option>Remada</option>
              <option>Desenvolvimento</option>
              <option>Rosca direta</option>
            </select>
          </label>

          <label style={S.label}>
            Kg

            <input
              value={customKg}
              onChange={(e) => setCustomKg(e.target.value)}
              inputMode="decimal"
              placeholder="50"
              style={S.input}
            />
          </label>
        </div>

        <button style={S.primaryWide} onClick={addCustomPR} type="button">
          Adicionar meta
        </button>
      </section>

      <button style={S.dashboardCard} onClick={() => nav("/dashboard")} type="button">
        <div>
          <div style={S.dashboardTitle}>Ver no Dashboard</div>
          <div style={S.dashboardSub}>As metas, ranking e progresso aparecem lá também.</div>
        </div>

        <div style={S.dashboardArrow}>›</div>
      </button>

      {sheet ? (
        <div style={S.sheetOverlay}>
          <button
            style={S.sheetBackdrop}
            onClick={() => setSheet(null)}
            type="button"
            aria-label="Fechar"
          />

          <div style={S.sheet}>
            <div style={S.sheetTop}>
              <div>
                <div style={S.sheetTitle}>Registrar PR</div>
                <div style={S.sheetSub}>Digite o maior peso que você atingiu (kg).</div>
              </div>

              <button
                style={S.sheetClose}
                onClick={() => setSheet(null)}
                aria-label="Fechar"
                type="button"
              >
                ✕
              </button>
            </div>

            <label style={S.label}>
              Kg atingido

              <input
                value={sheet.value}
                onChange={(e) => setSheet((s) => ({ ...s, value: e.target.value }))}
                inputMode="decimal"
                placeholder="Ex: 60"
                style={S.input}
                autoFocus
              />
            </label>

            <button style={S.primaryWide} onClick={savePR} type="button">
              Salvar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const S = {
  page: {
    minHeight: "100vh",
    background: BG,
    padding: 18,
    paddingBottom: 150,
  },

  toast: {
    position: "fixed",
    top: 14,
    left: 14,
    right: 14,
    zIndex: 80,
    maxWidth: 520,
    margin: "0 auto",
    borderRadius: 20,
    background: "rgba(15,23,42,.92)",
    color: "#fff",
    padding: 14,
    boxShadow: "0 18px 60px rgba(15,23,42,.24)",
    animation: "toastIn .18s ease-out",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
  },

  toastTitle: {
    fontSize: 14,
    fontWeight: 950,
  },

  toastSub: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: 750,
    opacity: 0.8,
  },

  hero: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    borderRadius: 28,
    padding: 16,
    background: "linear-gradient(135deg, rgba(255,106,0,.14), rgba(255,255,255,.92))",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 18px 60px rgba(15,23,42,.08)",
  },

  backBtn: {
    width: 44,
    height: 44,
    minWidth: 44,
    border: "none",
    borderRadius: 18,
    background: "rgba(255,255,255,.82)",
    color: TEXT,
    fontSize: 28,
    fontWeight: 900,
    display: "grid",
    placeItems: "center",
    boxShadow: "0 12px 32px rgba(15,23,42,.08)",
  },

  heroText: {
    flex: 1,
    paddingTop: 2,
  },

  kicker: {
    color: ORANGE,
    fontSize: 12,
    lineHeight: 1,
    fontWeight: 950,
    letterSpacing: 2.6,
    textTransform: "uppercase",
    marginBottom: 10,
  },

  title: {
    fontSize: 38,
    lineHeight: 0.94,
    color: TEXT,
    fontWeight: 980,
    letterSpacing: -1.6,
  },

  sub: {
    marginTop: 16,
    color: MUTED,
    fontSize: 17,
    lineHeight: 1.32,
    fontWeight: 850,
  },

  rankCard: {
    marginTop: 18,
    borderRadius: 26,
    padding: 16,
    background:
      "radial-gradient(circle at 88% 13%, rgba(255,106,0,.38), rgba(255,106,0,0) 28%), linear-gradient(135deg, #050506, #111113)",
    color: "#fff",
    boxShadow: "0 22px 70px rgba(15,23,42,.18)",
  },

  rankTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
    alignItems: "flex-start",
  },

  rankLabel: {
    fontSize: 12,
    fontWeight: 950,
    letterSpacing: 2.2,
    color: "rgba(255,255,255,.66)",
    textTransform: "uppercase",
    marginBottom: 10,
  },

  rankTitle: {
    fontSize: 31,
    lineHeight: 1,
    fontWeight: 980,
    letterSpacing: -1.2,
  },

  rankSub: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 1.25,
    color: "rgba(255,255,255,.70)",
    fontWeight: 850,
  },

  rankScore: {
    minWidth: 74,
    height: 74,
    borderRadius: 24,
    background: "linear-gradient(135deg, #FF6A00, #FF893E)",
    display: "grid",
    placeItems: "center",
    color: "#0b0b0c",
    fontSize: 30,
    fontWeight: 980,
    boxShadow: "0 18px 50px rgba(255,106,0,.28)",
  },

  rankGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10,
    marginTop: 18,
  },

  rankMini: {
    borderRadius: 19,
    padding: "13px 12px",
    background: "rgba(255,255,255,.08)",
    border: "1px solid rgba(255,255,255,.10)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,.08)",
  },

  whyCard: {
    marginTop: 18,
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 25,
    background: "#fff",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 18px 50px rgba(15,23,42,.08)",
  },

  whyIcon: {
    width: 45,
    height: 45,
    minWidth: 45,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, #FF6A00, #FF7F24)",
    boxShadow: "0 12px 34px rgba(255,106,0,.24)",
  },

  whyTitle: {
    color: TEXT,
    fontSize: 18,
    lineHeight: 1,
    fontWeight: 980,
    letterSpacing: -0.4,
  },

  whySub: {
    marginTop: 8,
    color: ORANGE,
    fontSize: 15,
    fontWeight: 950,
  },

  whyText: {
    marginTop: 10,
    color: MUTED,
    fontSize: 16,
    lineHeight: 1.36,
    fontWeight: 830,
  },

  section: {
    marginTop: 24,
  },

  sectionHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },

  sectionTitle: {
    color: TEXT,
    fontSize: 25,
    lineHeight: 1,
    fontWeight: 980,
    letterSpacing: -0.9,
  },

  syncBtn: {
    border: `1px solid ${BORDER}`,
    borderRadius: 999,
    padding: "12px 16px",
    background: "rgba(255,255,255,.82)",
    color: TEXT,
    fontSize: 14,
    fontWeight: 950,
    boxShadow: "0 12px 34px rgba(15,23,42,.06)",
  },

  emptyCard: {
    borderRadius: 24,
    background: "#fff",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 16px 44px rgba(15,23,42,.06)",
    padding: 16,
    color: MUTED,
    fontSize: 16,
    fontWeight: 850,
    lineHeight: 1.35,
  },

  emptyTitle: {
    color: TEXT,
    fontSize: 20,
    fontWeight: 980,
    letterSpacing: -0.4,
    marginBottom: 10,
  },

  emptySub: {
    color: MUTED,
    fontSize: 16,
    fontWeight: 850,
    lineHeight: 1.35,
  },

  goalList: {
    display: "grid",
    gap: 14,
  },

  goalCard: {
    borderRadius: 25,
    background: "#fff",
    border: `1px solid ${BORDER}`,
    padding: 15,
    boxShadow: "0 16px 46px rgba(15,23,42,.07)",
  },

  goalTop: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  goalIcon: {
    width: 43,
    height: 43,
    minWidth: 43,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, #FF6A00, #FF8231)",
    boxShadow: "0 12px 32px rgba(255,106,0,.22)",
  },

  goalMain: {
    flex: 1,
    minWidth: 0,
  },

  goalTitle: {
    color: TEXT,
    fontSize: 17,
    fontWeight: 980,
    lineHeight: 1.1,
  },

  goalSub: {
    marginTop: 5,
    color: MUTED,
    fontSize: 13,
    fontWeight: 850,
  },

  xBtn: {
    width: 36,
    height: 36,
    borderRadius: 14,
    border: "none",
    background: SOFT,
    color: MUTED,
    fontWeight: 950,
  },

  progressRow: {
    marginTop: 14,
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    color: MUTED,
    fontSize: 13,
    fontWeight: 850,
  },

  bar: {
    marginTop: 9,
    height: 10,
    borderRadius: 999,
    background: "rgba(15,23,42,.06)",
    overflow: "hidden",
  },

  fill: {
    height: "100%",
    borderRadius: 999,
    background: "linear-gradient(90deg, #FF6A00, #FF9B4A)",
  },

  reasonBox: {
    marginTop: 13,
    borderRadius: 18,
    padding: 12,
    background: "rgba(255,106,0,.07)",
    border: "1px solid rgba(255,106,0,.10)",
  },

  reasonTitle: {
    color: ORANGE,
    fontSize: 12,
    fontWeight: 980,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },

  reasonText: {
    marginTop: 7,
    color: TEXT,
    fontSize: 14,
    lineHeight: 1.35,
    fontWeight: 820,
  },

  actions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginTop: 13,
  },

  primary: {
    border: "none",
    borderRadius: 18,
    background: "linear-gradient(135deg, #FF6A00, #FF8231)",
    color: "#fff",
    padding: "13px 12px",
    fontSize: 14,
    fontWeight: 980,
    boxShadow: "0 14px 36px rgba(255,106,0,.22)",
  },

  ghost: {
    border: `1px solid ${BORDER}`,
    borderRadius: 18,
    background: "#fff",
    color: TEXT,
    padding: "13px 12px",
    fontSize: 14,
    fontWeight: 950,
  },

  doneList: {
    display: "grid",
    gap: 10,
    marginTop: 12,
  },

  doneItem: {
    borderRadius: 22,
    background: "#fff",
    border: `1px solid ${BORDER}`,
    padding: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    boxShadow: "0 14px 38px rgba(15,23,42,.06)",
  },

  doneTitle: {
    color: TEXT,
    fontSize: 15,
    fontWeight: 950,
  },

  doneSub: {
    marginTop: 4,
    color: MUTED,
    fontSize: 12,
    fontWeight: 800,
  },

  doneBtn: {
    border: "none",
    borderRadius: 999,
    padding: "10px 13px",
    background: "rgba(255,106,0,.10)",
    color: ORANGE,
    fontSize: 13,
    fontWeight: 950,
  },

  catalogGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
    marginTop: 14,
  },

  catalogCard: {
    textAlign: "left",
    border: `1px solid ${BORDER}`,
    borderRadius: 24,
    padding: 14,
    minHeight: 142,
    boxShadow: "0 16px 44px rgba(15,23,42,.07)",
    cursor: "pointer",
  },

  catalogOrange: {
    background: "linear-gradient(135deg, rgba(255,106,0,.16), rgba(255,255,255,.94))",
  },

  catalogSoft: {
    background: "#fff",
  },

  catalogOn: {
    outline: "3px solid rgba(255,106,0,.20)",
  },

  catalogTop: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 12,
  },

  catalogPill: {
    borderRadius: 999,
    padding: "8px 11px",
    background: "rgba(255,255,255,.78)",
    color: TEXT,
    fontSize: 12,
    fontWeight: 950,
    boxShadow: "0 8px 22px rgba(15,23,42,.06)",
  },

  catalogTitle: {
    color: TEXT,
    fontSize: 17,
    fontWeight: 980,
    letterSpacing: -0.35,
  },

  catalogValue: {
    marginTop: 12,
    color: ORANGE,
    fontSize: 25,
    lineHeight: 1,
    fontWeight: 980,
    letterSpacing: -0.8,
  },

  catalogSub: {
    marginTop: 10,
    color: MUTED,
    fontSize: 13,
    lineHeight: 1.25,
    fontWeight: 850,
  },

  customCard: {
    marginTop: 18,
    borderRadius: 25,
    background: "#fff",
    border: `1px solid ${BORDER}`,
    padding: 16,
    boxShadow: "0 16px 46px rgba(15,23,42,.07)",
  },

  customTitle: {
    color: TEXT,
    fontSize: 20,
    fontWeight: 980,
    letterSpacing: -0.5,
  },

  customSub: {
    marginTop: 7,
    color: ORANGE,
    fontSize: 14,
    fontWeight: 950,
  },

  customText: {
    marginTop: 9,
    color: MUTED,
    fontSize: 14,
    lineHeight: 1.35,
    fontWeight: 820,
  },

  customGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 110px",
    gap: 10,
    marginTop: 14,
  },

  label: {
    display: "grid",
    gap: 7,
    color: TEXT,
    fontSize: 13,
    fontWeight: 950,
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    border: `1px solid ${BORDER}`,
    borderRadius: 17,
    background: "rgba(15,23,42,.03)",
    color: TEXT,
    padding: "13px 12px",
    fontSize: 15,
    fontWeight: 850,
    outline: "none",
  },

  primaryWide: {
    width: "100%",
    marginTop: 14,
    border: "none",
    borderRadius: 19,
    background: "linear-gradient(135deg, #FF6A00, #FF8231)",
    color: "#fff",
    padding: "15px 14px",
    fontSize: 15,
    fontWeight: 980,
    boxShadow: "0 15px 40px rgba(255,106,0,.22)",
  },

  dashboardCard: {
    width: "100%",
    marginTop: 18,
    border: "none",
    borderRadius: 25,
    background: "#0B0B0C",
    color: "#fff",
    padding: 17,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    boxShadow: "0 20px 60px rgba(0,0,0,.18)",
    textAlign: "left",
  },

  dashboardTitle: {
    fontSize: 18,
    fontWeight: 980,
    letterSpacing: -0.4,
  },

  dashboardSub: {
    marginTop: 6,
    color: "rgba(255,255,255,.64)",
    fontSize: 13,
    lineHeight: 1.3,
    fontWeight: 800,
  },

  dashboardArrow: {
    width: 42,
    height: 42,
    minWidth: 42,
    borderRadius: 999,
    background: "rgba(255,255,255,.10)",
    display: "grid",
    placeItems: "center",
    fontSize: 33,
    fontWeight: 700,
  },

  sheetOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 12000,
    display: "grid",
    alignItems: "end",
    padding: 14,
  },

  sheetBackdrop: {
    position: "fixed",
    inset: 0,
    border: "none",
    background: "rgba(2,6,23,.28)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
  },

  sheet: {
    position: "relative",
    width: "100%",
    maxWidth: 520,
    margin: "0 auto",
    borderRadius: 28,
    background: "rgba(255,255,255,.94)",
    border: "1px solid rgba(255,255,255,.60)",
    boxShadow: "0 28px 90px rgba(15,23,42,.22)",
    padding: 16,
    animation: "sheetIn .18s ease-out",
    backdropFilter: "blur(22px)",
    WebkitBackdropFilter: "blur(22px)",
  },

  sheetTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },

  sheetTitle: {
    color: TEXT,
    fontSize: 22,
    fontWeight: 980,
    letterSpacing: -0.6,
  },

  sheetSub: {
    marginTop: 6,
    color: MUTED,
    fontSize: 14,
    fontWeight: 820,
  },

  sheetClose: {
    width: 40,
    height: 40,
    borderRadius: 16,
    border: "none",
    background: "rgba(15,23,42,.05)",
    color: TEXT,
    fontWeight: 950,
  },
};
