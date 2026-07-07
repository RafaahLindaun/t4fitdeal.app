import { BottomNav } from '@/components/BottomNav'
import { PageTopBar } from '@/components/Header'
import { CalendarIcon, Clipboard, Clock, Dumbbell, Fire, UserIcon } from '@/components/Icons'

export default function VerPerfilPage() {
  return (
    <main className="app-frame account-detail-screen profile-view-screen">
      <PageTopBar title="Meu perfil" backHref="/perfil" />
      <section className="profile-view-head"><div className="avatar big"><UserIcon/></div><h1>Aluno Exemplo</h1><span className="badge-blue">Aluno</span><p>Membro desde jan/2024</p></section>
      <section className="profile-stats"><div><Dumbbell/><b>48</b><small>Treinos</small></div><div><CalendarIcon/><b>32</b><small>Aulas</small></div><div><Fire/><b>28</b><small>Dias ativos</small></div><div><Clock/><b>12</b><small>Sequência</small></div></section>
      <section className="settings-list">
        <button className="settings-row"><Clipboard/><div><b>Meus objetivos</b><small>Ver e acompanhar</small></div><em>›</em></button>
        <button className="settings-row"><Clipboard/><div><b>Medidas e avaliações</b><small>Acompanhe seu progresso</small></div><em>›</em></button>
        <button className="settings-row"><Clock/><div><b>Histórico</b><small>Treinos, aulas e check-ins</small></div><em>›</em></button>
      </section>
      <button className="danger-button">Sair da conta</button>
      <BottomNav active="perfil" />
    </main>
  )
}
