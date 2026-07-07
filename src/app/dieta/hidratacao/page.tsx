import { BottomNav } from '@/components/BottomNav'
import { PageTopBar } from '@/components/Header'
import { Droplet } from '@/components/Icons'

export default function HidratacaoPage() {
  return (
    <main className="app-frame detail-screen hydration-screen">
      <PageTopBar title="MINHA DIETA" backHref="/dieta" infoHref="/dieta/guia" />
      <section className="detail-title"><h1>Hidratação</h1><p>A água é essencial para o seu desempenho e bem-estar.</p></section>
      <section className="water-main card-soft"><div><Droplet/><h2>Seu consumo de água hoje</h2><b>1,8 <span>/ 2,5 L</span></b><small>Meta diária</small></div><strong className="percent-gauge blue">72%<small>da meta</small></strong><div className="cups big"><i/><i/><i/><i/><i/><em/></div><p>Copos de 300 ml</p></section>
      <section className="when-drink card-soft"><h2>Quando beber</h2><div><article>🌅<b>Ao acordar</b><span>300 ml</span></article><article>🏋️<b>Antes do treino</b><span>300–500 ml</span></article><article>💧<b>Durante o treino</b><span>150–250 ml</span></article><article>☀️<b>À tarde</b><span>300 ml</span></article></div></section>
      <section className="benefits card-soft"><h2>Benefícios da hidratação adequada</h2><p>📈 Melhora o desempenho</p><p>🔄 Acelera a recuperação</p><p>🎯 Mais foco e disposição</p></section>
      <section className="reminder-card card-soft"><h2>Lembretes personalizados</h2><p>Receba notificações para não esquecer de beber água.</p><button className="primary-button">Ativar lembretes</button></section>
      <BottomNav active="home" />
    </main>
  )
}
