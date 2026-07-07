import Link from 'next/link'
import { CalendarIcon, Dumbbell, HomeIcon, Trophy, UserIcon } from './Icons'
import { cn } from '@/lib/utils'

const items = [
  { href: '/home', label: 'Início', icon: HomeIcon, key: 'home' },
  { href: '/treino', label: 'Treino', icon: Dumbbell, key: 'treino' },
  { href: '/aulas', label: 'Aulas', icon: CalendarIcon, key: 'aulas' },
  { href: '/ranking', label: 'Ranking', icon: Trophy, key: 'ranking' },
  { href: '/perfil', label: 'Perfil', icon: UserIcon, key: 'perfil' },
]

export function BottomNav({ active = 'home' }: { active?: string }) {
  return (
    <nav className="bottom-nav">
      {items.map(({ href, label, icon: Icon, key }) => (
        <Link key={key} href={href} className={cn('nav-item', active === key && 'active')}>
          <Icon size={25} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  )
}
