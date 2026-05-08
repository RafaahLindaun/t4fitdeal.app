import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import logo from "../assets/IMG_5692.png";

const APP_NAME = "fitdeal";
const ORANGE = "#FF6A00";
const BG = "#f8fafc";
const TEXT = "#0f172a";
const MUTED = "#64748b";

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
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

function pad2(n) {
  return String(n).padStart(2, "0");
}

function dayKeyLocalFromDate(d) {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
}

function prettyDate(isoDay) {
  const [y, m, d] = String(isoDay).split("-");
  return `${d}/${m}/${y}`;
}

const HOURS = [
  { key: "manha", label: "Manhã" },
  { key: "pre_treino", label: "Pré-treino" },
  { key: "pos_treino", label: "Pós-treino" },
  { key: "noite", label: "Noite" },
];

function getCatalog({ pesoKg, goal, level }) {
  const wheyDose = clamp(Math.round(pesoKg * 0.3 * 10) / 10, 20, 40);
  const creatinaDose = goal === "powerlifting" ? 5 : 3;
  const cafeinaMg = clamp(Math.round(pesoKg * (level === "avancado" ? 4 : 3)), 150, 400);
  const betaAlaninaG = level === "iniciante" ? 3.2 : 4.8;
  const omega3Mg = 1000;
  const magnesioMg = 350;
  const multivitaminicoMg = 1;

  return [
    {
      key: "whey",
      title: "Whey Protein",
      group: "base",
      doseLabel: fmtG(wheyDose),
      bestHour: "pos_treino",
      desc: "Ajuda a bater proteína diária com praticidade e recuperação melhor.",
      why: "Bom para hipertrofia, recuperação e rotina corrida.",
    },
    {
      key: "creatina",
      title: "Creatina",
      group: "performance",
      doseLabel: fmtG(creatinaDose),
      bestHour: "manha",
      desc: "Um dos suplementos com melhor base para força, volume e desempenho.",
      why: "Uso diário consistente costuma ser mais importante que o horário exato.",
    },
    {
      key: "cafeina",
      title: "Cafeína",
      group: "performance",
      doseLabel: fmtMg(cafeinaMg),
      bestHour: "pre_treino",
      desc: "Pode ajudar no foco, disposição e desempenho no treino.",
      why: "Mais interessante para sessões intensas e dias de baixa energia.",
    },
    {
      key: "beta_alanina",
      title: "Beta-alanina",
      group: "performance",
      doseLabel: fmtG(betaAlaninaG),
      bestHour: "pre_treino",
      desc: "Suporte para treinos de alta intensidade e maior tolerância ao esforço.",
      why: "Ganha mais valor em sessões fortes e rotina consistente.",
    },
    {
      key: "omega3",
      title: "Ômega 3",
      group: "health",
      doseLabel: fmtMg(omega3Mg),
      bestHour: "noite",
      desc: "Ajuda a completar o cuidado geral com saúde e rotina alimentar.",
      why: "Entra bem como base de manutenção.",
    },
    {
      key: "magnesio",
      title: "Magnésio",
      group: "recovery",
      doseLabel: fmtMg(magnesioMg),
      bestHour: "noite",
      desc: "Pode entrar bem em rotina de recuperação e sono.",
      why: "Útil quando a recuperação merece mais atenção.",
    },
    {
      key: "multivitaminico",
      title: "Multivitamínico",
      group: "health",
      doseLabel: fmtMg(multivitaminicoMg),
      bestHour: "manha",
      desc: "Suporte geral de micronutrientes dentro de rotina mais organizada.",
      why: "Complementar, não substitui alimentação bem montada.",
    },
  ].map((item) => ({
    ...item,
    suggested:
      goal === "hipertrofia"
        ? ["whey", "creatina", "magnesio"].includes(item.key)
        : goal === "powerlifting"
        ? ["creatina", "cafeina", "beta_alanina"].includes(item.key)
        : goal === "condicionamento"
        ? ["cafeina", "beta_alanina", "omega3"].includes(item.key)
        : ["omega3", "magnesio", "multivitaminico"].includes(item.key),
  }));
}

export default function Suplementacao() {
  const nav = useNavigate();
  const { user } = useAuth();

  const userId = user?.id || null;
  const pesoKg = clamp(Number(user?.peso || 80) || 80, 40, 180);
  const goal = getGoal(user);
  const level = getLevel(user);

  const [loadingAccess, setLoadingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  const catalog = useMemo(
    () => getCatalog({ pesoKg, goal, level }),
    [pesoKg, goal, level]
  );

  const catalogMap = useMemo(() => {
    const m = {};
    for (const item of catalog) m[item.key] = item;
    return m;
  }, [catalog]);

  const [stack, setStack] = useState({});
  const [loadingStack, setLoadingStack] = useState(true);
  const [savingStackKey, setSavingStackKey] = useState("");
  const [loggingDose, setLoggingDose] = useState(false);
  const [logs, setLogs] = useState([]);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [activeItem, setActiveItem] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const monthLabel = useMemo(() => {
    const fmt = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
    return fmt.format(cursor);
  }, [cursor]);

  useEffect(() => {
    async function loadAccess() {
      if (!userId) {
        setHasAccess(false);
        setLoadingAccess(false);
        return;
      }

      setLoadingAccess(true);

      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("plan_key,status")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Suplementacao access error:", error);
        setHasAccess(false);
        setLoadingAccess(false);
        return;
      }

      const allowed =
        ["active", "trialing"].includes(data?.status) &&
        ["basico", "nutri"].includes(data?.plan_key);

      setHasAccess(!!allowed);
      setLoadingAccess(false);
    }

    loadAccess();
  }, [userId]);

  useEffect(() => {
    async function loadStack() {
      if (!userId) {
        setStack({});
        setLoadingStack(false);
        return;
      }

      setLoadingStack(true);

      const { data, error } = await supabase
        .from("supplementation_stack")
        .select("supplement_key,is_active,dose,notes")
        .eq("user_id", userId);

      if (error) {
        console.error("Suplementacao stack error:", error);
        setStack({});
        setLoadingStack(false);
        return;
      }

      const map = {};
      for (const row of data || []) {
        map[row.supplement_key] = {
          is_active: !!row.is_active,
          dose: row.dose || "",
          notes: row.notes || "",
        };
      }

      setStack(map);
      setLoadingStack(false);
    }

    loadStack();
  }, [userId]);

  useEffect(() => {
    async function loadLogs() {
      if (!userId) {
        setLogs([]);
        return;
      }

      const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
      const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
      const startKey = dayKeyLocalFromDate(start);
      const endKey = dayKeyLocalFromDate(end);

      const { data, error } = await supabase
        .from("supplementation_log")
        .select("id,day,taken_at,hour_label,supplements")
        .eq("user_id", userId)
        .gte("day", startKey)
        .lte("day", endKey)
        .order("taken_at", { ascending: false });

      if (error) {
        console.error("Suplementacao logs error:", error);
        setLogs([]);
        return;
      }

      setLogs(data || []);
    }

    loadLogs();
  }, [userId, cursor]);

  async function toggleStackItem(item) {
    if (!userId) return;

    const current = stack[item.key];
    const nextActive = !current?.is_active;

    setSavingStackKey(item.key);

    const payload = {
      user_id: userId,
      supplement_key: item.key,
      is_active: nextActive,
      dose: current?.dose || item.doseLabel,
      notes: current?.notes || "",
    };

    const { error } = await supabase
      .from("supplementation_stack")
      .upsert(payload, { onConflict: "user_id,supplement_key" });

    if (error) {
      console.error("toggleStackItem error:", error);
      setSavingStackKey("");
      return;
    }

    setStack((prev) => ({
      ...prev,
      [item.key]: {
        is_active: nextActive,
        dose: current?.dose || item.doseLabel,
        notes: current?.notes || "",
      },
    }));

    setSavingStackKey("");
  }

  async function markSupplementsTaken(hourKey) {
    if (!userId) return;

    const activeSupps = catalog
      .filter((item) => stack[item.key]?.is_active)
      .map((item) => ({
        key: item.key,
        title: item.title,
        dose: stack[item.key]?.dose || item.doseLabel,
      }));

    if (!activeSupps.length) {
      alert("Ative pelo menos um suplemento no seu stack.");
      return;
    }

    setLoggingDose(true);

    const now = new Date();
    const day = dayKeyLocalFromDate(now);
    const hourLabel =
      HOURS.find((h) => h.key === hourKey)?.label || "Horário livre";

    const { error } = await supabase.from("supplementation_log").insert({
      user_id: userId,
      day,
      taken_at: now.toISOString(),
      hour_label: hourLabel,
      supplements: activeSupps,
    });

    if (error) {
      console.error("markSupplementsTaken error:", error);
      alert("Não foi possível salvar a suplementação agora.");
      setLoggingDose(false);
      return;
    }

    const { data } = await supabase
      .from("supplementation_log")
      .select("id,day,taken_at,hour_label,supplements")
      .eq("user_id", userId)
      .gte("day", day)
      .lte("day", day)
      .order("taken_at", { ascending: false });

    setLogs((prev) => {
      const merged = [...(data || []), ...prev];
      const ids = new Set();
      return merged.filter((row) => {
        if (ids.has(row.id)) return false;
        ids.add(row.id);
        return true;
      });
    });

    setLoggingDose(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const grouped = useMemo(() => {
    const g = {};
    for (const item of catalog) {
      const k = item.group;
      if (!g[k]) g[k] = [];
      g[k].push(item);
    }
    return g;
  }, [catalog]);

  const days = useMemo(() => {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const totalDays = last.getDate();
    const startWeekday = first.getDay();

    const byDay = {};
    for (const row of logs) {
      if (!byDay[row.day]) byDay[row.day] = [];
      byDay[row.day].push(row);
    }

    const grid = [];
    for (let i = 0; i < startWeekday; i++) grid.push(null);

    for (let d = 1; d <= totalDays; d++) {
      const dt = new Date(y, m, d);
      const key = dayKeyLocalFromDate(dt);
      grid.push({
        d,
        key,
        entries: byDay[key] || [],
      });
    }

    while (grid.length % 7 !== 0) grid.push(null);
    return grid;
  }, [cursor, logs]);

  function prevMonth() {
    const d = new Date(cursor);
    d.setMonth(d.getMonth() - 1);
    d.setDate(1);
    setCursor(d);
  }

  function nextMonth() {
    const d = new Date(cursor);
    d.setMonth(d.getMonth() + 1);
    d.setDate(1);
    setCursor(d);
  }

  const todayKey = useMemo(() => dayKeyLocalFromDate(new Date()), []);

  const todaysLogs = useMemo(() => {
    return logs.filter((row) => row.day === todayKey);
  }, [logs, todayKey]);

  function openSheet(item) {
    setActiveItem(item);
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setTimeout(() => setActiveItem(null), 160);
  }

  if (loadingAccess) {
    return (
      <div style={S.page}>
        <div style={S.wrap}>
          <div style={S.heroCard}>
            <div style={S.brandRow}>
              <img src={logo} alt={APP_NAME} style={S.logo} />
              <div style={S.appName}>{APP_NAME}.</div>
            </div>
            <div style={S.title}>Carregando suplementação...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div style={S.page}>
        <div style={S.wrap}>
          <div style={S.heroCard}>
            <div style={S.brandRow}>
              <img src={logo} alt={APP_NAME} style={S.logo} />
              <div style={S.appName}>{APP_NAME}.</div>
            </div>

            <div style={S.title}>Suplementação</div>
            <div style={S.sub}>
              Essa área é liberada para usuários com plano ativo.
            </div>

            <button style={S.bigBtn} onClick={() => nav("/planos")}>
              Ver planos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <section style={S.heroCard}>
          <div style={S.brandRow}>
            <img src={logo} alt={APP_NAME} style={S.logo} />
            <div style={S.appName}>{APP_NAME}.</div>
          </div>

          <div style={S.kicker}>Suplementação</div>
          <div style={S.title}>Seu plano de Suplementação.</div>
          <div style={S.sub}>
            Stack salvo no banco, calendário por dia e registro real de horário do que você tomou.
          </div>
        </section>

        <section style={S.sectionCard}>
          <div style={S.sectionTitle}>Tomei suplementação</div>
          <div style={S.sectionSub}>
            Escolha o horário e registre o stack ativo. Depois a página volta para as infos normalmente.
          </div>

          <div style={S.hoursGrid}>
            {HOURS.map((hour) => (
              <button
                key={hour.key}
                style={S.hourBtn}
                onClick={() => markSupplementsTaken(hour.key)}
                disabled={loggingDose}
              >
                {loggingDose ? "Salvando..." : `Tomei • ${hour.label}`}
              </button>
            ))}
          </div>

          <div style={S.todayBox}>
            <div style={S.todayTitle}>Hoje</div>
            {!todaysLogs.length ? (
              <div style={S.todayEmpty}>Nenhum registro hoje ainda.</div>
            ) : (
              todaysLogs.map((row) => (
                <div key={row.id} style={S.todayItem}>
                  <div style={S.todayItemTop}>
                    <strong>{row.hour_label || "Horário livre"}</strong>
                    <span>
                      {new Date(row.taken_at).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div style={S.todaySupps}>
                    {(row.supplements || []).map((s) => s.title).join(" • ")}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section style={S.sectionCard}>
          <div style={S.sectionTitle}>Meu stack</div>
          <div style={S.sectionSub}>
            Ative o que você realmente usa. Isso fica salvo por usuário e sincroniza entre aparelhos.
          </div>

          {loadingStack ? (
            <div style={S.loading}>Carregando stack...</div>
          ) : (
            Object.keys(grouped).map((groupKey) => (
              <div key={groupKey} style={S.groupWrap}>
                <div style={S.groupTitle}>{groupTitle(groupKey)}</div>

                <div style={S.cardsGrid}>
                  {grouped[groupKey].map((item) => {
                    const active = !!stack[item.key]?.is_active;

                    return (
                      <div key={item.key} style={S.card}>
                        <div style={S.cardTop}>
                          <div>
                            <div style={S.cardTitle}>{item.title}</div>
                            <div style={S.cardDose}>{stack[item.key]?.dose || item.doseLabel}</div>
                          </div>

                          {item.suggested ? <div style={S.badge}>Sugerido</div> : null}
                        </div>

                        <div style={S.cardDesc}>{item.desc}</div>

                        <div style={S.cardActions}>
                          <button
                            style={active ? S.activeBtn : S.ghostBtn}
                            onClick={() => toggleStackItem(item)}
                            disabled={savingStackKey === item.key}
                          >
                            {savingStackKey === item.key
                              ? "Salvando..."
                              : active
                              ? "Ativado"
                              : "Adicionar"}
                          </button>

                          <button style={S.infoBtn} onClick={() => openSheet(item)}>
                            Detalhes
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </section>

        <section style={S.sectionCard}>
          <div style={S.sectionTitle}>Calendário de suplementação</div>

          <div style={S.monthBar}>
            <button onClick={prevMonth} type="button" style={S.monthBtn}>
              ‹
            </button>

            <div style={S.monthLabel}>{monthLabel}</div>

            <button onClick={nextMonth} type="button" style={S.monthBtn}>
              ›
            </button>
          </div>

          <div style={S.weekRow}>
            {["D", "S", "T", "Q", "Q", "S", "S"].map((w, i) => (
              <div key={`${w}-${i}`} style={S.weekCell}>
                {w}
              </div>
            ))}
          </div>

          <div style={S.grid}>
            {days.map((it, idx) => {
              if (!it) return <div key={`e-${idx}`} style={S.emptyCell} />;

              const isToday = it.key === todayKey;
              const totalEntries = it.entries.length;
              const names = Array.from(
                new Set(
                  it.entries.flatMap((entry) =>
                    (entry.supplements || []).map((s) => s.title)
                  )
                )
              );

              return (
                <div
                  key={it.key}
                  style={{ ...S.cell, ...(isToday ? S.todayCell : null) }}
                >
                  <div style={S.cellTop}>
                    <div style={S.dayNum}>{it.d}</div>
                    <div style={S.ml}>{totalEntries ? `${totalEntries}x` : ""}</div>
                  </div>

                  <div style={S.suppCalendarBody}>
                    <div style={S.pct}>
                      {totalEntries ? `${totalEntries} registro${totalEntries > 1 ? "s" : ""}` : "—"}
                    </div>

                    <div style={S.suppNames}>
                      {names.length ? names.slice(0, 2).join(" • ") : ""}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={S.small}>
            O calendário mostra os dias em que você registrou a suplementação e quais suplementos entraram naquele dia.
          </div>
        </section>

        <button style={S.footerBack} onClick={() => nav(-1)}>
          Voltar
        </button>
      </div>

      {activeItem && (
        <div
          style={{
            ...S.sheetOverlay,
            opacity: sheetOpen ? 1 : 0,
            pointerEvents: sheetOpen ? "auto" : "none",
          }}
          onClick={closeSheet}
        >
          <div
            style={{
              ...S.sheet,
              transform: sheetOpen
                ? "translateY(0) scale(1)"
                : "translateY(18px) scale(.985)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={S.sheetTop}>
              <div style={S.sheetBrand}>{APP_NAME}.</div>
              <button style={S.closeBtn} onClick={closeSheet}>
                ×
              </button>
            </div>

            <div style={S.sheetTitle}>{activeItem.title}</div>
            <div style={S.sheetDose}>{catalogMap[activeItem.key]?.doseLabel}</div>
            <div style={S.sheetText}>{activeItem.desc}</div>
            <div style={S.sheetText}>{activeItem.why}</div>
            <div style={S.sheetHint}>
              Melhor encaixe:{" "}
              {HOURS.find((h) => h.key === activeItem.bestHour)?.label || "Livre"}
            </div>

            <button style={S.bigDarkBtn} onClick={closeSheet}>
              Voltar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  page: {
    minHeight: "100vh",
    padding: 18,
    paddingBottom: 140,
    background:
      "radial-gradient(900px 480px at 18% -10%, rgba(255,106,0,.12), rgba(248,250,252,0) 60%), linear-gradient(180deg, #f8fafc, #f7f9fc)",
  },

  wrap: {
    maxWidth: 820,
    margin: "0 auto",
  },

  heroCard: {
    borderRadius: 28,
    padding: 20,
    background: "rgba(255,255,255,.82)",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 20px 60px rgba(15,23,42,.09)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  },

  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },

  logo: {
    width: 24,
    height: 24,
    objectFit: "contain",
  },

  appName: {
    fontSize: 28,
    fontWeight: 900,
    letterSpacing: -1,
    color: TEXT,
  },

  kicker: {
    fontSize: 12,
    fontWeight: 900,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  title: {
    marginTop: 8,
    fontSize: 30,
    lineHeight: 1.05,
    fontWeight: 950,
    color: TEXT,
    letterSpacing: -1,
  },

  sub: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 1.5,
    color: MUTED,
    fontWeight: 700,
    maxWidth: 620,
  },

  sectionCard: {
    marginTop: 14,
    borderRadius: 26,
    padding: 18,
    background: "rgba(255,255,255,.92)",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 16px 44px rgba(15,23,42,.06)",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 950,
    color: TEXT,
    letterSpacing: -0.4,
  },

  sectionSub: {
    marginTop: 8,
    fontSize: 13,
    color: MUTED,
    fontWeight: 700,
    lineHeight: 1.45,
  },

  hoursGrid: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 10,
  },

  hourBtn: {
    height: 48,
    borderRadius: 16,
    border: "none",
    background: "linear-gradient(135deg, #FF6A00, #FF8A3D)",
    color: "#111",
    fontWeight: 900,
  },

  todayBox: {
    marginTop: 16,
    borderRadius: 18,
    background: "rgba(15,23,42,.03)",
    border: "1px solid rgba(15,23,42,.06)",
    padding: 14,
  },

  todayTitle: {
    fontSize: 13,
    fontWeight: 950,
    color: TEXT,
    marginBottom: 10,
  },

  todayEmpty: {
    fontSize: 12,
    fontWeight: 800,
    color: MUTED,
  },

  todayItem: {
    padding: "10px 0",
    borderTop: "1px solid rgba(15,23,42,.06)",
  },

  todayItemTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    fontSize: 12,
    color: TEXT,
  },

  todaySupps: {
    marginTop: 5,
    fontSize: 12,
    color: MUTED,
    fontWeight: 700,
    lineHeight: 1.4,
  },

  loading: {
    marginTop: 14,
    fontSize: 13,
    color: MUTED,
    fontWeight: 800,
  },

  groupWrap: {
    marginTop: 18,
  },

  groupTitle: {
    fontSize: 14,
    fontWeight: 950,
    color: TEXT,
    marginBottom: 10,
  },

  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 12,
  },

  card: {
    borderRadius: 22,
    padding: 14,
    background: "rgba(15,23,42,.03)",
    border: "1px solid rgba(15,23,42,.06)",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "flex-start",
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: 950,
    color: TEXT,
  },

  cardDose: {
    marginTop: 4,
    fontSize: 12,
    color: MUTED,
    fontWeight: 800,
  },

  badge: {
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(255,106,0,.12)",
    color: ORANGE,
    fontSize: 11,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  cardDesc: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 1.45,
    color: MUTED,
    fontWeight: 700,
  },

  cardActions: {
    marginTop: 14,
    display: "flex",
    gap: 8,
  },

  activeBtn: {
    flex: 1,
    height: 42,
    borderRadius: 14,
    border: "none",
    background: ORANGE,
    color: "#111",
    fontWeight: 900,
  },

  ghostBtn: {
    flex: 1,
    height: 42,
    borderRadius: 14,
    border: "1px solid rgba(15,23,42,.10)",
    background: "#fff",
    color: TEXT,
    fontWeight: 900,
  },

  infoBtn: {
    width: 100,
    height: 42,
    borderRadius: 14,
    border: "1px solid rgba(15,23,42,.10)",
    background: "#fff",
    color: TEXT,
    fontWeight: 900,
  },

  monthBar: {
    marginTop: 14,
    borderRadius: 20,
    padding: 10,
    background: "rgba(255,255,255,.92)",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 12px 30px rgba(15,23,42,.05)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  monthBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    border: "1px solid rgba(15,23,42,.10)",
    background: "#fff",
    color: TEXT,
    fontWeight: 900,
    fontSize: 22,
  },

  monthLabel: {
    fontSize: 14,
    fontWeight: 950,
    color: TEXT,
    textTransform: "capitalize",
  },

  weekRow: {
    marginTop: 10,
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    gap: 8,
  },

  weekCell: {
    textAlign: "center",
    fontSize: 11,
    fontWeight: 900,
    color: MUTED,
    padding: "6px 0",
  },

  grid: {
    marginTop: 8,
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    gap: 8,
  },

  emptyCell: {
    height: 94,
    borderRadius: 18,
    border: "1px dashed rgba(15,23,42,.06)",
    background: "rgba(255,255,255,.45)",
  },

  cell: {
    minHeight: 94,
    borderRadius: 18,
    padding: 10,
    border: "1px solid rgba(15,23,42,.06)",
    background: "rgba(255,255,255,.92)",
    boxShadow: "0 10px 24px rgba(15,23,42,.05)",
    overflow: "hidden",
  },

  todayCell: {
    border: "1px solid rgba(255,106,0,.26)",
    boxShadow: "0 14px 30px rgba(255,106,0,.10)",
  },

  cellTop: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
  },

  dayNum: {
    fontSize: 13,
    fontWeight: 950,
    color: TEXT,
  },

  ml: {
    fontSize: 11,
    fontWeight: 900,
    color: MUTED,
  },

  suppCalendarBody: {
    marginTop: 10,
    display: "grid",
    gap: 8,
  },

  pct: {
    fontSize: 11,
    fontWeight: 950,
    color: TEXT,
  },

  suppNames: {
    fontSize: 11,
    lineHeight: 1.35,
    fontWeight: 800,
    color: MUTED,
  },

  small: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 1.45,
    fontWeight: 700,
    color: MUTED,
  },

  footerBack: {
    marginTop: 16,
    width: "100%",
    height: 54,
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,.10)",
    background: "#fff",
    color: TEXT,
    fontWeight: 900,
  },

  bigBtn: {
    marginTop: 18,
    width: "100%",
    height: 56,
    borderRadius: 18,
    border: "none",
    background: ORANGE,
    color: "#111",
    fontSize: 16,
    fontWeight: 900,
  },

  bigDarkBtn: {
    marginTop: 20,
    width: "100%",
    height: 56,
    borderRadius: 18,
    border: "none",
    background: "#111",
    color: "#fff",
    fontSize: 16,
    fontWeight: 900,
  },

  sheetOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,.38)",
    display: "grid",
    alignItems: "end",
    transition: "opacity .18s ease",
    zIndex: 90,
  },

  sheet: {
    width: "100%",
    maxWidth: 860,
    margin: "0 auto",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    background: "#fff",
    padding: 18,
    boxShadow: "0 -14px 40px rgba(15,23,42,.15)",
    transition: "transform .18s ease",
  },

  sheetTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  sheetBrand: {
    fontSize: 24,
    fontWeight: 950,
    color: TEXT,
    letterSpacing: -1,
  },

  closeBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    border: "1px solid rgba(15,23,42,.10)",
    background: "#fff",
    color: TEXT,
    fontSize: 26,
    lineHeight: 1,
  },

  sheetTitle: {
    marginTop: 14,
    fontSize: 22,
    fontWeight: 950,
    color: TEXT,
    letterSpacing: -0.5,
  },

  sheetDose: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: 900,
    color: ORANGE,
  },

  sheetText: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 1.55,
    color: MUTED,
    fontWeight: 700,
  },

  sheetHint: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: 900,
    color: TEXT,
  },
};
