import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

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

  if (name === "code") {
    return (
      <svg width={w} height={w} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M8 8 4 12l4 4" stroke={s} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 8l4 4-4 4" stroke={s} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13 5 11 19" stroke={s2} strokeWidth="1.8" strokeLinecap="round" />
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

function Row({ icon, title, subtitle, right, onClick, danger }) {
  return (
    <button
      type="button"
      className="tap"
      onClick={onClick}
      style={{
        ...styles.row,
        ...(danger ? styles.rowDanger : null),
      }}
    >
      <div style={{ ...styles.rowIconWrap, ...(danger ? styles.rowIconDanger : styles.rowIcon) }}>
        <Icon name={icon} />
      </div>

      <div style={styles.rowMid}>
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

  const email = (user?.email || "anon").toLowerCase();
  const paid = useMemo(() => localStorage.getItem(`paid_${email}`) === "1", [email]);

  const localPhotoKey = `acct_photo_${email}`;
  const photo = user?.photoUrl || localStorage.getItem(localPhotoKey) || "";

  const createdKey = `acct_created_${email}`;
  const [createdAt, setCreatedAt] = useState(() => {
    const u = user?.createdAt;
    const fromLs = localStorage.getItem(createdKey);
    return u || fromLs || "";
  });

  const prefsKey = `acct_prefs_${email}`;
  const [prefs, setPrefs] = useState(() => {
    const init = safeJsonParse(localStorage.getItem(prefsKey), null);
    return (
      init || {
        notifTreino: true,
        notifPagamento: true,
        privacidadePerfil: false,
      }
    );
  });

  const creatorCodeKey = `creator_code_${email}`;
  const [creatorCode, setCreatorCode] = useState(() => localStorage.getItem(creatorCodeKey) || "");

  const [editOpen, setEditOpen] = useState(false);
  const [editMsg, setEditMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(() => ({
    nome: user?.nome || "",
    email: user?.email || "",
    idade: user?.idade || "",
    altura: user?.altura || "",
    peso: user?.peso || "",
  }));

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetKind, setSheetKind] = useState(null); // share | treino | creator
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (typeof document === "undefined") return;
    const id = "fitdeal-conta-ui-v2";
    if (document.getElementById(id)) return;

    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = `
      @keyframes sheetIn { from { transform: translateY(14px) scale(.996); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
      @keyframes sheetOut { from { transform: translateY(0) scale(1); opacity: 1; } to { transform: translateY(12px) scale(.996); opacity: 0; } }
      @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes overlayOut { from { opacity: 1; } to { opacity: 0; } }
      @keyframes toastIn { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      @keyframes fitdealFloat {
        0% { transform: translateY(0px); opacity: .88; }
        50% { transform: translateY(-2px); opacity: 1; }
        100% { transform: translateY(0px); opacity: .88; }
      }

      .tap { transition: transform .12s ease; }
      .tap:active { transform: scale(.99); }
      .sheetIn { animation: sheetIn .18s ease both; }
      .sheetOut { animation: sheetOut .18s ease both; }
      .overlayIn { animation: overlayIn .18s ease both; }
      .overlayOut { animation: overlayOut .18s ease both; }
      .toastIn { animation: toastIn .18s ease both; }
      .fitdealFloat { animation: fitdealFloat 2.2s ease-in-out infinite; }

      @media (prefers-reduced-motion: reduce) {
        .tap, .sheetIn, .sheetOut, .overlayIn, .overlayOut, .toastIn, .fitdealFloat {
          animation: none !important;
          transition: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }, []);

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
  }, [user, createdKey]);

  useEffect(() => {
    localStorage.setItem(prefsKey, JSON.stringify(prefs));
  }, [prefsKey, prefs]);

  useEffect(() => {
    localStorage.setItem(creatorCodeKey, creatorCode);
  }, [creatorCodeKey, creatorCode]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  function pickPhoto() {
    fileRef.current?.click();
  }

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = String(reader.result || "");
        localStorage.setItem(localPhotoKey, base64);

        const res = await updateUser({ photoUrl: base64 });
        if (!res?.ok) {
          setToast("Foto salva neste aparelho");
          return;
        }

        setToast("Foto atualizada");
      };
      reader.readAsDataURL(file);
    } catch {
      setToast("Falha ao atualizar foto");
    } finally {
      e.target.value = "";
    }
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
    if (saving) return;
    setEditOpen(false);
    setEditMsg("");
  }

  function onFormChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function saveProfile() {
    if (saving) return;

    setEditMsg("");
    setSaving(true);

    try {
      const nome = String(form.nome || "").trim();
      const idade = String(form.idade || "").trim();
      const altura = String(form.altura || "").trim();
      const peso = String(form.peso || "").trim();

      if (!nome) {
        setEditMsg("Nome é obrigatório.");
        return;
      }
      if (idade && Number(idade) <= 0) {
        setEditMsg("Idade inválida.");
        return;
      }
      if (altura && Number(altura) <= 0) {
        setEditMsg("Altura inválida.");
        return;
      }
      if (peso && Number(peso) <= 0) {
        setEditMsg("Peso inválido.");
        return;
      }

      // email não altera por aqui pra evitar travar o app
      const res = await updateUser({
        nome,
        idade,
        altura,
        peso,
      });

      if (!res?.ok) {
        setEditMsg(res?.msg || "Não foi possível salvar.");
        return;
      }

      setEditOpen(false);
      setToast("Dados atualizados");
    } catch (err) {
      setEditMsg(err?.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
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

  const treinoShare = useMemo(() => {
    const plan = safeJsonParse(localStorage.getItem(`generated_plan_${email}`), null);
    const compat = safeJsonParse(localStorage.getItem(`custom_split_${email}`), null);

    const shareCode =
      localStorage.getItem(`share_workout_code_${email}`) ||
      `FD${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    localStorage.setItem(`share_workout_code_${email}`, shareCode);

    const payload = {
      owner: email,
      nome: user?.nome || "",
      createdAt: new Date().toISOString(),
      plan,
      compat,
    };

    localStorage.setItem(`shared_workout_${shareCode}`, JSON.stringify(payload));

    const link = `${window.location.origin}/treino/compartilhado?code=${shareCode}`;
    return { shareCode, link, plan, compat };
  }, [email, user?.nome]);

  async function copy(text, successMsg = "Copiado") {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setToast(successMsg);
        return true;
      }

      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      setToast(successMsg);
      return true;
    } catch {
      setToast("Não foi possível copiar");
      return false;
    }
  }

  async function doShareProfile() {
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

  async function shareWorkout() {
    if (!paid) {
      setToast("Função disponível só para pagantes");
      return;
    }

    try {
      const text =
        `Treino de ${user?.nome || "usuário"}\n` +
        `Código: ${treinoShare.shareCode}\n` +
        `Abrir no app: ${treinoShare.link}`;

      if (navigator.share) {
        await navigator.share({
          title: "Meu treino fitdeal",
          text,
          url: treinoShare.link,
        });
        setToast("Treino compartilhado");
        return;
      }

      await copy(text, "Código e link copiados");
    } catch {
      await copy(
        `Código: ${treinoShare.shareCode}\n${treinoShare.link}`,
        "Código e link copiados"
      );
    }
  }

  async function saveCreatorCode() {
    const code = String(creatorCode || "").trim().toUpperCase();
    setCreatorCode(code);
    localStorage.setItem(creatorCodeKey, code);
    setToast(code ? "Código salvo" : "Código limpo");
    closeSheet();
  }

  function clearCreatorCode() {
    setCreatorCode("");
    localStorage.removeItem(creatorCodeKey);
    setToast("Código removido");
  }

  function doLogout() {
    logout();
    nav("/");
  }

  if (!user) return null;

  return (
    <div style={styles.page}>
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

      <div style={styles.hero}>
        <div style={styles.heroBgGlow} />
        <div style={styles.heroRow}>
          <div style={styles.avatarWrap} className="tap" onClick={pickPhoto} role="button" aria-label="Trocar foto">
            {photo ? <img src={photo} alt="Foto" style={styles.avatarImg} /> : <div style={styles.avatarFallback}>{user.nome?.[0]?.toUpperCase() || "U"}</div>}
            <div style={styles.avatarBadge}>Trocar</div>
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={styles.heroName}>{user.nome || "Usuário"}</div>
            <div style={styles.heroEmail}>{user.email || "—"}</div>
            <div style={styles.heroMeta}>{memberSinceText}</div>

            <div style={styles.chipsRow}>
              {profileChips.length
                ? profileChips.map((t) => (
                    <div key={t} style={styles.chip}>
                      {t}
                    </div>
                  ))
                : <div style={styles.chipSoft}>Complete seu perfil para metas melhores</div>}
            </div>

            <div style={styles.heroPills}>
              <button style={styles.heroPillDark} className="tap" onClick={openEdit} type="button">
                Perfil
              </button>
              <button style={styles.heroPillSoft} className="tap" onClick={() => nav("/pagamentos")} type="button">
                Pagamentos
              </button>
            </div>
          </div>
        </div>

        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
      </div>

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

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Perfil</div>
        <div style={styles.card}>
          <Row
            icon="share"
            title="Compartilhar perfil"
            subtitle="Enviar link ou copiar"
            onClick={() => openSheet("share")}
          />
          <Row
            icon="share"
            title="Mandar meu treino"
            subtitle={paid ? "Compartilhe seu treino completo" : "Disponível só para pagantes"}
            onClick={() => (paid ? openSheet("treino") : setToast("Função disponível só para pagantes"))}
          />
          <Row
            icon="code"
            title="Código de criador"
            subtitle={creatorCode ? `Código salvo: ${creatorCode}` : "Adicionar código"}
            onClick={() => openSheet("creator")}
          />
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Preferências</div>
        <div style={styles.card}>
          <div style={styles.rowStatic}>
            <div style={styles.rowIconWrap}>
              <Icon name="bell" />
            </div>
            <div style={styles.rowMid}>
              <div style={styles.rowTitle}>Notificações de treino</div>
              <div style={styles.rowSub}>Lembretes e consistência</div>
            </div>
            <div style={styles.rowEnd}>
              <Toggle
                on={!!prefs.notifTreino}
                onChange={(v) => setPrefs((p) => ({ ...p, notifTreino: v }))}
                ariaLabel="Alternar notificações de treino"
              />
            </div>
          </div>

          <div style={styles.divider} />

          <div style={styles.rowStatic}>
            <div style={styles.rowIconWrap}>
              <Icon name="bell" />
            </div>
            <div style={styles.rowMid}>
              <div style={styles.rowTitle}>Notificações de pagamentos</div>
              <div style={styles.rowSub}>Recibos e status</div>
            </div>
            <div style={styles.rowEnd}>
              <Toggle
                on={!!prefs.notifPagamento}
                onChange={(v) => setPrefs((p) => ({ ...p, notifPagamento: v }))}
                ariaLabel="Alternar notificações de pagamentos"
              />
            </div>
          </div>

          <div style={styles.divider} />

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
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Assinatura</div>
        <div style={styles.card}>
          <Row
            icon="pay"
            title="Pagamentos"
            subtitle="Histórico, status e recibos"
            onClick={() => nav("/pagamentos")}
          />
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Sessão</div>
        <div style={styles.card}>

          <Row
            icon="logout"
            title="Sair"
            subtitle="Encerrar sessão nesta conta"
            danger
            onClick={doLogout}
          />
        </div>
      </div>

      <div style={{ height: 34 }} />

      <div style={styles.fitdealWrap}>
        <div className="fitdealFloat" style={styles.fitdealText}>
          fitdeal<span style={{ color: ORANGE }}>.</span>
        </div>
      </div>

      <div style={{ height: 120 }} />

      {editOpen && (
        <div style={styles.modalOverlay} className="overlayIn" onClick={closeEdit}>
          <div style={styles.modal} className="sheetIn" onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTop}>
              <div>
                <div style={styles.modalTitle}>Editar dados</div>
                <div style={styles.modalSub}>Esses dados serão usados para metas e treinos.</div>
              </div>
              <button style={styles.modalX} className="tap" onClick={closeEdit} type="button" aria-label="Fechar" disabled={saving}>
                ✕
              </button>
            </div>

            <div style={styles.formGrid}>
              <input name="nome" value={form.nome} onChange={onFormChange} placeholder="Nome" style={styles.input} disabled={saving} />
              <input
                name="email"
                value={form.email}
                readOnly
                placeholder="Email"
                style={{ ...styles.input, opacity: 0.72 }}
                disabled
              />

              <div style={styles.modalHint}>
                Para mudar o email, faça isso depois. Assim evitamos travar o app.
              </div>

              <div style={styles.row2}>
                <input name="idade" value={form.idade} onChange={onFormChange} placeholder="Idade" style={styles.input} inputMode="numeric" disabled={saving} />
                <input name="altura" value={form.altura} onChange={onFormChange} placeholder="Altura (cm)" style={styles.input} inputMode="numeric" disabled={saving} />
              </div>

              <input name="peso" value={form.peso} onChange={onFormChange} placeholder="Peso (kg)" style={styles.input} inputMode="numeric" disabled={saving} />
            </div>

            {editMsg ? <div style={styles.modalMsg}>{editMsg}</div> : null}

            <div style={styles.modalActions}>
              <button style={styles.modalCancel} className="tap" onClick={closeEdit} type="button" disabled={saving}>
                Cancelar
              </button>
              <button
                style={{ ...styles.modalSave, opacity: saving ? 0.8 : 1 }}
                className="tap"
                onClick={saveProfile}
                type="button"
                disabled={saving}
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

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
                {sheetKind === "share" ? "Compartilhar perfil" : null}
                {sheetKind === "treino" ? "Mandar meu treino" : null}
                {sheetKind === "creator" ? "Código de criador" : null}
              </div>
              <button style={styles.sheetX} className="tap" onClick={closeSheet} type="button" aria-label="Fechar">
                ✕
              </button>
            </div>

            <div style={styles.sheetBody}>
              {sheetKind === "share" && (
                <div style={styles.sheetSection}>
                  <div style={styles.sheetSub}>
                    Compartilhe seu perfil por link.
                  </div>

                  <div style={styles.kvBox}>
                    <div style={styles.kvK}>Link</div>
                    <div style={styles.kvV}>{profileLink}</div>
                    <div style={styles.kvActions}>
                      <button style={styles.softBtn} className="tap" onClick={() => copy(profileLink)} type="button">
                        Copiar
                      </button>
                      <button style={styles.primaryBtn} className="tap" onClick={doShareProfile} type="button">
                        Compartilhar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {sheetKind === "treino" && (
                <div style={styles.sheetSection}>
                  <div style={styles.sheetSub}>
                    Essa função envia um código e um link do seu treino atual. Apenas usuários pagantes podem usar.
                  </div>

                  <div style={styles.kvBox}>
                    <div style={styles.kvK}>Código</div>
                    <div style={styles.kvV}>{treinoShare.shareCode}</div>
                  </div>

                  <div style={styles.kvBox}>
                    <div style={styles.kvK}>Link</div>
                    <div style={styles.kvV}>{treinoShare.link}</div>
                    <div style={styles.kvActions}>
                      <button
                        style={styles.softBtn}
                        className="tap"
                        onClick={() => copy(treinoShare.shareCode, "Código copiado")}
                        type="button"
                      >
                        Copiar código
                      </button>
                      <button
                        style={styles.primaryBtn}
                        className="tap"
                        onClick={shareWorkout}
                        type="button"
                      >
                        Mandar treino
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {sheetKind === "creator" && (
                <div style={styles.sheetSection}>
                  <div style={styles.sheetSub}>
                    Digite um código de criador. Depois você conecta com suas funções e validação.
                  </div>

                  <div style={styles.kvBox}>
                    <div style={styles.kvK}>Código</div>
                    <input
                      value={creatorCode}
                      onChange={(e) => setCreatorCode(e.target.value.toUpperCase())}
                      placeholder="Ex: FITDEAL10"
                      style={styles.creatorInput}
                    />
                    <div style={styles.kvActions}>
                      <button style={styles.softBtn} className="tap" onClick={clearCreatorCode} type="button">
                        Limpar
                      </button>
                      <button style={styles.primaryBtn} className="tap" onClick={saveCreatorCode} type="button">
                        Salvar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={styles.sheetFooterSingle}>
              <button style={styles.footerGhostWide} className="tap" onClick={closeSheet} type="button">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

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

  row: {
    width: "100%",
    textAlign: "left",
    padding: 14,
    border: "none",
    background: "transparent",
    display: "flex",
    gap: 12,
    alignItems: "center",
  },
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
  rowMid: { minWidth: 0, flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  rowTitleDanger: { color: TEXT },
  rowSub: { marginTop: 4, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35 },
  rowRight: { marginLeft: "auto", display: "flex", alignItems: "center", flexShrink: 0 },
  rowRightCustom: { display: "flex", alignItems: "center" },
  rowEnd: { marginLeft: "auto", display: "flex", alignItems: "center", justifyContent: "flex-end", flexShrink: 0 },
  chev: {
    width: 34,
    height: 34,
    borderRadius: 16,
    background: "rgba(15,23,42,.06)",
    display: "grid",
    placeItems: "center",
    color: TEXT,
    fontWeight: 950,
    flexShrink: 0,
  },
  rowStatic: {
    padding: 14,
    display: "flex",
    gap: 12,
    alignItems: "center",
  },
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

  fitdealWrap: {
    display: "grid",
    placeItems: "center",
    paddingTop: 6,
  },
  fitdealText: {
    fontSize: 26,
    fontWeight: 950,
    color: TEXT,
    letterSpacing: -0.7,
    opacity: 0.92,
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(2,6,23,0.45)",
    display: "grid",
    placeItems: "center",
    zIndex: 9999,
    padding: 18,
  },
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
  modalX: {
    width: 42,
    height: 42,
    borderRadius: 16,
    border: "none",
    background: "rgba(15,23,42,.06)",
    color: TEXT,
    fontWeight: 950,
    flexShrink: 0,
  },
  formGrid: { marginTop: 14, display: "flex", flexDirection: "column", gap: 10 },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  input: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 14,
    border: "1px solid rgba(15,23,42,.10)",
    outline: "none",
    fontSize: 14,
    fontWeight: 850,
    background: "rgba(255,255,255,.92)",
  },
  modalHint: {
    fontSize: 12,
    lineHeight: 1.45,
    color: MUTED,
    fontWeight: 850,
    paddingTop: 2,
  },
  modalMsg: {
    marginTop: 10,
    padding: "10px 12px",
    borderRadius: 14,
    background: "rgba(255,106,0,.10)",
    border: "1px solid rgba(255,106,0,.22)",
    color: TEXT,
    fontSize: 13,
    fontWeight: 900,
  },
  modalActions: { marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  modalCancel: {
    padding: 14,
    borderRadius: 18,
    background: "rgba(255,255,255,.90)",
    border: "1px solid rgba(15,23,42,.10)",
    color: TEXT,
    fontWeight: 950,
  },
  modalSave: {
    padding: 14,
    borderRadius: 18,
    background: "#0B0B0C",
    border: "none",
    color: "#fff",
    fontWeight: 950,
    boxShadow: "0 16px 40px rgba(0,0,0,.16)",
  },

  sheetOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    display: "grid",
    alignItems: "end",
    padding: 12,
  },
  overlayOn: { background: "rgba(2,6,23,.44)" },
  overlayOff: { background: "rgba(2,6,23,0)" },
  sheet: {
    width: "100%",
    maxWidth: 560,
    margin: "0 auto",
    borderRadius: 26,
    background: "rgba(255,255,255,.92)",
    border: "1px solid rgba(255,255,255,.35)",
    boxShadow: "0 28px 90px rgba(0,0,0,.28)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    overflow: "hidden",
  },
  sheetOn: { opacity: 1 },
  sheetOff: { opacity: 0.98 },
  sheetGrab: { width: 52, height: 6, borderRadius: 999, background: "rgba(15,23,42,.12)", margin: "10px auto 0" },
  sheetHead: { padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },
  sheetTitle: { fontSize: 14, fontWeight: 950, color: TEXT, letterSpacing: -0.2 },
  sheetX: { width: 40, height: 40, borderRadius: 16, border: "none", background: "rgba(15,23,42,.06)", color: TEXT, fontWeight: 950 },
  sheetBody: { paddingBottom: 6 },
  sheetSection: { padding: "0 14px 14px" },
  sheetSub: { marginTop: 6, fontSize: 12, fontWeight: 850, color: MUTED, lineHeight: 1.35 },

  kvBox: {
    marginTop: 12,
    borderRadius: 22,
    padding: 12,
    background: "rgba(255,255,255,.86)",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 12px 34px rgba(15,23,42,.06)",
  },
  kvK: { fontSize: 12, fontWeight: 950, color: MUTED, letterSpacing: 0.2, textTransform: "uppercase" },
  kvV: { marginTop: 6, fontSize: 13, fontWeight: 900, color: TEXT, lineHeight: 1.35, wordBreak: "break-word" },
  kvActions: { marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },

  creatorInput: {
    width: "100%",
    marginTop: 8,
    padding: "14px 14px",
    borderRadius: 16,
    border: "1px solid rgba(15,23,42,.10)",
    fontSize: 16,
    fontWeight: 900,
    color: TEXT,
    outline: "none",
    background: "#fff",
    textTransform: "uppercase",
  },

  primaryBtn: {
    padding: 14,
    borderRadius: 18,
    border: "none",
    background: "#0B0B0C",
    color: "#fff",
    fontWeight: 950,
    boxShadow: "0 16px 40px rgba(0,0,0,.16)",
  },
  softBtn: {
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,.10)",
    background: "rgba(255,255,255,.86)",
    color: TEXT,
    fontWeight: 950,
  },

  sheetFooterSingle: {
    padding: "12px 14px 14px",
    borderTop: "1px solid rgba(15,23,42,.06)",
    background: "rgba(255,255,255,.86)",
  },
  footerGhostWide: {
    width: "100%",
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,.10)",
    background: "rgba(255,255,255,.86)",
    color: TEXT,
    fontWeight: 950,
  },

  toastWrap: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 18,
    display: "grid",
    placeItems: "center",
    zIndex: 10000,
    padding: 12,
    pointerEvents: "none",
  },
  toast: {
    padding: "10px 12px",
    borderRadius: 999,
    background: "rgba(11,11,12,.92)",
    color: "#fff",
    fontWeight: 900,
    fontSize: 12,
    boxShadow: "0 18px 60px rgba(0,0,0,.25)",
    border: "1px solid rgba(255,255,255,.10)",
  },
};



