import { Header, Screen, Card, Toggle } from "../components/Layout";
import { Icon } from "../components/Icon";

const items = [
  ["Avisos gerais da academia", "Novidades e comunicados", true],
  ["Lembretes de aulas", "Avisos sobre suas aulas", true],
  ["Promoções e ofertas", "Descontos e campanhas", false],
  ["Dicas de treino e saúde", "Conteúdos e recomendações", true],
  ["Atualizações do app", "Melhorias e novas funcionalidades", true],
];

export default function Notificacoes() {
  return (
    <Screen>
      <Header title="NOTIFICAÇÕES" />
      <div className="page-title" style={{textAlign:'center'}}><span className="status-icon" style={{margin:'0 auto 12px'}}><Icon name="bell" size={42}/></span><p>Escolha sobre o que deseja receber avisos.</p></div>
      <Card className="setting-row"><span><Icon name="bell" className="yellow"/><div><strong>Receber notificações</strong><p>Ative para receber avisos importantes</p></div></span><Toggle /></Card>
      <h2 style={{margin:'18px 4px 10px'}}>Notificações push</h2>
      <section className="settings-list">{items.map(([title, sub, on])=><Card className="setting-row" key={title as string}><span><Icon name="bell" className="blue"/><div><strong>{title}</strong><p>{sub}</p></div></span><Toggle checked={on as boolean}/></Card>)}</section>
      <Card className="chart-card" style={{marginTop:14}}><p><Icon name="info" className="blue"/> Você pode alterar suas preferências a qualquer momento.</p></Card>
    </Screen>
  );
}
