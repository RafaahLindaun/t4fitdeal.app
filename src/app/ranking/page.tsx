import { BottomNav } from '@/components/BottomNav'
import { BrandHeader } from '@/components/Header'
import { ArrowLeft } from '@/components/Icons'
import Link from 'next/link'
import { ranking } from '@/data/appData'

export default function RankingPage() {
  const top = ranking.slice(0, 3)
  const rest = ranking.slice(3)
  return (
    <main className="app-frame ranking-screen">
      <Link href="/home" className="float-back"><ArrowLeft /></Link>
      <BrandHeader infoHref="/ranking" />
      <section className="section-title"><h1>Ranking</h1><p>Alunos com mais treinos</p></section>
      <section className="podium">
        {[top[1], top[0], top[2]].map((item) => <article key={item.pos} className={item.pos === 1 ? 'winner' : ''}><span className="medal">{item.pos}</span><div className="avatar">{item.avatar}</div><h2>{item.nome}</h2><b>{item.treinos} treinos</b></article>)}
      </section>
      <section className="ranking-list">
        {rest.map(item => <div className="ranking-row" key={item.pos}><b>{item.pos}</b><span className="avatar small">{item.avatar}</span><strong>{item.nome}</strong><em>{item.treinos} treinos</em></div>)}
      </section>
      <BottomNav active="ranking" />
    </main>
  )
}
