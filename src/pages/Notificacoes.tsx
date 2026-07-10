import { useState } from "react";
import AppShell from "../components/AppShell";
import { Panel } from "../components/ui";

export default function Notificacoes() {
  const [items, setItems] = useState({ treino: true, aulas: true, dieta: true, promocao: false });
  const toggle = (key: keyof typeof items) => setItems((prev) => ({ ...prev, [key]: !prev[key] }));
  return (
    <AppShell title="Notificações" subtitle="Ajuste apenas o que realmente importa.">
      <Panel>
        {Object.entries(items).map(([key, value]) => <button key={key} className="toggle-row" onClick={() => toggle(key as keyof typeof items)}><span>{key}</span><strong>{value ? "Ligado" : "Desligado"}</strong></button>)}
      </Panel>
    </AppShell>
  );
}
