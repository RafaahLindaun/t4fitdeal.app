import AppShell from "../components/AppShell";
import { Panel } from "../components/ui";

export default function DietaGuia() {
  return (
    <AppShell title="Guia da dieta" subtitle="Como usar cada parte da página premium.">
      <Panel><div className="guide-columns"><div><h4>Análise nutricional</h4><p>Aqui você acompanha macro nutrientes, calorias e hidratação.</p></div><div><h4>Você molda seu futuro</h4><p>As escolhas do dia formam sua evolução semanal e mensal.</p></div><div><h4>Alimentos em destaque</h4><p>Veja se está comendo bem e onde melhorar.</p></div><div><h4>Receitas recomendadas</h4><p>Descubra receitas incríveis e práticas para seu objetivo.</p></div></div></Panel>
    </AppShell>
  );
}
