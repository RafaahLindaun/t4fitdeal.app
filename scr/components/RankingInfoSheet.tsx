import ResponsiveDialog from "./ResponsiveDialog";
import type { RankingEntry, RankingPrize } from "../lib/ranking";
import type { currentRankingPeriod } from "../lib/rankingPeriod";

type Props = {
  open: boolean;
  onClose: () => void;
  period: ReturnType<typeof currentRankingPeriod>;
  entry?: RankingEntry;
  prize?: RankingPrize | null;
  loading: boolean;
  rankingError: boolean;
  prizeError: boolean;
  refreshing: boolean;
  onRefresh: () => void;
};

export default function RankingInfoSheet({ open, onClose, period, entry, prize, loading, rankingError, prizeError, refreshing, onRefresh }: Props) {
  return <ResponsiveDialog open={open} onOpenChange={(next) => { if (!next) onClose(); }} title="Como funciona" description={`Ranking de ${period.label.toLocaleLowerCase("pt-BR")}`} className="ranking-info-responsive-dialog" bodyClassName="ranking-info-dialog-body">
    <div className="ranking-rules">
      <section className="ranking-rules-current" aria-label="Seu mês no ranking" aria-live="polite">
        <small>{period.range} · horário de Brasília</small>
        {loading ? <p>Carregando sua posição...</p> : rankingError ? <p>Não foi possível atualizar sua posição. Tente novamente.</p> : entry ? <>
          <div className="ranking-rules-numbers"><span><strong>{entry.points}</strong> dia{entry.points === 1 ? "" : "s"} válido{entry.points === 1 ? "" : "s"}</span><span><strong>{entry.position}º</strong> lugar</span></div>
          <p>{entry.position === 1 ? "Você lidera este mês. Continue treinando para manter a posição." : entry.daysToLeader === 0 ? "Você empatou em pontos com o líder; o desempate define a posição." : `${entry.daysToLeader === 1 ? "Falta" : "Faltam"} ${entry.daysToLeader} dia${entry.daysToLeader === 1 ? "" : "s"} para igualar o líder.`}</p>
        </> : <p>Seu perfil não aparece na classificação deste mês. Confira sua participação no ranking no Perfil.</p>}
      </section>

      <article className="ranking-rule-summary"><strong>Treine no dia, ganhe o ponto</strong><p>Complete pelo menos 70% do treino em um dia para ganhar o ponto daquele dia.</p></article>

      <details><summary>Quando o dia pode contar?</summary><p>O registro precisa estar dentro do mês e seu acesso à academia precisa estar válido no dia. O mesmo dia conta uma única vez.</p><p>Na regra atual, cardio isolado não soma dias ao ranking; ele continua salvo no histórico.</p></details>
      <details><summary>Como funciona o desempate?</summary><p>Com o mesmo número de dias válidos, fica à frente quem registrou a última atividade válida mais cedo. Persistindo o empate, vale a ordem pelo primeiro nome.</p></details>
      <details><summary>Prêmio deste mês</summary>{loading ? <p>Carregando...</p> : prizeError ? <p>Não foi possível consultar o prêmio agora.</p> : prize ? <><p>Quem terminar o mês em 1º lugar ganha <b>{prize.name}</b>.</p>{prize.description ? <p>{prize.description}</p> : null}</> : <p>A equipe ainda não anunciou o prêmio deste mês.</p>}</details>
      <details><summary>Período da disputa</summary><p>{period.daysRemaining === 1 ? "Hoje é o último dia da disputa." : `Restam ${period.daysRemaining} dias, incluindo hoje.`} Em {period.resetLabel}, à meia-noite de Brasília, começa uma nova classificação.</p></details>

      <button type="button" className="ranking-rules-refresh" disabled={refreshing} onClick={onRefresh}>{refreshing ? "Atualizando..." : "Atualizar posição e prêmio"}</button>
    </div>
  </ResponsiveDialog>;
}
