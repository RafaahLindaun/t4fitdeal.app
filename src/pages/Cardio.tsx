import { Header, Screen, Card } from "../components/Layout";
import { Icon, type IconName } from "../components/Icon";

const types: { label: string; icon: IconName }[] = [
  { label: "Esteira", icon: "treadmill" }, { label: "Bike", icon: "bike" }, { label: "Elíptico", icon: "rows" },
  { label: "Escada", icon: "stairs" }, { label: "Remo", icon: "rows" }, { label: "Caminhada", icon: "walk" },
];

export default function Cardio() {
  return (
    <Screen>
      <Header title="CARDIO" right={<div className="top-actions"><button className="top-chip"><Icon name="sound" /></button><button className="top-chip"><Icon name="calendar" /></button><button className="top-chip yellow-border"><Icon name="target" /><span>Meta<br /><small>500 kcal</small></span></button></div>} />
      <div className="page-title"><h1>Esteira</h1><p>Cardio guiado</p></div>
      <Card className="big-media"><span className="top-chip" style={{position:"absolute", right: 14, top: 14}}><Icon name="heart" />CARDIO</span><span className="runner">🏃‍♂️</span></Card>
      <section className="cardio-metrics">
        <Card className="metric-box"><Icon name="fire" /><small>Kcal</small><strong>350</strong></Card>
        <div className="circle-counter"><div className="inner"><small>Tempo</small><strong style={{fontSize:42}}>28:40</strong><small>min</small></div></div>
        <Card className="metric-box"><Icon name="chart" /><small>Pace estimado</small><strong>6:50</strong><small>min/km</small></Card>
      </section>
      <Card className="time-config"><h2><Icon name="clock" />Configurar tempo</h2><div className="count-row" style={{gridTemplateColumns:"68px 1fr 68px"}}><button className="icon-btn"><Icon name="minus" /></button><div><div className="time-big">30:00</div><p>minutos</p></div><button className="icon-btn"><Icon name="plus" /></button></div><div className="slider" /><p>Ajuste a duração do treino</p></Card>
      <div style={{textAlign:"center", margin:"-4px 0 10px"}}><span className="top-chip"><span style={{color:"#4ade46"}}>●</span> Pronto para iniciar</span></div>
      <div className="cardio-actions"><button className="primary-btn"><Icon name="play" />Iniciar cardio</button><button className="outline-btn"><Icon name="pause" />Pausar cardio</button></div>
      <section className="cardio-types">{types.map((t, i) => <button key={t.label} className={`type-btn ${i === 0 ? "active" : ""}`}><Icon name={t.icon} />{t.label}</button>)}</section>
    </Screen>
  );
}
