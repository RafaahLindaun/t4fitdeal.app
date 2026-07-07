import { BottomNav } from '@/components/BottomNav'
import { PageTopBar } from '@/components/Header'
import { foods } from '@/data/appData'

export default function AlimentosPage() {
  return (
    <main className="app-frame foods-screen">
      <PageTopBar title="ALIMENTOS EM DESTAQUE" backHref="/dieta" infoHref="/dieta/guia" />
      <section className="detail-title"><h1>Alimentos em destaque</h1><p>Escolhas inteligentes para potencializar sua performance e alcançar seus objetivos.</p></section>
      <div className="filter-pills"><button className="active">Todos</button><button>Proteínas</button><button>Carboidratos</button><button>Gorduras boas</button><button>Fibras</button></div>
      <section className="food-list-grid">
        {foods.map((food) => <article className="food-list-card" key={food.nome}><div className="food-photo large"/><div><h2>{food.nome}</h2><b>{food.kcal} kcal</b><p>Porção: {food.porcao}</p><span className={`tag ${food.color}`}>{food.tipo}</span></div></article>)}
      </section>
      <BottomNav active="home" />
    </main>
  )
}
