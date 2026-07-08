import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import LoadingScreen from "./components/LoadingScreen";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CompleteProfile from "./pages/CompleteProfile";
import Pending, { RegistrationSent } from "./pages/Pending";
import Home from "./pages/Home";
import Workout from "./pages/Workout";
import Cardio from "./pages/Cardio";
import Diet from "./pages/Diet";
import Ranking from "./pages/Ranking";
import Personal from "./pages/Personal";
import PersonalDetail from "./pages/PersonalDetail";
import Store from "./pages/Store";
import Classes from "./pages/Classes";
import Account from "./pages/Account";
import PersonalData from "./pages/PersonalData";
import Notifications from "./pages/Notifications";
import Security from "./pages/Security";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import StudentsManager from "./pages/staff/StudentsManager";
import WorkoutsManager from "./pages/staff/WorkoutsManager";
import ExerciseLibraryManager from "./pages/staff/ExerciseLibraryManager";
import DietManager from "./pages/staff/DietManager";
import StoreManager from "./pages/staff/StoreManager";
import ClassesManager from "./pages/staff/ClassesManager";
import PermissionsManager from "./pages/staff/PermissionsManager";

function Protected({ children, staff = false }: { children: React.ReactNode; staff?: boolean }) {
  return <ProtectedRoute staff={staff}>{children}</ProtectedRoute>;
}

function RootRedirect() {
  const { user, profile, loading, needsOnboarding } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (needsOnboarding) return <Navigate to="/completar-cadastro" replace />;
  if (!profile || (profile.role === "student" && profile.status !== "active")) return <Navigate to="/aguardando" replace />;
  return <Navigate to="/home" replace />;
}

export default function App() {
  const { loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/primeiro-acesso" element={<Register />} />
      <Route path="/cadastro-enviado" element={<RegistrationSent />} />
      <Route path="/completar-cadastro" element={<Protected><CompleteProfile /></Protected>} />
      <Route path="/aguardando" element={<Protected><Pending /></Protected>} />
      <Route path="/home" element={<Protected><Home /></Protected>} />
      <Route path="/treino" element={<Protected><Workout /></Protected>} />
      <Route path="/cardio" element={<Protected><Cardio /></Protected>} />
      <Route path="/dieta" element={<Protected><Diet /></Protected>} />
      <Route path="/ranking" element={<Protected><Ranking /></Protected>} />
      <Route path="/personal" element={<Protected><Personal /></Protected>} />
      <Route path="/personal/:id" element={<Protected><PersonalDetail /></Protected>} />
      <Route path="/loja" element={<Protected><Store /></Protected>} />
      <Route path="/aulas" element={<Protected><Classes /></Protected>} />
      <Route path="/conta" element={<Protected><Account /></Protected>} />
      <Route path="/dados-pessoais" element={<Protected><PersonalData /></Protected>} />
      <Route path="/notificacoes" element={<Protected><Notifications /></Protected>} />
      <Route path="/seguranca" element={<Protected><Security /></Protected>} />
      <Route path="/configuracoes" element={<Protected><Settings /></Protected>} />
      <Route path="/perfil" element={<Protected><Profile /></Protected>} />
      <Route path="/equipe" element={<Navigate to="/equipe/alunos" replace />} />
      <Route path="/equipe/alunos" element={<Protected staff><StudentsManager /></Protected>} />
      <Route path="/equipe/treinos" element={<Protected staff><WorkoutsManager /></Protected>} />
      <Route path="/equipe/exercicios" element={<Protected staff><ExerciseLibraryManager /></Protected>} />
      <Route path="/equipe/dieta" element={<Protected staff><DietManager /></Protected>} />
      <Route path="/equipe/loja" element={<Protected staff><StoreManager /></Protected>} />
      <Route path="/equipe/aulas" element={<Protected staff><ClassesManager /></Protected>} />
      <Route path="/equipe/permissoes" element={<Protected staff><PermissionsManager /></Protected>} />
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}
