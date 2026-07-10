import AppShell from "../components/AppShell";
import { Panel, SectionTitle } from "../components/ui";

export default function Macronutrientes() {
  return (
    <AppShell title="Macronutrientes" subtitle="Entenda a divisão de carboidratos, proteínas e gorduras.">
      <Panel>
        <SectionTitle title="Resumo" />
        <p className="muted">Entenda a divisão de carboidratos, proteínas e gorduras.</p>
        <div className="stack-10 top-space">
          <div className="menu-card"><span>O que isso significa?</span><small>Explicação clara e aplicada ao seu objetivo.</small></div>
          <div className="menu-card"><span>Como melhorar</span><small>Passos práticos para sua rotina.</small></div>
        </div>
      </Panel>
    </AppShell>
  );
}
