import { Navigate, Route, Routes } from "react-router-dom";
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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/home" element={<Home />} />
      <Route path="/treino" element={<Treino />} />
      <Route path="/cardio" element={<Cardio />} />
      <Route path="/dieta" element={<Dieta />} />
      <Route path="/dieta/semanal" element={<DietaSemanal />} />
      <Route path="/dieta/mensal" element={<DietaMensal />} />
      <Route path="/dieta/guia" element={<DietaGuia />} />
      <Route path="/dieta/macronutrientes" element={<Macronutrientes />} />
      <Route path="/dieta/alimentos" element={<Alimentos />} />
      <Route path="/dieta/fibras" element={<Fibras />} />
      <Route path="/dieta/hidratacao" element={<Hidratacao />} />
      <Route path="/dieta/equilibrio" element={<Equilibrio />} />
      <Route path="/dieta/receitas/:slug" element={<Receita />} />
      <Route path="/ranking" element={<Ranking />} />
      <Route path="/personal" element={<Personal />} />
      <Route path="/personal/:id" element={<PersonalDetalhe />} />
      <Route path="/loja" element={<Loja />} />
      <Route path="/loja/info" element={<LojaInfo />} />
      <Route path="/aulas" element={<Aulas />} />
      <Route path="/conta" element={<Conta />} />
      <Route path="/conta/dados" element={<DadosPessoais />} />
      <Route path="/conta/notificacoes" element={<Notificacoes />} />
      <Route path="/conta/seguranca" element={<Seguranca />} />
      <Route path="/conta/configuracoes" element={<Configuracoes />} />
      <Route path="/conta/perfil" element={<VerPerfil />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
