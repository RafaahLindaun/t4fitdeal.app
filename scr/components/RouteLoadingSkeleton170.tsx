import { useLocation } from "react-router-dom";

function CardGrid({ compact = false }: { compact?: boolean }) {
  return <>
    <i className={`skeleton-card ${compact ? "is-short" : ""}`} />
    <div className="skeleton-grid"><i/><i/></div>
  </>;
}

export default function RouteLoadingSkeleton170({ embedded = false }: { embedded?: boolean }) {
  const { pathname } = useLocation();
  const staff = pathname.startsWith("/area-accqua");
  const workout = pathname.startsWith("/treino");
  const cardio = pathname.startsWith("/cardio");
  const diet = pathname.startsWith("/minha-dieta") || pathname.startsWith("/dieta");
  const ranking = pathname.startsWith("/ranking");

  return (
    <div className={`accqua-route-skeleton-170 ${staff ? "is-staff" : ""} ${embedded ? "is-embedded" : ""}`} role="status" aria-label="Carregando página">
      <div className="skeleton-head">
        <span className="skeleton-logo" />
        <div className="skeleton-actions"><i/><i/></div>
      </div>
      <span className="skeleton-title" />
      {workout ? <><i className="skeleton-card"/><i className="skeleton-card"/></> : null}
      {cardio ? <><i className="skeleton-card"/><CardGrid compact/></> : null}
      {diet ? <><CardGrid/><i className="skeleton-card is-short"/></> : null}
      {ranking ? <><i className="skeleton-card is-short"/><div className="skeleton-grid"><i/><i/></div><i className="skeleton-card"/></> : null}
      {!workout && !cardio && !diet && !ranking ? <CardGrid compact={staff}/> : null}
      <span className="accqua-sr-only">Carregando conteúdo...</span>
    </div>
  );
}
