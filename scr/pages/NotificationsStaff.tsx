import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../auth/AuthProvider";
import LoadingSplash from "../components/LoadingSplash";
import {
  sendStaffNotification,
  type NotificationAudience,
  type NotificationIcon,
  type StaffNotificationResult,
} from "../lib/notifications";
import "./notifications-staff.css";

const ICONS: Array<{ id: NotificationIcon; glyph: string; label: string }> = [
  { id: "megafone", glyph: "📣", label: "Aviso geral" },
  { id: "treino", glyph: "🏋️", label: "Treino" },
  { id: "pagamento", glyph: "💳", label: "Pagamento/matrícula" },
  { id: "presente", glyph: "🎁", label: "Promoção/prêmio" },
  { id: "alerta", glyph: "⚠️", label: "Urgente" },
  { id: "conquista", glyph: "🏆", label: "Conquista/ranking" },
];

const AUDIENCES: Array<{ id: NotificationAudience; label: string; detail: string }> = [
  { id: "todos", label: "Todos", detail: "Todos os alunos com notificações ativas" },
  { id: "matriculados", label: "Matriculados", detail: "Matrícula válida hoje" },
  { id: "gympass", label: "Wellhub / Gympass", detail: "Alunos com número Gympass" },
  { id: "totalpass", label: "TotalPass", detail: "Alunos com número TotalPass" },
];

export default function NotificationsStaff() {
  const { user, profile, loading } = useAuth();
  const isStaff = Boolean(profile && ["professor", "admin", "reception"].includes(profile.role));
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [icon, setIcon] = useState<NotificationIcon>("megafone");
  const [audience, setAudience] = useState<NotificationAudience>("todos");
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<StaffNotificationResult | null>(null);

  if (loading) return <LoadingSplash />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isStaff) return <Navigate to="/menu-teste" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const cleanTitle = title.trim();
    const cleanBody = body.trim();
    if (!cleanTitle || !cleanBody) {
      toast.error("Preencha título e mensagem.");
      return;
    }
    setSending(true);
    try {
      const result = await sendStaffNotification({ title: cleanTitle, body: cleanBody, icon, audience });
      setLastResult(result);
      setTitle("");
      setBody("");
      toast.success(`Enviado para ${result.recipients} aluno${result.recipients === 1 ? "" : "s"}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar a notificação.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="notifications-staff-page">
      <header className="notifications-staff-heading">
        <small>ÁREA ACCQUA</small>
        <h1>Notificações</h1>
        <p>Envie avisos segmentados para o sino do app e, quando autorizado, por push.</p>
      </header>

      <div className="notifications-staff-grid">
        <form className="notifications-staff-card notifications-compose" onSubmit={(event) => void submit(event)}>
          <div className="notifications-section-heading"><span>COMPOSIÇÃO</span><strong>Novo aviso</strong></div>
          <label>Título <span>{title.length}/60</span><input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={60} placeholder="Ex: Aula de hidro alterada" required /></label>
          <label>Mensagem <span>{body.length}/200</span><textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={200} rows={5} placeholder="Escreva a mensagem que o aluno vai receber." required /></label>

          <fieldset><legend>Ícone</legend><div className="notification-icon-grid">{ICONS.map((item) => <button key={item.id} type="button" className={icon === item.id ? "is-selected" : ""} onClick={() => setIcon(item.id)} aria-pressed={icon === item.id}><b>{item.glyph}</b><span>{item.label}</span></button>)}</div></fieldset>

          <fieldset><legend>Público</legend><div className="notification-audience-grid">{AUDIENCES.map((item) => <button key={item.id} type="button" className={audience === item.id ? "is-selected" : ""} onClick={() => setAudience(item.id)} aria-pressed={audience === item.id}><strong>{item.label}</strong><small>{item.detail}</small></button>)}</div></fieldset>

          <button className="notifications-send" type="submit" disabled={sending}>{sending ? "Enviando..." : "Enviar notificação"}</button>
        </form>

        <aside className="notifications-staff-side">
          <section className="notifications-staff-card notification-preview">
            <div className="notifications-section-heading"><span>PRÉVIA</span><strong>Como aparece para o aluno</strong></div>
            <article><span className="notification-preview-icon">{ICONS.find((item) => item.id === icon)?.glyph}</span><div><strong>{title.trim() || "Título da notificação"}</strong><p>{body.trim() || "Sua mensagem aparece aqui antes do envio."}</p><small>Agora · ACCQUA Sports</small></div></article>
          </section>

          <section className="notifications-staff-card notification-delivery-info">
            <div className="notifications-section-heading"><span>ENTREGA</span><strong>Respeita a preferência do aluno</strong></div>
            <p>Quem desativou notificações não recebe entrada no sino nem push. iPhone precisa do app instalado na Tela de Início para Web Push.</p>
            {lastResult ? <div className="notification-last-result"><strong>Último envio</strong><span>{lastResult.recipients} destinatário{lastResult.recipients === 1 ? "" : "s"}</span><small>{lastResult.pushDelivered} push entregue{lastResult.pushDelivered === 1 ? "" : "s"}{lastResult.pushFailed ? ` · ${lastResult.pushFailed} falharam` : ""}</small></div> : null}
          </section>
        </aside>
      </div>
    </main>
  );
}
