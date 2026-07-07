import { Header, Screen, Card, BottomNav } from "../components/Layout";
import { Icon } from "../components/Icon";

export default function Hidratacao() {
  return (
    <Screen>
      <Header title="MINHA DIETA" infoTo="/dieta/guia" />
      <div className="page-title"><h1>Hidratação</h1><p>A água é essencial para o seu desempenho e bem-estar.</p></div>
      <Card className="water-big"><h2><Icon name="water" className="blue"/> Seu consumo de água hoje</h2><div className="section-top"><div><h1><span className="blue">1,8</span> / 2,5 L</h1><p>Meta diária</p></div><div className="goal-gauge">72%<small style={{display:'block',fontSize:15,color:'var(--muted)'}}>da meta</small></div></div><div className="cup-row-large">{Array.from({length:6}).map((_,i)=><span key={i} className={`cup big ${i===5?'empty':''}`}/>)}</div><p className="muted" style={{textAlign:'center'}}>Copos de 300 ml</p></Card>
      <Card className="chart-card"><h2><Icon name="clock" className="blue"/> Quando beber</h2><section className="feature-grid" style={{gridTemplateColumns:'repeat(4,1fr)'}}><div className="feature-card"><Icon name="fire"/><strong>Ao acordar</strong><small>300 ml</small></div><div className="feature-card"><Icon name="dumbbell"/><strong>Antes do treino</strong><small>300–500 ml</small></div><div className="feature-card"><Icon name="water"/><strong>Durante</strong><small>150–250 ml</small></div><div className="feature-card"><Icon name="fire"/><strong>À tarde</strong><small>300 ml</small></div></section></Card>
      <Card className="chart-card"><h2><Icon name="leaf" className="green"/> Benefícios da hidratação adequada</h2><div className="info-list"><div className="info-line"><Icon name="chart" className="blue"/><p><strong>Melhora o desempenho</strong><br/>Aumenta a resistência e reduz a fadiga.</p></div><div className="info-line"><Icon name="counter" className="blue"/><p><strong>Acelera a recuperação</strong><br/>Auxilia na recuperação muscular.</p></div><div className="info-line"><Icon name="target" className="blue"/><p><strong>Mais foco e disposição</strong><br/>Mantém o cérebro ativo.</p></div></div></Card>
      <BottomNav active="inicio" />
    </Screen>
  );
}
