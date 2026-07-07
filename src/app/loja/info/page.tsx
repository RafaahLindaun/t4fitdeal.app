import Link from 'next/link'
import { BrandHeader } from '@/components/Header'
import { ArrowLeft, Bag, Check, Clipboard, Info, UserIcon } from '@/components/Icons'

export default function LojaInfoPage() {
  return (
    <main className="app-frame info-store-screen">
      <Link href="/loja" className="float-back"><ArrowLeft /></Link>
      <BrandHeader />
      <section className="section-title"><h1>Como funciona a loja</h1><p>Veja como adquirir os itens da academia.</p></section>
      <div className="info-banner"><Info/><b>Os itens exibidos no app são apenas para <span>visualização</span>.</b></div>
      <div className="info-banner"><UserIcon/><b>As compras são feitas somente na <span>recepção da academia</span>.</b></div>
      <section className="steps-grid"><article><Bottle/><b>Veja os produtos</b><p>Explore whey, creatina, energéticos, roupas e acessórios.</p></article><article><Bag/><b>Escolha o item</b><p>Confira o que você deseja comprar.</p></article><article><UserIcon/><b>Vá à recepção</b><p>Solicite o produto presencialmente.</p></article><article><Check/><b>Finalize a compra</b><p>Pagamento e retirada diretamente na academia.</p></article></section>
      <div className="tip-card">• Disponibilidade sujeita ao estoque da recepção.<br/>• Dúvidas? Fale com nossa equipe na academia.</div>
    </main>
  )
}
