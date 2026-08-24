import type { MealLog } from "../../lib/diet";
import { DietCameraIcon } from "./DietIcons";

function time(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function MealList({ meals }: { meals: MealLog[] }) {
  return (
    <section className="diet-meals-section">
      <div className="diet-section-title"><div><span>HOJE</span><h2>Suas refeições</h2></div><strong>{meals.length}</strong></div>
      {meals.length ? (
        <div className="diet-meal-list">
          {meals.map((meal) => (
            <article className="diet-meal-row" key={meal.id}>
              <div className="diet-meal-thumb">
                {meal.displayImageUrl ? <img src={meal.displayImageUrl} alt="Foto da refeição" loading="lazy" /> : <DietCameraIcon />}
              </div>
              <div className="diet-meal-copy">
                <span>{time(meal.registeredAt)} · {meal.source === "ocr_rotulo" ? "Rótulo" : meal.source === "ia_visao" ? "Análise por imagem" : "Manual"}</span>
                <strong>{meal.items.map((item) => item.nome).filter(Boolean).slice(0,2).join(" + ") || "Refeição"}</strong>
                <small>P {Math.round(meal.macros.proteina_g)}g · C {Math.round(meal.macros.carbo_g)}g · G {Math.round(meal.macros.gordura_g)}g</small>
              </div>
              <div className="diet-meal-kcal"><strong>{Math.round(meal.caloriesTotal)}</strong><small>kcal</small></div>
            </article>
          ))}
        </div>
      ) : (
        <div className="diet-empty-meals"><DietCameraIcon size={28} /><strong>Nenhuma refeição registrada</strong><p>Fotografe seu prato ou rótulo para começar o diário de hoje.</p></div>
      )}
    </section>
  );
}
