import { Link } from "react-router-dom";
import AppShell, { Card } from "../components/AppShell";
import Icon from "../components/Icon";
import { useAuth } from "../context/AuthContext";
import { roleLabel } from "../lib/permissions";

const rows=[
 ["/dados-pessoais","user","Dados pessoais","Nome, CPF, telefones e informações"],
 ["/notificacoes","bell","Notificações","Escolha os avisos que deseja receber"],
 ["/seguranca","shield","Segurança","Senha e sessões da conta"],
 ["/configuracoes","settings","Configurações do app","Ajustes gerais do aplicativo"],
] as const;
export default function Account(){
 const {profile,isStaff,signOut}=useAuth();
 return <AppShell title="Minha conta" subtitle="Gerencie suas informações e configurações" right={<a className="icon-button" href="https://wa.me/551147181730" target="_blank" rel="noreferrer"><Icon name="message"/></a>}>
  <Card className="account-profile"><div className="account-avatar">{profile?.avatar_url?<img src={profile.avatar_url}/>:<Icon name="user" size={45}/>}</div><div><strong>{profile?.full_name||"Aluno"}</strong><span>{roleLabel(profile?.role)}</span><Link to="/perfil">Ver perfil <Icon name="next"/></Link></div></Card>
  <div className="account-menu">{rows.map(([to,icon,title,text])=><Link to={to} key={to}><span><Icon name={icon}/></span><div><strong>{title}</strong><small>{text}</small></div><Icon name="next"/></Link>)}</div>
  {isStaff&&<Link className="team-access card" to="/equipe"><Icon name="users"/><div><strong>Área da equipe</strong><small>Alunos, treinos e gerenciamento</small></div><Icon name="next"/></Link>}
  <button className="button danger large" onClick={()=>void signOut()}><Icon name="logout"/> Sair da conta</button>
 </AppShell>;
}
