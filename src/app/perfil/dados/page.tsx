import { BottomNav } from '@/components/BottomNav'
import { PageTopBar } from '@/components/Header'
import { CalendarIcon, Mail, MapPin, Phone, UserIcon } from '@/components/Icons'

const rows = [
  { label: 'Nome completo', value: 'Aluno Exemplo', icon: UserIcon },
  { label: 'Data de nascimento', value: '01/01/1990', icon: CalendarIcon },
  { label: 'E-mail', value: 'aluno@email.com', icon: Mail },
  { label: 'Telefone', value: '(11) 99999-9999', icon: Phone },
  { label: 'CPF', value: '123.456.789-00', icon: '▣' },
  { label: 'Endereço', value: 'Rua Exemplo, 123\nSão Paulo - SP, 01234-567', icon: MapPin },
  { label: 'Plano', value: 'Mensal', icon: '▤' },
]

export default function DadosPage() {
  return (
    <main className="app-frame account-detail-screen">
      <PageTopBar title="Dados pessoais" backHref="/perfil" />
      <section className="center-icon"><UserIcon/><p>Mantenha seus dados sempre atualizados.</p></section>
      <section className="settings-list">
        {rows.map(({ label, value, icon }) => { const Icon = typeof icon === 'string' ? null : icon; return <button key={label} className="settings-row">{Icon ? <Icon/> : <span>{icon}</span>}<div><b>{label}</b><small>{value}</small></div><em>›</em></button> })}
      </section>
      <button className="outline-button">Editar dados</button>
      <BottomNav active="perfil" />
    </main>
  )
}
