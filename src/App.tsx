import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthProvider";
import LoadingSplash from "./components/LoadingSplash";
import MobileOnlyRoute from "./components/MobileOnlyRoute";
import StaffWorkoutAlerts from "./components/StaffWorkoutAlerts";
import EngagementNotifications from "./components/EngagementNotifications";
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

export default function App() {
  const { loading, landingPath } = useAuth();
  if (loading) return <LoadingSplash />;

  return (
    <>
      <StaffWorkoutAlerts />
      <EngagementNotifications />
      <Routes>
      <Route path="/" element={<Navigate to={landingPath} replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/recuperar-senha" element={<PasswordRecovery />} />
      <Route path="/redefinir-senha" element={<ResetPassword />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/menu-teste" element={<TestMenu />} />
      <Route
        path="/treino"
        element={
          <MobileOnlyRoute>
            <Treino />
          </MobileOnlyRoute>
        }
      />
      <Route
        path="/cardio"
        element={
          <MobileOnlyRoute>
            <Cardio />
          </MobileOnlyRoute>
        }
      />
      <Route path="/perfil" element={<Profile />} />
      <Route path="/area-accqua" element={<AdminArea />} />
      <Route
        path="/area-accqua/montar"
        element={<AdminWorkoutBuilder />}
      />
      <Route path="/aguardando" element={<Pending />} />
      <Route path="/completar-cadastro" element={<Navigate to={landingPath} replace />} />
        <Route path="*" element={<Navigate to={landingPath} replace />} />
      </Routes>
    </>
  );
}
