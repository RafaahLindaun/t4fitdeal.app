import { useMemo, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "../auth/AuthProvider";
import LoadingSplash from "../components/LoadingSplash";
import PageHeader from "../components/PageHeader";
import ResponsiveDialog from "../components/ResponsiveDialog";
import {
  loadRecipeImageReviewQueue, loadStaffReservations, loadStoreProducts, saveProduct, setRecipeImageValidated,
  staffSetReservationStatus, validateRecipeImageWithAI, type ProductInput, type RecipeImageReview, type StoreProduct,
} from "../lib/store";
import "./store-admin.css";

type Tab="produtos"|"reservas"|"receitas";
const blank:ProductInput={name:"",description:"",category:"camisa",originalPrice:0,pixPrice:0,stock:0,imageUrl:"",active:true,purchaseEnabled:false,rating:0,ratingCount:0};
function money(v:number){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v)}
function Back(){return <svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}

export default function StoreAdmin(){
 const navigate=useNavigate();const qc=useQueryClient();const {user,profile,loading}=useAuth();const staff=profile&&["professor","admin","reception"].includes(profile.role);
 const [tab,setTab]=useState<Tab>("produtos");const [editing,setEditing]=useState<StoreProduct|null>(null);const [form,setForm]=useState<ProductInput>(blank);const [aiBusy,setAiBusy]=useState("");
 const products=useQuery({queryKey:["staff-products"],queryFn:()=>loadStoreProducts(true),enabled:Boolean(staff)});
 const reservations=useQuery({queryKey:["staff-reservations"],queryFn:loadStaffReservations,enabled:Boolean(staff)});
 const recipes=useQuery({queryKey:["recipe-image-review"],queryFn:loadRecipeImageReviewQueue,enabled:Boolean(staff)});
 const save=useMutation({mutationFn:()=>saveProduct(form,editing?.id),onSuccess:()=>{toast.success("Produto salvo.");setEditing(null);setForm(blank);void qc.invalidateQueries({queryKey:["staff-products"]});void qc.invalidateQueries({queryKey:["store-products"]})},onError:()=>toast.error("Não foi possível salvar o produto.")});
 const status=useMutation({mutationFn:({id,next}:{id:string;next:"retirado"|"cancelado"})=>staffSetReservationStatus(id,next),onSuccess:()=>{toast.success("Reserva atualizada.");void qc.invalidateQueries({queryKey:["staff-reservations"]});void qc.invalidateQueries({queryKey:["staff-products"]})}});
 const pendingReservations=useMemo(()=>reservations.data??[],[reservations.data]);
 if(loading)return <LoadingSplash/>;if(!user)return <Navigate to="/login" replace/>;if(!staff)return <Navigate to="/menu-teste" replace/>;
 const openNew=()=>{setEditing({id:"",name:"",description:"",category:"camisa",originalPrice:0,pixPrice:0,discountPercent:0,rating:0,ratingCount:0,stock:0,imageUrl:"",active:true,purchaseEnabled:false});setForm(blank)};
 const openEdit=(p:StoreProduct)=>{setEditing(p);setForm({name:p.name,description:p.description,category:p.category,originalPrice:p.originalPrice,pixPrice:p.pixPrice,stock:p.stock,imageUrl:p.imageUrl,active:p.active,purchaseEnabled:p.purchaseEnabled,rating:p.rating,ratingCount:p.ratingCount})};
 const submit=(e:FormEvent)=>{e.preventDefault();if(!form.name.trim()||form.originalPrice<=0||form.pixPrice<=0){toast.error("Preencha nome e preços válidos.");return}save.mutate()};
 const reviewAI=async(recipe:RecipeImageReview)=>{setAiBusy(recipe.id);try{const result=await validateRecipeImageWithAI(recipe);toast(result.match?`Imagem compatível (${Math.round(result.score*100)}%).`:`Revisar imagem (${Math.round(result.score*100)}%).`);await qc.invalidateQueries({queryKey:["recipe-image-review"]})}catch{toast.error("Não foi possível validar com IA.")}finally{setAiBusy("")}};
 return <div className="store-admin-screen"><main className="store-admin-shell">
   <PageHeader className="store-admin-header" left={<button onClick={()=>navigate("/area-accqua")} aria-label="Voltar"><Back/></button>} center={<div><span>ÁREA ACCQUA</span><strong>Loja & catálogo</strong></div>} right={<span/>}/>
   <nav className="store-admin-tabs">{(["produtos","reservas","receitas"] as Tab[]).map(x=><button key={x} className={tab===x?"is-active":""} onClick={()=>setTab(x)}>{x==="receitas"?"QA receitas":x[0].toUpperCase()+x.slice(1)}</button>)}</nav>
   <div className="store-admin-scroll">
    {tab==="produtos"?<><div className="store-admin-section-title"><div><small>CATÁLOGO</small><h1>Produtos</h1></div><button onClick={openNew}>+ Novo</button></div><div className="store-admin-list">{(products.data??[]).map(p=><article key={p.id}><div className="store-admin-thumb">{p.imageUrl?<img src={p.imageUrl} alt=""/>:"•"}</div><div><strong>{p.name}</strong><span>{money(p.pixPrice)} · estoque {p.stock}</span><small>{p.active?"Ativo":"Desativado"}</small></div><button onClick={()=>openEdit(p)}>Editar</button></article>)}</div></>:null}
    {tab==="reservas"?<><div className="store-admin-section-title"><div><small>RETIRADA</small><h1>Reservas</h1></div><span>{pendingReservations.filter(r=>r.status==="reservado").length} pendentes</span></div><div className="store-admin-list">{pendingReservations.map(r=><article key={r.id}><div className="store-admin-thumb">{r.product?.imageUrl?<img src={r.product.imageUrl} alt=""/>:"•"}</div><div><strong>{r.studentName}</strong><span>{r.product?.name??"Produto"}</span><small>{new Date(r.reservedAt).toLocaleString("pt-BR")} · {r.status}</small></div>{r.status==="reservado"?<div className="store-admin-row-actions"><button onClick={()=>status.mutate({id:r.id,next:"retirado"})}>Retirado</button><button className="danger" onClick={()=>status.mutate({id:r.id,next:"cancelado"})}>Cancelar</button></div>:null}</article>)}</div></>:null}
    {tab==="receitas"?<><div className="store-admin-section-title"><div><small>CONTROLE VISUAL</small><h1>Receitas</h1></div><span>{(recipes.data??[]).filter(r=>r.validated).length}/{recipes.data?.length??0} validadas</span></div><p className="store-admin-note">Receitas não validadas ficam fora do catálogo do aluno. Compare nome e foto antes de aprovar; a IA apenas sinaliza, a decisão final continua humana.</p><div className="recipe-review-grid">{(recipes.data??[]).map(r=><article key={r.id} className={r.validated?"is-valid":""}><div className="recipe-review-img">{r.imageUrl?<img src={r.imageUrl} alt={r.name}/>:<span>Sem imagem</span>}</div><div><strong>{r.name}</strong><div className="recipe-review-tags">{r.objectiveTags.slice(0,2).map(tag=><span key={tag}>{tag.replaceAll("_"," ")}</span>)}{r.mealCategory?<span>{r.mealCategory.replaceAll("_"," ")}</span>:null}</div>{r.aiScore!=null?<small>IA: {Math.round(r.aiScore*100)}% · {r.aiReason||"sem observação"}</small>:<small>Ainda não analisada</small>}</div><div className="recipe-review-actions"><button disabled={!r.imageUrl||aiBusy===r.id} onClick={()=>void reviewAI(r)}>{aiBusy===r.id?"Analisando...":"Validar com IA"}</button><button className={r.validated?"danger":"approve"} onClick={async()=>{await setRecipeImageValidated(r.id,!r.validated);void qc.invalidateQueries({queryKey:["recipe-image-review"]});void qc.invalidateQueries({queryKey:["diet-dashboard"]})}}>{r.validated?"Remover aprovação":"Aprovar imagem"}</button></div></article>)}</div></>:null}
   </div>
 </main>
 <ResponsiveDialog open={Boolean(editing)} onOpenChange={(open)=>{if(!open){setEditing(null);setForm(blank)}}} title={editing?.id?"Editar produto":"Novo produto"} description="Dados exibidos para os alunos na Loja." closeButton={<button aria-label="Fechar">×</button>}>
  <form className="store-product-form" onSubmit={submit}><label>Nome<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>Descrição<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label><div><label>Categoria<input value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/></label><label>Estoque<input type="number" min="0" value={form.stock} onChange={e=>setForm({...form,stock:Number(e.target.value)})}/></label></div><div><label>Preço original<input type="number" min="0" step="0.01" value={form.originalPrice} onChange={e=>setForm({...form,originalPrice:Number(e.target.value)})}/></label><label>Preço Pix<input type="number" min="0" step="0.01" value={form.pixPrice} onChange={e=>setForm({...form,pixPrice:Number(e.target.value)})}/></label></div><label>URL da imagem<input value={form.imageUrl} onChange={e=>setForm({...form,imageUrl:e.target.value})}/></label><div className="store-product-checks"><label><input type="checkbox" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})}/> Produto ativo</label><label><input type="checkbox" checked={form.purchaseEnabled} onChange={e=>setForm({...form,purchaseEnabled:e.target.checked})}/> Compra online (feature flag)</label></div><button type="submit" disabled={save.isPending}>{save.isPending?"Salvando...":"Salvar produto"}</button></form>
 </ResponsiveDialog>
 </div>
}
