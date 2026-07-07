import { Header, Screen, Card } from "../components/Layout";
import { Icon } from "../components/Icon";

const macros = [
  { cls: "", icon:"dumbbell", name:"Proteínas", value:"132 g", total:"182 g", pct:"28%", desc:"Essenciais para a recuperação muscular e construção de massa.", foods:["🍗 Frango", "🥚 Ovos", "🥛 Iogurte", "🐟 Atum"] },
  { cls: "green", icon:"leaf", name:"Carboidratos", value:"210 g", total:"467 g", pct:"45%", desc:"Principal fonte de energia para o corpo e o cérebro.", foods:["🍚 Arroz", "🍠 Batata", "🥣 Aveia", "🍌 Banana"] },
  { cls: "orange", icon:"water", name:"Gorduras", value:"48 g", total:"89 g", pct:"27%", desc:"Importantes para o equilíbrio hormonal e absorção de vitaminas.", foods:["🥑 Abacate", "🫒 Azeite", "🌰 Castanhas", "🥜 Amendoim"] },
] as const;

export default function Macronutrientes() {
  return (
    <Screen>
      <Header title="MINHA DIETA" infoTo="/dieta/guia" />
      <div className="page-title"><h1>Macronutrientes</h1><p>Acompanhe a distribuição dos macronutrientes e como eles contribuem para seus objetivos.</p></div>
      <Card className="big-macro"><div className="donut big"/><div className="macro-list"><p><span className="dot blue"/>Proteínas <b>132 g — 28%</b></p><p><span className="dot green"/>Carboidratos <b>210 g — 45%</b></p><p><span className="dot orange"/>Gorduras <b>48 g — 27%</b></p><p>Meta diária <b>390 g • 2.550 kcal</b></p></div></Card>
      <h2>Detalhamento por macronutriente</h2>
      {macros.map((m) => <Card key={m.name} className={`macro-detail ${m.cls}`}><div><Icon name={m.icon as any} size={38}/><h2>{m.name}</h2><strong>{m.value} <span className="muted">/ {m.total}</span></strong><p className={m.cls || 'blue'}>{m.pct}</p><p>{m.desc}</p></div><div><p>Exemplos de alimentos</p><div className="example-foods">{m.foods.map(f=><span key={f}>{f}<small>{f.split(' ').slice(1).join(' ')}</small></span>)}</div><p className="blue" style={{marginTop:14}}>Ver mais alimentos ›</p></div></Card>)}
      <Card className="chart-card"><p><Icon name="spark" className="blue"/> <strong>Dica Accqua</strong><br/>Mantenha a consistência nas escolhas e ajuste conforme sua evolução.</p></Card>
    </Screen>
  );
}
