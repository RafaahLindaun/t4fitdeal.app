export default function AccquaLogo({
  animated = false,
  compact = false,
}: {
  animated?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={`accqua-logo ${animated ? "is-animated" : ""} ${
        compact ? "is-compact" : ""
      }`}
      aria-label="Accqua Sports Academia"
    >
      <span className="accqua-logo-line top" />
      <img
        src="/accqua-logo-text.png"
        alt="Accqua Sports Academia"
        draggable={false}
      />
      <span className="accqua-logo-line bottom" />
    </div>
  );
}
