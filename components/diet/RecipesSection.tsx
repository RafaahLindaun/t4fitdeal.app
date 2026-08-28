import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Recipe } from "../../lib/diet";
import { DietPlusIcon, DietRecipeIcon } from "./DietIcons";

const filters = [
  { label: "Todas", value: "all" },
  { label: "Emagrecimento", value: "emagrecimento" },
  { label: "Hipertrofia", value: "hipertrofia" },
  { label: "Low carb", value: "low_carb" },
] as const;

const INITIAL_VISIBLE = 8;
const PAGE_SIZE = 6;

const objectiveLabels: Record<string, string> = {
  emagrecimento: "Emagrecimento",
  hipertrofia: "Hipertrofia",
  low_carb: "Low carb",
};

const mealLabels: Record<string, string> = {
  cafe_da_manha: "Café da manhã",
  almoco: "Almoço",
  jantar: "Jantar",
  lanche: "Lanche",
};

function RecipeImage({ recipe }: { recipe: Recipe }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [recipe.imageUrl]);

  if (!recipe.imageUrl || failed) return <DietRecipeIcon size={34} />;
  return (
    <img
      src={recipe.imageUrl}
      alt={`Foto ilustrativa da receita ${recipe.name}`}
      loading="lazy"
      decoding="async"
      className={loaded ? "is-loaded" : ""}
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
    />
  );
}

export default function RecipesSection({ recipes, busy, onRegister }: { recipes: Recipe[]; busy: boolean; onRegister: (recipe: Recipe) => void }) {
  const [filter, setFilter] = useState<(typeof filters)[number]["value"]>("all");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const reduceMotion = useReducedMotion();

  const filtered = useMemo(
    () => filter === "all" ? recipes : recipes.filter((recipe) => recipe.objectiveCategories.includes(filter)),
    [filter, recipes],
  );

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
  }, [filter]);

  const visible = filtered.slice(0, visibleCount);
  const canLoadMore = visibleCount < filtered.length;
  const expanded = filtered.length > INITIAL_VISIBLE && !canLoadMore;

  const toggleAll = () => {
    setVisibleCount(expanded ? INITIAL_VISIBLE : filtered.length);
  };

  return (
    <section className="diet-recipes-section" aria-labelledby="diet-recipes-title">
      <div className="diet-section-title diet-recipes-heading">
        <div><span>BIBLIOTECA</span><h2 id="diet-recipes-title">Receitas ACCQUA</h2></div>
        {filtered.length > INITIAL_VISIBLE ? (
          <button type="button" className="diet-recipes-view-all" onClick={toggleAll}>
            {expanded ? "Ver menos" : "Ver todas"}
          </button>
        ) : null}
      </div>

      <div className="diet-filter-row" role="tablist" aria-label="Filtrar receitas por objetivo">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={filter === item.value}
            className={filter === item.value ? "is-active" : ""}
            onClick={() => setFilter(item.value)}
          >{item.label}</button>
        ))}
      </div>

      {visible.length ? (
        <>
          <div className="diet-recipe-grid">
            {visible.map((recipe) => (
              <article className="diet-recipe-card" key={recipe.id}>
                <div className="diet-recipe-art"><RecipeImage recipe={recipe} /></div>
                <div className="diet-recipe-body">
                  <div className="diet-recipe-copy">
                    <div className="diet-recipe-badges" aria-label="Categorias da receita">
                      {recipe.objectiveCategories.map((objective) => (
                        <span className="diet-recipe-badge is-objective" key={objective}>{objectiveLabels[objective] ?? objective}</span>
                      ))}
                      <span className="diet-recipe-badge is-meal">{mealLabels[recipe.mealCategory] ?? recipe.mealCategory}</span>
                    </div>
                    <strong>{recipe.name}</strong>
                    {recipe.portionDescription ? <small className="diet-recipe-portion">{recipe.portionDescription}</small> : null}
                    <div className="diet-recipe-macros" aria-label={`Macros de ${recipe.name}`}>
                      <span><b>{Math.round(recipe.macros.calorias)}</b> kcal</span>
                      <span>P <b>{Math.round(recipe.macros.proteina_g)}</b>g</span>
                      <span>C <b>{Math.round(recipe.macros.carbo_g)}</b>g</span>
                      <span>G <b>{Math.round(recipe.macros.gordura_g)}</b>g</span>
                    </div>
                  </div>
                  <motion.button
                    type="button"
                    disabled={busy}
                    whileTap={reduceMotion ? undefined : { scale: .92 }}
                    onClick={() => onRegister(recipe)}
                    aria-label={`Registrar receita ${recipe.name}`}
                  ><DietPlusIcon size={19} /></motion.button>
                </div>
              </article>
            ))}
          </div>

          {canLoadMore ? (
            <button
              type="button"
              className="diet-recipes-load-more"
              onClick={() => setVisibleCount((current) => Math.min(filtered.length, current + PAGE_SIZE))}
            >
              Carregar mais <span>{Math.min(PAGE_SIZE, filtered.length - visibleCount)}</span>
            </button>
          ) : null}
        </>
      ) : (
        <div className="diet-empty-recipes"><DietRecipeIcon size={28} /><strong>Nenhuma receita neste filtro</strong><p>Escolha outro objetivo para continuar explorando.</p></div>
      )}
    </section>
  );
}
