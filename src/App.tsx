import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthProvider";
import LoadingSplash from "./components/LoadingSplash";
import MobileOnlyRoute from "./components/MobileOnlyRoute";
import StaffWorkoutAlerts from "./components/StaffWorkoutAlerts";
import Login from "./pages/Login";
import TestMenu from "./pages/TestMenu";
import Pending from "./pages/Pending";
import CompleteProfile from "./pages/CompleteProfile";
import Treino from "./pages/Treino";
import Cardio from "./pages/Cardio";
import AdminArea from "./pages/AdminArea";
import AdminWorkoutBuilder from "./pages/AdminWorkoutBuilder";

export default function App() {
  const { loading, landingPath } = useAuth();
  if (loading) return <LoadingSplash />;

  return (
    <>
      <StaffWorkoutAlerts />
      <Routes>
      <Route path="/" element={<Navigate to={landingPath} replace />} />
      <Route path="/login" element={<Login />} />
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
      <Route path="/area-accqua" element={<AdminArea />} />
      <Route
        path="/area-accqua/montar"
        element={<AdminWorkoutBuilder />}
      />
      <Route path="/aguardando" element={<Pending />} />
      <Route path="/completar-cadastro" element={<CompleteProfile />} />
        <Route path="*" element={<Navigate to={landingPath} replace />} />
      </Routes>
    </>
  );
}
