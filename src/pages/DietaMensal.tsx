import { Link } from "react-router-dom";
import AppShell, { SmallIconButton } from "../components/AppShell";
import { Panel, Stat, SectionTitle } from "../components/ui";

export default function DietaMensal() {
  return (
    <AppShell title="Minha dieta" subtitle="Entenda claramente como foi o mês." action={<SmallIconButton to="/dieta/guia" label="Guia" icon="info" />}>
      <Panel>
        <div className="switch-row">
          <Link className="tab-chip" to="/dieta">Diário</Link>
          <Link className="tab-chip" to="/dieta/semanal">Semanal</Link>
          <Link className="tab-chip active" to="/dieta/mensal">Mensal</Link>
        </div>
        <div className="stats-grid three top-space">
          <Stat label="Aderência" value="78%" />
          <Stat label="Calorias" value="54.300" />
          <Stat label="Dias bons" value="21/30" />
        </div>
      </Panel>
      <Panel>
        <SectionTitle title="Como foi seu mês" />
        <div className="stack-10">
          <div className="summary-row"><span>Peso</span><strong>-2,4 kg</strong></div>
          <div className="summary-row"><span>Água</span><strong>62 / 75L</strong></div>
          <div className="summary-row"><span>Fibras</span><strong>510 / 900g</strong></div>
          <div className="summary-row"><span>Melhor semana</span><strong>Semana 3</strong></div>
        </div>
      </Panel>
    </AppShell>
  );
}
