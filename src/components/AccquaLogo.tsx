export default function AccquaLogo({ animated = false }: { animated?: boolean }) {
  return (
    <div className={`accqua-logo ${animated ? "is-animated" : ""}`} aria-label="Accqua Sports Academia">
      <span className="accqua-logo-line top" />
      <img src="/accqua-logo-text.png" alt="Accqua Sports Academia" />
      <span className="accqua-logo-line bottom" />
    </div>
  );
}
