// ✅ COLE EM: src/App.tsx
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Treino from "./pages/Treino.jsx";
import TreinoDetalhe from "./pages/TreinoDetalhe.jsx";
import Cardio from "./pages/Cardio.jsx";
import Nutricao from "./pages/Nutricao";
import NutricaoOpcao from "./pages/NutricaoOpcao";
import NutriPlus from "./pages/NutriPlus.jsx";
import Conta from "./pages/Conta";
import Pagamentos from "./pages/Pagamentos";
import Planos from "./pages/Planos";
import TreinoPersonalize from "./pages/TreinoPersonalize.jsx";
import Metas from "./pages/Metas.jsx";
import Suplementacao from "./pages/Suplementacao.jsx";
import Calendario from "./pages/Calendario.jsx";
import ComoFunciona from "./pages/ComoFunciona.jsx";

import BottomMenu from "./components/BottomMenu";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider, useAuth } from "./context/AuthContext";

// ✅ Só pra controlar onde o BottomMenu aparece (sem mexer no BottomMenu.jsx)
function BottomMenuGate() {
  const { user, ready } = useAuth();
  const { pathname } = useLocation();

  if (!ready) return null;
  if (!user) return null;

  if (pathname.startsWith("/onboarding")) return null;

  return <BottomMenu />;
}

function AppRoutes() {
  const { user, ready } = useAuth();

  if (!ready) return null;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/treino"
          element={
            <ProtectedRoute>
              <Treino />
            </ProtectedRoute>
          }
        />

        <Route
          path="/treino/detalhe"
          element={
            <ProtectedRoute>
              <TreinoDetalhe />
            </ProtectedRoute>
          }
        />

        <Route
          path="/treino/personalizar"
          element={
            <ProtectedRoute>
              <TreinoPersonalize />
            </ProtectedRoute>
          }
        />

        <Route
          path="/metas"
          element={
            <ProtectedRoute>
              <Metas />
            </ProtectedRoute>
          }
        />

        <Route
          path="/calendario"
          element={
            <ProtectedRoute>
              <Calendario />
            </ProtectedRoute>
          }
        />

        <Route
          path="/suplementacao"
          element={
            <ProtectedRoute>
              <Suplementacao />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cardio"
          element={
            <ProtectedRoute>
              <Cardio />
            </ProtectedRoute>
          }
        />

        <Route
          path="/nutricao"
          element={
            <ProtectedRoute>
              <Nutricao />
            </ProtectedRoute>
          }
        />

        <Route
          path="/nutricaoopcao"
          element={
            <ProtectedRoute>
              <NutricaoOpcao />
            </ProtectedRoute>
          }
        />

        <Route
          path="/comofunciona"
          element={
            <ProtectedRoute>
              <ComoFunciona />
            </ProtectedRoute>
          }
        />

        <Route
          path="/nutriplus"
          element={
            <ProtectedRoute>
              <NutriPlus />
            </ProtectedRoute>
          }
        />

        <Route
          path="/conta"
          element={
            <ProtectedRoute>
              <Conta />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pagamentos"
          element={
            <ProtectedRoute>
              <Pagamentos />
            </ProtectedRoute>
          }
        />

        <Route
          path="/planos"
          element={
            <ProtectedRoute>
              <Planos />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
      </Routes>

      <BottomMenuGate />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
