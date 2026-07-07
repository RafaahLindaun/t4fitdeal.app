import Link from 'next/link'
import { AccquaLogo } from './AccquaLogo'
import { ArrowLeft, Info, Bell, CalendarIcon, HeartPulse } from './Icons'

export function BrandHeader({ infoHref, showBell = false }: { infoHref?: string; showBell?: boolean }) {
  return (
    <header className="brand-header">
      <div />
      <AccquaLogo />
      {infoHref ? (
        <Link className="icon-button" href={infoHref} aria-label="Informações"><Info size={24} /></Link>
      ) : showBell ? (
        <button className="icon-button has-dot" aria-label="Notificações"><Bell size={24} /></button>
      ) : <div />}
    </header>
  )
}

export function PageTopBar({ title, backHref = '/home', infoHref, right }: { title: string; backHref?: string; infoHref?: string; right?: React.ReactNode }) {
  return (
    <header className="page-topbar">
      <Link className="round-back" href={backHref} aria-label="Voltar"><ArrowLeft size={25} /></Link>
      <div className="topbar-brand"><AccquaLogo small /><span className="brand-separator" /><span>{title}</span></div>
      <div className="topbar-actions">{right}{infoHref && <Link className="icon-button" href={infoHref}><Info size={22} /></Link>}</div>
    </header>
  )
}

export function WorkoutTopBar({ title, modeHref = '/cardio' }: { title: string; modeHref?: string }) {
  return (
    <header className="page-topbar workout-bar">
      <Link className="round-back" href="/home"><ArrowLeft size={25} /></Link>
      <div className="topbar-brand"><AccquaLogo small /><span className="brand-separator" /><span>{title}</span></div>
      <div className="topbar-actions compact-actions">
        <Link className="icon-button" href={modeHref} aria-label="Modo"><HeartPulse size={20} /></Link>
        <Link className="icon-button" href="/aulas" aria-label="Calendário"><CalendarIcon size={20} /></Link>
      </div>
    </header>
  )
}
