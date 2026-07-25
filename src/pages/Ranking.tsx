import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import AccquaLogo from "../components/AccquaLogo";
import BottomNavigation from "../components/BottomNavigation";
import LoadingSplash from "../components/LoadingSplash";
import ProfilePhotoViewer from "../components/ProfilePhotoViewer";
import { loadAccquaRanking, type RankingEntry } from "../lib/ranking";
import "./ranking.css";

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase() || "AS";
}

function formatDuration(seconds: number) {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}min`;
}

function PodiumEntry({
  entry,
  position,
  currentUserId,
  onPhoto,
}: {
  entry: RankingEntry;
  position: 1 | 2 | 3;
  currentUserId: string;
  onPhoto: (entry: RankingEntry) => void;
}) {
  const isMe = entry.studentId === currentUserId;

  return (
    <button
      type="button"
      className={`ranking-podium-entry is-position-${position} ${isMe ? "is-me" : ""}`}
      onClick={() => entry.avatarUrl && onPhoto(entry)}
      aria-label={`${position}º lugar: ${entry.firstName}`}
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

export default function Ranking() {
  const navigate = useNavigate();
  const { user, loading, landingPath } = useAuth();
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [loadingRanking, setLoadingRanking] = useState(true);
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
                      onPhoto={setPhoto}
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
                      onClick={() => entry.avatarUrl && setPhoto(entry)}
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

      <ProfilePhotoViewer
        open={Boolean(photo)}
        imageUrl={photo?.avatarUrl ?? ""}
        name={photo?.firstName ?? "Perfil"}
        onClose={() => setPhoto(null)}
      />
    </div>
  );
}
