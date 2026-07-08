import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import AppShell, { Card } from "../components/AppShell";
import Icon from "../components/Icon";
import { useAuth } from "../context/AuthContext";
import { firstName } from "../lib/format";
import { supabase } from "../lib/supabase";
import { roleLabel } from "../lib/permissions";

const modules = [
  ["/treino", "dumbbell", "Meu treino", "Treino liberado pelo professor"],
  ["/dieta", "apple", "Minha dieta", "Análise nutricional premium"],
  ["/ranking", "trophy", "Ranking", "Treinos válidos do mês"],
  ["/personal", "users", "Área personal", "Conheça os professores"],
  ["/loja", "bag", "Loja", "Itens disponíveis na recepção"],
  ["/conta", "settings", "Configuração", "Conta e preferências"],
] as const;

export default function Home() {
  const { profile, isStaff, dietAccess } = useAuth();
  const [workoutReady, setWorkoutReady] = useState(false);
  const [todayClasses, setTodayClasses] = useState(0);

  useEffect(() => {
    if (!profile) return;
    void (async () => {
      if (profile.role === "student") {
        const { count } = await supabase.from("workout_plans").select("id", { count: "exact", head: true }).eq("student_id", profile.id).eq("is_active", true);
        setWorkoutReady(Boolean(count));
      }
      const day = new Date().getDay();
      const { count: classCount } = await supabase.from("class_schedule_view").select("schedule_id", { count: "exact", head: true }).eq("day_of_week", day).eq("active", true);
      setTodayClasses(classCount || 0);
    })();
  }, [profile]);

  return <AppShell right={<Link className="icon-button notification-button" to="/notificacoes"><Icon name="bell"/><i/></Link>}>
    <section className="home-intro"><h1>Olá, {firstName(profile?.full_name)}</h1><p>Seu app da academia</p></section>
    <Card className="membership-card"><span className="membership-icon"><Icon name="shield"/></span><div><strong>{profile?.role === "student" ? "Matrícula ativa" : roleLabel(profile?.role)}</strong><p><i/> Acesso liberado</p></div></Card>
    {isStaff && <Link className="staff-banner card" to="/equipe"><Icon name="users"/><span><strong>Abrir área da equipe</strong><small>Alunos, treinos e gerenciamento</small></span><Icon name="next"/></Link>}
    <div className="home-grid">
      {modules.map(([to, icon, title, subtitle]) => <Link className="home-module card" to={to} key={to}>
        <Icon name={icon} size={34}/><span><strong>{title}</strong><small>{subtitle}</small></span><Icon name="next" className="module-next"/>
        {title === "Ranking" && <em>NOVIDADE</em>}
        {title === "Meu treino" && !isStaff && <b className={workoutReady ? "ready" : "pending"}>{workoutReady ? "LIBERADO" : "AGUARDANDO"}</b>}
        {title === "Minha dieta" && <b className={dietAccess?.status === "active" ? "ready" : "premium"}>{dietAccess?.status === "active" ? "ATIVA" : "PREMIUM"}</b>}
      </Link>)}
    </div>
    <Card className="today-card"><div><Icon name="calendar"/><span><strong>Aulas de hoje</strong><small>{todayClasses ? `${todayClasses} horários disponíveis` : "Nenhuma aula cadastrada hoje"}</small></span></div><Link to="/aulas">Ver aulas <Icon name="next"/></Link></Card>
  </AppShell>;
}
