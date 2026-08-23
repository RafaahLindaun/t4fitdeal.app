import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Recipe } from "../../lib/diet";
import { DietPlusIcon, DietRecipeIcon } from "./DietIcons";

const filters = ["Todas", "Emagrecimento", "Hipertrofia", "Low carb"];

function RecipeImage({ recipe }: { recipe: Recipe }) {
  const [loaded, setLoaded] = useState(false);
  if (!recipe.imageUrl) return <DietRecipeIcon size={34} />;
  return (
    <img
      src={recipe.imageUrl}
      alt={`Foto da receita ${recipe.name}`}
      loading="lazy"
      decoding="async"
      className={loaded ? "is-loaded" : ""}
      onLoad={() => setLoaded(true)}
    />
  );
}

export default function RecipesSection({ recipes, busy, onRegister }: { recipes: Recipe[]; busy: boolean; onRegister: (recipe: Recipe) => void }) {
  const [filter, setFilter] = useState("Todas");
  const reduceMotion = useReducedMotion();
  const visible = useMemo(() => filter === "Todas" ? recipes : recipes.filter((recipe) => recipe.tags.some((tag) => tag.toLowerCase().includes(filter.toLowerCase()))), [filter, recipes]);
  return (
    <section className="diet-recipes-section">
      <div className="diet-section-title"><div><span>BIBLIOTECA</span><h2>Receitas ACCQUA</h2></div><DietRecipeIcon /></div>
      <div className="diet-filter-row" role="tablist" aria-label="Filtrar receitas">
        {filters.map((item) => <button key={item} type="button" className={filter === item ? "is-active" : ""} onClick={() => setFilter(item)}>{item}</button>)}
      </div>
      <div className="diet-recipe-scroll">
        {visible.map((recipe) => (
          <article className="diet-recipe-card" key={recipe.id}>
            <div className="diet-recipe-art"><RecipeImage recipe={recipe} /></div>
            <div className="diet-recipe-copy"><span>{recipe.tags.slice(0,2).join(" · ")}</span><strong>{recipe.name}</strong><small>{Math.round(recipe.macros.calorias)} kcal · P {Math.round(recipe.macros.proteina_g)}g</small></div>
            <motion.button type="button" disabled={busy} whileTap={reduceMotion ? undefined : { scale: .92 }} onClick={() => onRegister(recipe)} aria-label={`Registrar receita ${recipe.name}`}><DietPlusIcon size={17} /></motion.button>
          </article>
        ))}
      </div>
    </section>
  );
}
