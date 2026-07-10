import { Link } from "react-router-dom";
import AppShell, { SmallIconButton } from "../components/AppShell";
import { Panel, SectionTitle, Stat } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";

const recipes = [
  { id: "r1", title: "Panqueca proteica", text: "Proteína + aveia + banana." },
  { id: "r2", title: "Bowl de frango", text: "Refeição prática e equilibrada." },
  { id: "r3", title: "Smoothie pós-treino", text: "Rápido, leve e nutritivo." },
];

export default function Dieta() {
  const { profile } = useAuth();
  if (!profile?.diet_active) {
    return (
      <AppShell title="Minha dieta" subtitle="Liberação paga e personalizada." action={<SmallIconButton to="/dieta/guia" label="Guia" icon="info" />}>
        <Panel>
          <SectionTitle title="Sua dieta ainda não está ativa" hint="Ela é liberada pela recepção após a contratação." />
          <p className="muted">Quando ativada, ela usa os dados do seu primeiro acesso para montar análises e sugestões.</p>
          <a className="primary-btn full-width" href={import.meta.env.VITE_DIET_CHECKOUT_URL || "https://wa.me/551147181730"} target="_blank" rel="noreferrer">Liberar Minha Dieta</a>
        </Panel>
      </AppShell>
    );
  }

  return (
    <AppShell title="Minha dieta" subtitle="Visual limpo, fácil e premium." action={<SmallIconButton to="/dieta/guia" label="Informações" icon="info" />}>
      <Panel>
        <div className="switch-row">
          <Link className="tab-chip active" to="/dieta">Diário</Link>
          <Link className="tab-chip" to="/dieta/semanal">Semanal</Link>
          <Link className="tab-chip" to="/dieta/mensal">Mensal</Link>
        </div>
        <div className="stats-grid three top-space">
          <Stat label="Calorias" value="1.860" />
          <Stat label="Água" value="6/8 copos" />
          <Stat label="Proteínas" value="132g" />
        </div>
      </Panel>

      <Panel>
        <SectionTitle title="Distribuição de macronutrientes" right={<Link className="mini-link" to="/dieta/macros">Abrir</Link>} />
        <div className="macro-chart">
          <div><strong>40%</strong><span>Carboidratos</span></div>
          <div><strong>35%</strong><span>Proteínas</span></div>
          <div><strong>25%</strong><span>Gorduras</span></div>
        </div>
      </Panel>

      <Panel>
        <SectionTitle title="Alimentos em destaque" right={<Link className="mini-link" to="/dieta/alimentos">Abrir</Link>} />
        <div className="food-grid">
          <div className="food-pill">Frango</div>
          <div className="food-pill">Arroz</div>
          <div className="food-pill">Ovos</div>
          <div className="food-pill">Banana</div>
        </div>
      </Panel>

      <Panel>
        <SectionTitle title="Sugestões para você" />
        <div className="stack-10">
          <Link className="menu-card" to="/dieta/hidratacao"><span>Beber mais água</span><small>Veja seus copos e sua meta.</small></Link>
          <Link className="menu-card" to="/dieta/fibras"><span>Aumentar fibras</span><small>Melhore sua saciedade e digestão.</small></Link>
          <Link className="menu-card" to="/dieta/equilibrio"><span>Equilibrar refeições</span><small>Monte pratos mais inteligentes.</small></Link>
        </div>
      </Panel>

      <Panel>
        <SectionTitle title="Receitas recomendadas" />
        <div className="stack-10">
          {recipes.map((item) => (
            <Link key={item.id} className="menu-card" to={`/dieta/receita/${item.id}`}>
              <span>{item.title}</span>
              <small>{item.text}</small>
            </Link>
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}
