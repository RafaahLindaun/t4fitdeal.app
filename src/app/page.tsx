import Link from 'next/link'
import { AccquaLogo } from '@/components/AccquaLogo'
import { Apple, CalendarIcon, Dumbbell, Lock, UserIcon, Chart } from '@/components/Icons'

export default function LoginPage() {
  return (
    <main className="login-screen">
      <AccquaLogo />
      <section className="login-hero">
        <h1>Bem-vindo ao app<br />da <span>Accqua Sports</span></h1>
        <p>Treinos, evolução, aulas e orientações em um só lugar.</p>
      </section>

      <div className="access-card">
        <div className="round-icon"><Lock size={30} /></div>
        <div>
          <strong>Acesso exclusivo para alunos matriculados</strong>
          <p>Seu acesso é liberado de acordo com sua matrícula ativa na academia.</p>
        </div>
      </div>

      <form className="login-form">
        <label className="input-line"><UserIcon size={22} /><input placeholder="CPF, e-mail ou telefone" /></label>
        <label className="input-line"><Lock size={22} /><input placeholder="Senha" type="password" /></label>
        <Link className="primary-button" href="/home">Entrar</Link>
        <Link className="outline-button" href="/home">Primeiro acesso</Link>
      </form>

      <section className="login-features">
        <span />
        <p>No app, você pode:</p>
        <span />
        <div className="feature-mini-grid">
          <div><Dumbbell /><b>Treino</b><small>Acesse seus treinos.</small></div>
          <div><Apple /><b>Dieta</b><small>Veja sua dieta.</small></div>
          <div><CalendarIcon /><b>Aulas</b><small>Confira horários.</small></div>
          <div><Chart /><b>Evolução</b><small>Acompanhe resultados.</small></div>
        </div>
      </section>

      <p className="login-help">Problemas para acessar? <b>Fale com a recepção.</b></p>
    </main>
  )
}
