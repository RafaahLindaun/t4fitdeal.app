export function AccquaBrand({ className = "" }: { className?: string }) {
  return (
    <img
      className={`accqua-brand-image ${className}`.trim()}
      src="/accqua-logo-official.png"
      alt="Accqua Sports Academia"
      draggable={false}
    />
  );
}
