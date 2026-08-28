import { Navigate, Route, Routes } from "react-router-dom";
import { LayoutGroup } from "framer-motion";
import { useAuth } from "./auth/AuthProvider";
import LoadingSplash from "./components/LoadingSplash";
import StaffWorkoutAlerts from "./components/StaffWorkoutAlerts";
import EngagementNotifications from "./components/EngagementNotifications";
import AccquaToaster from "./components/AccquaToaster";
import { SyncQueueProvider } from "./hooks/useSyncQueue";
import Login from "./pages/Login";
import TestMenu from "./pages/TestMenu";
import Pending from "./pages/Pending";
import Treino from "./pages/Treino";
import Cardio from "./pages/Cardio";
import AdminArea from "./pages/AdminArea";
import AdminWorkoutBuilder from "./pages/AdminWorkoutBuilder";
import Profile from "./pages/Profile";
import PasswordRecovery from "./pages/PasswordRecovery";
import ResetPassword from "./pages/ResetPassword";
import AuthCallback from "./pages/AuthCallback";
import Ranking from "./pages/Ranking";
import Diet from "./pages/Diet";
import MainLayout from "./components/MainLayout";
import StaffLayout from "./components/StaffLayout";
import Store from "./pages/Store";
import StoreAdmin from "./pages/StoreAdmin";
import Aulas from "./pages/Aulas";
import ClassesAdmin from "./pages/ClassesAdmin";

export default function App() {
  const { loading, landingPath } = useAuth();
  if (loading) return <LoadingSplash />;

  return (
    <SyncQueueProvider>
      <>
        <StaffWorkoutAlerts />
        <EngagementNotifications />
        <AccquaToaster />
        <LayoutGroup id="accqua-workout-shared-layout">
          <Routes>
            <Route path="/" element={<Navigate to={landingPath} replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/recuperar-senha" element={<PasswordRecovery />} />
            <Route path="/redefinir-senha" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route element={<MainLayout />}>
              <Route path="/menu-teste" element={<TestMenu />} />
              <Route path="/treino" element={<Treino />} />
              <Route path="/cardio" element={<Cardio />} />
              <Route path="/minha-dieta" element={<Diet />} />
              <Route path="/dieta" element={<Navigate to="/minha-dieta" replace />} />
              <Route path="/perfil" element={<Profile />} />
              <Route path="/ranking" element={<Ranking />} />
              <Route path="/loja" element={<Store />} />
              <Route path="/aulas" element={<Aulas />} />
              <Route path="/area-accqua" element={<StaffLayout />}>
                <Route index element={<AdminArea />} />
                <Route path="loja" element={<StoreAdmin />} />
                <Route path="aulas" element={<ClassesAdmin />} />
                <Route path="alunos" element={<Navigate to="/area-accqua" replace />} />
                <Route path="montar" element={<AdminWorkoutBuilder />} />
              </Route>
            </Route>
            <Route path="/aguardando" element={<Pending />} />
            <Route path="/completar-cadastro" element={<Navigate to={landingPath} replace />} />
            <Route path="*" element={<Navigate to={landingPath} replace />} />
          </Routes>
        </LayoutGroup>
      </>
    </SyncQueueProvider>
  );
}
