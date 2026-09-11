import { useNavigate } from "react-router-dom";
import AccquaLogo from "./AccquaLogo";

export default function StaffSubPageHeader({
  title,
  subtitle,
  eyebrow = "ÁREA ACCQUA",
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
}) {
  const navigate = useNavigate();
  return (
    <header className="staff-subpage-header">
      <button
        type="button"
        className="staff-subpage-back"
        onClick={() => navigate(-1)}
        aria-label="Voltar"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
      </button>
      <div className="staff-subpage-logo"><AccquaLogo compact /></div>
      <div className="staff-subpage-heading">
        <small>{eyebrow}</small>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
    </header>
  );
}
