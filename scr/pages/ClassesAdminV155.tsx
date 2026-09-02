import { useQuery } from "@tanstack/react-query";
import ClassesAdmin from "./ClassesAdmin";
import StaffSubPageHeader from "../components/StaffSubPageHeader";
import StaffPageLayout from "../components/StaffPageLayout";
import { loadAccessModeSummary } from "../lib/accessSummary";
import "./classes-admin-v155.css";

function AccessSummary() {
  const query = useQuery({ queryKey: ["access-mode-summary", "1.5.7"], queryFn: loadAccessModeSummary, staleTime: 20_000 });
  const rows = query.data ?? [];
  return (
    <aside className="classes-v155-access-summary" aria-label="Como seus alunos acessam">
      <small>ACESSO DOS ALUNOS</small>
      <h2>Como seus alunos acessam?</h2>
      {query.isLoading ? <p>Carregando resumo...</p> : rows.length ? <div>{rows.map((row) => <article key={row.mode}><span>{row.label}</span><strong>{row.total}</strong><small>{row.total === 1 ? "aluno" : "alunos"}</small></article>)}</div> : <p>Nenhum aluno ativo encontrado.</p>}
    </aside>
  );
}

export default function ClassesAdminV155() {
  return (
    <StaffPageLayout className="classes-admin-v155-page" header={<StaffSubPageHeader title="Gestão de aulas" subtitle="Horários, modalidades e acesso dos alunos em um só lugar." />}>
      <div className="classes-admin-v155-wrap"><AccessSummary /><ClassesAdmin /></div>
    </StaffPageLayout>
  );
}
