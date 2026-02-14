// ✅ COLE EM: src/pages/Conta.jsx  (SEM FEEDBACK, SEM MOTIVAÇÃO)
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Conta() {
  const { user, updateUser, logout } = useAuth();
  const nav = useNavigate();
  const fileRef = useRef(null);

  const photo = user?.photoUrl || "";

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

  const [editOpen, setEditOpen] = useState(false);
  const [editMsg, setEditMsg] = useState("");

  const [form, setForm] = useState(() => ({
    nome: user?.nome || "",
    email: user?.email || "",
    idade: user?.idade || "",
    altura: user?.altura || "",
    peso: user?.peso || "",
  }));

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
  }

  function saveProfile() {
    setEditMsg("");

    const nome = form.nome.trim();
    const email = form.email.trim().toLowerCase();
    const idade = String(form.idade || "").trim();
    const altura = String(form.altura || "").trim();
    const peso = String(form.peso || "").trim();

    if (!nome) return setEditMsg("Nome é obrigatório.");
    if (!email || !email.includes("@")) return setEditMsg("Email inválido.");
    if (idade && Number(idade) <= 0) return setEditMsg("Idade inválida.");
    if (altura && Number(altura) <= 0) return setEditMsg("Altura inválida.");
    if (peso && Number(peso) <= 0) return setEditMsg("Peso inválido.");

    const oldEmail = (user?.email || "").toLowerCase();
    if (oldEmail && email !== oldEmail) migrateEmailData(oldEmail, email);

    updateUser({ nome, email, idade, altura, peso });
    setEditOpen(false);
  }

  if (!user) return null;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.profile}>
          <div style={styles.avatarWrap} onClick={pickPhoto}>
            {photo ? (
              <img src={photo} alt="Foto" style={styles.avatarImg} />
            ) : (
              <div style={styles.avatarFallback}>{user.nome?.[0]?.toUpperCase() || "U"}</div>
            )}
            <div style={styles.badge}>Trocar</div>
          </div>

          <div style={styles.info}>
            <div style={styles.name}>{user.nome}</div>
            <div style={styles.email}>{user.email}</div>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onFile}
          style={{ display: "none" }}
        />
      </div>

      <div style={styles.actions}>
        <button style={styles.primaryBtn} onClick={openEdit}>
          Editar dados
        </button>

        <button style={styles.payBtn} onClick={() => nav("/pagamentos")}>
          Pagamentos
        </button>

        <button
          style={styles.logoutBtn}
          onClick={() => {
            logout();
            nav("/");
          }}
        >
          Sair
        </button>
      </div>

      {editOpen && (
        <div style={styles.modalOverlay} onClick={closeEdit}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>Editar dados</div>
            <div style={styles.modalSub}>Esses dados serão usados para metas e treinos.</div>

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
              <button style={styles.modalCancel} onClick={closeEdit}>
                Cancelar
              </button>
              <button style={styles.modalSave} onClick={saveProfile}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const ORANGE = "#FF6A00";
const BG = "#f8fafc";
const TEXT = "#0f172a";
const MUTED = "#64748b";

const styles = {
  page: { padding: 18, paddingBottom: 120, background: BG },

  header: {
    background: `linear-gradient(135deg, rgba(255,106,0,.92), rgba(255,106,0,.62))`,
    borderRadius: 22,
    padding: 18,
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.18)",
    boxShadow: "0 22px 70px rgba(15,23,42,.12)",
  },
  profile: { display: "flex", gap: 14, alignItems: "center" },
  avatarWrap: {
    width: 78,
    height: 78,
    borderRadius: 20,
    overflow: "hidden",
    background: "rgba(255,255,255,0.22)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    cursor: "pointer",
    flexShrink: 0,
    border: "1px solid rgba(255,255,255,0.22)",
  },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  avatarFallback: { fontSize: 28, fontWeight: 950 },
  badge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    fontSize: 11,
    background: "rgba(0,0,0,0.42)",
    padding: "4px 8px",
    borderRadius: 999,
    fontWeight: 950,
  },
  info: { minWidth: 0 },
  name: { fontSize: 20, fontWeight: 950, letterSpacing: -0.3 },
  email: { fontSize: 12, opacity: 0.95, wordBreak: "break-word", fontWeight: 800 },

  actions: { marginTop: 14, display: "grid", gap: 12 },
  primaryBtn: {
    padding: 14,
    borderRadius: 18,
    background: TEXT,
    color: "#fff",
    border: "none",
    fontWeight: 950,
  },
  payBtn: {
    padding: 14,
    borderRadius: 18,
    background: ORANGE,
    color: "#111",
    border: "none",
    fontWeight: 950,
  },
  logoutBtn: {
    padding: 14,
    borderRadius: 18,
    background: "#fff",
    border: "1px solid rgba(15,23,42,.10)",
    color: TEXT,
    fontWeight: 950,
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.45)",
    display: "grid",
    placeItems: "center",
    zIndex: 999,
    padding: 18,
  },
  modal: {
    width: "min(520px, 100%)",
    background: "#ffffff",
    borderRadius: 22,
    padding: 18,
    border: "1px solid rgba(15,23,42,0.10)",
    boxShadow: "0 30px 80px rgba(15,23,42,0.25)",
  },
  modalTitle: { fontSize: 16, fontWeight: 950, color: TEXT },
  modalSub: { marginTop: 6, fontSize: 13, color: MUTED, lineHeight: 1.45, fontWeight: 800 },
  formGrid: { marginTop: 14, display: "flex", flexDirection: "column", gap: 10 },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  input: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 14,
    border: "1px solid rgba(15,23,42,.10)",
    outline: "none",
    fontSize: 14,
    fontWeight: 800,
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
    borderRadius: 16,
    background: "#fff",
    border: "1px solid rgba(15,23,42,.10)",
    color: TEXT,
    fontWeight: 950,
  },
  modalSave: { padding: 14, borderRadius: 16, background: TEXT, border: "none", color: "#fff", fontWeight: 950 },
};
