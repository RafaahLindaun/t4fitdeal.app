import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import { Panel } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";

export default function Conta() {
  const { profile, isTeam } = useAuth();
  const items = [
    ["/conta/dados", "Dados pessoais", "Atualize informações importantes e completas."],
    ["/conta/notificacoes", "Notificações", "Controle alertas, avisos e lembretes."],
    ["/conta/seguranca", "Segurança", "Senha, sessão e proteção da conta."],
    ["/conta/configuracoes", "Configurações", "Preferências gerais do aplicativo."],
    ["/conta/ver-perfil", "Ver perfil", "Veja como seu perfil aparece no app."],
  ] as const;
  return (
    <AppShell title="Minha conta" subtitle="Tudo organizado e sem excesso de informação.">
      <Panel>
        <div className="profile-summary">
          <div className="header-avatar large">{profile?.full_name?.charAt(0).toUpperCase() || "A"}</div>
          <div><strong>{profile?.full_name || "Aluno Accqua"}</strong><p>{profile?.email}</p><span>{profile?.role} • {profile?.status}</span></div>
        </div>
      </Panel>
      <div className="stack-10">
        {items.map(([to, title, desc]) => <Link key={to} to={to} className="menu-card"><span>{title}</span><small>{desc}</small></Link>)}
      </div>
      {isTeam ? <Link to="/equipe" className="primary-btn full-width top-space">Abrir área da equipe</Link> : null}
    </AppShell>
  );
}
