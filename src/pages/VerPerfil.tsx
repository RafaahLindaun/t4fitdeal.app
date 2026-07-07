import { Header, Screen, Card, MenuRow } from "../components/Layout";
import { Icon } from "../components/Icon";

export default function VerPerfil() {
  return (
    <Screen>
      <Header title="MEU PERFIL" />
      <div className="page-title" style={{textAlign:'center'}}><span className="profile-circle" style={{margin:'0 auto 12px'}}><Icon name="user" size={54}/></span><h2>Aluno Exemplo</h2><span className="badge" style={{margin:'0 auto'}}>Aluno</span><p>Membro desde jan/2024</p></div>
      <Card className="chart-card"><div className="profile-stats"><div><strong>48</strong><small>Treinos</small></div><div><strong>32</strong><small>Aulas</small></div><div><strong>28</strong><small>Dias ativos</small></div><div><strong>12</strong><small>Sequência</small></div></div></Card>
      <section className="menu-list"><MenuRow icon="target" title="Meus objetivos" subtitle="Ver e acompanhar" to="/conta/perfil"/><MenuRow icon="clipboard" title="Medidas e avaliações" subtitle="Acompanhe seu progresso" to="/conta/perfil"/><MenuRow icon="clock" title="Histórico" subtitle="Treinos, aulas e check-ins" to="/conta/perfil"/></section>
      <button className="outline-btn danger"><Icon name="logout"/>Sair da conta</button>
    </Screen>
  );
}
