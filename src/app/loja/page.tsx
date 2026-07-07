import Link from 'next/link'
import { BottomNav } from '@/components/BottomNav'
import { BrandHeader } from '@/components/Header'
import { ArrowLeft, Bottle, Info, Shirt } from '@/components/Icons'
import { products } from '@/data/appData'

const icons = ['🥤','▧','⚡','👕','🎽','▣']

export default function LojaPage() {
  return (
    <main className="app-frame store-screen">
      <Link href="/home" className="float-back"><ArrowLeft /></Link>
      <BrandHeader infoHref="/loja/info" />
      <section className="section-title"><h1>Loja</h1><p>Visualize os itens da academia</p></section>
      <div className="filter-pills store"><button className="active"><Bottle/> Whey</button><button>Creatina</button><button>Energéticos</button><button><Shirt/> Roupas</button></div>
      <section className="store-grid">
        {products.map((item, index) => <article className="product-card" key={item.nome}><div className="product-image"><span>{icons[index]}</span></div><h2>{item.nome}</h2><p>{item.categoria}</p></article>)}
      </section>
      <BottomNav active="home" />
    </main>
  )
}
