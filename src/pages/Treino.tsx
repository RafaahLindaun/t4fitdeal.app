import { Header, Screen, Card } from "../components/Layout";
import { Icon } from "../components/Icon";
import { Link } from "react-router-dom";
import exerciseGif from "../assets/rosca-banco-inclinado-unilateral.gif";

export default function Treino() {
  return (
    <Screen>
      <Header title="TREINO A" right={<Link className="round ghost" to="/cardio"><Icon name="calendar" /></Link>} />
      <div className="page-title"><h1>Rosca inclinada</h1><p>Halteres</p></div>
      <div className="section-top"><span></span><strong className="yellow">1<span className="muted">/6</span></strong></div>
      <Card className="exercise-hero"><img src={exerciseGif} alt="Demonstração do exercício" /><span className="gif-label">GIF</span></Card>
      <section className="count-row">
        <button className="icon-btn"><Icon name="minus" size={34} /></button>
        <div className="circle-counter"><div className="inner"><small>SÉRIE</small><strong>2 <em>/ 4</em></strong></div></div>
        <button className="icon-btn"><Icon name="plus" size={34} /></button>
      </section>
      <section className="three-stats">
        <Card className="stat-tile"><Icon name="counter" /><div><small>Repetições</small><strong>8–12</strong></div></Card>
        <Card className="stat-tile"><Icon name="weight" /><div><small>Carga</small><strong>12 kg <span className="crown">♛</span></strong></div></Card>
        <Card className="stat-tile"><Icon name="clock" /><div><small>Descanso</small><strong>60s</strong></div></Card>
      </section>
      <Card className="next-exercise"><div><p>Próximo exercício</p><h2>Elevação lateral</h2><p>Halteres</p></div><span className="mini-figure">🏋️</span><Link className="next-round" to="/treino"><Icon name="back" size={34} /></Link></Card>
      <button className="primary-btn">Concluir série <Icon name="check" /></button>
    </Screen>
  );
}
