// ✅ COLE EM: src/pages/Metas.jsx
// Metas + “Apple vibe” + incentivo real de conclusão (sem cassino / sem “dopamina”)
// - Ativar metas (catálogo + PR custom)
// - Registrar progresso (1 toque: “Registrar hoje”, “Registrar sessão”, “Registrar PR”)
// - Mostra progresso, faltam X, e libera “Concluir” quando bater a meta
// - Mantém compatibilidade com o Dashboard lendo: active_goals_<email>

import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ORANGE = "#FF6A00";
const BG = "#f8fafc";
const TEXT = "#0f172a";
const MUTED = "#64748b";

function safeJsonParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function uid() {
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
  // segunda-feira como início
  const dt = new Date(d);
  const day = dt.getDay(); // 0 dom .. 6 sab
  const diff = (day === 0 ? -6 : 1) - day; // move para segunda
  dt.setDate(dt.getDate() + diff);
  dt.setHours(0, 0, 0, 0);
  return yyyyMmDd(dt);
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function labelFromGoal(g) {
  if (!g) return "";
  if (g.type === "freq") return `${g.value} dias de frequência`;
  if (g.type === "pr") return `${g.value} kg no ${g.exercise}`;
  if (g.type === "peso") return `${g.value} kg de peso-alvo`;
  if (g.type === "cardio") return `${g.value} sessões de cardio/sem`;
  return g.title || "Meta";
}

function iconFromGoal(g) {
  if (!g) return "🎯";
  if (g.type === "freq") return "📅";
  if (g.type === "pr") return "🏋️";
  if (g.type === "peso") return "⚖️";
  if (g.type === "cardio") return "🏃";
  return "🎯";
}

function ensureGoalShape(g) {
  // ✅ compatível com goals antigos (sem quebrar)
  const base = {
    id: g?.id || uid(),
    catalogId: g?.catalogId ?? null,
    type: g?.type || "freq",
    value: Number(g?.value || 0) || 0,
    exercise: g?.exercise,
    title: g?.title,
    createdAt: g?.createdAt || Date.now(),

    // novos campos (incentivo / progresso)
    status: g?.status || "active", // active | done
    completedAt: g?.completedAt || null,

    // progresso por tipo
    days: Array.isArray(g?.days) ? g.days : [], // freq: lista de yyyy-mm-dd
    weekId: g?.weekId || startOfWeekISO(new Date()), // cardio: semana atual
    weekCount: Number(g?.weekCount || 0) || 0, // cardio: sessões na semana atual
    cardioLog: Array.isArray(g?.cardioLog) ? g.cardioLog : [], // cardio: datas (opcional)

    bestKg: Number(g?.bestKg || 0) || 0, // pr: melhor kg registrado
    lastPrAt: g?.lastPrAt || null,

    currentWeight: Number(g?.currentWeight || 0) || 0, // peso: último peso registrado
    lastWeightAt: g?.lastWeightAt || null,

    // micro feedback
    lastActionAt: g?.lastActionAt || null,
  };

  return base;
}

function progressOfGoal(g) {
  const goal = ensureGoalShape(g);

  if (goal.type === "freq") {
    const uniq = new Set(goal.days || []);
    return clamp(uniq.size, 0, goal.value || 0);
  }

  if (goal.type === "cardio") {
    // se semana mudou, zera para semana atual
    const nowWeek = startOfWeekISO(new Date());
    if (goal.weekId !== nowWeek) return 0;
    return clamp(goal.weekCount || 0, 0, goal.value || 0);
  }

  if (goal.type === "pr") {
    // progresso “visual”: quanto do alvo já tem
    const target = goal.value || 0;
    const best = goal.bestKg || 0;
    if (target <= 0) return 0;
    return clamp(best, 0, target);
  }

  if (goal.type === "peso") {
    // para peso-alvo: progresso é “quanto falta” visualmente invertido
    // (como não sabemos se o usuário quer ganhar/perder, usamos regra simples:
    // se currentWeight > target => progresso aumenta conforme aproxima)
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

  if (goal.type === "freq") {
    const p = progressOfGoal(goal);
    return p >= (goal.value || 0);
  }
  if (goal.type === "cardio") {
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
    // atingiu “bem perto” (0.3kg)
    return Math.abs(cur - target) <= 0.3;
  }
  return false;
}

function remainingText(g) {
  const goal = ensureGoalShape(g);

  if (goal.type === "freq") {
    const done = progressOfGoal(goal);
    const left = Math.max(0, (goal.value || 0) - done);
    return left === 0 ? "Meta batida" : `Faltam ${left} dia${left === 1 ? "" : "s"}`;
  }

  if (goal.type === "cardio") {
    const nowWeek = startOfWeekISO(new Date());
    const done = goal.weekId !== nowWeek ? 0 : progressOfGoal(goal);
    const left = Math.max(0, (goal.value || 0) - done);
    return left === 0 ? "Semana completa" : `Faltam ${left} sessão${left === 1 ? "" : "s"} nesta semana`;
  }

  if (goal.type === "pr") {
    const target = goal.value || 0;
    const best = goal.bestKg || 0;
    const left = Math.max(0, target - best);
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
  // ✅ “por que concluir” sem cassino/sem dopamina: foco em clareza, consistência, autoestima, processo
  const goal = ensureGoalShape(g);

  if (goal.type === "freq")
    return "Frequência cria o hábito. Hábito vira resultado. Um check-in por dia mantém você no caminho, mesmo nos dias fracos.";

  if (goal.type === "cardio")
    return "Cardio consistente melhora recuperação, disposição e saúde. Fechar a semana dá a sensação real de progresso acumulado.";

  if (goal.type === "pr")
    return "PR é prova concreta do seu avanço. Bater o alvo valida seu treino e te dá referência para o próximo ciclo.";

  if (goal.type === "peso")
    return "Acompanhar o peso com calma ajuda a ajustar o plano sem ansiedade. Concluir o alvo é um marco — não um fim.";

  return "Concluir metas dá direção e clareza. Menos dúvida, mais execução.";
}

/* ---- catálogo (simples e direto) ---- */
const GOALS_CATALOG = [
  { id: "g_freq_30", type: "freq", title: "Frequência", subtitle: "Consistência", value: 30, accent: "soft" },
  { id: "g_freq_60", type: "freq", title: "Frequência", subtitle: "Disciplina", value: 60, accent: "orange" },
  { id: "g_freq_90", type: "freq", title: "Frequência", subtitle: "Transformação", value: 90, accent: "soft" },

  { id: "g_pr_supino_50", type: "pr", title: "PR — Supino", subtitle: "Força no peito", exercise: "Supino", value: 50, accent: "orange" },
  { id: "g_pr_supino_60", type: "pr", title: "PR — Supino", subtitle: "Meta forte", exercise: "Supino", value: 60, accent: "soft" },
  { id: "g_pr_agacho_80", type: "pr", title: "PR — Agachamento", subtitle: "Base de pernas", exercise: "Agachamento", value: 80, accent: "soft" },

  { id: "g_cardio_3", type: "cardio", title: "Cardio", subtitle: "Saúde e corte", value: 3, accent: "soft" },
  { id: "g_cardio_5", type: "cardio", title: "Cardio", subtitle: "Turbo no shape", value: 5, accent: "orange" },

  // opcional (fica leve e ajuda a “concluir” algo curto)
  { id: "g_freq_7", type: "freq", title: "Frequência", subtitle: "Começo rápido", value: 7, accent: "orange" },
];

export default function Metas() {
  const nav = useNavigate();
  const { user } = useAuth();
  const email = (user?.email || "anon").toLowerCase();

  const storageKey = `active_goals_${email}`;

  const initial = useMemo(() => safeJsonParse(localStorage.getItem(storageKey), []), [storageKey]);
  const [active, setActive] = useState(Array.isArray(initial) ? initial.map(ensureGoalShape) : []);

  // custom PR
  const [customKg, setCustomKg] = useState("");
  const [customEx, setCustomEx] = useState("Supino");

  // micro “sheet” para registrar valor (PR / Peso)
  const [sheet, setSheet] = useState(null); // { goalId, kind: 'pr'|'peso', value: '' }
  const [toast, setToast] = useState(null); // { title, sub }

  function persist(next) {
    const shaped = Array.isArray(next) ? next.map(ensureGoalShape) : [];
    setActive(shaped);
    localStorage.setItem(storageKey, JSON.stringify(shaped));
  }

  function isActive(catalogId) {
    return active.some((g) => g.catalogId === catalogId && ensureGoalShape(g).status !== "done");
  }

  function toggleCatalogGoal(item) {
    const on = isActive(item.id);

    if (on) {
      const next = active.filter((g) => g.catalogId !== item.id);
      return persist(next);
    }

    const goal = ensureGoalShape({
      id: uid(),
      catalogId: item.id,
      type: item.type,
      value: item.value,
      exercise: item.exercise,
      title: item.title,
      createdAt: Date.now(),
    });

    // cardio: inicializa semana
    if (goal.type === "cardio") {
      goal.weekId = startOfWeekISO(new Date());
      goal.weekCount = 0;
    }

    const next = [goal, ...active].slice(0, 12);
    persist(next);

    showToast("Meta ativada", labelFromGoal(goal));
  }

  function removeGoal(goalId) {
    const next = active.filter((g) => g.id !== goalId);
    persist(next);
    showToast("Removida", "Meta removida da lista");
  }

  function addCustomPR() {
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
      createdAt: Date.now(),
    });

    const next = [goal, ...active].slice(0, 12);
    persist(next);
    setCustomKg("");

    showToast("Meta criada", labelFromGoal(goal));
  }

  function showToast(title, sub) {
    setToast({ title, sub });
    setTimeout(() => setToast(null), 2200);
  }

  function softComplete(goalId) {
    const next = active.map((g) => {
      if (g.id !== goalId) return g;
      const gg = ensureGoalShape(g);
      gg.status = "done";
      gg.completedAt = Date.now();
      gg.lastActionAt = Date.now();
      return gg;
    });
    persist(next);
    showToast("Concluída", "Meta registrada como concluída");
  }

  function reactivate(goalId) {
    const next = active.map((g) => {
      if (g.id !== goalId) return g;
      const gg = ensureGoalShape(g);
      gg.status = "active";
      gg.completedAt = null;
      gg.lastActionAt = Date.now();

      // reinicia lógica “semana” do cardio ao reativar
      if (gg.type === "cardio") {
        gg.weekId = startOfWeekISO(new Date());
        gg.weekCount = 0;
      }

      return gg;
    });
    persist(next);
    showToast("Reativada", "Meta voltou para Ativas");
  }

  function registerToday(goalId) {
    const today = yyyyMmDd(new Date());

    const next = active.map((g) => {
      if (g.id !== goalId) return g;
      const gg = ensureGoalShape(g);
      if (gg.type !== "freq") return gg;

      const set = new Set(gg.days || []);
      set.add(today);
      gg.days = Array.from(set).sort().slice(-200);
      gg.lastActionAt = Date.now();

      // auto “done”
      if (isCompleted(gg)) {
        gg.status = "done";
        gg.completedAt = Date.now();
      }

      return gg;
    });

    persist(next);

    const updated = next.find((x) => x.id === goalId);
    const left = remainingText(updated);
    showToast("Registrado", left);
  }

  function registerCardioSession(goalId) {
    const today = yyyyMmDd(new Date());
    const nowWeek = startOfWeekISO(new Date());

    const next = active.map((g) => {
      if (g.id !== goalId) return g;
      const gg = ensureGoalShape(g);
      if (gg.type !== "cardio") return gg;

      // se semana virou, zera
      if (gg.weekId !== nowWeek) {
        gg.weekId = nowWeek;
        gg.weekCount = 0;
      }

      gg.weekCount = clamp((gg.weekCount || 0) + 1, 0, 99);
      gg.cardioLog = Array.isArray(gg.cardioLog) ? [today, ...gg.cardioLog].slice(0, 180) : [today];
      gg.lastActionAt = Date.now();

      if (isCompleted(gg)) {
        gg.status = "done";
        gg.completedAt = Date.now();
      }

      return gg;
    });

    persist(next);

    const updated = next.find((x) => x.id === goalId);
    showToast("Sessão registrada", remainingText(updated));
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

  function savePR() {
    const v = normalizeNumber(sheet?.value);
    if (!sheet?.goalId || v <= 0) return;

    const next = active.map((g) => {
      if (g.id !== sheet.goalId) return g;
      const gg = ensureGoalShape(g);
      gg.bestKg = Math.max(Number(gg.bestKg || 0), v);
      gg.lastPrAt = Date.now();
      gg.lastActionAt = Date.now();

      if (isCompleted(gg)) {
        gg.status = "done";
        gg.completedAt = Date.now();
      }

      return gg;
    });

    persist(next);
    setSheet(null);

    const updated = next.find((x) => x.id === sheet.goalId);
    showToast("PR registrado", remainingText(updated));
  }

  // ---- listas derivadas
  const activeList = useMemo(
    () => active.filter((g) => ensureGoalShape(g).status !== "done"),
    [active]
  );
  const doneList = useMemo(
    () => active.filter((g) => ensureGoalShape(g).status === "done"),
    [active]
  );

  // ---- pequenas animações (estilo clean)
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
      button:active { transform: scale(.99); }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <div style={S.page}>
      {/* Toast */}
      {toast ? (
        <div style={S.toastWrap} aria-live="polite">
          <div style={S.toast}>
            <div style={S.toastTitle}>{toast.title}</div>
            <div style={S.toastSub}>{toast.sub}</div>
          </div>
        </div>
      ) : null}

      {/* header */}
      <div style={S.head}>
        <button style={S.back} onClick={() => nav("/dashboard")} aria-label="Voltar">
          ←
        </button>

        <div style={{ minWidth: 0 }}>
          <div style={S.hTitle}>Metas</div>
          <div style={S.hSub}>Ative, registre progresso e conclua. Tudo aparece no Dashboard.</div>
        </div>

        <button style={S.goDash} onClick={() => nav("/dashboard")}>
          Dashboard
        </button>
      </div>

      {/* INSIGHT (por que concluir) */}
      <div style={S.sectionTitle}>Por que concluir</div>
      <div style={S.insightCard}>
        <div style={S.insightRow}>
          <div style={S.insightIcon}>⟡</div>
          <div style={{ minWidth: 0 }}>
            <div style={S.insightTitle}>Clareza + direção</div>
            <div style={S.insightSub}>
              Metas funcionam quando viram ação simples. Use os botões “Registrar” para transformar intenção em progresso.
            </div>
          </div>
        </div>
      </div>

      {/* ACTIVE */}
      <div style={S.sectionTitle}>Ativas</div>

      {activeList.length === 0 ? (
        <div style={S.emptyCard}>
          <div style={S.emptyBig}>Sem metas ativas.</div>
          <div style={S.emptySmall}>Escolha uma meta abaixo. Depois, registre progresso aqui com 1 toque.</div>
        </div>
      ) : (
        <div style={S.activeWrap}>
          {activeList.map((raw) => {
            const g = ensureGoalShape(raw);
            const p = progressOfGoal(g);
            const target = g.type === "pr" ? g.value : g.value;
            const ratio =
              g.type === "pr"
                ? (g.value > 0 ? clamp((g.bestKg || 0) / g.value, 0, 1) : 0)
                : (g.value > 0 ? clamp(p / g.value, 0, 1) : 0);

            const canComplete = isCompleted(g);

            return (
              <div key={g.id} style={S.activeCard}>
                <div style={S.activeTop}>
                  <div style={S.pillIcon}>{iconFromGoal(g)}</div>

                  <div style={{ minWidth: 0 }}>
                    <div style={S.pillText}>{labelFromGoal(g)}</div>
                    <div style={S.pillSub}>{remainingText(g)}</div>
                  </div>

                  <button style={S.pillX} onClick={() => removeGoal(g.id)} aria-label="Remover">
                    ✕
                  </button>
                </div>

                {/* progress bar */}
                <div style={S.progressWrap}>
                  <div style={S.progressTrack}>
                    <div style={{ ...S.progressFill, width: `${Math.round(ratio * 100)}%` }} />
                  </div>

                  <div style={S.progressMeta}>
                    {g.type === "pr" ? (
                      <span>
                        Melhor: <b>{g.bestKg || 0} kg</b> • Alvo: <b>{g.value} kg</b>
                      </span>
                    ) : g.type === "cardio" ? (
                      <span>
                        Semana: <b>{Math.min(p, g.value)}/{g.value}</b>
                      </span>
                    ) : (
                      <span>
                        Progresso: <b>{Math.min(p, g.value)}/{g.value}</b>
                      </span>
                    )}
                    <span style={S.progressPct}>{Math.round(ratio * 100)}%</span>
                  </div>
                </div>

                {/* incentive copy */}
                <div style={S.whyCard}>
                  <div style={S.whyTitle}>Motivo</div>
                  <div style={S.whySub}>{whyThisMatters(g)}</div>
                </div>

                {/* actions */}
                <div style={S.actionsRow}>
                  {g.type === "freq" ? (
                    <button style={S.primaryAction} onClick={() => registerToday(g.id)}>
                      Registrar hoje
                    </button>
                  ) : g.type === "cardio" ? (
                    <button style={S.primaryAction} onClick={() => registerCardioSession(g.id)}>
                      Registrar sessão
                    </button>
                  ) : g.type === "pr" ? (
                    <button style={S.primaryAction} onClick={() => openPRSheet(g.id)}>
                      Registrar PR
                    </button>
                  ) : (
                    <button style={S.primaryAction} onClick={() => openPRSheet(g.id)}>
                      Registrar
                    </button>
                  )}

                  {canComplete ? (
                    <button style={S.completeBtn} onClick={() => softComplete(g.id)}>
                      Concluir
                    </button>
                  ) : (
                    <button style={S.secondaryAction} onClick={() => nav("/dashboard")}>
                      Ver no Dashboard
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DONE */}
      {doneList.length > 0 ? (
        <>
          <div style={S.sectionTitle}>Concluídas</div>
          <div style={S.doneWrap}>
            {doneList.slice(0, 10).map((raw) => {
              const g = ensureGoalShape(raw);
              const when = g.completedAt ? new Date(g.completedAt).toLocaleDateString() : "—";
              return (
                <div key={g.id} style={S.doneCard}>
                  <div style={S.doneRow}>
                    <div style={S.doneIcon}>{iconFromGoal(g)}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={S.doneTitle}>{labelFromGoal(g)}</div>
                      <div style={S.doneSub}>Concluída em {when}</div>
                    </div>

                    <button style={S.doneBtn} onClick={() => reactivate(g.id)}>
                      Reativar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : null}

      {/* QUICK PICK */}
      <div style={S.sectionTitle}>Escolha rápida</div>
      <div style={S.grid}>
        {GOALS_CATALOG.map((item) => {
          const on = isActive(item.id);
          const isOrange = item.accent === "orange";

          return (
            <button
              key={item.id}
              style={{
                ...S.goalCard,
                ...(isOrange ? S.goalOrange : S.goalSoft),
                ...(on ? S.goalOn : null),
              }}
              onClick={() => toggleCatalogGoal(item)}
            >
              <div style={S.goalTop}>
                <div style={S.goalIcon}>
                  {item.type === "freq" ? "📅" : item.type === "pr" ? "🏋️" : item.type === "cardio" ? "🏃" : "🎯"}
                </div>
                <div style={{ marginLeft: "auto", ...S.toggleDot, ...(on ? S.toggleOn : S.toggleOff) }} />
              </div>

              <div style={S.goalTitle}>
                {item.type === "freq" ? `${item.value} dias` : item.type === "pr" ? `${item.value} kg` : `${item.value}x/sem`}
              </div>
              <div style={S.goalSub}>{item.type === "pr" ? item.exercise : item.subtitle}</div>
            </button>
          );
        })}
      </div>

      {/* CUSTOM PR */}
      <div style={S.sectionTitle}>Meta personalizada</div>
      <div style={S.customCard}>
        <div style={S.customTop}>
          <div style={S.customTitle}>PR (força)</div>
          <div style={S.customHint}>Ex: “50 kg no supino”. Depois use “Registrar PR” para marcar avanço.</div>
        </div>

        <div style={S.customRow}>
          <div style={{ flex: 1 }}>
            <div style={S.label}>Exercício</div>
            <select style={S.select} value={customEx} onChange={(e) => setCustomEx(e.target.value)}>
              <option>Supino</option>
              <option>Agachamento</option>
              <option>Levantamento terra</option>
              <option>Remada</option>
              <option>Desenvolvimento</option>
              <option>Rosca direta</option>
            </select>
          </div>

          <div style={{ width: 130 }}>
            <div style={S.label}>Kg</div>
            <input
              style={S.input}
              value={customKg}
              onChange={(e) => setCustomKg(e.target.value)}
              inputMode="decimal"
              placeholder="50"
            />
          </div>
        </div>

        <button style={S.addBtn} onClick={addCustomPR}>
          Adicionar meta
        </button>
      </div>

      {/* CTA */}
      <button style={S.cta} onClick={() => nav("/dashboard")}>
        <div style={S.ctaRow}>
          <div>
            <div style={S.ctaTitle}>Ver no Dashboard</div>
            <div style={S.ctaSub}>As metas e o progresso aparecem lá também.</div>
          </div>
          <div style={S.ctaIcon}>›</div>
        </div>
        <div style={S.ctaTrack}>
          <div style={S.ctaFill} />
        </div>
      </button>

      {/* Sheet para registrar PR */}
      {sheet ? (
        <>
          <div style={S.sheetBackdrop} onClick={() => setSheet(null)} />
          <div style={S.sheetWrap} role="dialog" aria-modal="true">
            <div style={S.sheet}>
              <div style={S.sheetTop}>
                <div>
                  <div style={S.sheetTitle}>Registrar PR</div>
                  <div style={S.sheetSub}>Digite o maior peso que você atingiu (kg).</div>
                </div>
                <button style={S.sheetClose} onClick={() => setSheet(null)} aria-label="Fechar">
                  ✕
                </button>
              </div>

              <div style={S.sheetRow}>
                <div style={{ flex: 1 }}>
                  <div style={S.label}>Kg atingido</div>
                  <input
                    style={S.input}
                    value={sheet.value}
                    onChange={(e) => setSheet((s) => ({ ...s, value: e.target.value }))}
                    inputMode="decimal"
                    placeholder="Ex: 60"
                    autoFocus
                  />
                </div>
              </div>

              <button style={S.sheetSave} onClick={savePR}>
                Salvar
              </button>
            </div>
          </div>
        </>
      ) : null}

      <div style={{ height: 120 }} />
    </div>
  );
}

/* ----------------- styles (apple simples) ----------------- */
const S = {
  page: { padding: 18, paddingBottom: 130, background: BG },

  toastWrap: {
    position: "fixed",
    top: 12,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 9999,
  },
  toast: {
    width: "min(360px, calc(100vw - 24px))",
    borderRadius: 18,
    padding: 12,
    background: "linear-gradient(135deg, rgba(255,255,255,.92), rgba(255,255,255,.78))",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 18px 60px rgba(15,23,42,.10)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    animation: "toastIn .18s ease-out",
  },
  toastTitle: { fontSize: 13, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  toastSub: { marginTop: 3, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.3 },

  head: {
    borderRadius: 22,
    padding: 16,
    background: "#fff",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
    display: "flex",
    alignItems: "center",
    gap: 12,
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
  hSub: { marginTop: 4, fontSize: 12, color: MUTED, fontWeight: 800, lineHeight: 1.35 },
  goDash: {
    marginLeft: "auto",
    padding: "10px 12px",
    borderRadius: 999,
    border: "1px solid rgba(15,23,42,.10)",
    background: "#fff",
    fontWeight: 950,
    color: TEXT,
  },

  sectionTitle: { marginTop: 14, fontSize: 16, fontWeight: 950, color: TEXT, letterSpacing: -0.3 },

  insightCard: {
    marginTop: 10,
    borderRadius: 22,
    padding: 14,
    background: "linear-gradient(135deg, rgba(255,106,0,.10), rgba(255,255,255,.92))",
    border: "1px solid rgba(255,106,0,.18)",
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
  },
  insightRow: { display: "flex", alignItems: "center", gap: 10 },
  insightIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,.85)",
    border: "1px solid rgba(15,23,42,.06)",
    color: TEXT,
    fontWeight: 950,
    flexShrink: 0,
  },
  insightTitle: { fontSize: 14, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  insightSub: { marginTop: 4, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35 },

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

  activeWrap: { marginTop: 10, display: "grid", gap: 12 },

  activeCard: {
    borderRadius: 22,
    padding: 14,
    background: "#fff",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
  },
  activeTop: { display: "flex", alignItems: "center", gap: 10 },

  pillIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    background: "rgba(15,23,42,.04)",
    border: "1px solid rgba(15,23,42,.06)",
    flexShrink: 0,
    fontSize: 18,
  },
  pillText: {
    fontSize: 14,
    fontWeight: 950,
    color: TEXT,
    letterSpacing: -0.2,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  pillSub: { marginTop: 3, fontSize: 12, fontWeight: 850, color: MUTED },
  pillX: {
    marginLeft: "auto",
    width: 40,
    height: 40,
    borderRadius: 16,
    border: "none",
    background: "rgba(15,23,42,.06)",
    color: TEXT,
    fontWeight: 950,
    flexShrink: 0,
  },

  progressWrap: { marginTop: 12 },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    background: "rgba(15,23,42,.08)",
    overflow: "hidden",
    border: "1px solid rgba(15,23,42,.06)",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    background: "linear-gradient(90deg, #FF6A00, #FFB26B)",
    boxShadow: "0 10px 24px rgba(255,106,0,.18)",
  },
  progressMeta: {
    marginTop: 8,
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    fontSize: 12,
    fontWeight: 850,
    color: MUTED,
    lineHeight: 1.3,
  },
  progressPct: { color: TEXT, fontWeight: 950 },

  whyCard: {
    marginTop: 12,
    borderRadius: 18,
    padding: 12,
    background: "linear-gradient(135deg, rgba(255,106,0,.10), rgba(15,23,42,.02))",
    border: "1px solid rgba(255,106,0,.16)",
  },
  whyTitle: { fontSize: 12, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  whySub: { marginTop: 6, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35 },

  actionsRow: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "1.1fr .9fr",
    gap: 10,
  },
  primaryAction: {
    padding: 14,
    borderRadius: 18,
    border: "none",
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    color: "#111",
    fontWeight: 950,
    boxShadow: "0 18px 45px rgba(255,106,0,.18)",
  },
  secondaryAction: {
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,.10)",
    background: "#fff",
    color: TEXT,
    fontWeight: 950,
  },
  completeBtn: {
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,.10)",
    background: "rgba(15,23,42,.92)",
    color: "#fff",
    fontWeight: 950,
    boxShadow: "0 18px 55px rgba(2,6,23,.16)",
  },

  doneWrap: { marginTop: 10, display: "grid", gap: 10 },
  doneCard: {
    borderRadius: 22,
    padding: 12,
    background: "linear-gradient(135deg, rgba(15,23,42,.03), rgba(255,255,255,.92))",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 14px 40px rgba(15,23,42,.05)",
  },
  doneRow: { display: "flex", alignItems: "center", gap: 10 },
  doneIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,.90)",
    border: "1px solid rgba(15,23,42,.06)",
    flexShrink: 0,
  },
  doneTitle: { fontSize: 13, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  doneSub: { marginTop: 3, fontSize: 12, fontWeight: 850, color: MUTED },
  doneBtn: {
    marginLeft: "auto",
    padding: "10px 12px",
    borderRadius: 999,
    border: "1px solid rgba(15,23,42,.10)",
    background: "#fff",
    fontWeight: 950,
    color: TEXT,
  },

  grid: { marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  goalCard: {
    border: "none",
    borderRadius: 22,
    padding: 14,
    textAlign: "left",
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
    borderTop: "1px solid rgba(255,255,255,.60)",
    transition: "transform .12s ease",
    background: "#fff",
  },
  goalSoft: { background: "#fff", border: "1px solid rgba(15,23,42,.06)" },
  goalOrange: { background: "linear-gradient(135deg, rgba(255,106,0,.18), rgba(255,255,255,.92))", border: "1px solid rgba(255,106,0,.18)" },
  goalOn: { boxShadow: "0 16px 55px rgba(255,106,0,.16)", transform: "translateY(-1px)" },
  goalTop: { display: "flex", alignItems: "center", gap: 10 },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    background: "rgba(15,23,42,.04)",
    border: "1px solid rgba(15,23,42,.06)",
    display: "grid",
    placeItems: "center",
    fontSize: 18,
  },
  toggleDot: { width: 14, height: 14, borderRadius: 999 },
  toggleOn: { background: ORANGE, boxShadow: "0 10px 24px rgba(255,106,0,.25)" },
  toggleOff: { background: "rgba(15,23,42,.14)" },

  goalTitle: { marginTop: 10, fontSize: 18, fontWeight: 950, color: TEXT, letterSpacing: -0.4 },
  goalSub: { marginTop: 6, fontSize: 12, fontWeight: 800, color: MUTED },

  customCard: {
    marginTop: 10,
    borderRadius: 22,
    padding: 16,
    background: "#fff",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
  },
  customTop: { display: "grid", gap: 4 },
  customTitle: { fontSize: 16, fontWeight: 950, color: TEXT, letterSpacing: -0.3 },
  customHint: { fontSize: 12, fontWeight: 800, color: MUTED },

  customRow: { marginTop: 12, display: "flex", gap: 10, alignItems: "end" },
  label: { fontSize: 12, fontWeight: 900, color: MUTED },
  input: {
    width: "100%",
    marginTop: 6,
    padding: "12px 12px",
    borderRadius: 14,
    border: "1px solid rgba(15,23,42,.10)",
    outline: "none",
    fontSize: 14,
    fontWeight: 850,
    background: "#fff",
  },
  select: {
    width: "100%",
    marginTop: 6,
    padding: "12px 12px",
    borderRadius: 14,
    border: "1px solid rgba(15,23,42,.10)",
    outline: "none",
    fontSize: 14,
    fontWeight: 850,
    background: "#fff",
  },
  addBtn: {
    marginTop: 12,
    width: "100%",
    padding: 14,
    borderRadius: 18,
    border: "none",
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    color: "#111",
    fontWeight: 950,
    boxShadow: "0 18px 45px rgba(255,106,0,.22)",
  },

  cta: {
    marginTop: 14,
    width: "100%",
    border: "none",
    borderRadius: 26,
    padding: 16,
    textAlign: "left",
    background: "linear-gradient(135deg, rgba(255,106,0,.20), rgba(255,255,255,.95))",
    boxShadow: "0 18px 60px rgba(15,23,42,.10)",
    borderLeft: "1px solid rgba(255,106,0,.22)",
    borderTop: "1px solid rgba(15,23,42,.06)",
  },
  ctaRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 },
  ctaTitle: { fontSize: 16, fontWeight: 950, color: TEXT, letterSpacing: -0.3 },
  ctaSub: { marginTop: 6, fontSize: 12, fontWeight: 800, color: MUTED, lineHeight: 1.35 },
  ctaIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    display: "grid",
    placeItems: "center",
    fontSize: 22,
    fontWeight: 950,
    color: "#111",
    boxShadow: "0 14px 34px rgba(255,106,0,.22)",
    flexShrink: 0,
  },
  ctaTrack: { marginTop: 12, height: 10, borderRadius: 999, background: "rgba(15,23,42,.08)", overflow: "hidden" },
  ctaFill: { height: "100%", width: "78%", borderRadius: 999, background: "linear-gradient(90deg, #FF6A00, #FFB26B)" },

  /* Sheet */
  sheetBackdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(2,6,23,.38)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    zIndex: 9998,
  },
  sheetWrap: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    padding: 12,
    animation: "sheetIn .18s ease-out",
  },
  sheet: {
    maxWidth: 520,
    margin: "0 auto",
    borderRadius: 26,
    padding: 14,
    background: "linear-gradient(135deg, rgba(255,255,255,.92), rgba(255,255,255,.80))",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 26px 90px rgba(2,6,23,.18)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
  },
  sheetTop: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 },
  sheetTitle: { fontSize: 14, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  sheetSub: { marginTop: 4, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35 },
  sheetClose: {
    width: 40,
    height: 40,
    borderRadius: 16,
    border: "none",
    background: "rgba(15,23,42,.06)",
    color: TEXT,
    fontWeight: 950,
  },
  sheetRow: { marginTop: 12, display: "flex", gap: 10, alignItems: "end" },
  sheetSave: {
    marginTop: 12,
    width: "100%",
    padding: 14,
    borderRadius: 18,
    border: "none",
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    color: "#111",
    fontWeight: 950,
    boxShadow: "0 18px 45px rgba(255,106,0,.22)",
  },
};
