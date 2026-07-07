import Link from 'next/link'
import { BottomNav } from '@/components/BottomNav'
import { BrandHeader } from '@/components/Header'
import { ArrowLeft, ChevronRight, Dumbbell, Message, UserIcon } from '@/components/Icons'
import { personals } from '@/data/appData'

export default function PersonalPage() {
  return (
    <main className="app-frame personal-screen">
      <Link href="/home" className="float-back"><ArrowLeft /></Link>
      <BrandHeader infoHref="/personal" />
      <section className="section-title"><h1>Área personal</h1><p>Escolha um professor e solicite atendimento personalizado.</p></section>
      <section className="how-it-works card-soft"><h2>Como funciona</h2><div><article><UserIcon/> <b>1. Escolha</b><p>Encontre o personal ideal.</p></article><ChevronRight/><article><Message/> <b>2. Converse</b><p>Tire suas dúvidas.</p></article><ChevronRight/><article><Dumbbell/> <b>3. Comece</b><p>Evolua com foco.</p></article></div></section>
      <section className="filters-block card-soft"><h2>Encontre seu personal ideal</h2><p>Filtre por objetivo ou modalidade.</p><div className="filter-pills"><button className="active">Todos</button><button>Hipertrofia</button><button>Emagrecimento</button><button>Funcional</button><button>Natação</button></div></section>
      <section className="personal-list">
        {personals.map((p, index) => <Link href="/personal/rafael" className="personal-card" key={p.nome}><div className="avatar coach">{p.nome[0]}</div><div><small>{index === 0 ? '★ Mais procurado' : p.tag}</small><h2>{p.nome}</h2><p>{p.area}</p><span>{p.anos}</span><span>{p.turno}</span><span>Avaliação {p.rating}</span></div><span className="personal-cta">Quero esse personal</span><ChevronRight/></Link>)}
      </section>
      <BottomNav active="home" />
    </main>
  )
}
