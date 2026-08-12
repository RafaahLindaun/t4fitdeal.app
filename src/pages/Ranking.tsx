import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import AccquaLogo from "../components/AccquaLogo";
import BottomNavigation from "../components/BottomNavigation";
import LoadingSplash from "../components/LoadingSplash";
import ProfilePhotoViewer from "../components/ProfilePhotoViewer";
import {
  loadAccquaRanking,
  loadRankingProfileSummary,
  type RankingEntry,
  type RankingProfileSummary,
} from "../lib/ranking";
import "./ranking.css";

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase() || "AS";
}

function formatMemberSince(value: string) {
  if (!value) return "Data não disponível";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data não disponível";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatTrainingAge(value: string) {
  if (!value) return "Tempo não disponível";
  const start = new Date(value);
  if (Number.isNaN(start.getTime())) return "Tempo não disponível";

  const now = new Date();
  let months =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());

  if (now.getDate() < start.getDate()) months -= 1;
  months = Math.max(0, months);

  if (months === 0) {
    const days = Math.max(
      1,
      Math.floor((now.getTime() - start.getTime()) / 86_400_000),
    );
    return `${days} dia${days === 1 ? "" : "s"} treinando`;
  }

  if (months < 12) return `${months} ${months === 1 ? "mês" : "meses"} treinando`;

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  const yearsLabel = `${years} ${years === 1 ? "ano" : "anos"}`;
  if (!remainingMonths) return `${yearsLabel} treinando`;
  return `${yearsLabel} e ${remainingMonths} ${remainingMonths === 1 ? "mês" : "meses"} treinando`;
}

function formatAge(value: string) {
  if (!value) return "Não informado";
  const birth = new Date(value);
  if (Number.isNaN(birth.getTime())) return "Não informado";
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age -= 1;
  return `${Math.max(0, age)} anos`;
}

function trainingCount(entry: RankingEntry) {
  return Math.max(0, entry.workoutDays || 0);
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10.2v6.1" />
      <circle cx="12" cy="7.2" r=".9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function Medal({ position }: { position: 1 | 2 | 3 }) {
  return <span className={`ranking-medal ranking-medal-${position}`} aria-hidden="true">{position}</span>;
}

function PodiumEntry({
  entry,
  position,
  currentUserId,
  onSelect,
}: {
  entry: RankingEntry;
  position: 1 | 2 | 3;
  currentUserId: string;
  onSelect: (entry: RankingEntry) => void;
}) {
  const isMe = entry.studentId === currentUserId;
  const count = trainingCount(entry);

  return (
    <button
      type="button"
      className={`ranking-podium-card is-position-${position} ${isMe ? "is-me" : ""}`}
      onClick={() => onSelect(entry)}
      aria-label={`${position}º lugar: ${isMe ? "você" : entry.firstName}. Abrir perfil resumido.`}
    >
      <div className={`ranking-podium-photo is-position-${position} ${entry.avatarUrl ? "has-photo" : ""}`}>
        {entry.avatarUrl ? (
          <img src={entry.avatarUrl} alt={`Foto de ${entry.firstName}`} />
        ) : (
          <span>{initials(entry.firstName)}</span>
        )}
        <Medal position={position} />
      </div>
      <strong>{isMe ? "Você" : entry.firstName}</strong>
      <small>{count} treino{count === 1 ? "" : "s"}</small>
    </button>
  );
}

function RankingInfoSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="ranking-sheet-backdrop" onClick={onClose} role="presentation">
      <section
        className="ranking-sheet ranking-info-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Informações do ranking"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="ranking-sheet-handle" aria-hidden="true" />
        <button type="button" className="ranking-sheet-close" onClick={onClose} aria-label="Fechar informações">
          ×
        </button>
        <header className="ranking-sheet-title">
          <small>COMO FUNCIONA</small>
          <h2>Ranking ACCQUA</h2>
          <p>Veja sua posição entre os alunos com mais treinos registrados no app.</p>
        </header>
        <div className="ranking-info-list">
          <article>
            <strong>Contagem do ranking</strong>
            <p>O ranking mostra os treinos válidos registrados para cada aluno dentro do aplicativo.</p>
          </article>
          <article>
            <strong>Premiação mensal</strong>
            <p>No fim de cada mês, a academia premia o melhor colocado do ranking.</p>
          </article>
          <article>
            <strong>Novo ciclo</strong>
            <p>Depois da premiação, a contagem mensal reinicia para começar uma nova disputa.</p>
          </article>
          <article>
            <strong>Ao tocar em alguém</strong>
            <p>Você pode ver dados básicos do aluno, como idade, tempo de treino, treino atual e quantidade de treinos.</p>
          </article>
        </div>
      </section>
    </div>
  );
}

function RankingProfileSheet({
  entry,
  currentUserId,
  onClose,
  onPhoto,
}: {
  entry: RankingEntry | null;
  currentUserId: string;
  onClose: () => void;
  onPhoto: (entry: RankingEntry) => void;
}) {
  const [summary, setSummary] = useState<RankingProfileSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!entry) {
      setSummary(null);
      setLoading(false);
      return;
    }

    let alive = true;
    setLoading(true);
    setSummary(null);

    void loadRankingProfileSummary(entry.studentId)
      .then((data) => {
        if (alive) setSummary(data);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [entry?.studentId]);

  useEffect(() => {
    if (!entry) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [entry, onClose]);

  if (!entry) return null;

  const displayName = entry.studentId === currentUserId ? "Você" : entry.firstName;
  const count = trainingCount(entry);

  return (
    <div className="ranking-sheet-backdrop" onClick={onClose} role="presentation">
      <section
        className="ranking-sheet ranking-profile-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`Perfil resumido de ${displayName}`}
        onClick={(event) => event.stopPropagation()}
      >
        <span className="ranking-sheet-handle" aria-hidden="true" />
        <button type="button" className="ranking-sheet-close" onClick={onClose} aria-label="Fechar perfil resumido">
          ×
        </button>

        <header className="ranking-sheet-header">
          {entry.avatarUrl ? (
            <button
              type="button"
              className="ranking-profile-avatar-button"
              onClick={() => onPhoto(entry)}
              aria-label={`Ampliar foto de ${displayName}`}
            >
              <span className="ranking-profile-avatar has-photo">
                <img src={entry.avatarUrl} alt={`Foto de ${displayName}`} />
              </span>
            </button>
          ) : (
            <span className="ranking-profile-avatar" aria-hidden="true">{initials(entry.firstName)}</span>
          )}
          <div>
            <small>PERFIL DO RANKING</small>
            <h2>{displayName}</h2>
            <p>{count} treino{count === 1 ? "" : "s"} registrados</p>
          </div>
        </header>

        {loading ? (
          <div className="ranking-sheet-loading"><span aria-hidden="true" /><p>Carregando perfil...</p></div>
        ) : !summary ? (
          <div className="ranking-sheet-error"><p>Não foi possível carregar os detalhes deste perfil agora.</p></div>
        ) : (
          <div className="ranking-profile-grid">
            <article>
              <span>Idade</span>
              <strong>{formatAge(summary.birthDate)}</strong>
            </article>
            <article>
              <span>Treino atual</span>
              <strong>{summary.currentWorkout || "Sem treino registrado"}</strong>
            </article>
            <article>
              <span>Na ACCQUA desde</span>
              <strong>{formatMemberSince(summary.memberSince)}</strong>
            </article>
            <article>
              <span>Tempo de treino</span>
              <strong>{formatTrainingAge(summary.memberSince)}</strong>
            </article>
            <article>
              <span>Quantidade de treinos</span>
              <strong>{count} treino{count === 1 ? "" : "s"}</strong>
            </article>
          </div>
        )}
      </section>
    </div>
  );
}

export default function Ranking() {
  const navigate = useNavigate();
  const { user, loading, landingPath } = useAuth();
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [loadingRanking, setLoadingRanking] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<RankingEntry | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [photo, setPhoto] = useState<RankingEntry | null>(null);

  useEffect(() => {
    let alive = true;
    setLoadingRanking(true);
    void loadAccquaRanking()
      .then((data) => alive && setEntries(data))
      .finally(() => alive && setLoadingRanking(false));
    return () => {
      alive = false;
    };
  }, []);

  const podium = useMemo(() => entries.slice(0, 3), [entries]);
  const rest = useMemo(() => entries.slice(3), [entries]);
  const podiumByPosition = useMemo(
    () => new Map(podium.map((entry, index) => [index + 1, entry])),
    [podium],
  );

  if (loading) return <LoadingSplash />;
  if (!user) return <Navigate to="/login" replace />;
  if (landingPath !== "/menu-teste") return <Navigate to={landingPath} replace />;

  const handleBottom = (label: string) => {
    if (label === "Início") {
      window.sessionStorage.setItem("accqua:skip-next-menu-splash", "1");
      navigate("/menu-teste");
      return;
    }
    if (label === "Perfil") navigate("/perfil");
    if (label === "Treino") navigate("/treino");
  };

  return (
    <div className="accqua-ranking-screen">
      <main className="accqua-ranking-shell">
        <header className="ranking-header">
          <button type="button" className="ranking-icon-button ranking-back" onClick={() => navigate("/menu-teste")} aria-label="Voltar">←</button>
          <div className="ranking-header-logo"><AccquaLogo compact /></div>
          <button type="button" className="ranking-icon-button ranking-info" onClick={() => setInfoOpen(true)} aria-label="Como funciona o ranking"><InfoIcon /></button>
        </header>

        <section className="ranking-title">
          <h1>Ranking</h1>
          <p>Alunos com mais treinos</p>
        </section>

        <section className="ranking-content">
          {loadingRanking ? (
            <div className="ranking-loading"><span /><p>Carregando ranking...</p></div>
          ) : !entries.length ? (
            <div className="ranking-empty"><strong>O ranking começa com o primeiro treino</strong><p>Conclua sua atividade e volte para acompanhar sua posição.</p></div>
          ) : (
            <>
              <section className="ranking-podium" aria-label="Pódio do ranking">
                {[2, 1, 3].map((position) => {
                  const entry = podiumByPosition.get(position);
                  if (!entry) return <span className={`ranking-podium-placeholder is-position-${position}`} key={position} />;
                  return (
                    <PodiumEntry
                      key={entry.studentId}
                      entry={entry}
                      position={position as 1 | 2 | 3}
                      currentUserId={user.id}
                      onSelect={setSelectedProfile}
                    />
                  );
                })}
              </section>

              <div className="ranking-list">
                {rest.map((entry, index) => {
                  const position = index + 4;
                  const isMe = entry.studentId === user.id;
                  const count = trainingCount(entry);
                  return (
                    <button
                      type="button"
                      key={entry.studentId}
                      className={`ranking-row ${isMe ? "is-me" : ""}`}
                      onClick={() => setSelectedProfile(entry)}
                      aria-label={`Abrir perfil resumido de ${isMe ? "você" : entry.firstName}`}
                    >
                      <span className="ranking-row-position">{position}</span>
                      <span className={`ranking-row-avatar ${entry.avatarUrl ? "has-photo" : ""}`}>
                        {entry.avatarUrl ? <img src={entry.avatarUrl} alt={`Foto de ${entry.firstName}`} /> : initials(entry.firstName)}
                      </span>
                      <strong>{isMe ? "Você" : entry.firstName}</strong>
                      <small>{count} treino{count === 1 ? "" : "s"}</small>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </section>

        <BottomNavigation onSelect={handleBottom} activeKey="inicio" />
      </main>

      <RankingInfoSheet open={infoOpen} onClose={() => setInfoOpen(false)} />

      <RankingProfileSheet
        entry={selectedProfile}
        currentUserId={user.id}
        onClose={() => setSelectedProfile(null)}
        onPhoto={(entry) => setPhoto(entry)}
      />

      <ProfilePhotoViewer
        open={Boolean(photo)}
        imageUrl={photo?.avatarUrl ?? ""}
        name={photo?.firstName ?? "Perfil"}
        onClose={() => setPhoto(null)}
      />
    </div>
  );
}
