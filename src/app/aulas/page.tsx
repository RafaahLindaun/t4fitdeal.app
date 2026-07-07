import Link from 'next/link'
import { BottomNav } from '@/components/BottomNav'
import { BrandHeader } from '@/components/Header'
import { ArrowLeft, Clock, Info, Swimmer } from '@/components/Icons'
import { classes } from '@/data/appData'

export default function AulasPage() {
  const now = classes.slice(0,2)
  const next = classes.slice(2)
  return (
    <main className="app-frame classes-screen">
      <Link href="/home" className="float-back"><ArrowLeft /></Link>
      <BrandHeader infoHref="/aulas" />
      <section className="section-title"><h1>Aulas coletivas</h1><p>Veja as aulas disponíveis e horários de hoje</p></section>
      <div className="segmented-tabs"><button>Agora</button><button className="active">Hoje</button><button>Semana</button></div>
      <section className="gympass-card"><Info/><b>Gympass aceito em aulas selecionadas</b><div><span>Silver</span><span className="active">Gold</span><span>Platinum</span></div></section>
      <section className="classes-now"><div className="row-title"><h2>Acontecendo agora <span className="dot"/></h2><a>Ver todas</a></div><div className="now-grid">{now.map(item => <article className="class-card" key={item.nome}><Swimmer/><h3>{item.nome}</h3><b><Clock/> {item.hora}</b><p>{item.local}</p><small>● Acontecendo agora</small><span>Gympass</span></article>)}</div></section>
      <section className="class-list"><h2>Próximas de hoje</h2>{next.map(item => <article key={item.nome + item.hora}><Swimmer/><div><h3>{item.nome}</h3><p>{item.local}</p></div><b><Clock/> {item.hora}</b><span>{item.plano}</span></article>)}</section>
      <BottomNav active="aulas" />
    </main>
  )
}
