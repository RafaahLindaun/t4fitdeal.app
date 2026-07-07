import { BottomNav } from '@/components/BottomNav'
import { BrandHeader } from '@/components/Header'
import { ArrowLeft, CalendarIcon, Dumbbell, Info, Message, UserIcon } from '@/components/Icons'
import Link from 'next/link'

export default function PersonalDetailPage() {
  return (
    <main className="app-frame personal-detail-screen">
      <Link href="/personal" className="float-back"><ArrowLeft /></Link>
      <BrandHeader infoHref="/personal" />
      <section className="coach-hero card-soft"><span className="badge-yellow">★ Mais procurado</span><div className="coach-photo">R</div><h1>Rafael</h1><p>Hipertrofia e força</p><p>Sou apaixonado por ajudar pessoas a se tornarem mais fortes no corpo e na mente. Com mais de 5 anos de experiência, meu foco é construir treinos seguros e personalizados.</p><div className="coach-tags"><span>🏆 5 anos</span><span>☀️ Manhã</span><span>☆ Avaliação 4,9</span></div></section>
      <section className="info-cards"><article><UserIcon/><h2>Sobre mim</h2><p>Formado em Educação Física e pós-graduado em Fisiologia do Exercício.</p></article><article><Dumbbell/><h2>Especialidades</h2><p>Hipertrofia, força, periodização e acompanhamento de evolução.</p></article><article><Info/><h2>Para quem indico</h2><p>Iniciantes e praticantes que querem evoluir com segurança.</p></article></section>
      <button className="primary-button"><Message/> Chamar personal</button><button className="outline-button"><CalendarIcon/> Ver horários disponíveis</button>
      <BottomNav active="home" />
    </main>
  )
}
