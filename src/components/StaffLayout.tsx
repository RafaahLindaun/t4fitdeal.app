import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { getStaffNavItems, staffNavKeyForLocation } from "../lib/staffNavigation";
import "./staff-layout.css";

export default function StaffLayout() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const items = getStaffNavItems();
  const active = staffNavKeyForLocation(location.pathname, location.search);
  const role = profile?.role === "admin"
    ? "ADMINISTRAÇÃO"
    : profile?.role === "reception"
      ? "RECEPÇÃO"
      : "PROFESSOR";

  return (
    <div className="accqua-staff-layout">
      <aside className="accqua-staff-sidebar" aria-label="Navegação da Área ACCQUA" data-testid="staff-sidebar">
        <div className="accqua-staff-sidebar-heading">
          <small>ÁREA ACCQUA</small>
          <strong>Gestão da equipe</strong>
          <span>{role}</span>
        </div>
        <nav>
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              className={active === item.key ? "is-active" : ""}
              aria-current={active === item.key ? "page" : undefined}
              onClick={() => navigate(item.href)}
            >
              <span>{item.icon}</span>
              <strong>{item.label}</strong>
            </button>
          ))}
        </nav>
        <div className="accqua-staff-sidebar-account">
          <small>{role}</small>
          <strong>{profile?.fullName || user?.email || "Equipe ACCQUA"}</strong>
          <span>Gestão operacional</span>
        </div>
      </aside>

      <nav className="accqua-staff-mobile-nav" aria-label="Seções da Área ACCQUA" data-testid="staff-mobile-nav">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            className={active === item.key ? "is-active" : ""}
            aria-current={active === item.key ? "page" : undefined}
            onClick={() => navigate(item.href)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <section className="accqua-staff-content" aria-live="polite">
        <div className="accqua-staff-route" key={location.pathname} data-staff-route={location.pathname}>
          <Outlet />
        </div>
      </section>
    </div>
  );
}
