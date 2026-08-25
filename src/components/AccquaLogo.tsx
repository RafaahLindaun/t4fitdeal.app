export default function AccquaLogo({
  animated = false,
  compact = false,
  imageSrc = "/accqua-logo-oficial.png",
}: {
  animated?: boolean;
  compact?: boolean;
  imageSrc?: string;
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
        src={imageSrc}
        alt="Accqua Sports Academia"
        draggable={false}
      />
      <span className="accqua-logo-line bottom" />
    </div>
  );
}
