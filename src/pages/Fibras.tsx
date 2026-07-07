import { Header, Screen, Card, BottomNav } from "../components/Layout";
import { Icon } from "../components/Icon";

export default function Fibras() {
  return (
    <Screen>
      <Header title="MAIS FIBRAS NO DIA A DIA" infoTo="/dieta/guia" />
      <Card className="status-card"><span className="status-icon" style={{color:'var(--green)'}}><Icon name="leaf" size={42}/></span><div><h2>Pequenas escolhas, grandes resultados.</h2><p>As fibras ajudam na digestão, aumentam a saciedade e contribuem para o controle do colesterol e da glicemia.</p></div></Card>
      <Card className="chart-card"><div className="cardio-metrics"><div><p>Meta diária</p><h1>30 g</h1><p>de fibras</p></div><div className="goal-gauge">70%<small style={{display:'block',fontSize:15,color:'var(--muted)'}}>da meta</small></div><div><p>Você consumiu</p><h1>21 g</h1><p>de fibras hoje</p></div></div><p style={{color:'var(--green)'}}>↗ Faltam 9 g para atingir sua meta diária.</p></Card>
      <Card className="chart-card"><h2>Como aumentar suas fibras</h2><section className="fiber-ideas"><div className="idea-card glass-card"><h3>Adicione aveia</h3><p>Inclua aveia no café da manhã ou lanches.</p></div><div className="idea-card glass-card"><h3>Inclua legumes no almoço</h3><p>Metade do prato com legumes e verduras.</p></div><div className="idea-card glass-card"><h3>Coma frutas com casca</h3><p>Prefira frutas inteiras.</p></div><div className="idea-card glass-card"><h3>Troque pelo integral</h3><p>Pães, massas e arroz integrais.</p></div></section></Card>
      <Card className="chart-card"><h2>Alimentos ricos em fibras</h2><div className="food-scroll">{['🥣 Aveia','🫘 Feijão','🥦 Brócolis','🍎 Maçã','⚫ Chia'].map(x=><div className="food-card" key={x}><div className="food-img">{x.split(' ')[0]}</div><div><strong>{x.split(' ')[1]}</strong><small>4 g / porção</small></div></div>)}</div></Card>
      <div className="cardio-actions"><button className="primary-btn blue">Salvar meta</button><button className="outline-btn">Adicionar ao plano</button></div>
      <BottomNav active="inicio" />
    </Screen>
  );
}
