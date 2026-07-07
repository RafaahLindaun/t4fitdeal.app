import { Header, Screen, Card, BottomNav } from "../components/Layout";
import { Icon } from "../components/Icon";
import { classes } from "../data/appData";

export default function Aulas() {
  return (
    <Screen>
      <Header infoTo="/aulas" />
      <div className="page-title"><h1>Aulas coletivas</h1><p>Veja as aulas disponíveis e horários de hoje</p></div>
      <div className="class-tabs"><span>Agora</span><span className="active">Hoje</span><span>Semana</span></div>
      <Card className="gympass-card"><span><Icon name="target" className="yellow"/> <strong className="yellow">Gympass</strong> aceito em aulas selecionadas</span><div className="tiny-chips"><span className="tiny-chip">Silver</span><span className="tiny-chip" style={{color:'var(--yellow)'}}>Gold</span><span className="tiny-chip">Platinum</span></div></Card>
      <div className="section-top"><h2>Acontecendo agora <span className="yellow">•</span></h2><span className="yellow">Ver todas</span></div>
      <section className="class-now">{classes.slice(0,2).map(c=><Card className="class-card" key={c.name}><Icon name={c.icon} className="yellow" size={38}/><h2>{c.name}</h2><p><Icon name="clock" size={16}/> {c.time}</p><p>{c.place}</p><p style={{color:'var(--green)'}}>● Acontecendo agora <span className="tiny-chip">Gympass</span></p></Card>)}</section>
      <h2 style={{margin:'20px 4px 12px'}}>Próximas de hoje</h2>
      <section className="class-list">{classes.slice(2).map(c=><Card className="class-row" key={c.name+c.time}><Icon name={c.icon} className="yellow" size={36}/><div><h2>{c.name}</h2><p>{c.place}</p></div><div><h2><Icon name="clock" size={18}/> {c.time}</h2><p className="blue">● Próxima</p><span className="tiny-chip">Gympass</span></div></Card>)}</section>
      <BottomNav active="aulas" />
    </Screen>
  );
}
