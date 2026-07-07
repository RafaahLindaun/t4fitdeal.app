import { BottomNav } from '@/components/BottomNav'
import { PageTopBar } from '@/components/Header'
import { Bike, CalendarIcon, Fire, HeartPulse, Minus, Pause, Play, Plus, Stairs, Walk } from '@/components/Icons'

const cardio = [
  { label: 'Esteira', icon: '▰' },
  { label: 'Bike', icon: Bike },
  { label: 'Elíptico', icon: '⌁' },
  { label: 'Escada', icon: Stairs },
  { label: 'Remo', icon: '▱' },
  { label: 'Caminhada', icon: Walk },
]

export default function CardioPage() {
  return (
    <main className="app-frame cardio-screen">
      <PageTopBar title="CARDIO" backHref="/treino" right={<><button className="icon-button"><HeartPulse size={20}/></button><button className="icon-button"><CalendarIcon size={20}/></button><button className="goal-mini">Meta<br/><b>500 kcal</b></button></>} />
      <section className="exercise-title-row"><div><h1>Esteira</h1><p>Cardio guiado</p></div></section>

      <section className="cardio-hero-card">
        <span className="cardio-chip"><HeartPulse size={20}/> CARDIO</span>
        <div className="treadmill-figure">🏃‍♂️</div>
      </section>

      <section className="cardio-metrics">
        <div className="metric-tile"><Fire /><span>Kcal</span><b>350</b></div>
        <div className="time-ring"><small>Tempo</small><b>28:40</b><span>min</span></div>
        <div className="metric-tile"><span className="speedometer">⌁</span><span>Pace estimado</span><b>6:50</b><small>min/km</small></div>
      </section>

      <section className="time-config-card">
        <h2>Configurar tempo</h2>
        <div className="time-setter"><button><Minus /></button><strong>30:00<small>minutos</small></strong><button><Plus /></button></div>
        <div className="range-line"><span>5:00</span><div><i /></div><span>120:00</span></div>
        <p>Ajuste a duração do treino</p>
      </section>

      <section className="cardio-actions"><span className="ready-dot">● Pronto para iniciar</span><button className="outline-start"><Play />Iniciar cardio</button><button className="primary-pause"><Pause />Pausar cardio</button></section>

      <section className="cardio-options">
        {cardio.map((item, index) => {
          const Icon = typeof item.icon === 'string' ? null : item.icon
          return <button key={item.label} className={index === 0 ? 'selected' : ''}>{Icon ? <Icon /> : <span>{item.icon}</span>} {item.label}</button>
        })}
      </section>
      <BottomNav active="treino" />
    </main>
  )
}
