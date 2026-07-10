import AppShell from "../components/AppShell";
import { Panel, Stat } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";

export default function VerPerfil() {
  const { profile } = useAuth();
  return (
    <AppShell title="Ver perfil" subtitle="Como sua conta aparece no app.">
      <Panel>
        <div className="profile-summary"><div className="header-avatar large">{profile?.full_name?.charAt(0).toUpperCase() || "A"}</div><div><strong>{profile?.full_name}</strong><p>{profile?.goal || "Sem objetivo definido"}</p></div></div>
        <div className="stats-grid two top-space">
          <Stat label="Status" value={profile?.status || "pending"} />
          <Stat label="Tipo" value={profile?.role || "aluno"} />
        </div>
      </Panel>
    </AppShell>
  );
}
