import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import LoadingScreen from "./components/LoadingScreen";
import { useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Treino from "./pages/Treino";
import Cardio from "./pages/Cardio";
import Dieta from "./pages/Dieta";
import DietaSemanal from "./pages/DietaSemanal";
import DietaMensal from "./pages/DietaMensal";
import DietaGuia from "./pages/DietaGuia";
import Macronutrientes from "./pages/Macronutrientes";
import Alimentos from "./pages/Alimentos";
import Fibras from "./pages/Fibras";
import Hidratacao from "./pages/Hidratacao";
import Equilibrio from "./pages/Equilibrio";
import Receita from "./pages/Receita";
import Ranking from "./pages/Ranking";
import Personal from "./pages/Personal";
import PersonalDetalhe from "./pages/PersonalDetalhe";
import Loja from "./pages/Loja";
import LojaInfo from "./pages/LojaInfo";
import Aulas from "./pages/Aulas";
import Conta from "./pages/Conta";
import DadosPessoais from "./pages/DadosPessoais";
import Notificacoes from "./pages/Notificacoes";
import Seguranca from "./pages/Seguranca";
import Configuracoes from "./pages/Configuracoes";
import VerPerfil from "./pages/VerPerfil";
import Equipe from "./pages/Equipe";

export default function App() {
  const { loading } = useAuth();
  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/treino" element={<ProtectedRoute><Treino /></ProtectedRoute>} />
      <Route path="/cardio" element={<ProtectedRoute><Cardio /></ProtectedRoute>} />
      <Route path="/dieta" element={<ProtectedRoute><Dieta /></ProtectedRoute>} />
      <Route path="/dieta/semanal" element={<ProtectedRoute><DietaSemanal /></ProtectedRoute>} />
      <Route path="/dieta/mensal" element={<ProtectedRoute><DietaMensal /></ProtectedRoute>} />
      <Route path="/dieta/guia" element={<ProtectedRoute><DietaGuia /></ProtectedRoute>} />
      <Route path="/dieta/macros" element={<ProtectedRoute><Macronutrientes /></ProtectedRoute>} />
      <Route path="/dieta/alimentos" element={<ProtectedRoute><Alimentos /></ProtectedRoute>} />
      <Route path="/dieta/fibras" element={<ProtectedRoute><Fibras /></ProtectedRoute>} />
      <Route path="/dieta/hidratacao" element={<ProtectedRoute><Hidratacao /></ProtectedRoute>} />
      <Route path="/dieta/equilibrio" element={<ProtectedRoute><Equilibrio /></ProtectedRoute>} />
      <Route path="/dieta/receita/:id" element={<ProtectedRoute><Receita /></ProtectedRoute>} />
      <Route path="/ranking" element={<ProtectedRoute><Ranking /></ProtectedRoute>} />
      <Route path="/personal" element={<ProtectedRoute><Personal /></ProtectedRoute>} />
      <Route path="/personal/:id" element={<ProtectedRoute><PersonalDetalhe /></ProtectedRoute>} />
      <Route path="/loja" element={<ProtectedRoute><Loja /></ProtectedRoute>} />
      <Route path="/loja/info" element={<ProtectedRoute><LojaInfo /></ProtectedRoute>} />
      <Route path="/aulas" element={<ProtectedRoute><Aulas /></ProtectedRoute>} />
      <Route path="/conta" element={<ProtectedRoute><Conta /></ProtectedRoute>} />
      <Route path="/conta/dados" element={<ProtectedRoute><DadosPessoais /></ProtectedRoute>} />
      <Route path="/conta/notificacoes" element={<ProtectedRoute><Notificacoes /></ProtectedRoute>} />
      <Route path="/conta/seguranca" element={<ProtectedRoute><Seguranca /></ProtectedRoute>} />
      <Route path="/conta/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
      <Route path="/conta/ver-perfil" element={<ProtectedRoute><VerPerfil /></ProtectedRoute>} />
      <Route path="/equipe" element={<ProtectedRoute teamOnly><Equipe /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
