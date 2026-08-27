import { useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import BottomNavigation from "./BottomNavigation";
import { useAuth } from "../auth/AuthProvider";
import { loadActiveWorkoutCardioPrescription } from "../lib/cardio";
import { BottomNavTreinoTargetProvider } from "./BottomNavTargetContext";
import "./main-layout.css";

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const activeSession = location.pathname.startsWith("/treino") || location.pathname.startsWith("/cardio");
  const treinoTargetRef = useRef<HTMLSpanElement>(null);

  const onSelect = async (label: string) => {
    if (label === "Início") return navigate("/menu-teste");
    if (label === "Perfil") return navigate("/perfil");
    if (label === "Staff") return navigate("/area-accqua");
    if (label === "Aulas") return navigate("/aulas");
    if (label === "Treino") {
      if (!user?.id) return navigate("/treino");
      const cardio = await loadActiveWorkoutCardioPrescription(user.id).catch(() => null);
      navigate(cardio?.timing === "before" ? "/cardio" : "/treino");
    }
  };

  return (
    <BottomNavTreinoTargetProvider value={treinoTargetRef}>
      <div className="accqua-main-layout">
        <div className="accqua-main-layout-content"><Outlet /></div>
        {!activeSession ? (
          <div className="accqua-main-layout-nav"><BottomNavigation onSelect={(label) => void onSelect(label)} /></div>
        ) : null}
      </div>
    </BottomNavTreinoTargetProvider>
  );
}
