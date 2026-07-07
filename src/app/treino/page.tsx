import Link from 'next/link'
import { BottomNav } from '@/components/BottomNav'
import { WorkoutTopBar } from '@/components/Header'
import { Check, ChevronRight, Clock, Dumbbell, Minus, Plus } from '@/components/Icons'

export default function TreinoPage() {
  return (
    <main className="app-frame workout-screen">
      <WorkoutTopBar title="TREINO A" />
      <section className="exercise-title-row">
        <div><h1>Rosca inclinada</h1><p>Halteres</p></div>
        <strong className="exercise-count">1/6</strong>
      </section>

      <section className="gif-card">
        <div className="exercise-figure">🏋️‍♂️</div>
        <span className="gif-label">GIF</span>
      </section>

      <section className="series-control">
        <button><Minus /></button>
        <div className="series-ring"><small>SÉRIE</small><b>2<span>/4</span></b></div>
        <button><Plus /></button>
      </section>

      <section className="metric-row three">
        <div className="metric-pill"><Dumbbell /><span>Repetições</span><b>8–12</b></div>
        <div className="metric-pill"><span className="weight-icon">▣</span><span>Carga</span><b>12 kg <em>♛</em></b></div>
        <div className="metric-pill muted"><Clock /><span>Descanso</span><b>60s</b></div>
      </section>

      <Link href="/treino" className="next-exercise-card">
        <div><small>Próximo exercício</small><b>Elevação lateral</b><span>Halteres</span></div>
        <div className="mini-figure">🏋️</div>
        <span className="next-round"><ChevronRight /></span>
      </Link>

      <button className="primary-button finish-button"><span>Concluir série</span><Check /></button>
      <BottomNav active="treino" />
    </main>
  )
}
