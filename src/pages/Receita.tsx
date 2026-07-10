import { useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import { Panel, SectionTitle } from "../components/ui";

const map: Record<string, { title: string; intro: string; items: string[] }> = {
  r1: { title: "Panqueca proteica", intro: "Perfeita para café da manhã ou pré-treino.", items: ["2 ovos", "1 banana", "1 scoop de proteína", "2 colheres de aveia"] },
  r2: { title: "Bowl de frango", intro: "Almoço equilibrado e fácil de montar.", items: ["Frango desfiado", "Arroz", "Feijão", "Legumes"] },
  r3: { title: "Smoothie pós-treino", intro: "Leve e rápido para recuperar energia.", items: ["Leite", "Banana", "Aveia", "Canela"] },
};

export default function Receita() {
  const { id = "r1" } = useParams();
  const recipe = map[id] || map.r1;
  return (
    <AppShell title={recipe.title} subtitle={recipe.intro}>
      <Panel>
        <SectionTitle title="Ingredientes" />
        <ul className="bullet-list">{recipe.items.map((item) => <li key={item}>{item}</li>)}</ul>
      </Panel>
      <Panel>
        <SectionTitle title="Modo de preparo" />
        <p className="muted">Misture tudo, prepare e ajuste conforme sua meta nutricional.</p>
      </Panel>
    </AppShell>
  );
}
