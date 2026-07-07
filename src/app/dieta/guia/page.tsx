import { BottomNav } from '@/components/BottomNav'
import { PageTopBar } from '@/components/Header'
import { Apple, Chart, Fire, Leaf } from '@/components/Icons'

const guide = [
  { title: 'Análise nutricional', text: 'Aqui você vê calorias, macros e como sua alimentação está distribuída no dia.', icon: Chart },
  { title: 'Você molda seu futuro', text: 'Acompanhe sua evolução e crie hábitos melhores para chegar nos seus objetivos.', icon: '🏁' },
  { title: 'Escolha seus alimentos', text: 'Selecione alimentos e entenda se está comendo bem de forma prática e visual.', icon: Apple },
  { title: 'Receitas incríveis', text: 'Descubra receitas práticas e nutritivas para variar sua rotina com sabor.', icon: '👨‍🍳' },
]

export default function DietaGuiaPage() {
  return (
    <main className="app-frame guide-screen">
      <PageTopBar title="MINHA DIETA" backHref="/dieta" />
      <section className="guide-title"><h1>Como usar Minha Dieta</h1><span className="premium-pill">☆ Premium</span><p>Entenda cada seção da sua página e aproveite ao máximo sua jornada de saúde e performance.</p></section>
      <section className="guide-grid">
        {guide.map((item) => {
          const Icon = typeof item.icon === 'string' ? null : item.icon
          return <div className="guide-card" key={item.title}><div className="guide-icon">{Icon ? <Icon size={58}/> : <span>{item.icon}</span>}</div><h2>{item.title}</h2><p>{item.text}</p></div>
        })}
      </section>
      <BottomNav active="home" />
    </main>
  )
}
