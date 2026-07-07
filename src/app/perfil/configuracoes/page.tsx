import { BottomNav } from '@/components/BottomNav'
import { PageTopBar } from '@/components/Header'
import { Gear } from '@/components/Icons'

const rows = [
  ['Tema', 'Escuro'],
  ['Idioma', 'Português'],
  ['Unidade de medida', 'Métrico (kg, cm)'],
  ['Som', 'Ativado'],
  ['Vibração', 'Ativada'],
]

export default function ConfiguracoesPage() {
  return (
    <main className="app-frame account-detail-screen">
      <PageTopBar title="Configurações" backHref="/perfil" />
      <section className="center-icon"><Gear/><p>Personalize sua experiência no app.</p></section>
      <section className="settings-list">
        {rows.map(([title, value]) => <button className="settings-row" key={title}><Gear/><div><b>{title}</b><small>{value}</small></div><em>›</em></button>)}
      </section>
      <div className="tip-card">ⓘ As alterações são salvas automaticamente.</div>
      <BottomNav active="perfil" />
    </main>
  )
}
