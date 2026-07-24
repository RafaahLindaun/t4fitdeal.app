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

function medal(position: number) {
  if (position === 1) return "🥇";
  if (position === 2) return "🥈";
  if (position === 3) return "🥉";
  return String(position);
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

  const leader = entries[0] ?? null;
  const rest = useMemo(() => entries.slice(1), [entries]);

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
          <p>Treino válido ou cardio de pelo menos 30 minutos vale um ponto por dia.</p>
        </section>

        <section className="ranking-content">
          {loadingRanking ? (
            <div className="ranking-loading"><span /><p>Carregando ranking...</p></div>
          ) : !entries.length ? (
            <div className="ranking-empty"><strong>O ranking começa com o primeiro treino</strong><p>Conclua sua atividade e volte para acompanhar sua posição.</p></div>
          ) : (
            <>
              {leader ? (
                <button className="ranking-leader" type="button" onClick={() => leader.avatarUrl && setPhoto(leader)}>
                  <span className="ranking-crown">1</span>
                  <span className={`ranking-avatar is-large ${leader.avatarUrl ? "has-photo" : ""}`}>
                    {leader.avatarUrl ? <img src={leader.avatarUrl} alt={`Foto de ${leader.firstName}`} /> : initials(leader.firstName)}
                  </span>
                  <div><small>LIDERANÇA ATUAL</small><h2>{leader.firstName}</h2><p>{leader.workoutDays} dias de treino · {leader.cardioOnlyDays} dias de cardio</p></div>
                  <strong>{leader.points}<i>pts</i></strong>
                </button>
              ) : null}

              <div className="ranking-list">
                {rest.map((entry, index) => {
                  const position = index + 2;
                  return (
                    <button type="button" key={entry.studentId} onClick={() => entry.avatarUrl && setPhoto(entry)}>
                      <span className={`ranking-position is-${position <= 3 ? "podium" : "regular"}`}>{medal(position)}</span>
                      <span className={`ranking-avatar ${entry.avatarUrl ? "has-photo" : ""}`}>
                        {entry.avatarUrl ? <img src={entry.avatarUrl} alt={`Foto de ${entry.firstName}`} /> : initials(entry.firstName)}
                      </span>
                      <div><strong>{entry.firstName}</strong><p>{formatDuration(entry.totalDurationSeconds)} registrados</p></div>
                      <b>{entry.points}<i>pts</i></b>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </section>

        <BottomNavigation onSelect={handleBottom} />
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
