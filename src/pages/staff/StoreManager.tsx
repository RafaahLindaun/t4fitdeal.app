import { useEffect, useState, type FormEvent } from "react";
import StaffShell from "../../components/StaffShell";
import { Card } from "../../components/AppShell";
import Icon from "../../components/Icon";
import Modal from "../../components/Modal";
import { InputField, SelectField, TextareaField } from "../../components/Field";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

interface Item{id:string;name:string;category:string;description:string|null;image_url:string|null;active:boolean;position:number;stock_status:string;}
const blank:any={name:"",category:"Suplementos",description:"",image_url:"",active:true,position:0,stock_status:"available"};
export default function StoreManager(){
 const {profile}=useAuth();const [items,setItems]=useState<Item[]>([]);const [open,setOpen]=useState(false);const [editing,setEditing]=useState<string|null>(null);const [form,setForm]=useState(blank);
 async function load(){const {data}=await supabase.from("store_items").select("*").order("position");setItems((data||[]) as Item[]);}useEffect(()=>{void load();},[]);
 function create(){setEditing(null);setForm(blank);setOpen(true);}function edit(item:Item){setEditing(item.id);setForm({...item});setOpen(true);}
 async function save(e:FormEvent){e.preventDefault();const payload={...form,updated_by:profile?.id};if(editing)await supabase.from("store_items").update(payload).eq("id",editing);else await supabase.from("store_items").insert(payload);setOpen(false);await load();}
 async function remove(id:string){if(confirm("Remover o item da loja?")){await supabase.from("store_items").delete().eq("id",id);await load();}}
 return <StaffShell title="Gerenciar loja" subtitle="Somente a recepção e administradores alteram o catálogo." right={<button className="button primary small" onClick={create}><Icon name="plus"/> Item</button>}>
  <div className="manager-grid">{items.map(item=><Card key={item.id} className={!item.active?"disabled-item":""}><div className="manager-image">{item.image_url?<img src={item.image_url}/>:<Icon name="bag" size={46}/>}</div><div><strong>{item.name}</strong><small>{item.category} · {item.stock_status}</small><p>{item.description}</p></div><div><button className="icon-button" onClick={()=>edit(item)}><Icon name="edit"/></button><button className="icon-button danger" onClick={()=>void remove(item.id)}><Icon name="trash"/></button></div></Card>)}</div>
  <Modal open={open} title={editing?"Editar item":"Adicionar item"} onClose={()=>setOpen(false)} wide><form className="form-grid" onSubmit={save}><InputField label="Nome" required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><SelectField label="Categoria" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}><option>Whey</option><option>Creatina</option><option>Energéticos</option><option>Roupas</option><option>Acessórios</option><option>Suplementos</option></SelectField><InputField label="URL da foto" value={form.image_url||""} onChange={e=>setForm({...form,image_url:e.target.value})}/><SelectField label="Estoque" value={form.stock_status} onChange={e=>setForm({...form,stock_status:e.target.value})}><option value="available">Disponível</option><option value="low">Poucas unidades</option><option value="unavailable">Indisponível</option></SelectField><InputField label="Ordem" type="number" value={form.position} onChange={e=>setForm({...form,position:Number(e.target.value)})}/><label className="toggle-row"><span><strong>Exibir no app</strong></span><input type="checkbox" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})}/><i/></label><TextareaField label="Descrição" value={form.description||""} onChange={e=>setForm({...form,description:e.target.value})}/><button className="button primary span-2">Salvar item</button></form></Modal>
 </StaffShell>;
}
