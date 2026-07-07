import { Link } from "react-router-dom";
import { Header, Screen, Card, BottomNav } from "../components/Layout";
import { Icon } from "../components/Icon";
import { foods, recipes } from "../data/appData";

function Chart() {
  return <div className="line-chart"><svg viewBox="0 0 320 120"><polyline points="0,80 55,62 110,42 165,58 220,65 275,46 320,35" fill="none" stroke="#ffd414" strokeWidth="5" strokeLinecap="round"/><path d="M0 80 55 62 110 42 165 58 220 65 275 46 320 35V120H0Z" fill="rgba(255,212,20,.12)"/><g fill="#ffd414">{[0,55,110,165,220,275].map((x,i)=><circle key={i} cx={x} cy={[80,62,42,58,65,46][i]} r="5"/>)}<circle cx="320" cy="35" r="5" fill="#fff"/></g></svg></div>;
}

export default function Dieta() {
  return (
    <Screen>
      <Header title="MINHA DIETA" infoTo="/dieta/guia" />
      <div className="section-top"><h2>Análise nutricional</h2><Link className="blue" to="/dieta/macronutrientes">Ver tudo ›</Link></div>
      <nav className="tabs"><Link className="active" to="/dieta">Diária</Link><Link to="/dieta/semanal">Semanal</Link><Link to="/dieta/mensal">Mensal</Link></nav>
      <Card className="chart-card"><h2><Icon name="fire" className="yellow" /> Calorias</h2><div style={{display:"flex",justifyContent:"space-between"}}><p>Média diária<br/><strong style={{color:'#fff'}}>1.842 kcal</strong></p><p>Meta<br/><strong style={{color:'#fff'}}>2.550 kcal</strong></p></div><Chart/><div className="axis"><span>28/04</span><span>29/04</span><span>30/04</span><span>01/05</span><span>02/05</span><span>03/05</span><span>Hoje</span></div></Card>
      <Link to="/dieta/macronutrientes"><Card className="macro-card"><div className="donut"/><div className="macro-list"><h2>Distribuição de macronutrientes</h2><p><span className="dot blue"/>Proteínas <b>28% (132 g)</b></p><p><span className="dot green"/>Carboidratos <b>45% (210 g)</b></p><p><span className="dot orange"/>Gorduras <b>27% (48 g)</b></p></div><div className="goal-gauge">72%<small style={{display:'block',fontSize:15,color:'var(--muted)'}}>da meta</small></div></Card></Link>
      <section className="mini-row"><Link to="/dieta/hidratacao"><Card className="chart-card"><h2><Icon name="water" className="blue"/> Água</h2><strong>1,8 / 2,5 L</strong><div className="water-cups"><span className="cup"/><span className="cup"/><span className="cup"/><span className="cup"/><span className="cup empty"/><button className="top-chip blue">+ Registrar</button></div></Card></Link><Link to="/dieta/fibras"><Card className="chart-card"><h2><Icon name="leaf" className="green"/> Fibras</h2><strong>21 / 30 g</strong><div className="slider" style={{margin:'14px 0',background:'linear-gradient(90deg,var(--green) 0 70%, rgba(255,255,255,.15) 70%)'}}/></Card></Link></section>
      <Card className="chart-card"><div className="section-top"><h2>Alimentos em destaque</h2><Link to="/dieta/alimentos" className="blue">Ver todos ›</Link></div><div className="food-scroll">{foods.slice(0,4).map(f=><div className="food-card" key={f.name}><div className="food-img">{f.emoji}</div><div><strong>{f.name}</strong><small>{f.kcal} • {f.portion}</small></div></div>)}</div></Card>
      <Card className="chart-card"><div className="section-top"><h2>Sugestões para você</h2></div><div className="suggestions"><Link className="suggestion glass-card" to="/dieta/fibras"><Icon name="leaf" className="green"/><span><strong>Aumente fibras</strong><small>Inclua verduras.</small></span></Link><Link className="suggestion glass-card" to="/dieta/hidratacao"><Icon name="water" className="blue"/><span><strong>Hidratação</strong><small>Beba água.</small></span></Link><Link className="suggestion glass-card" to="/dieta/equilibrio"><Icon name="star" className="yellow"/><span><strong>Equilíbrio</strong><small>Proteínas ideais.</small></span></Link></div></Card>
      <Card className="chart-card"><div className="section-top"><h2>Receitas recomendadas</h2><Link to="/dieta/receitas/panqueca" className="blue">Ver todas ›</Link></div><div className="recipe-row">{recipes.map(r=><Link className="recipe-card food-card" to={`/dieta/receitas/${r.slug}`} key={r.slug}><div className="food-img">{r.emoji}</div><div><strong>{r.name}</strong><small>{r.kcal}</small></div></Link>)}</div></Card>
      <BottomNav active="inicio" />
    </Screen>
  );
}
