import { BottomNav } from '@/components/BottomNav'
import { PageTopBar } from '@/components/Header'
import { recipes } from '@/data/appData'

export default async function ReceitaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const recipe = recipes.find(r => r.slug === slug) ?? recipes[0]
  const smoothie = recipe.slug === 'smoothie-de-frutas'
  return (
    <main className="app-frame recipe-screen">
      <PageTopBar title="RECEITA" backHref="/dieta" infoHref="/dieta/guia" />
      <section className="recipe-hero"><div className="recipe-photo hero"/><h1>{recipe.title}</h1><p>{smoothie ? 'Rápido, refrescante e nutritivo. Perfeito para qualquer hora do dia.' : 'Leve, nutritivo e cheio de sabor para o seu dia a dia.'}</p></section>
      <section className="recipe-pills"><span>🔥 {recipe.kcal} kcal</span><span>🕒 Preparo {recipe.time}</span><span>👤 1 porção</span><span>🥗 {recipe.meal}</span></section>
      <section className="recipe-nutrition card-soft"><h2>Resumo nutricional</h2><div><b>{recipe.kcal}<small>kcal</small></b><p>Proteínas <strong>{recipe.protein}</strong></p><p>Carboidratos <strong>{smoothie ? '46 g' : '38 g'}</strong></p><p>Gorduras <strong>{smoothie ? '6 g' : '14 g'}</strong></p></div></section>
      <section className="recipe-columns"><article className="card-soft"><h2>Ingredientes</h2><ul><li>{smoothie ? '1 banana média congelada' : '120 g de peito de frango grelhado'}</li><li>{smoothie ? '1/2 xícara de morangos' : '1/2 xícara de quinoa cozida'}</li><li>{smoothie ? '170 ml de iogurte natural' : '1/2 xícara de brócolis no vapor'}</li><li>{smoothie ? 'Gelo a gosto' : 'Tomates cereja e azeite'}</li></ul></article><article className="card-soft"><h2>Modo de preparo</h2><ol><li>{smoothie ? 'Coloque todos os ingredientes no liquidificador.' : 'Tempere e grelhe o frango.'}</li><li>{smoothie ? 'Bata até ficar cremoso.' : 'Cozinhe a quinoa conforme instruções.'}</li><li>{smoothie ? 'Sirva imediatamente.' : 'Monte o bowl com os vegetais.'}</li></ol></article></section>
      <button className="primary-button">Salvar receita</button>
      <BottomNav active="home" />
    </main>
  )
}
