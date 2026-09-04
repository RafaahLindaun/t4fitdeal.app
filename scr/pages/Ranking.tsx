import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthProvider";
import AccquaLogo from "../components/AccquaLogo";
import LoadingSplash from "../components/LoadingSplash";
import ProfilePhotoViewer from "../components/ProfilePhotoViewer";
import ResponsiveDialog from "../components/ResponsiveDialog";
import ModalCloseButton from "../components/ModalCloseButton";
import {
  loadAccquaRanking,
  loadRankingPrize,
  loadRankingProfileSummary,
  loadRankingPrizeName,
  type RankingEntry,
  type RankingProfileSummary,
  type RankingPrize,
} from "../lib/ranking";
import "./ranking.css";

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase() || "AS";
}

function formatAppTime(value: string) {
  if (!value) return "Tempo não disponível";
  const start = new Date(value);
  if (Number.isNaN(start.getTime())) return "Tempo não disponível";
  const now = new Date();
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) months -= 1;
  months = Math.max(0, months);
  if (months === 0) {
    const days = Math.max(1, Math.floor((now.getTime() - start.getTime()) / 86_400_000));
    return `${days} dia${days === 1 ? "" : "s"} no app`;
  }
  if (months < 12) return `${months} ${months === 1 ? "mês" : "meses"} no app`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  return remainingMonths
    ? `${years} ${years === 1 ? "ano" : "anos"} e ${remainingMonths} ${remainingMonths === 1 ? "mês" : "meses"} no app`
    : `${years} ${years === 1 ? "ano" : "anos"} no app`;
}

function rankingAchievementV163(memberSince: string) {
  const start = new Date(memberSince);
  if (Number.isNaN(start.getTime())) return null;
  const days = Math.max(0, Math.floor((Date.now() - start.getTime()) / 86_400_000));
  const levels = [
    { days: 365, label: "LENDÁRIO" },
    { days: 180, label: "IMPARÁVEL" },
    { days: 90, label: "CONSISTENTE" },
    { days: 50, label: "INSANO" },
    { days: 30, label: "NO RITMO" },
  ];
  return levels.find((level) => days >= level.days) ?? null;
}

function BackIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5 7.5 12l7 7"/><path d="M8 12h11"/></svg>;
}

function InfoIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 10.4v6"/><circle cx="12" cy="7.2" r=".9" fill="currentColor" stroke="none"/></svg>;
}

function GiftIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10h16v10H4z"/><path d="M3 7h18v3H3z"/><path d="M12 7v13"/><path d="M12 7c-2.8 0-5-1-5-2.8C7 2.8 8 2 9.2 2 11 2 12 4.2 12 7Zm0 0c2.8 0 5-1 5-2.8C17 2.8 16 2 14.8 2 13 2 12 4.2 12 7Z"/></svg>;
}

function Medal({ position }: { position: 1 | 2 | 3 }) {
  return <span className={`ranking-medal ranking-medal-${position}`} aria-hidden="true">{position}</span>;
}

function PodiumEntry({ entry, position, currentUserId, onSelect }: { entry: RankingEntry; position: 1 | 2 | 3; currentUserId: string; onSelect: (entry: RankingEntry) => void }) {
  const isMe = entry.studentId === currentUserId;
  return (
    <button type="button" className={`ranking-podium-card is-position-${position} ${isMe ? "is-me" : ""}`} onClick={() => onSelect(entry)}>
      <span className={`ranking-podium-avatar is-position-${position} ${entry.avatarUrl ? "has-photo" : ""}`}>
        {entry.avatarUrl ? <img src={entry.avatarUrl} alt={`Foto de ${entry.firstName}`}/> : initials(entry.firstName)}
        <Medal position={position}/>
      </span>
      <strong>{isMe ? "Você" : entry.firstName}</strong>
      {isMe ? <em className="ranking-you-badge">Você</em> : null}
      <small>{entry.points} dia{entry.points === 1 ? "" : "s"} treinado{entry.points === 1 ? "" : "s"}</small>
    </button>
  );
}

function RankingInfoSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const prizeQuery = useQuery({ queryKey: ["ranking-config", "nome-premio"], queryFn: loadRankingPrizeName, enabled: open, staleTime: 5 * 60_000 });
  const prizeName = prizeQuery.data?.trim() || "um prêmio especial";
  return (
    <ResponsiveDialog open={open} onOpenChange={(next) => { if (!next) onClose(); }} title="Como funciona" description="Entenda como sua posição no Ranking ACCQUA é calculada." className="ranking-info-responsive-dialog" bodyClassName="ranking-info-dialog-body" closeButton={<button type="button" className="ranking-sheet-close" aria-label="Fechar">×</button>}>
      <div className="ranking-info-list">
        <article><strong>Dias treinados do mês</strong><p>Cada dia válido conta no máximo uma vez no ranking, mesmo que você registre mais de um treino no mesmo dia.</p></article>
        <article><strong>Presença com lastro</strong><p>O dia só entra na disputa quando há matrícula válida naquela data ou presença registrada em uma aula.</p></article>
        <article><strong>Prêmio para o 1º lugar</strong><p>Quem terminar o mês em primeiro lugar ganha: {prizeName}.</p></article>
        <article><strong>Todo mês começa do zero</strong><p>No primeiro dia de cada mês começa um novo período de disputa.</p></article>
      </div>
    </ResponsiveDialog>
  );
}

function daysToMonthEnd() {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86_400_000));
}

function PrizeDialog({ open, onClose, prize, entry }: { open: boolean; onClose: () => void; prize: RankingPrize | null | undefined; entry: RankingEntry | undefined }) {
  return (
    <ResponsiveDialog open={open} onOpenChange={(next) => { if (!next) onClose(); }} title="Prêmio deste mês" description="Treine, suba no ranking e dispute o prêmio mensal." className="ranking-prize-responsive-dialog" bodyClassName="ranking-prize-dialog-body">
      {!prize ? (
        <div className="ranking-prize-empty"><GiftIcon/><strong>Prêmio deste mês ainda não anunciado</strong><p>Assim que a equipe publicar, ele aparece aqui.</p></div>
      ) : (
        <div className="ranking-prize-content">
          {prize.imageUrl ? <img className="ranking-prize-image" src={prize.imageUrl} alt={prize.name}/> : <div className="ranking-prize-image-placeholder"><GiftIcon/></div>}
          <div><h3>{prize.name}</h3>{prize.description ? <p>{prize.description}</p> : null}</div>
          <div className="ranking-prize-progress">
            {!entry ? <p>Faça seu primeiro treino do mês para entrar na disputa.</p> : entry.position === 1 ? <p>🏆 Você está em <strong>1º lugar</strong>! Continue treinando para garantir.</p> : <p>Você está em <strong>{entry.position}º lugar</strong> — faltam <strong>{entry.daysToLeader} dia{entry.daysToLeader === 1 ? "" : "s"} treinado{entry.daysToLeader === 1 ? "" : "s"}</strong> para alcançar o líder.</p>}
          </div>
          <small>⏳ Faltam {daysToMonthEnd()} dias para o fim do período. O ranking reinicia todo mês.</small>
        </div>
      )}
    </ResponsiveDialog>
  );
}

function RankingProfileSheet({ entry, currentUserId, onClose, onPhoto }: { entry: RankingEntry | null; currentUserId: string; onClose: () => void; onPhoto: (entry: RankingEntry) => void }) {
  const [summary, setSummary] = useState<RankingProfileSummary | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!entry) { setSummary(null); setLoading(false); return; }
    let alive = true; setLoading(true); setSummary(null);
    void loadRankingProfileSummary(entry.studentId).then((data) => { if (alive) setSummary(data); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [entry?.studentId]);
  useEffect(() => {
    if (!entry) return;
    const previousOverflow = document.body.style.overflow; document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", onKeyDown); };
  }, [entry, onClose]);
  if (!entry) return null;
  const displayName = entry.studentId === currentUserId ? "Você" : entry.firstName;
  return (
    <div className="ranking-sheet-backdrop" role="presentation" onClick={onClose}>
      <section className="ranking-sheet ranking-profile-sheet" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <span className="ranking-sheet-handle" aria-hidden="true"/><ModalCloseButton className="ranking-sheet-close" onClick={onClose} ariaLabel="Fechar perfil resumido"/>
        <header className="ranking-profile-header">
          {entry.avatarUrl ? <button type="button" className="ranking-profile-avatar-button" onClick={() => onPhoto(entry)}><span className="ranking-profile-avatar has-photo"><img src={entry.avatarUrl} alt={`Foto de ${displayName}`}/></span></button> : <span className="ranking-profile-avatar" aria-hidden="true">{initials(entry.firstName)}</span>}
          <div><small>PERFIL DO RANKING</small><h2>{displayName}</h2><p>{entry.points} dia{entry.points === 1 ? "" : "s"} treinado{entry.points === 1 ? "" : "s"} neste mês</p></div>
        </header>
        {loading ? <div className="ranking-sheet-loading"><span/><p>Carregando perfil...</p></div> : !summary ? <div className="ranking-sheet-error"><p>Não foi possível carregar os detalhes deste perfil agora.</p></div> : <div className="ranking-profile-data">
          <article><span>Idade</span><strong>{summary.ageYears === null ? "Não informada" : `${summary.ageYears} anos`}</strong></article>
          <article><span>Tempo no app</span><strong>{formatAppTime(summary.memberSince)}</strong></article>
          <article><span>Treinos feitos</span><strong>{summary.totalWorkouts}</strong></article>
          <article><span>Divisão atual</span><strong>{summary.currentSplit || "Não informada"}</strong></article>
          <article className="ranking-profile-objective-v163"><span>Objetivo</span><strong>{summary.objective || "Não informado"}</strong></article>
          {rankingAchievementV163(summary.memberSince) ? <span className="ranking-achievement-v163">★ {rankingAchievementV163(summary.memberSince)?.label}</span> : null}
        </div>}
      </section>
    </div>
  );
}

export default function Ranking() {
  const navigate = useNavigate();
  const { user, loading, landingPath } = useAuth();
  const [infoOpen, setInfoOpen] = useState(false);
  const [prizeOpen, setPrizeOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<RankingEntry | null>(null);
  const [photo, setPhoto] = useState<RankingEntry | null>(null);
  const rankingQuery = useQuery({ queryKey: ["ranking", "monthly", "1.5.6"], queryFn: loadAccquaRanking, staleTime: 20_000 });
  const prizeQuery = useQuery({ queryKey: ["ranking-prize", "current"], queryFn: () => loadRankingPrize(), staleTime: 60_000 });
  const entries = rankingQuery.data ?? [];
  const podium = useMemo(() => entries.slice(0, 3), [entries]);
  const rest = useMemo(() => entries.slice(3), [entries]);
  const podiumByPosition = useMemo(() => new Map(podium.map((entry) => [entry.position, entry])), [podium]);
  const myEntry = useMemo(() => entries.find((entry) => entry.studentId === user?.id), [entries, user?.id]);

  if (loading) return <LoadingSplash/>;
  if (!user) return <Navigate to="/login" replace/>;
  if (landingPath !== "/menu-teste") return <Navigate to={landingPath} replace/>;

  return (
    <div className="accqua-ranking-screen"><main className="accqua-ranking-shell">
      <header className="ranking-header">
        <button type="button" className="ranking-header-action ranking-back-button" onClick={() => navigate("/menu-teste")} aria-label="Voltar"><BackIcon/></button>
        <div className="ranking-header-logo"><AccquaLogo compact/></div>
        <div className="ranking-header-actions">
          <button type="button" className="ranking-prize-fab" onClick={() => setPrizeOpen(true)} aria-label="Ver prêmio deste mês"><GiftIcon/></button>
          <button type="button" className="ranking-info-fab" onClick={() => setInfoOpen(true)} aria-label="Como funciona o ranking"><InfoIcon/></button>
        </div>
      </header>
      <section className="ranking-title"><h1>Ranking</h1><p>Alunos com mais dias treinados</p></section>
      <section className="ranking-content">
        {rankingQuery.isLoading ? <div className="ranking-loading"><span/><p>Carregando ranking...</p></div> : !entries.length ? <div className="ranking-empty"><strong>O ranking começa com o primeiro dia treinado do mês</strong><p>Conclua seu treino e acompanhe sua posição.</p></div> : <>
          <section className="ranking-podium" aria-label="Pódio do ranking">{([2,1,3] as const).map((position) => { const entry = podiumByPosition.get(position) ?? podium[position - 1]; return entry ? <PodiumEntry key={entry.studentId} entry={entry} position={position} currentUserId={user.id} onSelect={setSelectedProfile}/> : <span className={`ranking-podium-placeholder is-position-${position}`} key={position}/>; })}</section>
          <div className="ranking-list">{rest.map((entry, index) => { const isMe = entry.studentId === user.id; return <button type="button" key={entry.studentId} className={`ranking-row ${isMe ? "is-me" : ""}`} onClick={() => setSelectedProfile(entry)}><span className="ranking-row-position">{entry.position || index + 4}</span><span className={`ranking-row-avatar ${entry.avatarUrl ? "has-photo" : ""}`}>{entry.avatarUrl ? <img src={entry.avatarUrl} alt={`Foto de ${entry.firstName}`}/> : initials(entry.firstName)}</span><strong>{isMe ? "Você" : entry.firstName}{isMe ? <em className="ranking-you-badge">Você</em> : null}</strong><small>{entry.points} dia{entry.points === 1 ? "" : "s"}</small></button>; })}</div>
        </>}
      </section>
    </main>
    <RankingInfoSheet open={infoOpen} onClose={() => setInfoOpen(false)}/>
    <PrizeDialog open={prizeOpen} onClose={() => setPrizeOpen(false)} prize={prizeQuery.data} entry={myEntry}/>
    <RankingProfileSheet entry={selectedProfile} currentUserId={user.id} onClose={() => setSelectedProfile(null)} onPhoto={setPhoto}/>
    <ProfilePhotoViewer open={Boolean(photo)} imageUrl={photo?.avatarUrl ?? ""} name={photo?.firstName ?? "Perfil"} onClose={() => setPhoto(null)}/>
    </div>
  );
}
