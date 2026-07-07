import { BottomNav } from '@/components/BottomNav'
import { PageTopBar } from '@/components/Header'
import { Lock, Shield } from '@/components/Icons'

const rows = [
  ['Alterar senha', 'Crie uma nova senha para sua conta'],
  ['Autenticação em duas etapas', 'Mais segurança para sua conta · Ativada'],
  ['Dispositivos conectados', 'Gerencie seus dispositivos'],
  ['Encerrar sessão em outros dispositivos', 'Saia da sua conta em outros lugares'],
]

export default function SegurancaPage() {
  return (
    <main className="app-frame account-detail-screen">
      <PageTopBar title="Segurança" backHref="/perfil" />
      <section className="center-icon"><Shield/><p>Proteja sua conta e mantenha seus dados seguros.</p></section>
      <section className="settings-list">
        {rows.map(([title, desc]) => <button className="settings-row" key={title}><Lock/><div><b>{title}</b><small>{desc}</small></div><em>›</em></button>)}
      </section>
      <div className="tip-card">ⓘ Nunca compartilhe sua senha com outras pessoas.</div>
      <BottomNav active="perfil" />
    </main>
  )
}
