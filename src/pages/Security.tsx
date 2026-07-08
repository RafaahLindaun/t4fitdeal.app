import { useState, type FormEvent } from "react";
import AppShell from "../components/AppShell";
import Icon from "../components/Icon";
import Modal from "../components/Modal";
import { InputField } from "../components/Field";
import { supabase } from "../lib/supabase";

export default function Security(){
 const [passwordOpen,setPasswordOpen]=useState(false);const [password,setPassword]=useState("");const [confirm,setConfirm]=useState("");const [message,setMessage]=useState("");
 async function change(e:FormEvent){e.preventDefault();if(password.length<8||password!==confirm){setMessage("As senhas precisam ser iguais e ter pelo menos 8 caracteres.");return;}const {error}=await supabase.auth.updateUser({password});setMessage(error?error.message:"Senha alterada com sucesso.");if(!error){setPassword("");setConfirm("");}}
 async function otherSessions(){const {error}=await supabase.auth.signOut({scope:"others"});setMessage(error?error.message:"Outras sessões foram encerradas.");}
 return <AppShell title="Segurança" subtitle="Proteja sua conta e seus dados" back>
  <div className="security-hero"><Icon name="shield" size={48}/><p>Nunca compartilhe sua senha ou códigos de acesso.</p></div>
  {message&&<div className={`form-message ${message.includes("sucesso")||message.includes("encerradas")?"success":"error"}`}>{message}</div>}
  <div className="account-menu"><button onClick={()=>setPasswordOpen(true)}><span><Icon name="lock"/></span><div><strong>Alterar senha</strong><small>Crie uma nova senha para sua conta</small></div><Icon name="next"/></button><button onClick={otherSessions}><span><Icon name="logout"/></span><div><strong>Encerrar outras sessões</strong><small>Saia da sua conta em outros aparelhos</small></div><Icon name="next"/></button></div>
  <Modal open={passwordOpen} title="Alterar senha" onClose={()=>setPasswordOpen(false)}><form className="form-grid one-column" onSubmit={change}><InputField label="Nova senha" type="password" value={password} onChange={e=>setPassword(e.target.value)}/><InputField label="Confirmar senha" type="password" value={confirm} onChange={e=>setConfirm(e.target.value)}/><button className="button primary">Salvar nova senha</button></form></Modal>
 </AppShell>;
}
