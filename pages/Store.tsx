import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "../auth/AuthProvider";
import LoadingSplash from "../components/LoadingSplash";
import PageHeader from "../components/PageHeader";
import ResponsiveDialog from "../components/ResponsiveDialog";
import { MenuArrowIcon, MenuBagIcon } from "../components/MenuIcons";
import { loadStoreProducts, reserveProduct, type StoreProduct } from "../lib/store";
import "./store.css";

function BackIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function StarIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.7l2.55 5.17 5.7.83-4.13 4.02.98 5.68L12 16.72 6.9 19.4l.98-5.68L3.75 9.7l5.7-.83L12 3.7z" fill="currentColor"/></svg>}
function formatMoney(value:number){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(value)}

export default function Store(){
  const navigate=useNavigate(); const queryClient=useQueryClient(); const reduceMotion=useReducedMotion();
  const {user,loading,landingPath}=useAuth(); const [category,setCategory]=useState("todos"); const [confirmed,setConfirmed]=useState<StoreProduct|null>(null);
  const productsQuery=useQuery({queryKey:["store-products"],queryFn:()=>loadStoreProducts(false),enabled:Boolean(user?.id),staleTime:30_000});
  const reserveMutation=useMutation({mutationFn:(product:StoreProduct)=>reserveProduct(product.id),onSuccess:(_,product)=>{setConfirmed(product);void queryClient.invalidateQueries({queryKey:["store-products"]});void queryClient.invalidateQueries({queryKey:["my-reservations",user?.id]});},onError:(error:any)=>toast.error(error?.message?.includes("estoque")?"Esse item acabou de ficar sem estoque.":"Não foi possível reservar agora.")});
  const categories=useMemo(()=>["todos",...new Set((productsQuery.data??[]).map(p=>p.category).filter(Boolean))],[productsQuery.data]);
  const products=useMemo(()=>category==="todos"?(productsQuery.data??[]): (productsQuery.data??[]).filter(p=>p.category===category),[category,productsQuery.data]);
  if(loading||productsQuery.isLoading)return <LoadingSplash/>; if(!user)return <Navigate to="/login" replace/>; if(landingPath!=="/menu-teste")return <Navigate to={landingPath} replace/>;
  return <div className="store-screen"><div className="store-bg" aria-hidden="true"/><main className="store-shell">
    <PageHeader className="store-header" ariaLabel="Loja ACCQUA" left={<button className="store-header-button" type="button" onClick={()=>navigate("/menu-teste")} aria-label="Voltar"><BackIcon/></button>} center={<div className="store-header-title"><span>ACCQUA SPORTS</span><strong>Loja</strong></div>} right={<span className="store-header-icon"><MenuBagIcon size={23}/></span>}/>
    <div className="store-scroll">
      <section className="store-hero"><span>EXCLUSIVO PARA ALUNOS</span><h1>Reserve agora.<br/>Retire na recepção.</h1><p>Produtos ACCQUA e parceiros, sem pagamento pelo app nesta fase.</p></section>
      <div className="store-filter-row" role="tablist" aria-label="Categorias da loja">{categories.map(item=><button key={item} type="button" role="tab" aria-selected={category===item} className={category===item?"is-active":""} onClick={()=>setCategory(item)}>{item==="todos"?"Todos":item.replace(/_/g," ")}</button>)}</div>
      {products.length?<section className="store-grid" aria-label="Produtos disponíveis">{products.map(product=><motion.article key={product.id} className="store-card" whileTap={reduceMotion?undefined:{scale:.985}}>
        <div className="store-product-art">{product.imageUrl?<img src={product.imageUrl} alt={product.name} loading="lazy"/>:<span><MenuBagIcon size={38}/></span>}{product.discountPercent>0?<b>-{product.discountPercent}%</b>:null}</div>
        <div className="store-card-body"><small>{product.category.replace(/_/g," ")}</small><h2>{product.name}</h2>{product.description?<p>{product.description}</p>:null}
          <div className="store-rating"><StarIcon/><strong>{product.rating?product.rating.toFixed(1):"Novo"}</strong>{product.ratingCount>0?<span>({product.ratingCount})</span>:null}</div>
          <div className="store-price"><strong>{formatMoney(product.pixPrice)} <small>no Pix</small></strong>{product.originalPrice>product.pixPrice?<s>{formatMoney(product.originalPrice)}</s>:null}</div>
          <button type="button" className="store-reserve" disabled={product.stock<=0||reserveMutation.isPending} onClick={()=>reserveMutation.mutate(product)}><span>{product.stock<=0?"Sem estoque":"Reservar"}<small>{product.stock<=0?"Consulte a recepção":"Retire na recepção"}</small></span><MenuArrowIcon size={19}/></button>
          {product.purchaseEnabled?<button type="button" className="store-buy-future" onClick={()=>toast("Compra online será habilitada em breve.")}>Comprar online</button>:null}
        </div>
      </motion.article>)}</section>:<div className="store-empty"><MenuBagIcon size={34}/><strong>Nenhum produto nesta categoria</strong><p>Novos itens aparecem aqui assim que forem liberados.</p></div>}
    </div>
  </main>
  <ResponsiveDialog open={Boolean(confirmed)} onOpenChange={(open)=>{if(!open)setConfirmed(null)}} title="Reserva confirmada" description="Seu item ficou separado para retirada na recepção." closeButton={<button type="button" aria-label="Fechar">×</button>}>
    <div className="store-confirm"><span>✓</span><strong>{confirmed?.name}</strong><p>Apresente seu nome na recepção da ACCQUA para retirar. Se mudar de ideia, você pode cancelar pelo Perfil enquanto o status estiver como reservado.</p><button type="button" onClick={()=>{setConfirmed(null);navigate("/perfil")}}>Ver minhas reservas</button></div>
  </ResponsiveDialog>
  </div>
}
