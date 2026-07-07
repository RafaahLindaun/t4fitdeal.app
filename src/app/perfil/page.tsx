import Link from 'next/link'
import { BottomNav } from '@/components/BottomNav'
import { BrandHeader } from '@/components/Header'
import { Bell, ChevronRight, Gear, Lock, UserIcon } from '@/components/Icons'

const items = [
  { href: '/perfil/dados', title: 'Dados pessoais', desc: 'Atualize seus dados e informações', icon: UserIcon, blue: true },
  { href: '/perfil/notificacoes', title: 'Notificações', desc: 'Gerencie como você recebe avisos', icon: Bell },
  { href: '/perfil/seguranca', title: 'Segurança', desc: 'Altere sua senha e configurações', icon: Lock },
  { href: '/perfil/configuracoes', title: 'Configurações do app', desc: 'Ajustes gerais do aplicativo', icon: Gear },
  { href: '/perfil/ver', title: 'Ver perfil', desc: 'Veja suas informações e progresso', icon: UserIcon, blue: true },
]

export default function PerfilPage() {
  return (
    <main className="app-frame account-screen">
      <BrandHeader infoHref="/perfil" />
      <section className="account-title"><div><h1>Minha conta</h1><p>Gerencie suas informações e configurações</p></div><div className="account-avatar"><UserIcon/><strong>Aluno</strong><Link href="/perfil/ver">Ver perfil ›</Link></div></section>
      <section className="account-menu">
        {items.map(({ href, title, desc, icon: Icon, blue }) => <Link key={title} href={href} className="account-row"><Icon className={blue ? 'blue-icon' : ''}/><div><b>{title}</b><span>{desc}</span></div><ChevronRight/></Link>)}
        <button className="account-row exit"><span>↪</span><div><b>Sair da conta</b><span>Finalizar sessão no aplicativo</span></div><ChevronRight/></button>
      </section>
      <BottomNav active="perfil" />
    </main>
  )
}
