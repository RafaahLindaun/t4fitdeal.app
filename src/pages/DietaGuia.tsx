import { Header, Screen, Card } from "../components/Layout";
import { Icon } from "../components/Icon";

const items = [
  ["counter", "Análise nutricional", "Aqui você vê calorias, macros e como sua alimentação está distribuída no dia."],
  ["target", "Você molda seu futuro", "Acompanhe sua evolução e crie hábitos melhores para chegar nos seus objetivos."],
  ["apple", "Escolha seus alimentos", "Selecione alimentos e entenda se está comendo bem de forma prática e visual."],
  ["chef", "Receitas incríveis", "Descubra receitas práticas e nutritivas para variar sua rotina com sabor."],
] as const;

export default function DietaGuia() {
  return (
    <Screen>
      <Header title="MINHA DIETA" />
      <div className="page-title"><h1>Como usar Minha Dieta <span className="top-chip yellow-border" style={{fontSize:14}}><Icon name="star"/>Premium</span></h1><p>Entenda cada seção da sua página e aproveite ao máximo sua jornada de saúde e performance.</p></div>
      <section className="guide-grid">
        {items.map(([icon, title, text]) => <Card key={title} className="guide-tile"><span className="guide-icon"><Icon name={icon} size={54}/></span><h2>{title}</h2><p>{text}</p></Card>)}
      </section>
    </Screen>
  );
}
