import { Header, Screen, Card, BottomNav } from "../components/Layout";
import { Icon } from "../components/Icon";
import { shopItems } from "../data/appData";

export default function Loja() {
  return (
    <Screen>
      <Header infoTo="/loja/info" />
      <div className="page-title"><h1>Loja</h1><p>Visualize os itens da academia</p></div>
      <div className="shop-tabs"><span className="shop-tab active"><Icon name="weight"/>Whey</span><span className="shop-tab"><Icon name="spark"/>Creatina</span><span className="shop-tab"><Icon name="bolt"/>Energéticos</span><span className="shop-tab"><Icon name="shirt"/>Roupas</span></div>
      <section className="shop-grid">{shopItems.map(i=><Card className="shop-card" key={i.name}><div className="product-img"><Icon name={i.icon} size={76}/></div><div><h2>{i.name}</h2><p>{i.category}</p></div></Card>)}</section>
      <BottomNav active="inicio" />
    </Screen>
  );
}
