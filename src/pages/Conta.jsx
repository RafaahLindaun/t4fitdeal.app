// ✅ COLE EM: src/pages/Conta.jsx
// Conta — estética “Apple Settings / Fitness” (Jony Ive vibe) + layout moderno tipo app
// Inclui:
// - Header premium com avatar + chips (idade/altura/peso) + “Membro desde”
// - Seções estilo Settings (cards + rows com ícones, subtitles e chevrons)
// - Features comuns de apps: compartilhar perfil/link, copiar ID, “Membro desde”, exportar dados, conectar contas (mock), preferências (toggles), privacidade
// - Modais “sheet” (sem libs) + micro animações leves (respeita reduced motion)
// - Mantém: editar dados + trocar foto + pagamentos + sair + migração localStorage do email
// ✅ NOVO: botão estilo iOS para alternar Tema Claro/Escuro (usa ThemeContext)

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext"; // ✅ AQUI

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

function clamp(n, a, b) {
  const v = Number(n);
  if (!Number.isFinite(v)) return a;
  return Math.max(a, Math.min(b, v));
}

function formatPtDate(iso) {
  try {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return "—";
  }
}

function daysSince(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return days >= 0 ? days : null;
}

function mkDownload(filename, content, mime = "application/json") {
  try {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

function Icon({ name }) {
  const s = "rgba(15,23,42,.75)";
  const s2 = "rgba(15,23,42,.55)";
  const w = 20;

  if (name === "edit") {
    return (
      <svg width={w} height={w} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 20h4l11-11a2 2 0 0 0-4-4L4 16v4Z" stroke={s} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M14 6l4 4" stroke={s2} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "pay") {
    return (
      <svg width={w} height={w} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 7h16v10H4V7Z" stroke={s} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M4 10h16" stroke={s2} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M7 14h3" stroke={s2} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "share") {
    return (
      <svg width={w} height={w} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 16V4" stroke={s} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M8.5 7.5 12 4l3.5 3.5" stroke={s} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 12v7h12v-7" stroke={s2} strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "link") {
    return (
      <svg width={w} height={w} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M10 13a4 4 0 0 1 0-6l1-1a4 4 0 0 1 6 6l-1 1" stroke={s} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M14 11a4 4 0 0 1 0 6l-1 1a4 4 0 0 1-6-6l1-1" stroke={s2} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "shield") {
    return (
      <svg width={w} height={w} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3l8 4v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4Z" stroke={s} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9.5 12l1.8 1.8L15 10" stroke={s2} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "bell") {
    return (
      <svg width={w} height={w} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 22a2.2 2.2 0 0 0 2.2-2.2H9.8A2.2 2.2 0 0 0 12 22Z" stroke={s2} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M18 16H6c1.2-1.2 2-2.6 2-5V9a4 4 0 0 1 8 0v2c0 2.4.8 3.8 2 5Z" stroke={s} strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "theme") {
    return (
      <svg width={w} height={w} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3a9 9 0 1 0 9 9c-5 2-9-2-9-9Z" stroke={s} strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "download") {
    return (
      <svg width={w} height={w} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3v10" stroke={s} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M8.5 10.5 12 13.8l3.5-3.3" stroke={s} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 20h14" stroke={s2} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "trash") {
    return (
      <svg width={w} height={w} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 7h12l-1 14H7L6 7Z" stroke={s} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9 7V4h6v3" stroke={s2} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M10 11v6M14 11v6" stroke={s2} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "logout") {
    return (
      <svg width={w} height={w} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M10 7V5a2 2 0 0 1 2-2h7v18h-7a2 2 0 0 1-2-2v-2" stroke={s} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M3 12h10" stroke={s2} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M7 8l-4 4 4 4" stroke={s2} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg width={w} height={w} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3l8 7-8 11L4 10l8-7Z" stroke={s} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function Toggle({ on, onChange, ariaLabel }) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={() => onChange(!on)}
      className="tap"
      style={{
        ...styles.toggle,
        ...(on ? styles.toggleOn : styles.toggleOff),
      }}
    >
      <span style={{ ...styles.knob, ...(on ? styles.knobOn : styles.knobOff) }} />
    </button>
  );
}

function Row({ icon, title, subtitle, right, onClick, danger, compact }) {
  return (
    <button
      type="button"
      className="tap"
      onClick={onClick}
      style={{
        ...styles.row,
        ...(danger ? styles.rowDanger : null),
        ...(compact ? styles.rowCompact : null),
      }}
    >
      <div style={{ ...styles.rowIconWrap, ...(danger ? styles.rowIconDanger : styles.rowIcon) }}>
        <Icon name={icon} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ ...styles.rowTitle, ...(danger ? styles.rowTitleDanger : null) }}>{title}</div>
        {subtitle ? <div style={styles.rowSub}>{subtitle}</div> : null}
      </div>
      <div style={styles.rowRight}>
        {right ? <div style={styles.rowRightCustom}>{right}</div> : <div style={styles.chev}>›</div>}
      </div>
    </button>
  );
}

export default function Conta() {
  const { user, updateUser, logout } = useAuth();
  const nav = useNavigate();
  const fileRef = useRef(null);

  // ✅ THEME
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const photo = user?.photoUrl || "";
  const email = (user?.email || "anon").toLowerCase();

  // data “membro desde”
  const createdKey = `acct_created_${email}`;
  const [createdAt, setCreatedAt] = useState(() => {
    // prioridade: user.createdAt -> localStorage -> cria agora
    const u = user?.createdAt;
    const fromLs = localStorage.getItem(createdKey);
    return u || fromLs || "";
  });

  // preferências comuns
  const prefsKey = `acct_prefs_${email}`;
  const [prefs, setPrefs] = useState(() => {
    const init = safeJsonParse(localStorage.getItem(prefsKey), null);
    return (
      init || {
        notifTreino: true,
        notifPagamento: true,
        resumoSemanal: true,
        modoFocus: false,
        privacidadePerfil: false,
        haptics: true,
      }
    );
  });

  // contas conectadas (mock)
  const linksKey = `acct_links_${email}`;
  const [links, setLinks] = useState(() => {
    const init = safeJsonParse(localStorage.getItem(linksKey), null);
    return init || { google: false, apple: false };
  });

  // UI: edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editMsg, setEditMsg] = useState("");

  const [form, setForm] = useState(() => ({
    nome: user?.nome || "",
    email: user?.email || "",
    idade: user?.idade || "",
    altura: user?.altura || "",
    peso: user?.peso || "",
  }));

  // UI: sheet (bottom sheet)
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetKind, setSheetKind] = useState(null); // "share" | "link" | "privacy" | "export" | "danger"
  const [toast, setToast] = useState("");

  // animações
  useEffect(() => {
    if (typeof document === "undefined") return;
    const id = "fitdeal-conta-ui";
    if (document.getElementById(id)) return;

    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = `
      @keyframes sheetIn { from { transform: translateY(14px) scale(.996); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
      @keyframes sheetOut { from { transform: translateY(0) scale(1); opacity: 1; } to { transform: translateY(12px) scale(.996); opacity: 0; } }
      @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes overlayOut { from { opacity: 1; } to { opacity: 0; } }
      @keyframes toastIn { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      @keyframes toastOut { from { transform: translateY(0); opacity: 1; } to { transform: translateY(8px); opacity: 0; } }

      .tap { transition: transform .12s ease; }
      .tap:active { transform: scale(.99); }

      .sheetIn { animation: sheetIn .18s ease both; }
      .sheetOut { animation: sheetOut .18s ease both; }
      .overlayIn { animation: overlayIn .18s ease both; }
      .overlayOut { animation: overlayOut .18s ease both; }

      .toastIn { animation: toastIn .18s ease both; }
      .toastOut { animation: toastOut .16s ease both; }

      @media (prefers-reduced-motion: reduce) {
        .tap, .sheetIn, .sheetOut, .overlayIn, .overlayOut, .toastIn, .toastOut { 
          animation: none !important; 
          transition: none !important; 
        }
      }
    `;
    document.head.appendChild(style);
  }, []);

  // garante createdAt persistido
  useEffect(() => {
    if (!user) return;

    const uCreated = user?.createdAt;
    const ls = localStorage.getItem(createdKey);

    if (uCreated) {
      setCreatedAt(uCreated);
      if (!ls) localStorage.setItem(createdKey, String(uCreated));
      return;
    }

    if (ls) {
      setCreatedAt(ls);
      return;
    }

    const now = new Date().toISOString();
    setCreatedAt(now);
    localStorage.setItem(createdKey, now);
    // opcional: salvar também no user store (se seu updateUser persistir)
    try {
      updateUser({ createdAt: now });
    } catch {
      // ok
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  // persiste prefs/links
  useEffect(() => {
    localStorage.setItem(prefsKey, JSON.stringify(prefs));
  }, [prefsKey, prefs]);

  useEffect(() => {
    localStorage.setItem(linksKey, JSON.stringify(links));
  }, [linksKey, links]);

  // toast auto
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  function pickPhoto() {
    fileRef.current?.click();
  }

  function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => updateUser({ photoUrl: reader.result });
    reader.readAsDataURL(file);
  }

  function openEdit() {
    setEditMsg("");
    setForm({
      nome: user?.nome || "",
      email: user?.email || "",
      idade: user?.idade || "",
      altura: user?.altura || "",
      peso: user?.peso || "",
    });
    setEditOpen(true);
  }

  function closeEdit() {
    setEditOpen(false);
    setEditMsg("");
  }

  function onFormChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function migrateEmailData(oldEmail, newEmail) {
    const oldKeyPay = `payments_${oldEmail}`;
    const newKeyPay = `payments_${newEmail}`;
    const payRaw = localStorage.getItem(oldKeyPay);
    if (payRaw && !localStorage.getItem(newKeyPay)) localStorage.setItem(newKeyPay, payRaw);
    if (payRaw) localStorage.removeItem(oldKeyPay);

    const oldPaid = `paid_${oldEmail}`;
    const newPaid = `paid_${newEmail}`;
    const paid = localStorage.getItem(oldPaid);
    if (paid && !localStorage.getItem(newPaid)) localStorage.setItem(newPaid, paid);
    if (paid) localStorage.removeItem(oldPaid);

    // migra também meta/prefs/stack etc (se existirem)
    const keysToMove = [
      `supp_stack_${oldEmail}`,
      `acct_created_${oldEmail}`,
      `acct_prefs_${oldEmail}`,
      `acct_links_${oldEmail}`,
    ];
    keysToMove.forEach((k) => {
      const raw = localStorage.getItem(k);
      if (!raw) return;
      const nk = k.replace(oldEmail, newEmail);
      if (!localStorage.getItem(nk)) localStorage.setItem(nk, raw);
      localStorage.removeItem(k);
    });
  }

  function saveProfile() {
    setEditMsg("");

    const nome = form.nome.trim();
    const emailNew = form.email.trim().toLowerCase();
    const idade = String(form.idade || "").trim();
    const altura = String(form.altura || "").trim();
    const peso = String(form.peso || "").trim();

    if (!nome) return setEditMsg("Nome é obrigatório.");
    if (!emailNew || !emailNew.includes("@")) return setEditMsg("Email inválido.");
    if (idade && Number(idade) <= 0) return setEditMsg("Idade inválida.");
    if (altura && Number(altura) <= 0) return setEditMsg("Altura inválida.");
    if (peso && Number(peso) <= 0) return setEditMsg("Peso inválido.");

    const oldEmail = (user?.email || "").toLowerCase();
    if (oldEmail && emailNew !== oldEmail) migrateEmailData(oldEmail, emailNew);

    updateUser({ nome, email: emailNew, idade, altura, peso });
    setEditOpen(false);
    setToast("Dados atualizados");
  }

  function openSheet(kind) {
    setSheetKind(kind);
    setSheetOpen(true);
  }
  function closeSheet() {
    setSheetOpen(false);
    setTimeout(() => setSheetKind(null), 170);
  }

  const memberSinceText = useMemo(() => {
    const d = formatPtDate(createdAt);
    const days = daysSince(createdAt);
    if (days == null) return `Membro desde ${d}`;
    if (days === 0) return `Membro desde ${d} • hoje`;
    if (days === 1) return `Membro desde ${d} • 1 dia`;
    return `Membro desde ${d} • ${days} dias`;
  }, [createdAt]);

  const paid = useMemo(() => localStorage.getItem(`paid_${email}`) === "1", [email]);

  const profileChips = useMemo(() => {
    const idade = user?.idade ? `${user.idade} anos` : null;
    const altura = user?.altura ? `${user.altura} cm` : null;
    const peso = user?.peso ? `${user.peso} kg` : null;
    return [idade, altura, peso].filter(Boolean).slice(0, 3);
  }, [user?.idade, user?.altura, user?.peso]);

  const profileLink = useMemo(() => {
    const id = encodeURIComponent((user?.email || "anon").toLowerCase());
    return `${window?.location?.origin || ""}/perfil/${id}`;
  }, [user?.email]);

  async function copy(text) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setToast("Copiado");
        return true;
      }
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      setToast("Copiado");
      return true;
    } catch {
      setToast("Não foi possível copiar");
      return false;
    }
  }

  async function doShare() {
    try {
      const payload = {
        title: "Meu perfil",
        text: `Meu perfil no app: ${user?.nome || ""}`,
        url: profileLink,
      };
      if (navigator.share) {
        await navigator.share(payload);
        setToast("Compartilhado");
        return;
      }
      await copy(profileLink);
    } catch {
      await copy(profileLink);
    }
  }

  function exportMyData() {
    const keys = [
      `paid_${email}`,
      `payments_${email}`,
      `supp_stack_${email}`,
      `acct_created_${email}`,
      `acct_prefs_${email}`,
      `acct_links_${email}`,
    ];

    const pack = {
      exportedAt: new Date().toISOString(),
      user: user || null,
      localStorage: keys.reduce((acc, k) => {
        acc[k] = localStorage.getItem(k);
        return acc;
      }, {}),
    };

    const ok = mkDownload(`minha-conta-${email}.json`, JSON.stringify(pack, null, 2));
    setToast(ok ? "Exportado" : "Falha ao exportar");
  }

  function clearLocalData() {
    const keys = [
      `paid_${email}`,
      `payments_${email}`,
      `supp_stack_${email}`,
      `acct_created_${email}`,
      `acct_prefs_${email}`,
      `acct_links_${email}`,
    ];
    keys.forEach((k) => localStorage.removeItem(k));
    setToast("Dados locais removidos");
    closeSheet();
  }

  function doLogout() {
    logout();
    nav("/");
  }

  if (!user) return null;

  return (
    <div style={styles.page}>
      {/* TOP BAR */}
      <div style={styles.topBar}>
        <button style={styles.backBtn} className="tap" onClick={() => nav("/dashboard")} type="button" aria-label="Voltar">
          ←
        </button>
        <div style={styles.topTitle}>Conta</div>
        <button style={styles.topPill} className="tap" onClick={() => openSheet("share")} type="button" aria-label="Compartilhar">
          <span style={styles.topPillTxt}>
            Compartilhar<span style={styles.orangeDot}>.</span>
          </span>
        </button>
      </div>

      {/* HERO PROFILE */}
      <div style={styles.hero}>
        <div style={styles.heroBgGlow} />
        <div style={styles.heroRow}>
          <div style={styles.avatarWrap} className="tap" onClick={pickPhoto} role="button" aria-label="Trocar foto">
            {photo ? (
              <img src={photo} alt="Foto" style={styles.avatarImg} />
            ) : (
              <div style={styles.avatarFallback}>{user.nome?.[0]?.toUpperCase() || "U"}</div>
            )}
            <div style={styles.avatarBadge}>Trocar</div>
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={styles.heroName}>{user.nome || "Usuário"}</div>
            <div style={styles.heroEmail}>{user.email || "—"}</div>
            <div style={styles.heroMeta}>{memberSinceText}</div>

            <div style={styles.chipsRow}>
              {profileChips.length ? (
                profileChips.map((t) => (
                  <div key={t} style={styles.chip}>
                    {t}
                  </div>
                ))
              ) : (
                <div style={styles.chipSoft}>Complete seu perfil para metas melhores</div>
              )}
            </div>

            <div style={styles.heroPills}>
              <button style={styles.heroPillDark} className="tap" onClick={openEdit} type="button">
                Editar
              </button>
              <button style={styles.heroPillSoft} className="tap" onClick={() => nav("/pagamentos")} type="button">
                Pagamentos
              </button>
            </div>
          </div>
        </div>

        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
      </div>

      {/* STATS STRIP */}
      <div style={styles.statsStrip}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Plano</div>
          <div style={styles.statValue}>{paid ? "Assinante" : "Free"}</div>
          <div style={styles.statSub}>{paid ? "Recursos premium ativos" : "Acesse mais com planos"}</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Privacidade</div>
          <div style={styles.statValue}>{prefs.privacidadePerfil ? "Privado" : "Público"}</div>
          <div style={styles.statSub}>Visibilidade do perfil</div>
        </div>
      </div>

      {/* SETTINGS SECTIONS */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Perfil</div>
        <div style={styles.card}>
          <Row icon="edit" title="Editar dados" subtitle="Nome, email, idade, altura e peso" onClick={openEdit} />
          <Row icon="share" title="Compartilhar perfil" subtitle="Enviar link ou copiar" onClick={() => openSheet("share")} />
          <Row icon="link" title="Conectar contas" subtitle="Apple / Google (rápido e seguro)" onClick={() => openSheet("link")} />
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Preferências</div>
        <div style={styles.card}>
          <div style={styles.rowStatic}>
            <div style={styles.rowIconWrap}>
              <Icon name="bell" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={styles.rowTitle}>Notificações de treino</div>
              <div style={styles.rowSub}>Lembretes e consistência</div>
            </div>
            <Toggle
              on={!!prefs.notifTreino}
              onChange={(v) => setPrefs((p) => ({ ...p, notifTreino: v }))}
              ariaLabel="Alternar notificações de treino"
            />
          </div>

          <div style={styles.divider} />

          <div style={styles.rowStatic}>
            <div style={styles.rowIconWrap}>
              <Icon name="bell" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={styles.rowTitle}>Notificações de pagamentos</div>
              <div style={styles.rowSub}>Recibos e status</div>
            </div>
            <Toggle
              on={!!prefs.notifPagamento}
              onChange={(v) => setPrefs((p) => ({ ...p, notifPagamento: v }))}
              ariaLabel="Alternar notificações de pagamentos"
            />
          </div>

          <div style={styles.divider} />

          <div style={styles.rowStatic}>
            <div style={styles.rowIconWrap}>
              <Icon name="shield" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={styles.rowTitle}>Resumo semanal</div>
              <div style={styles.rowSub}>Evolução, consistência e metas</div>
            </div>
            <Toggle
              on={!!prefs.resumoSemanal}
              onChange={(v) => setPrefs((p) => ({ ...p, resumoSemanal: v }))}
              ariaLabel="Alternar resumo semanal"
            />
          </div>

          <div style={styles.divider} />

          <div style={styles.rowStatic}>
            <div style={styles.rowIconWrap}>
              <Icon name="theme" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={styles.rowTitle}>Modo Focus</div>
              <div style={styles.rowSub}>Menos distração no app</div>
            </div>
            <Toggle
              on={!!prefs.modoFocus}
              onChange={(v) => setPrefs((p) => ({ ...p, modoFocus: v }))}
              ariaLabel="Alternar modo focus"
            />
          </div>

          {/* ✅ NOVO: MODO ESCURO/CLARO */}
          <div style={styles.divider} />
          <div style={styles.rowStatic}>
            <div style={styles.rowIconWrap}>
              <Icon name="theme" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={styles.rowTitle}>Modo escuro</div>
              <div style={styles.rowSub}>Aparência do aplicativo</div>
            </div>
            <Toggle
              on={isDark}
              onChange={(v) => {
                setTheme(v ? "dark" : "light");
                setToast(v ? "Tema escuro" : "Tema claro");
              }}
              ariaLabel="Alternar tema escuro/claro"
            />
          </div>
        </div>

        <div style={styles.hint}>Essas preferências ficam salvas no dispositivo (localStorage) por conta.</div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Assinatura</div>
        <div style={styles.card}>
          <Row icon="pay" title="Pagamentos" subtitle="Histórico, status e recibos" onClick={() => nav("/pagamentos")} />
          <Row
            icon="shield"
            title="Gerenciar plano"
            subtitle={paid ? "Ver detalhes do plano" : "Ver planos e liberar recursos"}
            onClick={() => nav(paid ? "/pagamentos" : "/planos")}
          />
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Privacidade & Dados</div>
        <div style={styles.card}>
          <Row
            icon="shield"
            title="Privacidade do perfil"
            subtitle={prefs.privacidadePerfil ? "Seu perfil está privado" : "Seu perfil está público"}
            right={
              <Toggle
                on={!!prefs.privacidadePerfil}
                onChange={(v) => setPrefs((p) => ({ ...p, privacidadePerfil: v }))}
                ariaLabel="Alternar privacidade do perfil"
              />
            }
            onClick={() => setPrefs((p) => ({ ...p, privacidadePerfil: !p.privacidadePerfil }))}
          />
          <Row icon="download" title="Exportar meus dados" subtitle="Baixar JSON com sua conta e dados locais" onClick={() => openSheet("export")} />
          <Row icon="trash" title="Apagar dados locais" subtitle="Remove informações do dispositivo" danger onClick={() => openSheet("danger")} />
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Sessão</div>
        <div style={styles.card}>
          <Row icon="logout" title="Sair" subtitle="Encerrar sessão nesta conta" danger onClick={doLogout} />
        </div>
      </div>

      <div style={{ height: 110 }} />

      {/* EDIT MODAL */}
      {editOpen && (
        <div style={styles.modalOverlay} className="overlayIn" onClick={closeEdit}>
          <div style={styles.modal} className="sheetIn" onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTop}>
              <div>
                <div style={styles.modalTitle}>Editar dados</div>
                <div style={styles.modalSub}>Esses dados serão usados para metas e treinos.</div>
              </div>
              <button style={styles.modalX} className="tap" onClick={closeEdit} type="button" aria-label="Fechar">
                ✕
              </button>
            </div>

            <div style={styles.formGrid}>
              <input name="nome" value={form.nome} onChange={onFormChange} placeholder="Nome" style={styles.input} />
              <input name="email" value={form.email} onChange={onFormChange} placeholder="Email" style={styles.input} />

              <div style={styles.row2}>
                <input name="idade" value={form.idade} onChange={onFormChange} placeholder="Idade" style={styles.input} inputMode="numeric" />
                <input name="altura" value={form.altura} onChange={onFormChange} placeholder="Altura (cm)" style={styles.input} inputMode="numeric" />
              </div>

              <input name="peso" value={form.peso} onChange={onFormChange} placeholder="Peso (kg)" style={styles.input} inputMode="numeric" />
            </div>

            {editMsg ? <div style={styles.modalMsg}>{editMsg}</div> : null}

            <div style={styles.modalActions}>
              <button style={styles.modalCancel} className="tap" onClick={closeEdit} type="button">
                Cancelar
              </button>
              <button style={styles.modalSave} className="tap" onClick={saveProfile} type="button">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM SHEET */}
      {sheetKind && (
        <div
          style={{ ...styles.sheetOverlay, ...(sheetOpen ? styles.overlayOn : styles.overlayOff) }}
          className={sheetOpen ? "overlayIn" : "overlayOut"}
          onClick={closeSheet}
          role="presentation"
        >
          <div
            style={{ ...styles.sheet, ...(sheetOpen ? styles.sheetOn : styles.sheetOff) }}
            className={sheetOpen ? "sheetIn" : "sheetOut"}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div style={styles.sheetGrab} />

            <div style={styles.sheetHead}>
              <div style={styles.sheetTitle}>
                {sheetKind === "share" ? "Compartilhar" : null}
                {sheetKind === "link" ? "Conectar contas" : null}
                {sheetKind === "export" ? "Exportar dados" : null}
                {sheetKind === "danger" ? "Atenção" : null}
              </div>
              <button style={styles.sheetX} className="tap" onClick={closeSheet} type="button" aria-label="Fechar">
                ✕
              </button>
            </div>

            <div style={styles.sheetBody}>
              {sheetKind === "share" && (
                <div style={styles.sheetSection}>
                  <div style={styles.sheetSub}>
                    Use um link simples para compartilhar seu perfil. Se o compartilhamento nativo não estiver disponível, o app copia o link automaticamente.
                  </div>

                  <div style={styles.kvBox}>
                    <div style={styles.kvK}>Link</div>
                    <div style={styles.kvV}>{profileLink}</div>
                    <div style={styles.kvActions}>
                      <button style={styles.softBtn} className="tap" onClick={() => copy(profileLink)} type="button">
                        Copiar
                      </button>
                      <button style={styles.primaryBtn} className="tap" onClick={doShare} type="button">
                        Compartilhar
                      </button>
                    </div>
                  </div>

                  <div style={styles.kvBox}>
                    <div style={styles.kvK}>ID da conta</div>
                    <div style={styles.kvV}>{email}</div>
                    <div style={styles.kvActions}>
                      <button style={styles.softBtn} className="tap" onClick={() => copy(email)} type="button">
                        Copiar ID
                      </button>
                      <button style={styles.ghostBtn} className="tap" onClick={() => nav("/dashboard")} type="button">
                        Ir ao Dashboard
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {sheetKind === "link" && (
                <div style={styles.sheetSection}>
                  <div style={styles.sheetSub}>
                    Conectar contas facilita login e melhora segurança. Aqui é um mock local (sem OAuth). Se você integrar autenticação real depois, pode reaproveitar o layout.
                  </div>

                  <div style={styles.linkCard}>
                    <div style={styles.linkRow}>
                      <div style={styles.linkLeft}>
                        <div style={styles.linkLogo}>G</div>
                        <div>
                          <div style={styles.linkTitle}>Google</div>
                          <div style={styles.linkSub}>{links.google ? "Conectado" : "Não conectado"}</div>
                        </div>
                      </div>
                      <Toggle
                        on={!!links.google}
                        onChange={(v) => {
                          setLinks((p) => ({ ...p, google: v }));
                          setToast(v ? "Google conectado" : "Google desconectado");
                        }}
                        ariaLabel="Alternar conta Google"
                      />
                    </div>

                    <div style={styles.divider} />

                    <div style={styles.linkRow}>
                      <div style={styles.linkLeft}>
                        <div style={{ ...styles.linkLogo, background: "rgba(15,23,42,.10)" }}></div>
                        <div>
                          <div style={styles.linkTitle}>Apple</div>
                          <div style={styles.linkSub}>{links.apple ? "Conectado" : "Não conectado"}</div>
                        </div>
                      </div>
                      <Toggle
                        on={!!links.apple}
                        onChange={(v) => {
                          setLinks((p) => ({ ...p, apple: v }));
                          setToast(v ? "Apple conectado" : "Apple desconectado");
                        }}
                        ariaLabel="Alternar conta Apple"
                      />
                    </div>
                  </div>

                  <div style={styles.hint}>Dica: quando houver backend, guarde as conexões por UID do usuário (não só email).</div>
                </div>
              )}

              {sheetKind === "export" && (
                <div style={styles.sheetSection}>
                  <div style={styles.sheetSub}>
                    Exporta um arquivo JSON com seus dados do perfil e as principais chaves locais relacionadas à sua conta (assinatura, pagamentos, stack de suplementos e preferências).
                  </div>

                  <div style={styles.sheetButtons}>
                    <button style={styles.primaryBtn} className="tap" onClick={exportMyData} type="button">
                      Baixar arquivo
                    </button>
                    <button
                      style={styles.ghostBtn}
                      className="tap"
                      onClick={() => copy(JSON.stringify(user || {}, null, 2))}
                      type="button"
                    >
                      Copiar perfil (JSON)
                    </button>
                  </div>

                  <div style={styles.disclaimer}>Arquivo gerado no dispositivo. Não envia nada para servidores.</div>
                </div>
              )}

              {sheetKind === "danger" && (
                <div style={styles.sheetSection}>
                  <div style={styles.sheetSub}>
                    Isso remove dados do dispositivo (localStorage) desta conta. Seu perfil em memória (auth) continua até você sair.
                  </div>

                  <div style={styles.warnBox}>
                    <div style={styles.warnLine}>
                      <span style={styles.warnDot} />
                      <span style={styles.warnTxt}>Remove preferências, stack, flags de assinatura/pagamento e datas locais.</span>
                    </div>
                    <div style={styles.warnLine}>
                      <span style={styles.warnDot} />
                      <span style={styles.warnTxt}>Use quando precisar “resetar” o app nesta conta.</span>
                    </div>
                  </div>

                  <div style={styles.sheetButtons}>
                    <button style={styles.dangerBtn} className="tap" onClick={clearLocalData} type="button">
                      Apagar dados locais
                    </button>
                    <button style={styles.ghostBtn} className="tap" onClick={closeSheet} type="button">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div style={styles.sheetFooter}>
              <button style={styles.footerGhost} className="tap" onClick={closeSheet} type="button">
                Fechar
              </button>
              <button style={styles.footerPrimary} className="tap" onClick={() => nav("/dashboard")} type="button">
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast ? (
        <div style={styles.toastWrap} className="toastIn" role="status" aria-live="polite">
          <div style={styles.toast}>{toast}</div>
        </div>
      ) : null}
    </div>
  );
}

const styles = {
  page: { padding: 18, paddingBottom: 120, background: BG },

  orangeDot: { color: ORANGE, marginLeft: 1, fontWeight: 950 },

  topBar: { display: "flex", alignItems: "center", gap: 12, marginBottom: 12 },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    border: "1px solid rgba(15,23,42,.08)",
    background: "rgba(255,255,255,.86)",
    color: TEXT,
    fontWeight: 950,
    fontSize: 16,
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
  },
  topTitle: { fontSize: 18, fontWeight: 950, color: TEXT, letterSpacing: -0.3 },
  topPill: {
    marginLeft: "auto",
    padding: "12px 14px",
    borderRadius: 999,
    border: "1px solid rgba(15,23,42,.10)",
    background: "linear-gradient(180deg, #0B0C0F 0%, #14161B 100%)",
    color: "#fff",
    fontWeight: 950,
    boxShadow: "0 14px 34px rgba(0,0,0,.20), inset 0 1px 0 rgba(255,255,255,.06)",
  },
  topPillTxt: { display: "inline-flex", alignItems: "baseline" },

  hero: {
    position: "relative",
    borderRadius: 26,
    padding: 16,
    overflow: "hidden",
    background: "linear-gradient(135deg, rgba(255,106,0,.18), rgba(255,255,255,.92))",
    border: "1px solid rgba(255,106,0,.18)",
    boxShadow: "0 24px 80px rgba(15,23,42,.10)",
  },
  heroBgGlow: {
    position: "absolute",
    inset: -2,
    pointerEvents: "none",
    background:
      "radial-gradient(520px 220px at 12% 0%, rgba(255,106,0,.20), rgba(255,255,255,0) 60%), radial-gradient(520px 240px at 92% 15%, rgba(15,23,42,.10), rgba(255,255,255,0) 55%)",
    opacity: 0.9,
  },
  heroRow: { position: "relative", display: "flex", gap: 14, alignItems: "center" },

  avatarWrap: {
    width: 86,
    height: 86,
    borderRadius: 24,
    overflow: "hidden",
    background: "rgba(15,23,42,.06)",
    display: "grid",
    placeItems: "center",
    position: "relative",
    cursor: "pointer",
    flexShrink: 0,
    border: "1px solid rgba(255,255,255,.55)",
    boxShadow: "0 18px 60px rgba(15,23,42,.10)",
  },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  avatarFallback: { fontSize: 30, fontWeight: 950, color: TEXT },
  avatarBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    fontSize: 11,
    background: "rgba(0,0,0,0.45)",
    color: "#fff",
    padding: "4px 8px",
    borderRadius: 999,
    fontWeight: 950,
    border: "1px solid rgba(255,255,255,.14)",
  },

  heroName: { fontSize: 18, fontWeight: 950, color: TEXT, letterSpacing: -0.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  heroEmail: { marginTop: 4, fontSize: 12, fontWeight: 850, color: "rgba(15,23,42,.72)", wordBreak: "break-word" },
  heroMeta: { marginTop: 6, fontSize: 12, fontWeight: 850, color: MUTED },

  chipsRow: { marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 },
  chip: {
    padding: "8px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,.82)",
    border: "1px solid rgba(15,23,42,.08)",
    boxShadow: "0 12px 34px rgba(15,23,42,.06)",
    fontWeight: 950,
    fontSize: 12,
    color: TEXT,
  },
  chipSoft: {
    padding: "8px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,.65)",
    border: "1px solid rgba(15,23,42,.08)",
    fontWeight: 900,
    fontSize: 12,
    color: MUTED,
  },

  heroPills: { marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" },
  heroPillDark: {
    padding: "10px 12px",
    borderRadius: 16,
    border: "none",
    background: "#0B0B0C",
    color: "#fff",
    fontWeight: 950,
    boxShadow: "0 18px 55px rgba(0,0,0,.16)",
  },
  heroPillSoft: {
    padding: "10px 12px",
    borderRadius: 16,
    border: "1px solid rgba(15,23,42,.10)",
    background: "rgba(255,255,255,.86)",
    color: TEXT,
    fontWeight: 950,
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
  },

  statsStrip: { marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  statCard: {
    borderRadius: 22,
    padding: 14,
    background: "rgba(255,255,255,.92)",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 14px 40px rgba(15,23,42,.06)",
  },
  statLabel: { fontSize: 12, fontWeight: 950, color: MUTED, letterSpacing: 0.2, textTransform: "uppercase" },
  statValue: { marginTop: 6, fontSize: 16, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  statSub: { marginTop: 4, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35 },

  section: { marginTop: 16 },
  sectionTitle: { fontSize: 14, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  card: {
    marginTop: 10,
    borderRadius: 24,
    background: "rgba(255,255,255,.92)",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 18px 60px rgba(15,23,42,.06)",
    overflow: "hidden",
  },
  hint: { marginTop: 10, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35 },

  row: { width: "100%", textAlign: "left", padding: 14, border: "none", background: "transparent", display: "flex", gap: 12, alignItems: "center" },
  rowCompact: { padding: 12 },
  rowDanger: { background: "rgba(255,106,0,.00)" },
  rowIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    border: "1px solid rgba(15,23,42,.06)",
    background: "rgba(15,23,42,.04)",
    flexShrink: 0,
  },
  rowIcon: {},
  rowIconDanger: { background: "rgba(255,106,0,.12)", borderColor: "rgba(255,106,0,.18)" },
  rowTitle: { fontSize: 14, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  rowTitleDanger: { color: TEXT },
  rowSub: { marginTop: 4, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35 },
  rowRight: { marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 },
  rowRightCustom: { display: "flex", alignItems: "center" },
  chev: { width: 34, height: 34, borderRadius: 16, background: "rgba(15,23,42,.06)", display: "grid", placeItems: "center", color: TEXT, fontWeight: 950, flexShrink: 0 },
  rowStatic: { padding: 14, display: "flex", gap: 12, alignItems: "center" },
  divider: { height: 1, background: "rgba(15,23,42,.06)", marginLeft: 14, marginRight: 14 },

  toggle: {
    width: 48,
    height: 28,
    borderRadius: 999,
    border: "1px solid rgba(15,23,42,.10)",
    padding: 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    background: "rgba(15,23,42,.08)",
  },
  toggleOn: { background: "rgba(255,106,0,.95)", borderColor: "rgba(255,106,0,.35)", justifyContent: "flex-end" },
  toggleOff: { background: "rgba(15,23,42,.10)" },
  knob: { width: 24, height: 24, borderRadius: 999, background: "#fff", boxShadow: "0 8px 20px rgba(15,23,42,.16)" },
  knobOn: {},
  knobOff: { opacity: 0.98 },

  modalOverlay: { position: "fixed", inset: 0, background: "rgba(2,6,23,0.45)", display: "grid", placeItems: "center", zIndex: 9999, padding: 18 },
  modal: {
    width: "min(560px, 100%)",
    background: "rgba(255,255,255,.94)",
    borderRadius: 26,
    padding: 18,
    border: "1px solid rgba(255,255,255,.35)",
    boxShadow: "0 30px 90px rgba(0,0,0,.25)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
  },
  modalTop: { display: "flex", gap: 10, alignItems: "flex-start", justifyContent: "space-between" },
  modalTitle: { fontSize: 16, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  modalSub: { marginTop: 6, fontSize: 13, color: MUTED, lineHeight: 1.45, fontWeight: 850 },
  modalX: { width: 42, height: 42, borderRadius: 16, border: "none", background: "rgba(15,23,42,.06)", color: TEXT, fontWeight: 950, flexShrink: 0 },
  formGrid: { marginTop: 14, display: "flex", flexDirection: "column", gap: 10 },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  input: { width: "100%", padding: "12px 12px", borderRadius: 14, border: "1px solid rgba(15,23,42,.10)", outline: "none", fontSize: 14, fontWeight: 850, background: "rgba(255,255,255,.92)" },
  modalMsg: { marginTop: 10, padding: "10px 12px", borderRadius: 14, background: "rgba(255,106,0,.10)", border: "1px solid rgba(255,106,0,.22)", color: TEXT, fontSize: 13, fontWeight: 900 },
  modalActions: { marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  modalCancel: { padding: 14, borderRadius: 18, background: "rgba(255,255,255,.90)", border: "1px solid rgba(15,23,42,.10)", color: TEXT, fontWeight: 950 },
  modalSave: { padding: 14, borderRadius: 18, background: "#0B0B0C", border: "none", color: "#fff", fontWeight: 950, boxShadow: "0 16px 40px rgba(0,0,0,.16)" },

  sheetOverlay: { position: "fixed", inset: 0, zIndex: 9999, display: "grid", alignItems: "end", padding: 12 },
  overlayOn: { background: "rgba(2,6,23,.44)" },
  overlayOff: { background: "rgba(2,6,23,0)" },
  sheet: { width: "100%", maxWidth: 560, margin: "0 auto", borderRadius: 26, background: "rgba(255,255,255,.92)", border: "1px solid rgba(255,255,255,.35)", boxShadow: "0 28px 90px rgba(0,0,0,.28)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", overflow: "hidden" },
  sheetOn: { opacity: 1 },
  sheetOff: { opacity: 0.98 },
  sheetGrab: { width: 52, height: 6, borderRadius: 999, background: "rgba(15,23,42,.12)", margin: "10px auto 0" },
  sheetHead: { padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },
  sheetTitle: { fontSize: 14, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  sheetX: { width: 40, height: 40, borderRadius: 16, border: "none", background: "rgba(15,23,42,.06)", color: TEXT, fontWeight: 950 },
  sheetBody: { paddingBottom: 6 },
  sheetSection: { padding: "0 14px 14px" },
  sheetSub: { marginTop: 6, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35 },

  kvBox: { marginTop: 12, borderRadius: 22, padding: 12, background: "rgba(255,255,255,.86)", border: "1px solid rgba(15,23,42,.06)", boxShadow: "0 12px 34px rgba(15,23,42,.06)" },
  kvK: { fontSize: 12, fontWeight: 950, color: MUTED, letterSpacing: 0.2, textTransform: "uppercase" },
  kvV: { marginTop: 6, fontSize: 13, fontWeight: 900, color: TEXT, lineHeight: 1.35, wordBreak: "break-word" },
  kvActions: { marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },

  sheetButtons: { marginTop: 12, display: "grid", gap: 10 },

  primaryBtn: { padding: 14, borderRadius: 18, border: "none", background: "#0B0B0C", color: "#fff", fontWeight: 950, boxShadow: "0 16px 40px rgba(0,0,0,.16)" },
  softBtn: { padding: 14, borderRadius: 18, border: "1px solid rgba(15,23,42,.10)", background: "rgba(255,255,255,.86)", color: TEXT, fontWeight: 950 },
  ghostBtn: { padding: 14, borderRadius: 18, border: "1px solid rgba(15,23,42,.10)", background: "rgba(255,255,255,.86)", color: TEXT, fontWeight: 950 },
  dangerBtn: { padding: 14, borderRadius: 18, border: "none", background: ORANGE, color: "#111", fontWeight: 950, boxShadow: "0 16px 40px rgba(255,106,0,.18)" },

  disclaimer: { marginTop: 10, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35 },

  linkCard: { marginTop: 12, borderRadius: 24, background: "rgba(255,255,255,.86)", border: "1px solid rgba(15,23,42,.06)", boxShadow: "0 12px 34px rgba(15,23,42,.06)", overflow: "hidden" },
  linkRow: { padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },
  linkLeft: { display: "flex", alignItems: "center", gap: 12, minWidth: 0 },
  linkLogo: { width: 44, height: 44, borderRadius: 18, background: "rgba(255,106,0,.14)", border: "1px solid rgba(255,106,0,.18)", display: "grid", placeItems: "center", fontWeight: 950, color: TEXT, flexShrink: 0 },
  linkTitle: { fontSize: 14, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  linkSub: { marginTop: 4, fontSize: 12, fontWeight: 850, color: MUTED },

  warnBox: { marginTop: 12, borderRadius: 22, padding: 12, background: "linear-gradient(135deg, rgba(2,6,23,.06), rgba(255,255,255,.86))", border: "1px solid rgba(15,23,42,.08)", boxShadow: "0 14px 40px rgba(15,23,42,.06)" },
  warnLine: { display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 4px" },
  warnDot: { width: 7, height: 7, borderRadius: 999, background: "rgba(15,23,42,.55)", marginTop: 6, flexShrink: 0 },
  warnTxt: { fontSize: 12, fontWeight: 850, color: TEXT, lineHeight: 1.35, opacity: 0.92 },

  sheetFooter: { padding: "12px 14px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, borderTop: "1px solid rgba(15,23,42,.06)", background: "rgba(255,255,255,.86)" },
  footerGhost: { padding: 14, borderRadius: 18, border: "1px solid rgba(15,23,42,.10)", background: "rgba(255,255,255,.86)", color: TEXT, fontWeight: 950 },
  footerPrimary: { padding: 14, borderRadius: 18, border: "none", background: "#0B0B0C", color: "#fff", fontWeight: 950, boxShadow: "0 16px 40px rgba(0,0,0,.16)" },

  toastWrap: { position: "fixed", left: 0, right: 0, bottom: 18, display: "grid", placeItems: "center", zIndex: 10000, padding: 12, pointerEvents: "none" },
  toast: { padding: "10px 12px", borderRadius: 999, background: "rgba(11,11,12,.92)", color: "#fff", fontWeight: 900, fontSize: 12, boxShadow: "0 18px 60px rgba(0,0,0,.25)", border: "1px solid rgba(255,255,255,.10)" },
};
