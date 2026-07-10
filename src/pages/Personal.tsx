import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import { Panel, SectionTitle } from "../components/ui";

const teachers = [
  { id: "1", name: "Carlos", story: "Especialista em hipertrofia e treino técnico." },
  { id: "2", name: "Marina", story: "Foco em emagrecimento e condicionamento." },
  { id: "3", name: "Thiago", story: "Treino funcional e reabilitação." },
];

export default function Personal() {
  return (
    <AppShell title="Área personal" subtitle="Escolha um professor para te acompanhar.">
      <Panel>
        <SectionTitle title="Professores disponíveis" hint="Toque para ver a história e chamar." />
        <div className="teacher-list">
          {teachers.map((item) => (
            <Link key={item.id} to={`/personal/${item.id}`} className="teacher-card">
              <div className="teacher-avatar">{item.name.charAt(0)}</div>
              <div><strong>{item.name}</strong><p>{item.story}</p></div>
            </Link>
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}
