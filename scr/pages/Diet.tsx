import { useState, type CSSProperties } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "../auth/AuthProvider";
import LoadingSplash from "../components/LoadingSplash";
import PageHeader from "../components/PageHeader";
import IconButton from "../components/IconButton";
import CalorieRing from "../components/diet/CalorieRing";
import WaterWidget from "../components/diet/WaterWidget";
import MealList from "../components/diet/MealList";
import RecipesSection from "../components/diet/RecipesSection";
import MealCaptureSheet from "../components/diet/MealCaptureSheet";
import DietSettingsSheet from "../components/diet/DietSettingsSheet";
import DietInfoSheet from "../components/diet/DietInfoSheet";
import MealScheduleDialog from "../components/diet/MealScheduleDialog";
import HealthNudgeDialog from "../components/diet/HealthNudgeDialog";
import DietHistoryPopover from "../components/diet/DietHistoryPopover";
import {
  DietBackIcon,
  DietCameraIcon,
  DietClockIcon,
  DietDumbbellIcon,
  DietEditIcon,
  DietFireIcon,
  DietInfoIcon,
} from "../components/diet/DietIcons";
import { isPerfilNutricionalCompleto, recipeAlternative, type Recipe } from "../lib/diet";
import { useDietDashboard } from "../hooks/useDietDashboard";
import "./diet.css";
import "./diet-header-v1487.css";

function safeKcal(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? Math.max(0, Math.round(number)) : 0;
}

type RecipeNudgeState = { recipe: Recipe; alternative: Recipe } | null;

export default function Diet() {
  const navigate = useNavigate();
  const { user, loading, landingPath } = useAuth();
  const reducedMotion = useReducedMotion();
  const dashboard = useDietDashboard(user?.id ?? "");
  const [captureOpen, setCaptureOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [recipeNudge, setRecipeNudge] = useState<RecipeNudgeState>(null);

  if (loading || dashboard.loading) return <LoadingSplash />;
  if (!user) return <Navigate to="/login" replace />;
  if (landingPath !== "/menu-teste") return <Navigate to={landingPath} replace />;
  if (!dashboard.data) return <div className="diet-screen"><main className="diet-shell"><p className="diet-fatal">Não foi possível carregar a seção Minha dieta.</p></main></div>;

  const { data } = dashboard;
  const profileComplete = isPerfilNutricionalCompleto(data.profile);
  const cardioCalories = safeKcal(data.burn.cardioCalories);
  const strengthCalories = safeKcal(data.burn.strengthCalories);
  const calorieTarget = safeKcal(data.calorieTarget);

  const handleRecipeRegister = (recipe: Recipe) => {
    if (recipe.healthLevel === "menos_saudavel") {
      const alternative = recipeAlternative(recipe, data.recipes);
      if (alternative) {
        setRecipeNudge({ recipe, alternative });
        return;
      }
    }
    void dashboard.addRecipe(recipe);
  };

  const keepRecipe = async () => {
    if (!recipeNudge) return;
    const current = recipeNudge.recipe;
    setRecipeNudge(null);
    await dashboard.addRecipe(current);
  };

  const swapRecipe = async () => {
    if (!recipeNudge) return;
    const alternative = recipeNudge.alternative;
    setRecipeNudge(null);
    await dashboard.addRecipe(alternative);
  };

  return (
    <div className="diet-screen">
      <div className="diet-background" aria-hidden="true"><i /><i /></div>
      <main className="diet-shell">
        <PageHeader
          className="diet-topbar"
          ariaLabel="Cabeçalho Minha dieta"
          left={
            <div className="diet-header-primary">
              <IconButton
                className="diet-round-button"
                aria-label="Voltar para início"
                onClick={() => navigate("/menu-teste")}
              >
                <DietBackIcon />
              </IconButton>
              <div className="diet-title">
                <span>ACCQUA NUTRIÇÃO</span>
                <h1>Minha dieta</h1>
              </div>
            </div>
          }
          right={
            <div className="diet-topbar-side is-right">
              <IconButton
                className="diet-round-button"
                aria-label="Informações sobre Minha dieta"
                onClick={() => setInfoOpen(true)}
              >
                <DietInfoIcon />
              </IconButton>
              {profileComplete ? (
                <IconButton
                  className="diet-round-button"
                  aria-label="Abrir cronograma sugerido de refeições"
                  onClick={() => setScheduleOpen(true)}
                >
                  <DietClockIcon />
                </IconButton>
              ) : null}
              <IconButton
                className="diet-round-button"
                aria-label="Configurar metas da dieta"
                onClick={() => setSettingsOpen(true)}
              >
                <DietEditIcon />
              </IconButton>
            </div>
          }
        />

        <div className="diet-scroll-content">
          <section className="diet-overview">
            <div className="diet-overview-copy"><span>SEU DIA</span><h2>Energia em equilíbrio</h2><p>Alimentação, hidratação e gasto dos seus treinos em um único resumo.</p></div>
          </section>

          <div className="diet-dashboard-grid">
            <section className="diet-energy-panel" aria-label="Resumo de energia do dia">
              <CalorieRing consumed={data.consumedCalories} target={calorieTarget} burned={safeKcal(data.burn.calories)} historyAction={<DietHistoryPopover mode="calories" days={data.history} />} />
              <div className="diet-burn-detail">
                <strong>Com base nos seus gastos de hoje</strong>
                <div className="diet-burn-pills" aria-label="Detalhamento do gasto calórico de hoje">
                  <span><DietFireIcon size={16} /> Cardio: <b>{cardioCalories} kcal</b></span>
                  <span><DietDumbbellIcon size={16} /> Musculação: <b>{strengthCalories} kcal</b></span>
                </div>
                {data.burn.usedFallback ? <small>Usando os treinos registrados no ACCQUA enquanto sua fonte preferida não está conectada.</small> : null}
              </div>
            </section>

            <WaterWidget
              currentMl={data.waterMl}
              targetMl={data.waterTargetMl}
              busy={dashboard.busy}
              onAdd={(ml) => void dashboard.addWaterAmount(ml)}
              onReset={dashboard.resetWater}
              historyAction={<DietHistoryPopover mode="water" days={data.history} />}
            />
          </div>

          <motion.button type="button" className="diet-register-cta" whileTap={reducedMotion ? undefined : { scale: .985 }} onClick={() => setCaptureOpen(true)}>
            <span><DietCameraIcon size={28} /></span><div><small>REGISTRO RÁPIDO</small><strong>Fotografar refeição</strong><p>Prato ou rótulo nutricional</p></div><i>IA</i>
          </motion.button>

          <section className="diet-macro-strip" aria-label="Macronutrientes consumidos hoje">
            <article><span>Proteína</span><strong>{Math.round(data.consumedMacros.proteina_g)}g</strong><i style={{ "--macro-progress": `${Math.min(100, data.consumedMacros.proteina_g)}%` } as CSSProperties} /></article>
            <article><span>Carbo</span><strong>{Math.round(data.consumedMacros.carbo_g)}g</strong><i style={{ "--macro-progress": `${Math.min(100, data.consumedMacros.carbo_g / 2)}%` } as CSSProperties} /></article>
            <article><span>Gordura</span><strong>{Math.round(data.consumedMacros.gordura_g)}g</strong><i style={{ "--macro-progress": `${Math.min(100, data.consumedMacros.gordura_g * 1.5)}%` } as CSSProperties} /></article>
          </section>

          <MealList meals={data.meals} />
          <RecipesSection recipes={data.recipes} busy={dashboard.busy} onRegister={handleRecipeRegister} />
          <div className="diet-bottom-spacer" />
        </div>
      </main>

      <DietInfoSheet open={infoOpen} onOpenChange={setInfoOpen} />
      <MealCaptureSheet open={captureOpen} onOpenChange={setCaptureOpen} userId={user.id} recipes={data.recipes} onSaved={dashboard.refresh} />
      <DietSettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} profile={data.profile} busy={dashboard.busy} onSave={dashboard.saveTargets} />
      <MealScheduleDialog open={scheduleOpen} onOpenChange={setScheduleOpen} calorieTarget={calorieTarget} />
      <HealthNudgeDialog
        open={Boolean(recipeNudge)}
        onOpenChange={(value) => { if (!value) setRecipeNudge(null); }}
        itemName={recipeNudge?.recipe.name ?? "esta opção"}
        alternative={recipeNudge?.alternative ?? null}
        busy={dashboard.busy}
        onKeep={keepRecipe}
        onSwap={swapRecipe}
      />
    </div>
  );
}
