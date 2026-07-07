import { Link } from "react-router-dom";
import { Header, Screen, Card, BottomNav } from "../components/Layout";
import { Icon } from "../components/Icon";

export default function DietaSemanal() {
  return (
    <Screen>
      <Header title="MINHA DIETA" infoTo="/dieta/guia" />
      <div className="section-top"><h2>Análise nutricional</h2><Link className="blue" to="/dieta">Ver tudo ›</Link></div>
      <nav className="tabs"><Link to="/dieta">Diária</Link><Link className="active" to="/dieta/semanal">Semanal</Link><Link to="/dieta/mensal">Mensal</Link></nav>
      <div className="section-top"><button className="round ghost"><Icon name="back"/></button><h2>03 a 09 de Maio</h2><button className="round ghost" style={{transform:'rotate(180deg)'}}><Icon name="back"/></button></div>
      <section className="week-summary"><Card className="summary-mini"><Icon name="fire" className="yellow"/><div><strong>12.890</strong><small>kcal consumidas</small></div></Card><Card className="summary-mini"><Icon name="target" className="blue"/><div><strong>17.850</strong><small>kcal de meta</small></div></Card><Card className="summary-mini"><Icon name="check" className="green"/><div><strong>72%</strong><small>da meta</small></div></Card></section>
      <Card className="chart-card"><h2>Calorias por dia</h2><div className="bar-chart">{[58,72,92,68,82,60,55].map((h,i)=><div className="bar" style={{height:`${h}%`}} key={i}><span>{[2100,2450,2700,2300,2650,2150,2090][i]}</span></div>)}</div><div className="days-row"><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span><span>Dom</span></div></Card>
      <Card className="macro-card"><div className="donut"/><div className="macro-list"><h2>Média semanal de macronutrientes</h2><p><span className="dot blue"/>Proteínas <b>132 g/dia</b></p><p><span className="dot green"/>Carboidratos <b>210 g/dia</b></p><p><span className="dot orange"/>Gorduras <b>48 g/dia</b></p><p style={{color:'var(--green)'}}>✓ Proteína dentro da meta em 5 de 7 dias.</p></div></Card>
      <section className="mini-row"><Card className="chart-card"><h2><Icon name="water" className="blue"/> Água</h2><strong>12,6 / 17,5 L</strong><div className="water-cups">{Array.from({length:7}).map((_,i)=><span key={i} className={`cup ${i===6?'empty':''}`}/>)}</div></Card><Card className="chart-card"><h2><Icon name="leaf" className="green"/> Fibras</h2><strong>128 / 210 g</strong><p>61% da meta</p><div className="slider" style={{margin:'14px 0',background:'linear-gradient(90deg,var(--green) 0 61%, rgba(255,255,255,.15) 61%)'}}/></Card></section>
      <BottomNav active="inicio" />
    </Screen>
  );
}
