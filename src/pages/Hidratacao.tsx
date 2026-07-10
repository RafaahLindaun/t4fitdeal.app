import AppShell from "../components/AppShell";
import { Panel, SectionTitle } from "../components/ui";

export default function Hidratacao() {
  return (
    <AppShell title="Hidratação" subtitle="Acompanhe seus copos e sua meta diária.">
      <Panel>
        <SectionTitle title="Resumo" />
        <p className="muted">Acompanhe seus copos e sua meta diária.</p>
        <div className="stack-10 top-space">
          <div className="menu-card"><span>O que isso significa?</span><small>Explicação clara e aplicada ao seu objetivo.</small></div>
          <div className="menu-card"><span>Como melhorar</span><small>Passos práticos para sua rotina.</small></div>
        </div>
      </Panel>
    </AppShell>
  );
}
