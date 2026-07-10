import { useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import { Panel } from "../components/ui";
import { Icon } from "../components/Icons";

const map: Record<string, { name: string; bio: string }> = {
  1: { name: "Carlos", bio: "Professor dedicado à hipertrofia, técnica e evolução de cargas." },
  2: { name: "Marina", bio: "Acompanha alunos com foco em emagrecimento, constância e motivação." },
  3: { name: "Thiago", bio: "Trabalha condicionamento, funcional e adaptação para diferentes níveis." },
};

export default function PersonalDetalhe() {
  const { id = "1" } = useParams();
  const item = map[id] || map[1];
  return (
    <AppShell title={item.name} subtitle="Seu possível personal na Accqua Sports.">
      <Panel>
        <div className="teacher-detail">
          <div className="teacher-photo-large">{item.name.charAt(0)}</div>
          <div className="stack-10"><strong>História</strong><p className="muted">{item.bio}</p></div>
          <a className="primary-btn full-width" href="https://wa.me/551147181730" target="_blank" rel="noreferrer"><Icon name="message" /> Chamar</a>
        </div>
      </Panel>
    </AppShell>
  );
}
