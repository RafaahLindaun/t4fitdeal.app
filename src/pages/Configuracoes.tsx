import { useState } from "react";
import AppShell from "../components/AppShell";
import { Panel } from "../components/ui";

export default function Configuracoes() {
  const [compact, setCompact] = useState(false);
  const [animations, setAnimations] = useState(true);
  return (
    <AppShell title="Configurações" subtitle="Pequenos ajustes do aplicativo.">
      <Panel>
        <button className="toggle-row" onClick={() => setCompact((v) => !v)}><span>Layout compacto</span><strong>{compact ? "Ativo" : "Normal"}</strong></button>
        <button className="toggle-row" onClick={() => setAnimations((v) => !v)}><span>Animações leves</span><strong>{animations ? "Ligadas" : "Desligadas"}</strong></button>
      </Panel>
    </AppShell>
  );
}
