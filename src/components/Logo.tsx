import logo from "../assets/accqua-logo.png";

export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <img
      className={compact ? "brand-logo compact" : "brand-logo"}
      src={logo}
      alt="Accqua Sports Academia"
    />
  );
}
