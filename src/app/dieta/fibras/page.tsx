import { BottomNav } from '@/components/BottomNav'
import { PageTopBar } from '@/components/Header'
import { Leaf } from '@/components/Icons'

export default function FibrasPage() {
  return (
    <main className="app-frame detail-screen">
      <PageTopBar title="MAIS FIBRAS NO DIA A DIA" backHref="/dieta" infoHref="/dieta/guia" />
      <section className="hero-info card-soft"><Leaf size={52}/><div><h1>Pequenas escolhas, grandes resultados.</h1><p>As fibras ajudam na digestão, aumentam a saciedade e contribuem para uma rotina alimentar melhor.</p></div></section>
      <section className="fiber-progress card-soft"><div><small>Meta diária</small><b>30 g</b><span>de fibras</span></div><div className="percent-gauge big">70%<small>da meta</small></div><div><small>Você consumiu</small><b>21 g</b><span>de fibras hoje</span></div><p>↗ Faltam 9 g para atingir sua meta diária.</p></section>
      <section className="how-grid card-soft"><h2>Como aumentar suas fibras</h2><div><article>🥣 <b>Adicione aveia</b><p>No café da manhã ou lanches.</p></article><article>🥗 <b>Inclua legumes no almoço</b><p>Metade do prato com legumes e verduras.</p></article><article>🍎 <b>Coma frutas com casca</b><p>Prefira frutas inteiras.</p></article><article>🍞 <b>Troque pão branco</b><p>Use opções integrais.</p></article></div></section>
      <section className="compact-section"><div className="row-title"><h2>Alimentos ricos em fibras</h2></div><div className="food-row"><span>Aveia<br/><small>4 g</small></span><span>Feijão<br/><small>7 g</small></span><span>Brócolis<br/><small>3 g</small></span><span>Maçã<br/><small>4 g</small></span><span>Chia<br/><small>5 g</small></span></div></section>
      <div className="button-row"><button className="primary-button">Salvar meta</button><button className="outline-button">Adicionar ao plano</button></div>
      <BottomNav active="home" />
    </main>
  )
}
