import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import AppShell from "./AppShell";
import Icon from "./Icon";
import { useAuth } from "../context/AuthContext";

export default function StaffShell({title,subtitle,children,right}:{title:string;subtitle?:string;children:ReactNode;right?:ReactNode}){
 const location=useLocation();const {canManageStore,canManageClasses,canManageStaff}=useAuth();
 const tabs=[
  ["/equipe/alunos","users","Alunos",true],["/equipe/treinos","dumbbell","Treinos",true],["/equipe/exercicios","plus","Exercícios",true],["/equipe/dieta","apple","Dieta",true],["/equipe/loja","bag","Loja",canManageStore],["/equipe/aulas","calendar","Aulas",canManageClasses],["/equipe/permissoes","shield","Equipe",canManageStaff],
 ] as const;
 return <AppShell title={title} subtitle={subtitle} back right={right} className="staff-page"><nav className="staff-tabs">{tabs.filter(([, , , visible])=>visible).map(([to,icon,label])=><Link className={location.pathname===to?"active":""} to={to} key={to}><Icon name={icon}/><span>{label}</span></Link>)}</nav>{children}</AppShell>;
}
