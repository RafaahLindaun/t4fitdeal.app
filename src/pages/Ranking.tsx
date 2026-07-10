import { useEffect, useState } from "react";
import AppShell, { SmallIconButton } from "../components/AppShell";
import { Panel, SectionTitle } from "../components/ui";
import { getRanking } from "../lib/data";

export default function Ranking() {
  const [rows, setRows] = useState<{ name: string; count: number }[]>([]);
  useEffect(() => { getRanking().then(setRows); }, []);

  return (
    <AppShell title="Ranking" subtitle="Treinos válidos do mês." action={<SmallIconButton label="Como funciona" icon="info" />}>
      <Panel>
        <SectionTitle title="Top alunos" hint="Sem sobrenome, com total de treinos na ponta." />
        <div className="stack-10">
          {rows.map((item, index) => (
            <div key={`${item.name}-${index}`} className="ranking-row">
              <div className="ranking-left"><span className="rank-badge">#{index + 1}</span><strong>{item.name}</strong></div>
              <span>{item.count} treinos</span>
            </div>
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}
