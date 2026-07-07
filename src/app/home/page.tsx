import Link from 'next/link'
import { AccquaLogo } from '@/components/AccquaLogo'
import { BottomNav } from '@/components/BottomNav'
import { Apple, Bag, Bell, Clipboard, Dumbbell, Gear, Shield, Trophy } from '@/components/Icons'

const cards = [
  { href: '/treino', title: 'Meu treino', icon: Dumbbell },
  { href: '/dieta', title: 'Minha dieta', icon: Apple },
  { href: '/ranking', title: 'Ranking', icon: Trophy, badge: 'Novidade' },
  { href: '/personal', title: 'Área personal', icon: Clipboard },
  { href: '/loja', title: 'Loja', icon: Bag },
  { href: '/perfil', title: 'Configuração', icon: Gear },
]

export default function HomePage() {
  return (
    <main className="app-frame home-screen">
      <header className="home-header">
        <AccquaLogo />
        <button className="icon-button has-dot"><Bell size={25} /></button>
      </header>

      <section className="welcome-block">
        <h1>Olá, Aluno</h1>
        <p>Seu app da academia</p>
      </section>

      <section className="status-card">
        <div className="round-icon"><Shield size={34} /></div>
        <div>
          <strong>Matrícula ativa</strong>
          <p><span className="dot" /> Acesso liberado</p>
        </div>
      </section>

      <section className="home-grid">
        {cards.map(({ href, title, icon: Icon, badge }) => (
          <Link href={href} className="home-card" key={title}>
            <Icon size={43} />
            <b>{title}</b>
            {badge && <span className="badge-yellow">{badge}</span>}
            <span className="chev">›</span>
          </Link>
        ))}
      </section>

      <BottomNav active="home" />
    </main>
  )
}
