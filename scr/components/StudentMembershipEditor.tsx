import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { statusMatricula } from "../lib/home";
import { updateStudentMembership } from "../lib/classes";
import { logStaffError, staffFacingErrorMessage } from "../lib/staffErrors";
import { AdminCheckIcon, AdminShieldIcon } from "./AdminIcons";
import "./student-membership-editor.css";

type Props = {
  studentId: string;
  validUntil: string;
  paymentDay: number;
  lastPayment: string;
  confirmedAt: string;
  notes: string;
  onSaved: () => void | Promise<void>;
};

function plusOneMonth(dateKey: string) {
  if (!dateKey) return "";
  const date = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  const originalDay = date.getDate();
  date.setMonth(date.getMonth() + 1, 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(originalDay, lastDay));
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function todayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDate(value: string) {
  if (!value) return "Não informado";
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? "Não informado" : date.toLocaleDateString("pt-BR");
}

export default function StudentMembershipEditor({ studentId, validUntil, paymentDay, lastPayment, confirmedAt, notes, onSaved }: Props) {
  const reduceMotion = Boolean(useReducedMotion());
  const [paidOn, setPaidOn] = useState(lastPayment || todayKey());
  const [day, setDay] = useState(paymentDay || Number((lastPayment || todayKey()).slice(8, 10)) || 1);
  const [until, setUntil] = useState(validUntil || plusOneMonth(lastPayment || todayKey()));
  const [note, setNote] = useState(notes);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const base = lastPayment || todayKey();
    setPaidOn(base);
    setDay(paymentDay || Number(base.slice(8, 10)) || 1);
    setUntil(validUntil || plusOneMonth(base));
    setNote(notes);
  }, [studentId, validUntil, paymentDay, lastPayment, notes]);

  const health = useMemo(() => statusMatricula(validUntil), [validUntil]);
  const label = health === "ativa" ? "Matrícula ativa" : health === "vencendo" ? "Vence em breve" : "Matrícula inativa";

  const save = async (confirmed: boolean) => {
    if (busy) return;
    if (confirmed && !paidOn) {
      toast.error("Informe a data do pagamento.");
      return;
    }
    if (confirmed && !until) {
      toast.error("Informe até quando a matrícula ficará válida.");
      return;
    }
    setBusy(true);
    try {
      await updateStudentMembership(studentId, {
        paymentDay: Math.max(1, Math.min(31, Number(day) || 1)),
        lastPayment: paidOn,
        validUntil: until,
        notes: note,
        confirmed,
      });
      toast.success(confirmed ? "Pagamento confirmado" : "Matrícula marcada como pendente.");
      await onSaved();
    } catch (error) {
      logStaffError("membership", error);
      toast.error(staffFacingErrorMessage(error, "Não foi possível atualizar a matrícula agora. Tente novamente."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="admin-membership-card">
      <header>
        <span className={`admin-membership-icon is-${health}`}><AdminShieldIcon size={24} /></span>
        <div>
          <small>MATRÍCULA</small>
          <h2>Controle de pagamento</h2>
          <p>Este é o mesmo vencimento usado pelo escudo do aluno e pelas regras de reserva de aulas.</p>
        </div>
        <b className={`is-${health}`}>{label}</b>
      </header>

      <div className="admin-membership-current">
        <span><small>Válida até</small><strong>{formatDate(validUntil)}</strong></span>
        <span><small>Último pagamento</small><strong>{formatDate(lastPayment)}</strong></span>
        <span><small>Confirmado</small><strong>{confirmedAt ? new Date(confirmedAt).toLocaleDateString("pt-BR") : "Ainda não"}</strong></span>
      </div>

      <div className="admin-membership-form">
        <label><span>Pagamento realizado em</span><input type="date" value={paidOn} onChange={(event) => {
          const next = event.target.value;
          setPaidOn(next);
          if (next) {
            setDay(Number(next.slice(8, 10)) || 1);
            setUntil(plusOneMonth(next));
          }
        }} /></label>
        <label><span>Dia padrão</span><input type="number" min={1} max={31} inputMode="numeric" value={day} onChange={(event) => setDay(Math.max(1, Math.min(31, Number(event.target.value) || 1)))} /></label>
        <label><span>Matrícula válida até</span><input type="date" value={until} onChange={(event) => setUntil(event.target.value)} /></label>
        <label className="is-wide"><span>Observação</span><input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Opcional — ex.: mensalidade presencial" /></label>
      </div>

      <div className="admin-membership-actions">
        <motion.button type="button" className="is-confirm" whileTap={reduceMotion ? undefined : { scale: .97 }} disabled={busy} onClick={() => void save(true)}><AdminCheckIcon size={18} />{busy ? "Salvando..." : "Confirmar pagamento"}</motion.button>
        {validUntil ? <button type="button" className="is-pending" disabled={busy} onClick={() => void save(false)}>Marcar como pendente</button> : null}
      </div>
    </article>
  );
}
