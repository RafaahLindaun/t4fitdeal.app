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
        {loading ? <p>Carregando sua posição e o prêmio...</p> : rankingError ? <p>Não foi possível atualizar sua posição. Tente novamente.</p> : entry ? <>
          <div className="ranking-rules-numbers"><span><strong>{entry.points}</strong> dia{entry.points === 1 ? "" : "s"} válido{entry.points === 1 ? "" : "s"}</span><span><strong>{entry.position}º</strong> lugar</span></div>
          <p>{entry.position === 1 ? "Você lidera este mês. A classificação vale até o encerramento." : entry.daysToLeader === 0 ? "Você tem a mesma pontuação do líder. A posição depende do desempate." : `${entry.daysToLeader === 1 ? "Falta" : "Faltam"} ${entry.daysToLeader} dia${entry.daysToLeader === 1 ? "" : "s"} válido${entry.daysToLeader === 1 ? "" : "s"} para igualar a pontuação do líder.`}</p>
        </> : <p>Seu perfil não aparece na classificação deste mês. Verifique a opção de participação no perfil e seu acesso com a recepção.</p>}
      </section>
      <article><strong>1 dia válido = 1 ponto</strong><p>Finalize e salve um treino de musculação com pelo menos 70% da ficha concluída. O mesmo dia conta uma única vez: repetir treinos ou acumular mais minutos não acrescenta pontos.</p></article>
      <details><summary>Quando o dia pode contar?</summary><p>O registro precisa estar dentro do mês, com matrícula confirmada e válida na data do treino ou presença registrada em aula nesse dia. Seu perfil também precisa participar do ranking.</p><p>Na regra atual, cardio isolado não soma dias ao ranking. Ele continua salvo no seu histórico.</p></details>
      <details><summary>Como funciona o desempate?</summary><p>Com o mesmo número de dias válidos, fica à frente quem tem a última atividade válida mais antiga. Se as datas forem iguais, a ordem é pelo primeiro nome.</p></details>
      <article><strong>Prêmio deste mês</strong>{loading ? <p>Carregando...</p> : prizeError ? <p>Não foi possível consultar o prêmio. Atualize para tentar novamente.</p> : prize ? <><p>Quem encerrar o mês em 1º lugar ganha <b>{prize.name}</b>.</p>{prize.description && <p>{prize.description}</p>}</> : <p>A equipe ainda não anunciou um prêmio para {period.label.toLocaleLowerCase("pt-BR")}.</p>}</article>
      <article><strong>{period.daysRemaining === 1 ? "Último dia da disputa" : `${period.daysRemaining} dias de disputa, incluindo hoje`}</strong><p>Em {period.resetLabel}, à meia-noite de Brasília, começa uma nova classificação. Seus treinos anteriores continuam no histórico.</p></article>
      <button type="button" className="ranking-rules-refresh" disabled={refreshing} onClick={onRefresh}>{refreshing ? "Atualizando..." : "Atualizar posição e prêmio"}</button>
    </div>
  </ResponsiveDialog>;
}
