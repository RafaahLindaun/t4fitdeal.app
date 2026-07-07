import { BottomNav } from '@/components/BottomNav'
import { PageTopBar } from '@/components/Header'
import { Apple, Dumbbell, Leaf } from '@/components/Icons'

const macros = [
  { name: 'Proteínas', value: '132 g', goal: '/ 182 g', percent: '28%', color: 'blue', foods: ['Frango', 'Ovos', 'Iogurte', 'Atum'], icon: Dumbbell, text: 'Essenciais para recuperação muscular e construção de massa.' },
  { name: 'Carboidratos', value: '210 g', goal: '/ 467 g', percent: '45%', color: 'green', foods: ['Arroz', 'Batata', 'Aveia', 'Banana'], icon: Leaf, text: 'Principal fonte de energia para o corpo e o cérebro.' },
  { name: 'Gorduras', value: '48 g', goal: '/ 89 g', percent: '27%', color: 'orange', foods: ['Abacate', 'Azeite', 'Castanhas', 'Amendoim'], icon: Apple, text: 'Importantes para o equilíbrio hormonal e absorção de vitaminas.' },
]

export default function MacronutrientesPage() {
  return (
    <main className="app-frame detail-screen">
      <PageTopBar title="MINHA DIETA" backHref="/dieta" infoHref="/dieta/guia" />
      <section className="detail-title"><h1>Macronutrientes</h1><p>Acompanhe a distribuição dos macronutrientes e como eles contribuem para seus objetivos.</p><div className="status-balanced">✓ Seu consumo está <b>equilibrado</b></div></section>
      <section className="macro-detail-main card-soft"><div className="donut big"><span>72%<small>da meta</small></span></div><div><p><span className="blue-dot"/>Proteínas <b>132 g · 28%</b></p><p><span className="green-dot"/>Carboidratos <b>210 g · 45%</b></p><p><span className="orange-dot"/>Gorduras <b>48 g · 27%</b></p><small>Meta diária: 390 g · 2.550 kcal</small></div></section>
      <h2 className="subheading">Detalhamento por macronutriente</h2>
      {macros.map(({ name, value, goal, percent, color, foods, icon: Icon, text }) => <section className={`macro-line ${color}`} key={name}><div><Icon size={34}/><h3>{name}</h3><b>{value} <small>{goal}</small></b><strong>{percent}</strong><span className="progress"><i /></span><p>{text}</p></div><div className="food-bubbles"><small>Exemplos de alimentos</small>{foods.map(food => <span key={food}>{food}</span>)}</div></section>)}
      <div className="tip-card">💡 Dica Accqua: mantenha consistência nas escolhas e ajuste conforme sua evolução.</div>
      <BottomNav active="home" />
    </main>
  )
}
