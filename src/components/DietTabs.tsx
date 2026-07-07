import Link from 'next/link'
import { cn } from '@/lib/utils'

export function DietTabs({ active }: { active: 'diaria' | 'semanal' | 'mensal' }) {
  const tabs = [
    { href: '/dieta', label: 'Diária', key: 'diaria' },
    { href: '/dieta/semanal', label: 'Semanal', key: 'semanal' },
    { href: '/dieta/mensal', label: 'Mensal', key: 'mensal' },
  ] as const
  return <div className="segmented-tabs">{tabs.map(t => <Link key={t.key} href={t.href} className={cn(active === t.key && 'active')}>{t.label}</Link>)}</div>
}
