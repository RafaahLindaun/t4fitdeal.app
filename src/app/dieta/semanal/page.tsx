import Link from 'next/link'
import { BottomNav } from '@/components/BottomNav'
import { PageTopBar } from '@/components/Header'
import { DietTabs } from '@/components/DietTabs'
import { Droplet, Fire, Leaf } from '@/components/Icons'

export default function DietaSemanalPage() {
  return (
    <main className="app-frame diet-screen">
      <PageTopBar title="MINHA DIETA" backHref="/dieta" infoHref="/dieta/guia" />
      <section className="section-heading"><h1>Análise nutricional</h1><Link href="/dieta/guia">Ver tudo ›</Link></section>
      <DietTabs active="semanal" />
      <div className="date-switch">‹ <b>03 a 09 de Maio</b> ›</div>

      <section className="weekly-summary card-soft"><h2>Resumo da semana</h2><div className="summary-grid"><div><Fire/><b>12.890</b><small>kcal consumidas</small></div><div><span className="target-icon">◎</span><b>17.850</b><small>kcal de meta</small></div><div><span className="check-ok">✓</span><b>72%</b><small>da meta</small></div></div></section>

      <section className="bar-chart-card card-soft"><h2>Calorias por dia</h2><div className="bar-chart"><i style={{height:'58%'}}/><i style={{height:'68%'}}/><i style={{height:'82%'}}/><i style={{height:'62%'}}/><i style={{height:'76%'}}/><i style={{height:'55%'}}/><i style={{height:'52%'}}/></div><div className="bar-labels"><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span><span>Dom</span></div></section>

      <section className="macro-card small"><div className="donut" /><div><h2>Média semanal de macros</h2><p><span className="blue-dot" />Proteínas <b>132 g/dia · 28%</b></p><p><span className="green-dot" />Carboidratos <b>210 g/dia · 45%</b></p><p><span className="orange-dot" />Gorduras <b>48 g/dia · 27%</b></p><small className="success-line">✓ Proteína dentro da meta em 5 de 7 dias.</small></div></section>

      <section className="two-cards"><div className="mini-stat water"><Droplet /><h3>Água — semana</h3><b>12,6 / 17,5 L</b><div className="cups week"><i/><i/><i/><i/><i/><i/><em/></div><small>72% da meta</small></div><div className="mini-stat fiber"><Leaf /><h3>Fibras — semana</h3><b>128 / 210 g</b><span className="progress green"><i /></span><small>61% da meta</small></div></section>
      <BottomNav active="home" />
    </main>
  )
}
