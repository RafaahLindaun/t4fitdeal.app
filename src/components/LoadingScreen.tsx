import Logo from "./Logo";

export default function LoadingScreen() {
  return (
    <div className="loading-screen" role="status" aria-label="Carregando">
      <div className="loading-rays" />
      <div className="loading-logo-wrap">
        <span className="loading-line top" />
        <Logo />
        <span className="loading-line bottom" />
      </div>
      <div className="loading-dots"><i/><i/><i/></div>
    </div>
  );
}
