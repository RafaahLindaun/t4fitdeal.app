import AccquaLogo from "./AccquaLogo";

export default function LoadingSplash() {
  return (
    <div className="splash-screen" role="status" aria-live="polite">
      <div className="splash-glow" />
      <AccquaLogo animated />
      <span className="splash-label">Preparando seu app</span>
    </div>
  );
}
