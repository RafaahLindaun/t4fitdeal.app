import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { LayoutGroup } from "framer-motion";
import { useAuth } from "./auth/AuthProvider";
import LoadingSplash from "./components/LoadingSplash";
import StaffWorkoutAlerts from "./components/StaffWorkoutAlerts";
import EngagementNotifications from "./components/EngagementNotifications";
import AccquaToaster from "./components/AccquaToaster";
import { SyncQueueProvider } from "./hooks/useSyncQueue";
import MainLayout from "./components/MainLayout";
import StaffLayout from "./components/StaffLayout";

const Login = lazy(() => import("./pages/Login"));
const TestMenu = lazy(() => import("./pages/TestMenu"));
const Pending = lazy(() => import("./pages/Pending"));
const Treino = lazy(() => import("./pages/Treino"));
const Cardio = lazy(() => import("./pages/Cardio"));
const AdminArea = lazy(() => import("./pages/AdminArea"));
const AdminWorkoutBuilder = lazy(() => import("./pages/AdminWorkoutBuilder"));
const Profile = lazy(() => import("./pages/Profile"));
const PasswordRecovery = lazy(() => import("./pages/PasswordRecovery"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Ranking = lazy(() => import("./pages/Ranking"));
const Diet = lazy(() => import("./pages/Diet"));
const Store = lazy(() => import("./pages/Store"));
const StoreAdmin = lazy(() => import("./pages/StoreAdmin"));
const Aulas = lazy(() => import("./pages/Aulas"));
const ClassesAdmin = lazy(() => import("./pages/ClassesAdmin"));
const NotFound = lazy(() => import("./pages/NotFound"));

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
          <Suspense fallback={<LoadingSplash />}>
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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </LayoutGroup>
      </>
    </SyncQueueProvider>
  );
}
