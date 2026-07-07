import { BottomNav } from '@/components/BottomNav'
import { PageTopBar } from '@/components/Header'
import { Bell } from '@/components/Icons'

const options = [
  ['Avisos gerais da academia', 'Novidades e comunicados', true],
  ['Lembretes de aulas', 'Avisos sobre suas aulas', true],
  ['Promoções e ofertas', 'Descontos e campanhas', false],
  ['Dicas de treino e saúde', 'Conteúdos e recomendações', true],
  ['Atualizações do app', 'Melhorias e novas funcionalidades', true],
  ['E-mails', 'Receber notificações por e-mail', true],
] as const

export default function NotificacoesPage() {
  return (
    <main className="app-frame account-detail-screen">
      <PageTopBar title="Notificações" backHref="/perfil" />
      <section className="center-icon"><Bell/><p>Escolha sobre o que deseja receber avisos.</p></section>
      <section className="settings-list toggles">
        {options.map(([title, desc, on]) => <label className="settings-row" key={title}><Bell/><div><b>{title}</b><small>{desc}</small></div><input type="checkbox" defaultChecked={on} /></label>)}
      </section>
      <div className="tip-card">ⓘ Você pode alterar suas preferências a qualquer momento.</div>
      <BottomNav active="perfil" />
    </main>
  )
}
