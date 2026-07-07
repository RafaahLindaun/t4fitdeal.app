import { Header, Screen, Card, BottomNav } from "../components/Layout";
import { Icon } from "../components/Icon";
import { foods } from "../data/appData";

export default function Alimentos() {
  return (
    <Screen>
      <Header title="ALIMENTOS EM DESTAQUE" infoTo="/dieta/guia" />
      <div className="page-title"><h1>Alimentos em destaque</h1><p>Escolhas inteligentes para potencializar sua performance e alcançar seus objetivos.</p></div>
      <div className="filter-row"><span className="filter-chip active">Todos</span><span className="filter-chip"><span className="dot blue"/> Proteínas</span><span className="filter-chip"><span className="dot green"/> Carboidratos</span><span className="filter-chip"><span className="dot orange"/> Gorduras boas</span><span className="filter-chip"><Icon name="leaf" size={16}/> Fibras</span></div>
      <section className="food-grid">{foods.map(f=><Card className="food-wide" key={f.name}><div className="food-img">{f.emoji}</div><div><h2>{f.name}</h2><p>{f.kcal}</p><p>Porção: {f.portion}</p><span className={`filter-chip ${f.tone}`} style={{display:'inline-flex',marginTop:8,padding:'6px 10px'}}>{f.tag}</span></div></Card>)}</section>
      <BottomNav active="inicio" />
    </Screen>
  );
}
