import { AccquaBrand } from "./AccquaBrand";

export default function LoadingScreen({ text = "Carregando sua experiência" }: { text?: string }) {
  return (
    <div className="loading-page">
      <div className="loading-halo" />
      <AccquaBrand />
      <div className="loading-bar"><span /></div>
      <p>{text}</p>
    </div>
  );
}
