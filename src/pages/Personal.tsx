import { Link } from "react-router-dom";
import { Header, Screen, Card, BottomNav } from "../components/Layout";
import { Icon } from "../components/Icon";
import { trainers } from "../data/appData";

export default function Personal() {
  return (
    <Screen>
      <Header infoTo="/personal" />
      <div className="page-title"><h1>Área personal</h1><p>Escolha um professor e solicite atendimento personalizado.</p></div>
      <Card className="personal-steps"><div className="step"><Icon name="user" className="yellow"/><span><strong>1. Escolha</strong><small>Personal ideal</small></span></div><div className="step"><Icon name="message" className="yellow"/><span><strong>2. Converse</strong><small>Tire dúvidas</small></span></div><div className="step"><Icon name="dumbbell" className="yellow"/><span><strong>3. Comece</strong><small>Evolua</small></span></div></Card>
      <Card className="chart-card"><h2 className="yellow">Encontre seu personal ideal</h2><p>Filtre por objetivo ou modalidade.</p><div className="filter-row" style={{marginTop:12}}><span className="filter-chip active" style={{background:'var(--yellow)', color:'#061022'}}>Todos</span><span className="filter-chip">Hipertrofia</span><span className="filter-chip">Emagrecimento</span><span className="filter-chip">Funcional</span><span className="filter-chip">Natação</span></div></Card>
      {trainers.map((t, idx)=><Link to={`/personal/${t.id}`} key={t.id}><Card className="trainer-card"><span className="avatar">{idx===1?'👩':idx===3?'🏊‍♀️':'👨'}</span><div><h2>{t.name}</h2><p>{t.focus}</p><div className="tiny-chips"><span className="tiny-chip">🏆 {t.years}</span><span className="tiny-chip">☀️ {t.time}</span><span className="tiny-chip">⭐ {t.rating}</span></div></div><div className="trainer-cta"><button className="outline-btn" style={{minHeight:40,margin:0,width:'auto',padding:'0 14px'}}>Quero esse personal</button><Icon name="back" className="chev"/></div></Card></Link>)}
      <BottomNav active="inicio" />
    </Screen>
  );
}
