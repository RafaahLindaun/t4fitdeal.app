import { Header, Screen, Card } from "../components/Layout";
import { Icon } from "../components/Icon";

export default function LojaInfo() {
  return (
    <Screen>
      <Header />
      <div className="page-title"><h1>Como funciona a loja</h1><p>Veja como adquirir os itens da academia.</p></div>
      <Card className="status-card"><Icon name="eye" className="yellow" size={48}/><h2>Os itens exibidos no app são apenas para <span className="yellow">visualização.</span></h2></Card>
      <Card className="status-card"><Icon name="user" className="yellow" size={48}/><h2>As compras são feitas somente na <span className="yellow">recepção da academia.</span></h2></Card>
      <section className="guide-grid"><Card className="guide-tile"><Icon name="weight" size={56}/><h2>Veja os produtos</h2><p>Explore whey, creatina, energéticos, roupas e acessórios.</p></Card><Card className="guide-tile"><Icon name="bag" size={56}/><h2>Escolha o item</h2><p>Confira o que você deseja comprar.</p></Card><Card className="guide-tile"><Icon name="user" size={56}/><h2>Vá à recepção</h2><p>Solicite o produto presencialmente.</p></Card><Card className="guide-tile"><Icon name="shield" size={56}/><h2>Finalize a compra</h2><p>Pagamento e retirada direto na academia.</p></Card></section>
    </Screen>
  );
}
