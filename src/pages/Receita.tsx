import { useParams } from "react-router-dom";
import { Header, Screen, Card } from "../components/Layout";
import { recipes } from "../data/appData";
import { Icon } from "../components/Icon";

const details: Record<string, { emoji: string; name: string; kcal: string; meal: string; prep: string; portion: string; protein: string; carbs: string; fat: string; focus: string; ingredients: string[]; steps: string[] }> = {
  panqueca: { emoji:"🥞", name:"Panqueca de banana", kcal:"320 kcal", meal:"Café da manhã", prep:"10 min", portion:"1 porção", protein:"12 g", carbs:"42 g", fat:"9 g", focus:"Boa para começar o dia com energia.", ingredients:["1 banana madura amassada", "1 ovo", "2 colheres de sopa de aveia", "Canela a gosto"], steps:["Misture a banana com o ovo.", "Adicione aveia e canela.", "Cozinhe em fogo baixo até dourar."] },
  "bowl-frango": { emoji:"🥗", name:"Bowl de frango com quinoa", kcal:"450 kcal", meal:"Almoço", prep:"20 min", portion:"1 porção", protein:"36 g", carbs:"38 g", fat:"14 g", focus:"Alta em proteínas, ideal para ganho de massa magra.", ingredients:["120 g de frango grelhado", "1/2 xícara de quinoa cozida", "Brócolis no vapor", "Tomates cereja", "Azeite e ervas"], steps:["Tempere e grelhe o frango.", "Cozinhe a quinoa.", "Monte o bowl com vegetais.", "Finalize com azeite."] },
  smoothie: { emoji:"🥤", name:"Smoothie de frutas", kcal:"280 kcal", meal:"Lanche", prep:"5 min", portion:"1 porção", protein:"8 g", carbs:"46 g", fat:"6 g", focus:"Rápido, refrescante e nutritivo.", ingredients:["1 banana congelada", "1/2 xícara de morangos", "170 ml de iogurte natural", "Gelo a gosto"], steps:["Coloque tudo no liquidificador.", "Bata até ficar cremoso.", "Sirva imediatamente."] },
};

export default function Receita() {
  const { slug = "panqueca" } = useParams();
  const data = details[slug] ?? details[recipes[0].slug];
  return (
    <Screen>
      <Header title="RECEITA" infoTo="/dieta/guia" />
      <div className="recipe-hero">{data.emoji}</div>
      <div className="recipe-title"><h1>{data.name}</h1><p>{data.focus}</p></div>
      <section className="nutri-summary"><div className="stat-pill yellow"><Icon name="fire"/><strong>{data.kcal}</strong></div><div className="stat-pill blue"><Icon name="clock"/><strong>{data.meal}</strong></div><div className="stat-pill green"><Icon name="clock"/><strong>{data.prep}</strong></div><div className="stat-pill orange"><Icon name="user"/><strong>{data.portion}</strong></div></section>
      <Card className="chart-card"><h2>Resumo nutricional</h2><div className="macro-list"><p><span className="dot blue"/>Proteínas <b>{data.protein}</b></p><p><span className="dot green"/>Carboidratos <b>{data.carbs}</b></p><p><span className="dot orange"/>Gorduras <b>{data.fat}</b></p></div></Card>
      <section className="columns-2"><Card className="list-card"><h2>Ingredientes</h2><ul>{data.ingredients.map(i=><li key={i}>{i}</li>)}</ul></Card><Card className="list-card"><h2>Modo de preparo</h2>{data.steps.map((s,i)=><div className="number-step" key={s}><b>{i+1}</b><span>{s}</span></div>)}</Card></section>
      <Card className="chart-card"><p><Icon name="leaf" className="green"/> <strong>Dica ACCQUA</strong><br/>Combina proteína de qualidade com bons nutrientes para a sua rotina.</p></Card>
      <button className="primary-btn blue"><Icon name="star"/>Salvar receita</button>
    </Screen>
  );
}
