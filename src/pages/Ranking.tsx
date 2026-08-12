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

function formatDuration(seconds: number) {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}min`;
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

  if (months < 12) {
    return `${months} ${months === 1 ? "mês" : "meses"} treinando`;
  }

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  const yearsLabel = `${years} ${years === 1 ? "ano" : "anos"}`;

  if (!remainingMonths) return `${yearsLabel} treinando`;

  return `${yearsLabel} e ${remainingMonths} ${
    remainingMonths === 1 ? "mês" : "meses"
  } treinando`;
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
      className={`ranking-podium-entry is-position-${position} ${isMe ? "is-me" : ""}`}
      onClick={() => onSelect(entry)}
      aria-label={`${position}º lugar: ${entry.firstName}. Abrir perfil resumido.`}
    >
      <span className="ranking-podium-badge">{position}</span>
      {position === 1 ? <span className="ranking-podium-crown" aria-hidden="true">♛</span> : null}
      <span className={`ranking-podium-avatar ${entry.avatarUrl ? "has-photo" : ""}`}>
        {entry.avatarUrl ? (
          <img src={entry.avatarUrl} alt={`Foto de ${entry.firstName}`} />
        ) : (
          initials(entry.firstName)
        )}
      </span>
      <strong>{isMe ? "Você" : entry.firstName}</strong>
      <span>{entry.points} ponto{entry.points === 1 ? "" : "s"}</span>
      <i>{entry.workoutDays} treino{entry.workoutDays === 1 ? "" : "s"}</i>
      <span className="ranking-podium-base" aria-hidden="true" />
    </button>
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
    <div className="ranking-profile-backdrop" onClick={onClose} role="presentation">
      <section
        className="ranking-profile-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`Perfil resumido de ${displayName}`}
        onClick={(event) => event.stopPropagation()}
      >
        <span className="ranking-profile-handle" aria-hidden="true" />
        <button
          type="button"
          className="ranking-profile-close"
          onClick={onClose}
          aria-label="Fechar perfil resumido"
        >
          ×
        </button>

        <header className="ranking-profile-sheet-header">
          {entry.avatarUrl ? (
            <button
              type="button"
              className="ranking-profile-sheet-avatar"
              onClick={() => onPhoto(entry)}
              aria-label={`Ampliar foto de ${displayName}`}
            >
              <img src={entry.avatarUrl} alt={`Foto de ${displayName}`} />
            </button>
          ) : (
            <span className="ranking-profile-sheet-avatar" aria-hidden="true">
              {initials(entry.firstName)}
            </span>
          )}
          <div>
            <small>PERFIL ACCQUA</small>
            <h2>{displayName}</h2>
            <p>{entry.points} ponto{entry.points === 1 ? "" : "s"} no ranking</p>
          </div>
        </header>

        {loading ? (
          <div className="ranking-profile-loading">
            <span aria-hidden="true" />
            <p>Carregando perfil...</p>
          </div>
        ) : !summary ? (
          <div className="ranking-profile-error">
            <p>Não foi possível carregar os detalhes deste perfil agora.</p>
          </div>
        ) : (
          <div className="ranking-profile-data">
            <article>
              <span>Treino atual</span>
              <strong>{summary.currentWorkout || "Sem treino registrado"}</strong>
            </article>
            <article>
              <span>Na ACCQUA desde</span>
              <strong>{formatMemberSince(summary.memberSince)}</strong>
            </article>
            <article>
              <span>Tempo treinando</span>
              <strong>{formatTrainingAge(summary.memberSince)}</strong>
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
          <button type="button" onClick={() => navigate("/menu-teste")} aria-label="Voltar">←</button>
          <div><AccquaLogo compact /></div>
          <span />
        </header>

        <section className="ranking-title">
          <span>FREQUÊNCIA ACCQUA</span>
          <h1>Ranking da academia</h1>
          <p>Cada dia com treino válido vale um ponto. Sem treino no dia, 30 minutos de cardio também valem um ponto.</p>
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

              <div className="ranking-divider">
                <span>CLASSIFICAÇÃO</span>
                <i>{entries.length} participante{entries.length === 1 ? "" : "s"}</i>
              </div>

              <div className="ranking-list">
                {rest.map((entry, index) => {
                  const position = index + 4;
                  const isMe = entry.studentId === user.id;
                  return (
                    <button
                      type="button"
                      key={entry.studentId}
                      className={isMe ? "is-me" : ""}
                      onClick={() => setSelectedProfile(entry)}
                      aria-label={`Abrir perfil resumido de ${isMe ? "você" : entry.firstName}`}
                    >
                      <span className="ranking-position">{position}</span>
                      <span className={`ranking-avatar ${entry.avatarUrl ? "has-photo" : ""}`}>
                        {entry.avatarUrl ? <img src={entry.avatarUrl} alt={`Foto de ${entry.firstName}`} /> : initials(entry.firstName)}
                      </span>
                      <div>
                        <strong>{isMe ? "Você" : entry.firstName}</strong>
                        <p>{entry.workoutDays} dia{entry.workoutDays === 1 ? "" : "s"} com treino · {entry.cardioOnlyDays} com cardio</p>
                        <small>{formatDuration(entry.totalDurationSeconds)} registrados</small>
                      </div>
                      <b>{entry.points}<i>pts</i></b>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </section>

        <BottomNavigation onSelect={handleBottom} activeKey="inicio" />
      </main>

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
