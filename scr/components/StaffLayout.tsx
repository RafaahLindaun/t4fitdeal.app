import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import Build158MotionBridge from "./Build158MotionBridge";
import OwnerStaffManager from "./OwnerStaffManager";
import { getStaffNavItems, staffNavKeyForLocation, type StaffNavKey } from "../lib/staffNavigation";
import { staffButtonVariants, staffMotionTransition } from "../lib/staffMotion";
import "./staff-layout.css";
import "./staff-layout-v1484.css";

const STAFF_ROLES = ["professor", "reception", "admin"] as const;
const OWNER_EMAIL = "rafaalexandrowitch@professor.com";

function SidebarToggleIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true" focusable="false" className={collapsed ? "is-collapsed" : ""}>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M9 4v16" />
    </svg>
  );
}

function OwnerMenuIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <circle cx="12" cy="5" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <circle cx="12" cy="19" r="1.6" fill="currentColor" />
    </svg>
  );
}

export default function StaffLayout() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const items = getStaffNavItems();
  const active = staffNavKeyForLocation(location.pathname, location.search);
  const mobileItemRefs = useRef<Partial<Record<StaffNavKey, HTMLButtonElement | null>>>({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [ownerManagerOpen, setOwnerManagerOpen] = useState(false);
  const isStaff = Boolean(
    profile && STAFF_ROLES.includes(profile.role as (typeof STAFF_ROLES)[number]),
  );
  const isOwner = Boolean(user?.email && user.email.trim().toLowerCase() === OWNER_EMAIL);
  const isBuilder = location.pathname.startsWith("/area-accqua/montar");
  const role = profile?.role === "admin"
    ? "ADMINISTRAÇÃO"
    : profile?.role === "reception"
      ? "RECEPÇÃO"
      : profile?.role === "professor"
        ? "PROFESSOR"
        : "EQUIPE";

  useEffect(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) return;
    const activeTab = mobileItemRefs.current[active];
    if (!activeTab) return;
    window.requestAnimationFrame(() => {
      activeTab.scrollIntoView({ inline: "center", block: "nearest", behavior: "auto" });
    });
  }, [active]);

  useEffect(() => {
    if (!window.matchMedia("(min-width: 1024px)").matches) return;
    if (isBuilder) setSidebarCollapsed(true);
  }, [isBuilder]);

  if (!user) return <Navigate to="/login" replace />;
  if (!profile || profile.status !== "active") return <Navigate to="/aguardando" replace />;
  if (!isStaff) return <Navigate to="/menu-teste" replace />;

  return (
    <div
      className={`accqua-staff-layout uses-unified-mobile-scroll ${isBuilder ? "uses-builder-internal-scroll" : ""} ${sidebarCollapsed ? "is-sidebar-collapsed" : ""}`}
    >
      <aside
        className={`accqua-staff-sidebar ${sidebarCollapsed ? "is-collapsed" : ""}`}
        aria-label="Navegação da Área ACCQUA"
        data-testid="staff-sidebar"
      >
        <button
          type="button"
          className="accqua-staff-sidebar-toggle"
          onClick={() => setSidebarCollapsed((current) => !current)}
          aria-label={sidebarCollapsed ? "Mostrar barra lateral" : "Ocultar barra lateral"}
          aria-expanded={!sidebarCollapsed}
          title={sidebarCollapsed ? "Mostrar barra lateral" : "Ocultar barra lateral"}
        >
          <span className="accqua-staff-sidebar-toggle-icon">
            <SidebarToggleIcon collapsed={sidebarCollapsed} />
          </span>
          <strong>{sidebarCollapsed ? "Mostrar barra" : "Ocultar barra lateral"}</strong>
        </button>

        <div className="accqua-staff-sidebar-heading">
          <small>ÁREA ACCQUA</small>
          <strong>Gestão da equipe</strong>
          <span>{isOwner ? `${role} · DONO` : role}</span>
          {isOwner && !sidebarCollapsed ? (
            <button
              type="button"
              className="accqua-owner-staff-menu-button"
              onClick={() => setOwnerManagerOpen(true)}
              aria-label="Gerenciar acessos da equipe"
              title="Gerenciar equipe"
            >
              <OwnerMenuIcon />
            </button>
          ) : null}
        </div>
        <nav>
          {items.map((item) => (
            <motion.button
              key={item.key}
              type="button"
              className={active === item.key ? "is-active" : ""}
              aria-current={active === item.key ? "page" : undefined}
              aria-label={sidebarCollapsed ? item.label : undefined}
              title={sidebarCollapsed ? item.label : undefined}
              onClick={() => navigate(item.href)}
              initial="idle"
              animate="idle"
              whileHover="hover"
              whileTap="tap"
              variants={staffButtonVariants}
              transition={staffMotionTransition}
            >
              <span>{item.icon}</span>
              <strong>{item.label}</strong>
            </motion.button>
          ))}
        </nav>
        <div className="accqua-staff-sidebar-account" aria-hidden={sidebarCollapsed ? "true" : undefined}>
          <small>{isOwner ? "DONO" : role}</small>
          <strong>{profile.fullName || user.email || "Equipe ACCQUA"}</strong>
          <span>{isOwner ? "Controle de acessos Staff" : "Gestão operacional"}</span>
        </div>
      </aside>

      <nav className="accqua-staff-mobile-nav" data-tab-swipe-ignore aria-label="Seções da Área ACCQUA" data-testid="staff-mobile-nav">
        {items.map((item) => (
          <motion.button
            ref={(node) => { mobileItemRefs.current[item.key] = node; }}
            key={item.key}
            type="button"
            className={active === item.key ? "is-active" : ""}
            aria-current={active === item.key ? "page" : undefined}
            onClick={() => navigate(item.href)}
            initial="idle"
            animate="idle"
            whileTap="tap"
            variants={staffButtonVariants}
            transition={staffMotionTransition}
          >
            {item.icon}
            <span>{item.label}</span>
          </motion.button>
        ))}
        {isOwner ? (
          <motion.button
            type="button"
            className="accqua-owner-staff-mobile-button"
            onClick={() => setOwnerManagerOpen(true)}
            aria-label="Gerenciar acessos da equipe"
            initial="idle"
            animate="idle"
            whileTap="tap"
            variants={staffButtonVariants}
            transition={staffMotionTransition}
          >
            <OwnerMenuIcon />
            <span>Equipe</span>
          </motion.button>
        ) : null}
      </nav>

      <section className="accqua-staff-content" aria-live="polite">
        <div className="accqua-staff-route" key={location.pathname} data-staff-route={location.pathname}>
          <Outlet />
          {isBuilder ? <Build158MotionBridge /> : null}
        </div>
      </section>

      {isOwner ? (
        <OwnerStaffManager open={ownerManagerOpen} onOpenChange={setOwnerManagerOpen} />
      ) : null}
    </div>
  );
}
