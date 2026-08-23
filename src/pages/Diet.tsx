import { useState, type CSSProperties } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "../auth/AuthProvider";
import LoadingSplash from "../components/LoadingSplash";
import BottomNavigation from "../components/BottomNavigation";
import CalorieRing from "../components/diet/CalorieRing";
import WaterWidget from "../components/diet/WaterWidget";
import MealList from "../components/diet/MealList";
import RecipesSection from "../components/diet/RecipesSection";
import MealCaptureSheet from "../components/diet/MealCaptureSheet";
import DietSettingsSheet from "../components/diet/DietSettingsSheet";
import { DietBackIcon, DietCameraIcon, DietEditIcon, DietSparkIcon } from "../components/diet/DietIcons";
import { useDietDashboard } from "../hooks/useDietDashboard";
import "./diet.css";

export default function Diet() {
  const navigate = useNavigate();
  const { user, loading, landingPath } = useAuth();
  const reducedMotion = useReducedMotion();
  const dashboard = useDietDashboard(user?.id ?? "");
  const [captureOpen, setCaptureOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (loading || dashboard.loading) return <LoadingSplash />;
  if (!user) return <Navigate to="/login" replace />;
  if (landingPath !== "/menu-teste") return <Navigate to={landingPath} replace />;
  if (!dashboard.data) return <div className="diet-screen"><main className="diet-shell"><p className="diet-fatal">Não foi possível carregar a seção Minha dieta.</p></main></div>;

  const { data } = dashboard;
  const handleNavigation = (label: string) => {
    if (label === "Início") navigate("/menu-teste");
    else if (label === "Treino") navigate("/treino");
    else if (label === "Perfil") navigate("/perfil");
  };

  return (
    <div className="diet-screen">
      <div className="diet-background" aria-hidden="true"><i /><i /></div>
      <main className="diet-shell">
        <header className="diet-topbar">
          <button type="button" className="diet-round-button" aria-label="Voltar para início" onClick={() => navigate("/menu-teste")}><DietBackIcon /></button>
          <div className="diet-title"><span>ACCQUA NUTRIÇÃO</span><h1>Minha dieta</h1></div>
          <button type="button" className="diet-round-button" aria-label="Configurar metas da dieta" onClick={() => setSettingsOpen(true)}><DietEditIcon /></button>
        </header>

        <div className="diet-scroll-content">
          <section className="diet-overview">
            <div className="diet-overview-copy"><span>SEU DIA</span><h2>Energia em equilíbrio</h2><p>Alimentação, hidratação e gasto dos seus treinos em um único resumo.</p></div>
            <CalorieRing consumed={data.consumedCalories} target={data.calorieTarget} burned={data.burn.calories} />
            <div className="diet-burn-detail"><span><DietSparkIcon size={16} /> {data.burn.sourceLabel}{data.burn.usedFallback ? " · fallback ativo" : ""}</span><small>Cardio {data.burn.cardioCalories} kcal · Musculação {data.burn.strengthCalories} kcal</small></div>
          </section>

          <WaterWidget currentMl={data.waterMl} targetMl={data.waterTargetMl} busy={dashboard.busy} onAdd={(ml) => void dashboard.addWaterAmount(ml)} />

          <motion.button type="button" className="diet-register-cta" whileTap={reducedMotion ? undefined : { scale: .985 }} onClick={() => setCaptureOpen(true)}>
            <span><DietCameraIcon size={28} /></span><div><small>REGISTRO RÁPIDO</small><strong>Fotografar refeição</strong><p>Prato ou rótulo nutricional</p></div><i>IA</i>
          </motion.button>

          <section className="diet-macro-strip" aria-label="Macronutrientes consumidos hoje">
            <article><span>Proteína</span><strong>{Math.round(data.consumedMacros.proteina_g)}g</strong><i style={{ "--macro-progress": `${Math.min(100, data.consumedMacros.proteina_g)}%` } as CSSProperties} /></article>
            <article><span>Carbo</span><strong>{Math.round(data.consumedMacros.carbo_g)}g</strong><i style={{ "--macro-progress": `${Math.min(100, data.consumedMacros.carbo_g / 2)}%` } as CSSProperties} /></article>
            <article><span>Gordura</span><strong>{Math.round(data.consumedMacros.gordura_g)}g</strong><i style={{ "--macro-progress": `${Math.min(100, data.consumedMacros.gordura_g * 1.5)}%` } as CSSProperties} /></article>
          </section>

          <MealList meals={data.meals} />
          <RecipesSection recipes={data.recipes} busy={dashboard.busy} onRegister={(recipe) => void dashboard.addRecipe(recipe)} />
          <div className="diet-bottom-spacer" />
        </div>

        <BottomNavigation activeKey="inicio" onSelect={handleNavigation} disabledLabels={["Aulas"]} />
      </main>

      <MealCaptureSheet open={captureOpen} onOpenChange={setCaptureOpen} userId={user.id} onSaved={dashboard.refresh} />
      <DietSettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} profile={data.profile} busy={dashboard.busy} onSave={dashboard.saveTargets} />
    </div>
  );
}
