import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "../auth/AuthProvider";
import LoadingSplash from "../components/LoadingSplash";
import StaffSubPageHeader from "../components/StaffSubPageHeader";
import StaffPageLayout from "../components/StaffPageLayout";
import StorageImageUploadGrid, { type StorageImageValue } from "../components/StorageImageUploadGrid";
import {
  loadAccquaRanking,
  loadRankingPrize,
  nextRankingPeriodKey,
  rankingPeriodKey,
  rankingPeriodLabel,
  saveRankingPrize,
} from "../lib/ranking";
import { logStaffError, staffFacingErrorMessage } from "../lib/staffErrors";
import "./ranking-staff.css";

export default function RankingStaff() {
  const { user, profile, loading } = useAuth();
  const queryClient = useQueryClient();
  const isStaff = Boolean(profile && ["professor", "admin", "reception"].includes(profile.role));
  const [period, setPeriod] = useState(rankingPeriodKey());
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<StorageImageValue[]>([]);
  const [saving, setSaving] = useState(false);

  const currentPeriod = rankingPeriodKey();
  const nextPeriod = nextRankingPeriodKey();
  const rankingQuery = useQuery({ queryKey: ["ranking", "monthly", "1.5.6"], queryFn: loadAccquaRanking, enabled: isStaff, staleTime: 20_000 });
  const prizeQuery = useQuery({ queryKey: ["ranking-prize", period], queryFn: () => loadRankingPrize(period), enabled: isStaff });

  useEffect(() => {
    const prize = prizeQuery.data;
    setName(prize?.name ?? "");
    setDescription(prize?.description ?? "");
    setImages(prize?.imageUrl ? [{ path: prize.imageUrl, url: prize.imageUrl, order: 0 }] : []);
  }, [period, prizeQuery.data?.id, prizeQuery.data?.name, prizeQuery.data?.description, prizeQuery.data?.imageUrl]);

  const topFive = useMemo(() => (rankingQuery.data ?? []).slice(0, 5), [rankingQuery.data]);

  if (loading) return <LoadingSplash />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isStaff) return <Navigate to="/menu-teste" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) { toast.error("Informe o nome do prêmio."); return; }
    setSaving(true);
    try {
      await saveRankingPrize({ period, name: name.trim(), description: description.trim(), imageUrl: images[0]?.url ?? "" });
      toast.success(`Prêmio de ${rankingPeriodLabel(period)} salvo.`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["ranking-prize"] }),
        queryClient.invalidateQueries({ queryKey: ["ranking-config"] }),
      ]);
    } catch (error) {
      logStaffError("ranking-prize", error);
      toast.error(staffFacingErrorMessage(error, "Não foi possível salvar o prêmio agora. Tente novamente."));
    } finally { setSaving(false); }
  };

  return (
    <StaffPageLayout className="ranking-staff-page" header={<StaffSubPageHeader title="Ranking" subtitle="Prêmio mensal e acompanhamento da disputa por dias treinados." />}>
      <div className="ranking-staff-grid">
        <form className="ranking-staff-card ranking-prize-editor" onSubmit={(event) => void submit(event)}>
          <header><div><small>PRÊMIO</small><h2>Prêmio do período</h2></div><span>{rankingPeriodLabel(period)}</span></header>
          <label>Período<select value={period} onChange={(event) => setPeriod(event.target.value)}><option value={currentPeriod}>{rankingPeriodLabel(currentPeriod)} · atual</option><option value={nextPeriod}>{rankingPeriodLabel(nextPeriod)} · próximo mês</option></select></label>
          <StorageImageUploadGrid bucket="premios-ranking" folder={`premios/${period}`} value={images} onChange={setImages} maxFiles={1} multiple={false} label="Imagem do prêmio" />
          <label>Nome do prêmio<input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} placeholder="Ex: Kit ACCQUA + mensalidade" required /></label>
          <label>Descrição<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={300} rows={4} placeholder="Explique o que o vencedor recebe." /></label>
          <button className="ranking-staff-primary" type="submit" disabled={saving}>{saving ? "Salvando..." : `Salvar prêmio de ${rankingPeriodLabel(period)}`}</button>
        </form>

        <section className="ranking-staff-card ranking-race-panel">
          <header><div><small>DISPUTA</small><h2>Quem está perto de ganhar</h2></div><span>Top 5 do mês</span></header>
          {rankingQuery.isLoading ? <div className="ranking-staff-empty">Carregando ranking...</div> : !topFive.length ? <div className="ranking-staff-empty">Ainda não há dias válidos neste mês.</div> : <div className="ranking-race-list">{topFive.map((entry) => <article key={entry.studentId} className={entry.daysToLeader <= 2 && entry.position > 1 ? "is-close" : ""}><span className="ranking-race-position">{entry.position}º</span><span className="ranking-race-avatar">{entry.avatarUrl ? <img src={entry.avatarUrl} alt="" /> : entry.firstName.slice(0,2).toUpperCase()}</span><div><strong>{entry.firstName}</strong><small>{entry.points} dia{entry.points === 1 ? "" : "s"} treinado{entry.points === 1 ? "" : "s"}{entry.position > 1 ? ` · a ${entry.daysToLeader} dia${entry.daysToLeader === 1 ? "" : "s"} treinado${entry.daysToLeader === 1 ? "" : "s"} do líder` : " · líder"}</small>{entry.position > 1 && entry.daysToLeader <= 2 ? <em>🔥 Disputa acirrada</em> : null}</div></article>)}</div>}
          <p className="ranking-race-note">A distância exibida aqui vem da mesma RPC de dias treinados usada no Ranking do aluno.</p>
        </section>
      </div>
    </StaffPageLayout>
  );
}
