import AppShell from "../components/AppShell";
import { Panel } from "../components/ui";

export default function LojaInfo() {
  return (
    <AppShell title="Como funciona a loja" subtitle="Explicação do botão i.">
      <Panel>
        <p className="muted">Os itens exibidos no app são vendidos somente na recepção. O aplicativo serve como catálogo visual, sem compra direta.</p>
      </Panel>
    </AppShell>
  );
}
