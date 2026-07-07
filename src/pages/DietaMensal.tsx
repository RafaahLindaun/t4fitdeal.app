import { Link } from "react-router-dom";
import { Header, Screen, Card, BottomNav } from "../components/Layout";
import { Icon } from "../components/Icon";

export default function DietaMensal() {
  return (
    <Screen>
      <Header title="MINHA DIETA" infoTo="/dieta/guia" />
      <div className="section-top"><h2>Análise nutricional</h2><Link className="blue" to="/dieta">Ver tudo ›</Link></div>
      <nav className="tabs"><Link to="/dieta">Diária</Link><Link to="/dieta/semanal">Semanal</Link><Link className="active" to="/dieta/mensal">Mensal</Link></nav>
      <div className="section-top"><button className="round ghost"><Icon name="back"/></button><h2>Maio / 2025</h2><button className="round ghost" style={{transform:'rotate(180deg)'}}><Icon name="back"/></button></div>
      <Card className="chart-card"><h2>Resumo do mês</h2><section className="week-summary"><div><Icon name="fire" className="yellow"/><strong>54.300</strong><small>kcal consumidas</small></div><div><Icon name="target" className="blue"/><strong>69.700</strong><small>kcal de meta</small></div><div><Icon name="check" className="green"/><strong>78%</strong><small>aderência</small></div></section><p style={{color:'var(--green)'}}>✓ Você manteve boa regularidade, mas pode melhorar hidratação e fibras.</p></Card>
      <Card className="chart-card"><h2>Calorias ao longo do mês</h2><div className="line-chart"><svg viewBox="0 0 320 120"><polyline points="0,70 35,60 70,82 105,53 140,74 175,45 210,58 245,38 280,54 320,44" fill="none" stroke="#ffd414" strokeWidth="5" strokeLinecap="round"/><path d="M0 70 35 60 70 82 105 53 140 74 175 45 210 58 245 38 280 54 320 44V120H0Z" fill="rgba(255,212,20,.1)"/></svg></div><div className="axis"><span>Semana 1</span><span>Semana 2</span><span>Semana 3</span><span>Semana 4</span><span>Semana 5</span></div></Card>
      <Card className="chart-card"><h2>Resultado do mês</h2><div className="month-performance"><div><small>Aderência</small><strong>78%</strong></div><div><small>Peso</small><strong style={{color:'var(--green)'}}>-2,4 kg</strong></div><div><small>Dias na meta</small><strong style={{color:'var(--green)'}}>21/30</strong></div><div><small>Melhor semana</small><strong>Sem. 3</strong></div></div></Card>
      <Card className="chart-card"><h2>Plano para o próximo mês</h2><div className="plan-cards"><div className="plan-card glass-card"><Icon name="water" className="blue"/><strong>Aumentar água</strong><small>Meta: 75 L/mês</small></div><div className="plan-card glass-card"><Icon name="leaf" className="green"/><strong>Melhorar fibras</strong><small>Meta: 30 g/dia</small></div><div className="plan-card glass-card"><Icon name="star" className="yellow"/><strong>Manter proteína</strong><small>Continue assim!</small></div></div></Card>
      <BottomNav active="inicio" />
    </Screen>
  );
}
