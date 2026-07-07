import Link from 'next/link'
import { BottomNav } from '@/components/BottomNav'
import { PageTopBar } from '@/components/Header'
import { DietTabs } from '@/components/DietTabs'
import { Droplet, Fire, Leaf } from '@/components/Icons'
import { foods, recipes } from '@/data/appData'

export default function DietaPage() {
  return (
    <main className="app-frame diet-screen">
      <PageTopBar title="MINHA DIETA" backHref="/home" infoHref="/dieta/guia" />
      <section className="section-heading"><h1>Análise nutricional</h1><Link href="/dieta/guia">Ver tudo ›</Link></section>
      <DietTabs active="diaria" />

      <section className="chart-card calories-card"><div><Fire /><h2>Calorias</h2><small>Média diária</small><b>1.842 kcal</b></div><div><small>Meta</small><b>2.550 kcal</b></div><div className="line-chart"><span>28/04</span><span>29/04</span><span>30/04</span><span>01/05</span><span>02/05</span><span>03/05</span><span>Hoje</span><i /></div></section>

      <Link className="macro-card" href="/dieta/macronutrientes"><div className="donut" /><div><h2>Distribuição de macronutrientes</h2><p><span className="blue-dot" />Proteínas <b>28% (132 g)</b></p><p><span className="green-dot" />Carboidratos <b>45% (210 g)</b></p><p><span className="orange-dot" />Gorduras <b>27% (48 g)</b></p></div><strong className="percent-gauge">72%<small>da meta</small></strong></Link>

      <section className="two-cards"><Link href="/dieta/hidratacao" className="mini-stat water"><Droplet /><h3>Água</h3><b>1,8 / 2,5 L</b><div className="cups"><i/><i/><i/><i/><i/><em/></div><small>Meta diária</small></Link><Link href="/dieta/fibras" className="mini-stat fiber"><Leaf /><h3>Fibras</h3><b>21 / 30 g</b><span className="progress green"><i /></span></Link></section>

      <section className="compact-section"><div className="row-title"><h2>Alimentos em destaque</h2><Link href="/dieta/alimentos">Ver todos ›</Link></div><div className="food-row">{foods.slice(0,4).map(food => <Link href="/dieta/alimentos" className="food-card" key={food.nome}><div className="food-photo"/><b>{food.nome}</b><small>{food.kcal} kcal · {food.porcao}</small></Link>)}</div></section>

      <section className="compact-section tiny"><div className="row-title"><h2>Sugestões para você</h2></div><div className="suggestion-row"><Link href="/dieta/fibras"><Leaf />Aumente fibras</Link><Link href="/dieta/hidratacao"><Droplet />Hidratação</Link><Link href="/dieta/equilibrio">⭐ Equilíbrio</Link></div></section>

      <section className="compact-section recipes"><div className="row-title"><h2>Receitas recomendadas</h2><Link href="/dieta/receitas/panqueca-de-banana">Ver todas ›</Link></div><div className="recipe-row">{recipes.map(r => <Link href={`/dieta/receitas/${r.slug}`} className="recipe-card" key={r.slug}><div className="recipe-photo"/><b>{r.title}</b><small>{r.kcal} kcal</small></Link>)}</div></section>
      <BottomNav active="home" />
    </main>
  )
}
