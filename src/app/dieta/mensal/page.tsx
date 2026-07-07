import Link from 'next/link'
import { BottomNav } from '@/components/BottomNav'
import { PageTopBar } from '@/components/Header'
import { DietTabs } from '@/components/DietTabs'
import { Droplet, Fire, Leaf } from '@/components/Icons'

export default function DietaMensalPage() {
  return (
    <main className="app-frame diet-screen">
      <PageTopBar title="MINHA DIETA" backHref="/dieta" infoHref="/dieta/guia" />
      <section className="section-heading"><h1>Análise nutricional</h1><Link href="/dieta/guia">Ver tudo ›</Link></section>
      <DietTabs active="mensal" />
      <div className="date-switch">‹ <b>Maio / 2025</b> ›</div>

      <section className="month-hero card-soft"><h2>Resumo do mês</h2><div className="summary-grid four"><div><Fire/><b>54.300</b><small>kcal consumidas</small></div><div><span className="target-icon">◎</span><b>69.700</b><small>kcal de meta</small></div><div><span className="check-ok">✓</span><b>78%</b><small>aderência</small></div><div><span>📅</span><b>21/30</b><small>dias dentro</small></div></div><p className="positive-note">✓ Você manteve boa regularidade, mas pode melhorar hidratação e fibras.</p></section>

      <section className="chart-card calories-card"><div><h2>Calorias ao longo do mês</h2><small>Meta diária: 2.550 kcal</small></div><div className="line-chart month"><span>Sem 1</span><span>Sem 2</span><span>Sem 3</span><span>Sem 4</span><span>Sem 5</span><i /></div></section>

      <section className="nutri-month-grid card-soft"><h2>Resumo nutricional do mês</h2><div className="month-metrics"><div><span className="blue-dot"/>Proteínas<b>3.850 g</b><small>Média: 128 g/dia</small></div><div><span className="green-dot"/>Carboidratos<b>6.300 g</b><small>Média: 210 g/dia</small></div><div><span className="orange-dot"/>Gorduras<b>1.440 g</b><small>Média: 48 g/dia</small></div><div><Droplet/>Água<b>62 / 75 L</b><small>83% da meta</small></div></div></section>

      <section className="result-month card-soft"><div><h2>Resultado do mês</h2><p>Peso <b className="green-text">-2,4 kg</b></p><p>Dias dentro da meta <b>21 de 30 dias</b></p><p>Dias abaixo da água <b className="yellow-text">8 dias</b></p><p>Melhor semana <b className="green-text">Semana 3</b></p></div><div className="loss-ring"><b>-2,4 kg</b><span>de perda</span><small>Meta: -3,0 kg</small></div></section>

      <section className="compact-section tiny"><div className="row-title"><h2>Plano para o próximo mês</h2></div><div className="suggestion-row"><Link href="/dieta/hidratacao"><Droplet />Aumentar água</Link><Link href="/dieta/fibras"><Leaf />Melhorar fibras</Link><Link href="/dieta/equilibrio">⭐ Manter proteína</Link></div></section>
      <BottomNav active="home" />
    </main>
  )
}
