import AppShell from "../components/AppShell";
import { Panel, SectionTitle } from "../components/ui";

export default function Alimentos() {
  return (
    <AppShell title="Alimentos em destaque" subtitle="Veja os alimentos que mais estão ajudando sua dieta.">
      <Panel>
        <SectionTitle title="Resumo" />
        <p className="muted">Veja os alimentos que mais estão ajudando sua dieta.</p>
        <div className="stack-10 top-space">
          <div className="menu-card"><span>O que isso significa?</span><small>Explicação clara e aplicada ao seu objetivo.</small></div>
          <div className="menu-card"><span>Como melhorar</span><small>Passos práticos para sua rotina.</small></div>
        </div>
      </Panel>
    </AppShell>
  );
}
