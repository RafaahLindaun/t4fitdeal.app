import AccquaLogo from "./AccquaLogo";

export default function LoadingSplash() {
  return (
    <div className="splash-screen" role="status" aria-live="polite">
      <div className="splash-glow" />
      <AccquaLogo animated imageSrc="/accqua-logo-loading-oficial.png" />
    </div>
  );
}
