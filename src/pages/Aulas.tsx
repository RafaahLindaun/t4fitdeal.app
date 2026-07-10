import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { Panel, SectionTitle } from "../components/ui";
import { getClasses } from "../lib/data";
import type { ClassItem } from "../types";

export default function Aulas() {
  const [items, setItems] = useState<ClassItem[]>([]);
  useEffect(() => { getClasses().then(setItems); }, []);

  return (
    <AppShell title="Aulas" subtitle="Coletivas, hidro e natação com Gympass e horários.">
      <Panel>
        <SectionTitle title="Aulas disponíveis" hint="Aparecem conforme estão ativas no momento." />
        <div className="stack-10">
          {items.map((item) => (
            <div key={item.id} className="class-row">
              <div><strong>{item.title}</strong><span>{item.category} • {item.weekday} • {item.time_label}</span></div>
              <small>{item.gympass_plan}</small>
            </div>
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}
