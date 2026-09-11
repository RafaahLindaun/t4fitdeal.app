import { type FormEvent, useEffect, useState } from "react";
import CenteredModal from "./CenteredModal";
import { supabase } from "../lib/supabase";
import "./owner-staff-manager.css";

type StaffRole = "professor" | "admin" | "reception";

type StaffMember = {
  id: string;
  email: string;
  fullName: string;
  role: StaffRole;
  status: string;
  createdAt?: string | null;
  owner?: boolean;
};

const ROLE_META: Record<StaffRole, { label: string }> = {
  professor: { label: "Professor" },
  admin: { label: "Administração" },
  reception: { label: "Recepção" },
};

async function edgeErrorMessage(error: unknown, fallback: string) {
  const context = (error as { context?: unknown } | null)?.context as
    | { clone?: () => Response; json?: () => Promise<unknown> }
    | undefined;
  try {
    const response = typeof context?.clone === "function" ? context.clone() : context;
    if (response && typeof response.json === "function") {
      const payload = (await response.json()) as { message?: unknown };
      const message = String(payload?.message ?? "").trim();
      if (message) return message;
    }
  } catch {
    // Safe fallback below.
  }
  return fallback;
}

export default function OwnerStaffManager({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [creating, setCreating] = useState(false);
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<StaffRole>("professor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const cleanEmail = email.trim().toLowerCase();

  const loadStaff = async () => {
    setLoadingList(true);
    try {
      const { data, error } = await supabase.functions.invoke("owner-create-staff-v1655", {
        body: { action: "list" },
      });
      if (error) throw error;
      setStaff(Array.isArray(data?.staff) ? data.staff : []);
    } catch (error) {
      setMessage({ kind: "error", text: await edgeErrorMessage(error, "Não foi possível carregar a equipe agora.") });
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setMessage(null);
    void loadStaff();
  }, [open]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (creating) return;

    const cleanName = fullName.trim().replace(/\s+/g, " ");
    if (cleanName.length < 2 || !cleanEmail || password.length < 8) {
      setMessage({
        kind: "error",
        text: "Preencha o nome, o e-mail completo e uma senha com pelo menos 8 caracteres.",
      });
      return;
    }

    setCreating(true);
    setMessage(null);
    try {
      const { data, error } = await supabase.functions.invoke("owner-create-staff-v1655", {
        body: {
          action: "create",
          fullName: cleanName,
          role,
          email: cleanEmail,
          password,
        },
      });
      if (error) throw error;
      if (!data?.success || !data?.staff?.id) throw new Error("Conta não confirmada pelo servidor.");
      const createdEmail = String(data.staff.email ?? cleanEmail);
      setMessage({ kind: "success", text: `${createdEmail} criado e liberado para o Staff.` });
      setFullName("");
      setEmail("");
      setPassword("");
      await loadStaff();
    } catch (error) {
      setMessage({ kind: "error", text: await edgeErrorMessage(error, "Não foi possível criar essa conta agora.") });
    } finally {
      setCreating(false);
    }
  };

  return (
    <CenteredModal
      open={open}
      onOpenChange={onOpenChange}
      title="Gestão da equipe"
      description="Área exclusiva do proprietário da ACCQUA Sports."
      className="owner-staff-modal"
      bodyClassName="owner-staff-modal-body"
    >
      <form className="owner-staff-form" onSubmit={handleSubmit}>
        <div className="owner-staff-form-heading">
          <div>
            <small>NOVO ACESSO</small>
            <h3>Adicionar à equipe</h3>
          </div>
          {cleanEmail ? <span title={cleanEmail}>{cleanEmail}</span> : null}
        </div>

        <label>
          <span>Nome completo</span>
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Ex.: Mariana Souza"
            maxLength={80}
            autoComplete="off"
            required
            disabled={creating}
          />
        </label>

        <fieldset className="owner-staff-role-picker">
          <legend>Tipo de acesso</legend>
          <div>
            {(Object.keys(ROLE_META) as StaffRole[]).map((value) => (
              <button
                key={value}
                type="button"
                className={role === value ? "is-active" : ""}
                onClick={() => setRole(value)}
                aria-pressed={role === value}
                disabled={creating}
              >
                {ROLE_META[value].label}
              </button>
            ))}
          </div>
        </fieldset>

        <label>
          <span>E-mail de acesso</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Ex.: mariana@gmail.com"
              maxLength={254}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
              disabled={creating}
              aria-describedby="owner-staff-email-help"
            />
          <small id="owner-staff-email-help">Pode ser Gmail, Outlook ou outro domínio. O tipo de acesso é escolhido acima.</small>
        </label>

        <label>
          <span>Senha inicial</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mínimo de 8 caracteres"
            minLength={8}
            required
            disabled={creating}
            autoComplete="new-password"
          />
        </label>

        {message ? (
          <div className={`owner-staff-message is-${message.kind}`} role="status">
            {message.text}
          </div>
        ) : null}

        <button className="owner-staff-create-button" type="submit" disabled={creating}>
          {creating ? "Criando acesso..." : "Criar e liberar acesso"}
        </button>
      </form>

      <section className="owner-staff-list-section">
        <div className="owner-staff-list-heading">
          <div>
            <small>EQUIPE ATUAL</small>
            <h3>Acessos Staff</h3>
          </div>
          <span>{loadingList ? "..." : staff.length}</span>
        </div>

        {loadingList && staff.length === 0 ? (
          <div className="owner-staff-list-empty">Carregando equipe...</div>
        ) : staff.length === 0 ? (
          <div className="owner-staff-list-empty">Nenhum acesso Staff encontrado.</div>
        ) : (
          <div className="owner-staff-list">
            {staff.map((member) => (
              <article key={member.id} className="owner-staff-member">
                <div className="owner-staff-member-avatar" aria-hidden="true">
                  {(member.fullName || member.email || "A").slice(0, 1).toUpperCase()}
                </div>
                <div className="owner-staff-member-info">
                  <strong>
                    {member.fullName}
                    {member.owner ? <em>Dono</em> : null}
                  </strong>
                  <span>{member.email}</span>
                </div>
                <div className="owner-staff-member-role">
                  <strong>{ROLE_META[member.role]?.label ?? member.role}</strong>
                  <span>{member.status === "active" ? "Ativo" : member.status}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </CenteredModal>
  );
}
