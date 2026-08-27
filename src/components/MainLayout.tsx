import { useMemo, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import BottomNavigation from "./BottomNavigation";
import PrimarySidebar from "./PrimarySidebar";
import { useAuth } from "../auth/AuthProvider";
import { loadActiveWorkoutCardioPrescription } from "../lib/cardio";
import { activeNavKeyForPath, getNavItems, type PrimaryNavItem } from "../lib/navigation";
import { BottomNavTreinoTargetProvider } from "./BottomNavTargetContext";
import "./main-layout.css";

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const treinoTargetRef = useRef<HTMLSpanElement>(null);
  const items = useMemo(() => getNavItems(profile?.role), [profile?.role]);
  const activeKey = useMemo(() => activeNavKeyForPath(location.pathname), [location.pathname]);

  const onSelect = async (item: PrimaryNavItem) => {
    if (item.key !== "treino") {
      navigate(item.href);
      return;
    }
    if (!user?.id) {
      navigate(item.href);
      return;
    }
    const cardio = await loadActiveWorkoutCardioPrescription(user.id).catch(() => null);
    navigate(cardio?.timing === "before" ? "/cardio" : "/treino");
  };

  return (
    <BottomNavTreinoTargetProvider value={treinoTargetRef}>
      <div className="accqua-main-layout">
        <div className="accqua-main-layout-sidebar">
          <PrimarySidebar items={items} activeKey={activeKey} onSelect={(item) => void onSelect(item)} />
        </div>
        <main className="accqua-main-layout-content"><Outlet /></main>
        <div className="accqua-main-layout-nav">
          <BottomNavigation items={items} activeKey={activeKey} onSelect={(item) => void onSelect(item)} />
        </div>
      </div>
    </BottomNavTreinoTargetProvider>
  );
}
