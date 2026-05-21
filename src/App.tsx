import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import Login from "./pages/Login";

import Onboarding from "./pages/Onboarding";

import Dashboard from "./pages/Dashboard";

import Treino from "./pages/Treino.jsx";

import TreinoDetalhe from "./pages/TreinoDetalhe.jsx";

import TreinoCompartilhado from "./pages/TreinoCompartilhado";

import FitdealTeaching from "./pages/fitdeal.teaching";

import MontagemTreino from "./pages/MontagemTreino";

import Cardio, { CardioMiniDock } from "./pages/Cardio.jsx";

import Nutricao from "./pages/Nutricao";

import NutricaoOpcao from "./pages/NutricaoOpcao";

import NutriPlus from "./pages/NutriPlus.jsx";

import Conta from "./pages/Conta";

import Pagamentos from "./pages/Pagamentos";

import Planos from "./pages/Planos";

import TreinosSalvos from "./pages/TreinosSalvos";

import TreinoPersonalize from "./pages/TreinoPersonalize.jsx";

import Metas from "./pages/Metas.jsx";

import Suplementacao from "./pages/Suplementacao.jsx";

import Calendario from "./pages/Calendario.jsx";

import ComoFunciona from "./pages/ComoFunciona.jsx";

import Suporte from "./pages/Suporte.jsx";

import Politicas from "./pages/Politicas.jsx";

import BottomMenu from "./components/BottomMenu";

import ProtectedRoute from "./components/ProtectedRoute";

import { AuthProvider, useAuth } from "./context/AuthContext";

import AuthCallback from "./pages/AuthCallback";

const ORANGE = "#FF6A00";

const BG = "#f8fafc";

const TEXT = "#0f172a";

function AppBootSplash() {

  return (

    <div

      style={{

        minHeight: "100vh",

        width: "100%",

        background: BG,

        display: "flex",

        alignItems: "center",

        justifyContent: "center",

        overflow: "hidden",

      }}

    >

      <div

        style={{

          textAlign: "center",

          animation: "fitdealBootIn .28s ease both",

        }}

      >

        <div

          style={{

            fontSize: 38,

            fontWeight: 950,

            letterSpacing: -1,

            color: TEXT,

            lineHeight: 1,

          }}

        >

          fitdeal<span style={{ color: ORANGE }}>.</span>

        </div>

        <div

          style={{

            margin: "18px auto 0",

            width: 72,

            height: 6,

            borderRadius: 999,

            background: "rgba(15,23,42,.08)",

            overflow: "hidden",

          }}

        >

          <div

            style={{

              width: "45%",

              height: "100%",

              borderRadius: 999,

              background: "linear-gradient(90deg, #FF6A00, #FFB26B)",

              animation: "fitdealBootBar .9s ease-in-out infinite",

            }}

          />

        </div>

      </div>

    </div>

  );

}

function PublicHomeRoute() {

  const { user, loading } = useAuth();

  if (loading) return <AppBootSplash />;

  if (user) {

    return <Navigate to="/dashboard" replace />;

  }

  return <Login />;

}

function BottomMenuGate() {

  const { user, loading } = useAuth();

  const { pathname } = useLocation();

  if (loading) return null;

  if (!user) return null;

  if (pathname === "/") return null;

  if (pathname.startsWith("/login")) return null;

  if (pathname.startsWith("/auth/callback")) return null;

  if (pathname.startsWith("/onboarding")) return null;

  if (pathname.startsWith("/treino/detalhe")) return null;

  if (pathname.startsWith("/comofunciona")) return null;

  if (pathname.startsWith("/suporte")) return null;

  if (pathname.startsWith("/politicas")) return null;

  return <BottomMenu />;

}

function CardioDockGate() {

  const { user, loading } = useAuth();

  const { pathname } = useLocation();

  if (loading) return null;

  if (!user) return null;

  if (pathname === "/") return null;

  if (pathname.startsWith("/login")) return null;

  if (pathname.startsWith("/auth/callback")) return null;

  if (pathname.startsWith("/onboarding")) return null;

  if (pathname.startsWith("/comofunciona")) return null;

  if (pathname.startsWith("/suporte")) return null;

  if (pathname.startsWith("/politicas")) return null;

  return <CardioMiniDock />;

}

function AppStyleBoot() {

  return (

    <style>

      {`

        @keyframes fitdealBootIn {

          from {

            opacity: 0;

            transform: translateY(8px) scale(.985);

          }

          to {

            opacity: 1;

            transform: translateY(0) scale(1);

          }

        }

        @keyframes fitdealBootBar {

          0% {

            transform: translateX(-120%);

          }

          50% {

            transform: translateX(70%);

          }

          100% {

            transform: translateX(240%);

          }

        }

      `}

    </style>

  );

}

function AppRoutes() {

  const { user } = useAuth();

  return (

    <BrowserRouter>

      <AppStyleBoot />

      <Routes>

        <Route path="/" element={<PublicHomeRoute />} />

        <Route path="/fitdeal-teaching" element={<FitdealTeaching />} />

        <Route path="/auth/callback" element={<AuthCallback />} />

        <Route path="/comofunciona" element={<ComoFunciona />} />

        <Route path="/suporte" element={<Suporte />} />

        <Route path="/politicas" element={<Politicas />} />

        <Route path="/planos" element={<Planos />} />

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

          path="/treinos-salvos"

          element={

            <ProtectedRoute>

              <TreinosSalvos />

            </ProtectedRoute>

          }

        />

        <Route path="/treino/compartilhado" element={<TreinoCompartilhado />} />

        <Route

          path="/treino"

          element={

            <ProtectedRoute>

              <Treino />

            </ProtectedRoute>

          }

        />

        <Route

          path="/montagem-treino"

          element={

            <ProtectedRoute>

              <MontagemTreino />

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

        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />

      </Routes>

      <BottomMenuGate />

      <CardioDockGate />

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
