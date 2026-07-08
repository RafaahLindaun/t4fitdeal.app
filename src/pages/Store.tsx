import { useEffect, useMemo, useState } from "react";
import AppShell, { Card } from "../components/AppShell";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icon";
import { supabase } from "../lib/supabase";

interface StoreItem { id:string;name:string;category:string;description:string|null;image_url:string|null;active:boolean;stock_status:string; }
export default function Store(){
 const [items,setItems]=useState<StoreItem[]>([]);const [category,setCategory]=useState("Todos");const [info,setInfo]=useState(false);const [loading,setLoading]=useState(true);
 useEffect(()=>{void (async()=>{const {data}=await supabase.from("store_items").select("*").eq("active",true).order("position");setItems((data||[]) as StoreItem[]);setLoading(false);})();},[]);
 const categories=useMemo(()=>["Todos",...Array.from(new Set(items.map(x=>x.category)))],[items]);const visible=category==="Todos"?items:items.filter(x=>x.category===category);
 return <AppShell title="Loja" subtitle="Visualize os itens disponíveis na academia" back right={<button className="icon-button" onClick={()=>setInfo(!info)}><Icon name="info"/></button>}>
  {info&&<Card className="store-info"><Icon name="info"/><div><strong>Somente visualização</strong><p>Os itens são comprados e retirados exclusivamente na recepção. A disponibilidade depende do estoque atual.</p></div></Card>}
  <div className="filter-chips">{categories.map(x=><button key={x} className={category===x?"active":""} onClick={()=>setCategory(x)}>{x}</button>)}</div>
  {loading?<div className="skeleton hero"/>:visible.length===0?<EmptyState icon="bag" title="Nenhum item disponível" text="A recepção ainda não publicou itens nesta categoria."/>:<div className="store-grid">{visible.map(item=><Card key={item.id} className="store-item"><div className="store-image">{item.image_url?<img src={item.image_url}/>:<Icon name={item.category.toLowerCase().includes("roup")?"user":"bag"} size={48}/>}</div><h2>{item.name}</h2><p>{item.description}</p><small>{item.category} · {item.stock_status==="available"?"Disponível":"Consulte a recepção"}</small></Card>)}</div>}
 </AppShell>;
}
