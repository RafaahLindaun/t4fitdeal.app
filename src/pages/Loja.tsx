import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell, { SmallIconButton } from "../components/AppShell";
import { Panel, SectionTitle } from "../components/ui";
import { getProducts } from "../lib/data";
import type { ProductItem } from "../types";

export default function Loja() {
  const [items, setItems] = useState<ProductItem[]>([]);
  useEffect(() => { getProducts().then(setItems); }, []);

  return (
    <AppShell title="Loja" subtitle="Produtos da academia, sem preço e somente para visualizar." action={<SmallIconButton to="/loja/info" label="Informação" icon="info" />}>
      <Panel>
        <SectionTitle title="Itens disponíveis" hint="Compra somente na recepção." />
        <div className="product-grid">
          {items.map((item) => (
            <div key={item.id} className="product-card">
              <div className="product-image">{item.title.charAt(0)}</div>
              <strong>{item.title}</strong>
              <span>{item.category}</span>
            </div>
          ))}
        </div>
        <Link className="mini-link top-space block" to="/loja/info">Ver explicação</Link>
      </Panel>
    </AppShell>
  );
}
