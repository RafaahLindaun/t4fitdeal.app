import { NavLink } from "react-router-dom";
import { Icon } from "./Icons";
import { useAuth } from "../contexts/AuthContext";

export default function BottomNav() {
  const { isTeam } = useAuth();
  const items = [
    ["/home", "Início", "home"],
    ["/treino", "Treino", "training"],
    ["/cardio", "Cardio", "cardio"],
    ["/dieta", "Dieta", "diet"],
    ["/conta", "Conta", "account"],
  ] as const;

  return (
    <nav className="bottom-nav">
      {items.map(([to, label, icon]) => (
        <NavLink key={to} to={to} className={({ isActive }) => `bottom-link ${isActive ? "active" : ""}`}>
          <Icon name={icon} size={18} />
          <span>{label}</span>
        </NavLink>
      ))}
      {isTeam ? (
        <NavLink to="/equipe" className={({ isActive }) => `bottom-link ${isActive ? "active" : ""}`}>
          <Icon name="team" size={18} />
          <span>Equipe</span>
        </NavLink>
      ) : null}
    </nav>
  );
}
