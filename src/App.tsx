import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthProvider";
import LoadingSplash from "./components/LoadingSplash";
import Login from "./pages/Login";
import TestMenu from "./pages/TestMenu";
import Pending from "./pages/Pending";
import CompleteProfile from "./pages/CompleteProfile";
import Treino from "./pages/Treino";
import Cardio from "./pages/Cardio";
import WorkoutBuilder from "./pages/WorkoutBuilder";
import AccessAuthorization from "./pages/AccessAuthorization";

export default function App() {
  const { loading, landingPath } = useAuth();
  if (loading) return <LoadingSplash />;

  return (
    <Routes>
      <Route path="/" element={<Navigate to={landingPath} replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/menu-teste" element={<TestMenu />} />
      <Route path="/treino" element={<Treino />} />
      <Route path="/cardio" element={<Cardio />} />
      <Route path="/montar-treino" element={<WorkoutBuilder />} />
      <Route path="/autorizar-acesso" element={<AccessAuthorization />} />
      <Route path="/aguardando" element={<Pending />} />
      <Route path="/completar-cadastro" element={<CompleteProfile />} />
      <Route path="*" element={<Navigate to={landingPath} replace />} />
    </Routes>
  );
}
