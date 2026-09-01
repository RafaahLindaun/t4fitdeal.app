import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import ClassesAdmin from "./ClassesAdmin";
import { loadAccessModeSummary } from "../lib/accessSummary";
import "./classes-admin-v155.css";

function AccessSummary() {
  const query = useQuery({ queryKey: ["access-mode-summary", "1.5.5"], queryFn: loadAccessModeSummary, staleTime: 20_000 });
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
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest<HTMLButtonElement>(".classes-admin-type-head");
      if (!button) return;
      const card = button.closest<HTMLElement>(".classes-admin-type-card");
      if (!card) return;
      const forced = card.dataset.v155ForceCollapsed === "true";
      const body = card.querySelector(".classes-admin-type-body");
      if (forced) {
        window.setTimeout(() => { delete card.dataset.v155ForceCollapsed; }, 0);
      } else if (body) {
        // A implementação legada reabre automaticamente o primeiro accordion
        // quando o Set chega a zero. Este estado visual explícito preserva a
        // intenção do clique sem alterar o CRUD/estado interno já estabilizado.
        window.setTimeout(() => { card.dataset.v155ForceCollapsed = "true"; }, 0);
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return <div className="classes-admin-v155-wrap"><AccessSummary /><ClassesAdmin /></div>;
}
