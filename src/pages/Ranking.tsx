import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import AccquaLogo from "../components/AccquaLogo";
import LoadingSplash from "../components/LoadingSplash";
import ProfilePhotoViewer from "../components/ProfilePhotoViewer";
import {
  loadAccquaRanking,
  loadRankingProfileSummary,
  type RankingEntry,
  type RankingProfileSummary,
} from "../lib/ranking";
import "./ranking.css";

const RANKING_PRIZE_LABEL = "[nome do prêmio]";

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase() || "AS";
}

function formatAppTime(value: string) {
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
    return `${days} dia${days === 1 ? "" : "s"} no app`;
  }

  if (months < 12) {
    return `${months} ${months === 1 ? "mês" : "meses"} no app`;
  }

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  const yearLabel = `${years} ${years === 1 ? "ano" : "anos"}`;

  if (!remainingMonths) return `${yearLabel} no app`;

  return `${yearLabel} e ${remainingMonths} ${
    remainingMonths === 1 ? "mês" : "meses"
  } no app`;
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M14.5 5 7.5 12l7 7" />
      <path d="M8 12h11" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10.4v6" />
      <circle cx="12" cy="7.2" r=".9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function Medal({ position }: { position: 1 | 2 | 3 }) {
  return (
    <span
      className={`ranking-medal ranking-medal-${position}`}
      aria-hidden="true"
    >
      {position}
    </span>
  );
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

  return (
    <button
      type="button"
      className={`ranking-podium-card is-position-${position} ${
        isMe ? "is-me" : ""
      }`}
      onClick={() => onSelect(entry)}
      aria-label={`${position}º lugar: ${
        isMe ? "você" : entry.firstName
      }. ${entry.points} treino${entry.points === 1 ? "" : "s"} no mês.`}
    >
      <span
        className={`ranking-podium-avatar is-position-${position} ${
          entry.avatarUrl ? "has-photo" : ""
        }`}
      >
        {entry.avatarUrl ? (
          <img src={entry.avatarUrl} alt={`Foto de ${entry.firstName}`} />
        ) : (
          initials(entry.firstName)
        )}
        <Medal position={position} />
      </span>

      <strong>{isMe ? "Você" : entry.firstName}</strong>
      <small>{entry.points} treino{entry.points === 1 ? "" : "s"}</small>
    </button>
  );
}

function RankingInfoSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;

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
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="ranking-sheet-backdrop" role="presentation" onClick={onClose}>
      <section
        className="ranking-sheet ranking-info-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Como funciona o ranking"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="ranking-sheet-handle" aria-hidden="true" />
        <button
          type="button"
          className="ranking-sheet-close"
          onClick={onClose}
          aria-label="Fechar informações do ranking"
        >
          ×
        </button>

        <header className="ranking-sheet-title">
          <small>RANKING ACCQUA</small>
          <h2>Como funciona</h2>
        </header>

        <div className="ranking-info-list">
          <article>
            <strong>Treinos do mês</strong>
            <p>
              Sua posição é definida pela quantidade de treinos registrados no
              mês atual.
            </p>
          </article>
          <article>
            <strong>Prêmio para o 1º lugar</strong>
            <p>
              Quem terminar o mês em primeiro lugar ganha: {RANKING_PRIZE_LABEL}.
            </p>
          </article>
          <article>
            <strong>Todo mês começa do zero</strong>
            <p>
              A contagem é mensal. No início de cada mês o ranking começa um
              novo ciclo para todos os alunos.
            </p>
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

  return (
    <div className="ranking-sheet-backdrop" role="presentation" onClick={onClose}>
      <section
        className="ranking-sheet ranking-profile-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`Perfil resumido de ${displayName}`}
        onClick={(event) => event.stopPropagation()}
      >
        <span className="ranking-sheet-handle" aria-hidden="true" />
        <button
          type="button"
          className="ranking-sheet-close"
          onClick={onClose}
          aria-label="Fechar perfil resumido"
        >
          ×
        </button>

        <header className="ranking-profile-header">
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
            <span className="ranking-profile-avatar" aria-hidden="true">
              {initials(entry.firstName)}
            </span>
          )}

          <div>
            <small>PERFIL DO RANKING</small>
            <h2>{displayName}</h2>
            <p>
              {entry.points} treino{entry.points === 1 ? "" : "s"} neste mês
            </p>
          </div>
        </header>

        {loading ? (
          <div className="ranking-sheet-loading">
            <span aria-hidden="true" />
            <p>Carregando perfil...</p>
          </div>
        ) : !summary ? (
          <div className="ranking-sheet-error">
            <p>Não foi possível carregar os detalhes deste perfil agora.</p>
          </div>
        ) : (
          <div className="ranking-profile-data">
            <article>
              <span>Idade</span>
              <strong>
                {summary.ageYears === null
                  ? "Não informada"
                  : `${summary.ageYears} anos`}
              </strong>
            </article>
            <article>
              <span>Tempo no app</span>
              <strong>{formatAppTime(summary.memberSince)}</strong>
            </article>
            <article>
              <span>Treinos feitos</span>
              <strong>{summary.totalWorkouts}</strong>
            </article>
            <article>
              <span>Divisão atual</span>
              <strong>{summary.currentSplit || "Não informada"}</strong>
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
  const [infoOpen, setInfoOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<RankingEntry | null>(
    null,
  );
  const [photo, setPhoto] = useState<RankingEntry | null>(null);

  useEffect(() => {
    let alive = true;
    setLoadingRanking(true);

    void loadAccquaRanking()
      .then((data) => {
        if (alive) setEntries(data);
      })
      .finally(() => {
        if (alive) setLoadingRanking(false);
      });

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
  if (landingPath !== "/menu-teste") {
    return <Navigate to={landingPath} replace />;
  }

  return (
    <div className="accqua-ranking-screen">
      <main className="accqua-ranking-shell">
        <header className="ranking-header">
          <button
            type="button"
            className="ranking-header-action ranking-back-button"
            onClick={() => navigate("/menu-teste")}
            aria-label="Voltar"
          >
            <BackIcon />
          </button>

          <div className="ranking-header-logo">
            <AccquaLogo compact />
          </div>

          <button
            type="button"
            className="ranking-header-action ranking-info-button"
            onClick={() => setInfoOpen(true)}
            aria-label="Como funciona o ranking"
          >
            <InfoIcon />
          </button>
        </header>

        <section className="ranking-title">
          <h1>Ranking</h1>
          <p>Alunos com mais treinos</p>
        </section>

        <section className="ranking-content">
          {loadingRanking ? (
            <div className="ranking-loading">
              <span aria-hidden="true" />
              <p>Carregando ranking...</p>
            </div>
          ) : !entries.length ? (
            <div className="ranking-empty">
              <strong>O ranking começa com o primeiro treino do mês</strong>
              <p>Conclua seu treino e acompanhe sua posição.</p>
            </div>
          ) : (
            <>
              <section className="ranking-podium" aria-label="Pódio do ranking">
                {[2, 1, 3].map((position) => {
                  const entry = podiumByPosition.get(position);
                  if (!entry) {
                    return (
                      <span
                        className={`ranking-podium-placeholder is-position-${position}`}
                        key={position}
                      />
                    );
                  }

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

                  return (
                    <button
                      type="button"
                      key={entry.studentId}
                      className={`ranking-row ${isMe ? "is-me" : ""}`}
                      onClick={() => setSelectedProfile(entry)}
                      aria-label={`Abrir perfil resumido de ${
                        isMe ? "você" : entry.firstName
                      }`}
                    >
                      <span className="ranking-row-position">{position}</span>
                      <span
                        className={`ranking-row-avatar ${
                          entry.avatarUrl ? "has-photo" : ""
                        }`}
                      >
                        {entry.avatarUrl ? (
                          <img
                            src={entry.avatarUrl}
                            alt={`Foto de ${entry.firstName}`}
                          />
                        ) : (
                          initials(entry.firstName)
                        )}
                      </span>
                      <strong>{isMe ? "Você" : entry.firstName}</strong>
                      <small>
                        {entry.points} treino{entry.points === 1 ? "" : "s"}
                      </small>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </section>

      </main>

      <RankingInfoSheet open={infoOpen} onClose={() => setInfoOpen(false)} />

      <RankingProfileSheet
        entry={selectedProfile}
        currentUserId={user.id}
        onClose={() => setSelectedProfile(null)}
        onPhoto={setPhoto}
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
