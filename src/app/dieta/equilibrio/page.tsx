import { BottomNav } from '@/components/BottomNav'
import { PageTopBar } from '@/components/Header'

export default function EquilibrioPage() {
  return (
    <main className="app-frame detail-screen balance-screen">
      <PageTopBar title="MINHA DIETA" backHref="/dieta" infoHref="/dieta/guia" />
      <section className="detail-title"><h1>Equilíbrio nutricional</h1><p>Comer bem todos os dias é o que te leva mais longe.</p></section>
      <section className="status-wide card-soft"><span>✓</span><div><b>Seu consumo de proteínas está ideal</b><p>Você está no caminho certo para uma alimentação equilibrada.</p></div><strong className="percent-gauge">72%<small>da meta</small></strong></section>
      <section className="plate-card card-soft"><h2>Monte seu prato equilibrado</h2><p>Use o modelo do prato como guia para suas principais refeições.</p><div className="plate-visual"><div>Proteínas<br/><small>¼ do prato</small></div><div>Legumes<br/><small>½ do prato</small></div><div>Carboidratos<br/><small>¼ do prato</small></div><div>Gorduras boas<br/><small>pequena porção</small></div></div></section>
      <section className="tips-grid card-soft"><h2>Dicas para o dia a dia</h2><div><article>⚖️<b>Equilibre proteínas e carboidratos</b></article><article>🌿<b>Priorize comida de verdade</b></article><article>⏰<b>Não pule refeições</b></article><article>🌈<b>Varie as cores do prato</b></article></div></section>
      <div className="tip-card">⭐ Pequenas escolhas, grandes resultados. Consistência é mais importante que perfeição.</div>
      <BottomNav active="home" />
    </main>
  )
}
