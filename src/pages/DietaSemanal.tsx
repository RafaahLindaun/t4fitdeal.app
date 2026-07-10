import { Link } from "react-router-dom";
import AppShell, { SmallIconButton } from "../components/AppShell";
import { Panel, Stat } from "../components/ui";

export default function DietaSemanal() {
  return (
    <AppShell title="Minha dieta" subtitle="Visão semanal simples e objetiva." action={<SmallIconButton to="/dieta/guia" label="Guia" icon="info" />}>
      <Panel>
        <div className="switch-row">
          <Link className="tab-chip" to="/dieta">Diário</Link>
          <Link className="tab-chip active" to="/dieta/semanal">Semanal</Link>
          <Link className="tab-chip" to="/dieta/mensal">Mensal</Link>
        </div>
        <div className="stats-grid three top-space">
          <Stat label="Meta da semana" value="72%" />
          <Stat label="Água" value="12,6L" />
          <Stat label="Proteína média" value="132g" />
        </div>
        <div className="weekly-chart top-space">
          {['S','T','Q','Q','S','S','D'].map((day, i) => <div key={i}><span>{day}</span><strong style={{height:`${50 + i*8}px`}} /></div>)}
        </div>
      </Panel>
    </AppShell>
  );
}
