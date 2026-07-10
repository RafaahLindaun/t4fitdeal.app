import "./loading-screen.css";

export default function LoadingScreen({ text = "Carregando sua experiência" }: { text?: string }) {
  return (
    <div className="accqua-loading" role="status" aria-live="polite">
      <div className="accqua-loading__center">
        <span className="accqua-loading__line accqua-loading__line--top" />
        <img
          className="accqua-loading__logo"
          src="/accqua-logo-text.png"
          alt="Accqua Sports Academia"
          draggable={false}
        />
        <span className="accqua-loading__line accqua-loading__line--bottom" />
      </div>
      <p className="accqua-loading__text">{text}</p>
    </div>
  );
}
