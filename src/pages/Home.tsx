import { Link } from "react-router-dom";
import AppShell, { SmallIconButton } from "../components/AppShell";
import { Panel, SectionTitle, Stat } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import { Icon } from "../components/Icons";

export default function Home() {
  const { profile, isTeam } = useAuth();
  const firstName = profile?.full_name?.split(" ")[0] || "Aluno";

  const cards = [
    ["/treino", "Meu treino", "training", "Seu professor monta e atualiza seus exercícios."],
    ["/cardio", "Bora pro Cardio!", "cardio", "Cronometre tempo, calorias e pace estimado."],
    ["/dieta", "Minha dieta", "diet", "Análise diária, semanal e mensal."],
    ["/ranking", "Ranking", "ranking", "Veja quem mais treinou no mês."],
    ["/personal", "Área personal", "team", "Conheça os professores e chame seu personal."],
    ["/loja", "Loja", "store", "Itens visualizados no app e vendidos na recepção."],
    ["/aulas", "Aulas", "calendar", "Aulas coletivas, piscina e Gympass."],
    ["/conta", "Conta", "account", "Dados, segurança e configurações."],
  ] as const;

  return (
    <AppShell title={`Olá, ${firstName}`} subtitle="Tudo o que você precisa em um só aplicativo." action={<SmallIconButton to="/ranking" label="Ranking" icon="ranking" />}>
      <Panel className="hero-panel">
        <div>
          <SectionTitle title="Resumo rápido" hint="Seu app só libera o que está ativo no sistema." />
          <div className="stats-grid three">
            <Stat label="Conta" value={profile?.status === "active" ? "Liberada" : "Pendente"} />
            <Stat label="Treino" value="Professor" />
            <Stat label="Dieta" value={profile?.diet_active ? "Ativa" : "Paga"} />
          </div>
        </div>
      </Panel>

      <div className="shortcut-grid">
        {cards.map(([to, label, icon, text]) => (
          <Link key={to} to={to} className="shortcut-card">
            <div className="shortcut-top"><Icon name={icon} /><span>{label}</span></div>
            <p>{text}</p>
          </Link>
        ))}
      </div>

      {isTeam ? (
        <Panel>
          <SectionTitle title="Área da equipe" hint="Acesso rápido para professores, recepção e administração." />
          <Link className="primary-btn full-width" to="/equipe">Abrir painel da equipe</Link>
        </Panel>
      ) : null}
    </AppShell>
  );
}
