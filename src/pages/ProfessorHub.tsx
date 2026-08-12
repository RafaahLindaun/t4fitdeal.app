import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import AccquaLogo from "../components/AccquaLogo";
import LoadingSplash from "../components/LoadingSplash";
import {
  AdminBoltIcon,
  AdminCheckIcon,
  AdminChevronIcon,
  AdminCloseIcon,
  AdminDumbbellIcon,
  AdminLayersIcon,
  AdminLinkIcon,
  AdminPeopleIcon,
  AdminPlusIcon,
  AdminSearchIcon,
  AdminShieldIcon,
  AdminWarningIcon,
} from "../components/AdminIcons";
import { MenuBellIcon } from "../components/MenuIcons";
import {
  createExerciseLibraryItem,
  loadAdminProfessors,
  loadAdminProgramTemplates,
  loadExerciseLibrary,
  loadStudentActivityHistory,
  loadWorkoutRequiredAlerts,
  loadWorkoutTemplates,
  markWorkoutRequiredAlertDelivered,
  markWorkoutRequiredAlertRead,
  resolveStudentWorkoutAlerts,
  searchWorkoutStudents,
  setStudentProfessorLink,
  setWorkoutStudentAccess,
  type AdminProfessor,
  type AdminProgramTemplate,
  type ExerciseLibraryItem,
  type StudentActivitySummary,
  type WorkoutRequiredAlert,
  type WorkoutStudent,
  type WorkoutTemplate,
} from "../lib/admin";
import "./professor-hub.css";

type HubSection = "students" | "alerts" | "approvals" | "library" | "templates";
type StudentStatusFilter = "all" | "active" | "unlinked" | "pending";

const INACTIVE_DAYS = 7;

function normalizeStatus(value: string) {
  const status = value.trim().toLowerCase();
  if (status === "active" || status === "ativo" || status === "approved") return "active";
  if (status === "blocked" || status === "bloqueado") return "blocked";
  if (status === "inactive" || status === "inativo") return "inactive";
  return "pending";
}

function initials(value: string) {
  return (
    value
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "AC"
  );
}

function isWithinCurrentWeek(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  const start = new Date(now);
  const day = start.getDay();
  const diff = day === 0 ? 6 : day - 1;
  start.setDate(start.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return date >= start && date < end;
}

function lastWorkoutDate(activities: StudentActivitySummary[]) {
  const workout = activities.find((activity) => activity.kind === "workout");
  if (!workout?.performedAt) return null;
  const parsed = new Date(workout.performedAt);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatRelativeActivity(activities: StudentActivitySummary[]) {
  const last = lastWorkoutDate(activities);
  if (!last) return "Sem treino registrado";
  const days = Math.max(0, Math.floor((Date.now() - last.getTime()) / 86_400_000));
  if (days === 0) return "Treinou hoje";
  if (days === 1) return "Último treino ontem";
  return `Último treino há ${days} dias`;
}

export default function ProfessorHub() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedStudentId = searchParams.get("student") ?? "";
  const { user, profile, loading, landingPath } = useAuth();

  const [section, setSection] = useState<HubSection>("students");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StudentStatusFilter>("all");
  const [students, setStudents] = useState<WorkoutStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [alerts, setAlerts] = useState<WorkoutRequiredAlert[]>([]);
  const [professors, setProfessors] = useState<AdminProfessor[]>([]);
  const [professorFilter, setProfessorFilter] = useState("");
  const [exerciseLibrary, setExerciseLibrary] = useState<ExerciseLibraryItem[]>([]);
  const [legacyTemplates, setLegacyTemplates] = useState<WorkoutTemplate[]>([]);
  const [programTemplates, setProgramTemplates] = useState<AdminProgramTemplate[]>([]);
  const [activityByStudent, setActivityByStudent] = useState<Record<string, StudentActivitySummary[]>>({});
  const [toast, setToast] = useState("");
  const [busyId, setBusyId] = useState("");
  const [createExerciseOpen, setCreateExerciseOpen] = useState(false);
  const [exerciseDraft, setExerciseDraft] = useState({
    name: "",
    muscleGroup: "Outros",
    equipment: "",
    mediaUrl: "",
    beginnerTip: "Priorize a execução segura antes de aumentar a carga.",
    defaultSets: 3,
    defaultRepsMin: 10,
    defaultRepsMax: 12,
    defaultRestSeconds: 60,
  });

  const canManageStudents =
    profile?.role === "professor" || profile?.role === "reception" || profile?.role === "admin";

  useEffect(() => {
    if (!user || !canManageStudents) return;
    if (profile?.role === "professor" && !professorFilter) setProfessorFilter(user.id);
  }, [canManageStudents, profile?.role, professorFilter, user?.id]);

  useEffect(() => {
    if (!user || !canManageStudents) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setStudentsLoading(true);
      try {
        const result = await searchWorkoutStudents(query);
        if (!cancelled) setStudents(result);
      } catch (error) {
        if (!cancelled) setToast(error instanceof Error ? error.message : "Não foi possível carregar os alunos.");
      } finally {
        if (!cancelled) setStudentsLoading(false);
      }
    }, 220);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [canManageStudents, query, user?.id]);

  useEffect(() => {
    if (!user || !canManageStudents) return;
    let cancelled = false;
    void Promise.all([
      loadWorkoutRequiredAlerts().catch(() => []),
      loadAdminProfessors().catch(() => []),
      loadExerciseLibrary().catch(() => []),
      loadWorkoutTemplates(user.id).catch(() => []),
      loadAdminProgramTemplates(user.id).catch(() => []),
    ]).then(([alertRows, professorRows, libraryRows, simpleModels, advancedModels]) => {
      if (cancelled) return;
      setAlerts(alertRows);
      alertRows
        .filter((alert) => !alert.deliveredAt)
        .forEach((alert) => void markWorkoutRequiredAlertDelivered(alert.id));
      setProfessors(professorRows);
      setExerciseLibrary(libraryRows);
      setLegacyTemplates(simpleModels);
      setProgramTemplates(advancedModels);
    });
    return () => {
      cancelled = true;
    };
  }, [canManageStudents, user?.id]);

  const managedStudents = useMemo(() => {
    if (!user) return [];
    if (profile?.role === "professor") {
      return students.filter((student) => student.linkedProfessorId === user.id);
    }
    if (professorFilter) {
      return students.filter((student) => student.linkedProfessorId === professorFilter);
    }
    return students.filter((student) => normalizeStatus(student.status) === "active");
  }, [professorFilter, profile?.role, students, user]);

  useEffect(() => {
    if (!managedStudents.length) {
      setActivityByStudent({});
      return;
    }
    let cancelled = false;
    const targets = managedStudents.slice(0, 80);
    void Promise.all(
      targets.map(async (student) => [student.id, await loadStudentActivityHistory(student.id).catch(() => [])] as const),
    ).then((rows) => {
      if (cancelled) return;
      setActivityByStudent(Object.fromEntries(rows));
    });
    return () => {
      cancelled = true;
    };
  }, [managedStudents.map((student) => student.id).join("|")]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const unreadAlerts = alerts.filter((alert) => !alert.readAt);
  const pendingStudents = students.filter((student) => {
    const status = normalizeStatus(student.status);
    return status === "pending" || status === "inactive";
  });

  const stats = useMemo(() => {
    const active = managedStudents.filter((student) => normalizeStatus(student.status) === "active").length;
    const now = Date.now();
    const inactive = managedStudents.filter((student) => {
      if (normalizeStatus(student.status) !== "active") return false;
      const activities = activityByStudent[student.id] ?? [];
      const last = lastWorkoutDate(activities);
      if (!last) return true;
      return (now - last.getTime()) / 86_400_000 > INACTIVE_DAYS;
    }).length;
    const weekly = Object.values(activityByStudent).reduce(
      (total, activities) => total + activities.filter((activity) => activity.kind === "workout" && isWithinCurrentWeek(activity.performedAt)).length,
      0,
    );
    return { active, inactive, pending: pendingStudents.length, weekly };
  }, [activityByStudent, managedStudents, pendingStudents.length]);

  const roster = useMemo(() => {
    return students.filter((student) => {
      const status = normalizeStatus(student.status);
      if (statusFilter === "active" && status !== "active") return false;
      if (statusFilter === "pending" && status !== "pending" && status !== "inactive") return false;
      if (statusFilter === "unlinked" && student.linkedProfessorId) return false;
      if (profile?.role === "professor" && statusFilter !== "unlinked" && student.linkedProfessorId !== user?.id) return false;
      if (profile?.role !== "professor" && professorFilter && statusFilter !== "unlinked" && student.linkedProfessorId !== professorFilter) return false;
      return true;
    });
  }, [professorFilter, profile?.role, statusFilter, students, user?.id]);

  if (loading) return <LoadingSplash />;
  if (!user) return <Navigate to="/login" replace />;
  if (landingPath !== "/menu-teste") return <Navigate to={landingPath} replace />;
  if (!canManageStudents) return <Navigate to="/menu-teste" replace />;
  if (requestedStudentId) {
    return <Navigate to={`/area-accqua/alunos?student=${encodeURIComponent(requestedStudentId)}`} replace />;
  }

  const openSection = (next: HubSection) => {
    setSection(next);
    setMobileMenuOpen(false);
  };

  const openStudent = (studentId: string) => {
    navigate(`/area-accqua/alunos?student=${encodeURIComponent(studentId)}`);
  };

  const resolveAlert = async (alert: WorkoutRequiredAlert) => {
    if (busyId) return;
    setBusyId(alert.id);
    try {
      await markWorkoutRequiredAlertRead(alert.id);
      await resolveStudentWorkoutAlerts(alert.studentId);
      setAlerts((current) => current.filter((item) => item.id !== alert.id));
      setToast("Alerta resolvido.");
    } finally {
      setBusyId("");
    }
  };

  const authorize = async (student: WorkoutStudent) => {
    if (busyId) return;
    setBusyId(student.id);
    try {
      const result = await setWorkoutStudentAccess(student.id, "active");
      setStudents((current) => current.map((item) => item.id === student.id ? { ...item, status: result.status } : item));
      setToast("Aluno autorizado.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Não foi possível autorizar.");
    } finally {
      setBusyId("");
    }
  };

  const linkStudent = async (student: WorkoutStudent) => {
    const targetProfessorId = profile?.role === "professor" ? user.id : professorFilter;
    if (!targetProfessorId || busyId) {
      setToast("Selecione um professor antes de vincular.");
      return;
    }
    setBusyId(student.id);
    try {
      const updated = await setStudentProfessorLink(student.id, targetProfessorId);
      setStudents((current) => current.map((item) => item.id === updated.id ? updated : item));
      setToast("Aluno vinculado.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Não foi possível vincular.");
    } finally {
      setBusyId("");
    }
  };

  const submitExercise = async (event: FormEvent) => {
    event.preventDefault();
    if (!exerciseDraft.name.trim() || busyId) return;
    setBusyId("new-exercise");
    try {
      const created = await createExerciseLibraryItem(exerciseDraft);
      setExerciseLibrary((current) => [created, ...current]);
      setCreateExerciseOpen(false);
      setExerciseDraft((current) => ({ ...current, name: "", equipment: "", mediaUrl: "" }));
      setToast("Exercício adicionado à biblioteca.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Não foi possível criar o exercício.");
    } finally {
      setBusyId("");
    }
  };

  const professorAvatar = String(user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? "");
  const professorName = profile?.fullName || user.email?.split("@")[0] || "Professor";

  const navItems: Array<{ key: HubSection; label: string; icon: JSX.Element; badge?: number }> = [
    { key: "students", label: "Alunos", icon: <AdminPeopleIcon /> },
    { key: "alerts", label: "Alertas", icon: <AdminWarningIcon />, badge: unreadAlerts.length },
    { key: "approvals", label: "Aprovações", icon: <AdminShieldIcon />, badge: pendingStudents.length },
    { key: "library", label: "Biblioteca", icon: <AdminDumbbellIcon /> },
    { key: "templates", label: "Modelos", icon: <AdminLayersIcon /> },
  ];

  return (
    <div className="professor-hub-screen">
      <header className="professor-hub-header">
        <button
          type="button"
          className="professor-hub-menu-toggle"
          onClick={() => setMobileMenuOpen((current) => !current)}
          aria-label="Abrir menu da área do professor"
          aria-expanded={mobileMenuOpen}
        >
          <span /><span /><span />
        </button>

        <div className="professor-hub-logo"><AccquaLogo compact /></div>

        <label className="professor-hub-search">
          <AdminSearchIcon size={20} />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              if (section !== "students") setSection("students");
            }}
            placeholder="Buscar aluno"
            autoComplete="off"
          />
          {query ? (
            <button type="button" onClick={() => setQuery("")} aria-label="Limpar busca"><AdminCloseIcon size={18} /></button>
          ) : null}
        </label>

        <button type="button" className="professor-hub-bell" onClick={() => openSection("alerts")} aria-label={`${unreadAlerts.length} alertas não lidos`}>
          <MenuBellIcon size={25} />
          {unreadAlerts.length ? <span>{Math.min(unreadAlerts.length, 99)}</span> : null}
        </button>

        <button type="button" className="professor-hub-avatar" onClick={() => navigate("/perfil")} aria-label="Abrir perfil do professor">
          {professorAvatar ? <img src={professorAvatar} alt={professorName} /> : initials(professorName)}
        </button>
      </header>

      <div className="professor-hub-layout">
        <aside className={`professor-hub-sidebar ${mobileMenuOpen ? "is-open" : ""}`}>
          <div className="professor-hub-sidebar-title">
            <small>CENTRAL ACCQUA</small>
            <strong>{profile?.role === "admin" ? "Administração" : profile?.role === "reception" ? "Recepção" : "Professor"}</strong>
          </div>
          <nav>
            {navItems.map((item) => (
              <button type="button" key={item.key} className={section === item.key ? "is-active" : ""} onClick={() => openSection(item.key)}>
                <span>{item.icon}</span><strong>{item.label}</strong>{item.badge ? <em>{item.badge}</em> : null}
              </button>
            ))}
          </nav>
          <button type="button" className="professor-hub-back" onClick={() => navigate("/menu-teste")}>Voltar ao app</button>
        </aside>
        {mobileMenuOpen ? <button type="button" className="professor-hub-menu-backdrop" onClick={() => setMobileMenuOpen(false)} aria-label="Fechar menu" /> : null}

        <main className="professor-hub-main">
          {section === "students" ? (
            <>
              <section className="professor-hub-welcome">
                <div><small>VISÃO GERAL</small><h1>Central do Professor</h1><p>Acompanhe seus alunos, pendências e treinos em um só lugar.</p></div>
                {profile?.role !== "professor" ? (
                  <label><span>Professor</span><select value={professorFilter} onChange={(event) => setProfessorFilter(event.target.value)}><option value="">Todos</option>{professors.map((professor) => <option key={professor.id} value={professor.id}>{professor.fullName}</option>)}</select></label>
                ) : null}
              </section>

              <section className="professor-hub-stats">
                <article><span><AdminPeopleIcon /></span><div><small>Alunos ativos</small><strong>{stats.active}</strong></div></article>
                <article><span><AdminWarningIcon /></span><div><small>+{INACTIVE_DAYS} dias sem treinar</small><strong>{stats.inactive}</strong></div></article>
                <article><span><AdminShieldIcon /></span><div><small>Aprovações pendentes</small><strong>{stats.pending}</strong></div></article>
                <article><span><AdminBoltIcon /></span><div><small>Treinos na semana</small><strong>{stats.weekly}</strong></div></article>
              </section>

              <section className="professor-hub-attention">
                <header><div><small>PRECISA DE ATENÇÃO</small><h2>Pendências rápidas</h2></div><button type="button" onClick={() => openSection("alerts")}>Ver tudo</button></header>
                {alerts.slice(0, 4).length ? alerts.slice(0, 4).map((alert) => {
                  const student = students.find((item) => item.id === alert.studentId);
                  return (
                    <article key={alert.id}>
                      <button type="button" className="professor-hub-alert-person" onClick={() => openStudent(alert.studentId)}>
                        <span className="professor-hub-student-avatar">{student?.avatarUrl ? <img src={student.avatarUrl} alt={student.fullName} /> : initials(student?.fullName || alert.studentName)}</span>
                        <div><strong>{student?.fullName || alert.studentName}</strong><p>{alert.message}</p></div>
                      </button>
                      <button type="button" className="professor-hub-resolve" onClick={() => void resolveAlert(alert)} disabled={busyId === alert.id}><AdminCheckIcon size={18} />Resolver</button>
                    </article>
                  );
                }) : <div className="professor-hub-empty"><AdminCheckIcon /><strong>Nenhuma pendência agora</strong><p>Os alertas de treino aparecerão aqui quando precisarem de atenção.</p></div>}
              </section>

              <section className="professor-hub-roster">
                <header><div><small>ALUNOS</small><h2>Roster do professor</h2></div><span>{roster.length} aluno{roster.length === 1 ? "" : "s"}</span></header>
                <div className="professor-hub-filters">
                  {(["all", "active", "unlinked", "pending"] as StudentStatusFilter[]).map((value) => <button type="button" key={value} className={statusFilter === value ? "is-active" : ""} onClick={() => setStatusFilter(value)}>{value === "all" ? "Todos" : value === "active" ? "Ativos" : value === "unlinked" ? "Sem vínculo" : "Pendentes"}</button>)}
                </div>
                {studentsLoading ? <div className="professor-hub-empty"><span className="professor-hub-spinner" /><p>Carregando alunos...</p></div> : null}
                {!studentsLoading && roster.map((student) => {
                  const activities = activityByStudent[student.id] ?? [];
                  const status = normalizeStatus(student.status);
                  return (
                    <article className="professor-hub-student-row" key={student.id}>
                      <button type="button" className="professor-hub-student-main" onClick={() => openStudent(student.id)}>
                        <span className="professor-hub-student-avatar">{student.avatarUrl ? <img src={student.avatarUrl} alt={student.fullName} /> : initials(student.fullName)}</span>
                        <div><strong>{student.fullName}</strong><p>{student.linkedProfessorName || "Sem professor"} · {formatRelativeActivity(activities)}</p><small className={`is-${status}`}>{status === "active" ? "Ativo" : status === "blocked" ? "Bloqueado" : "Pendente"}</small></div>
                        <AdminChevronIcon />
                      </button>
                      {!student.linkedProfessorId && status === "active" ? <button type="button" className="professor-hub-link" onClick={() => void linkStudent(student)} disabled={busyId === student.id}><AdminLinkIcon size={18} />Vincular</button> : null}
                    </article>
                  );
                })}
              </section>
            </>
          ) : null}

          {section === "alerts" ? (
            <section className="professor-hub-panel">
              <header><div><small>ALERTAS</small><h1>Todos os alertas</h1><p>Alunos que precisam de acompanhamento da equipe.</p></div><span>{alerts.length}</span></header>
              <div className="professor-hub-panel-list">{alerts.length ? alerts.map((alert) => <article key={alert.id}><button type="button" onClick={() => openStudent(alert.studentId)}><AdminWarningIcon /><div><strong>{alert.studentName}</strong><p>{alert.message}</p><small>{alert.readAt ? "Lido" : "Não lido"}</small></div><AdminChevronIcon /></button><button type="button" onClick={() => void resolveAlert(alert)} disabled={busyId === alert.id}><AdminCheckIcon />Resolver</button></article>) : <div className="professor-hub-empty"><AdminCheckIcon /><strong>Sem alertas</strong></div>}</div>
            </section>
          ) : null}

          {section === "approvals" ? (
            <section className="professor-hub-panel">
              <header><div><small>APROVAÇÕES</small><h1>Cadastros pendentes</h1><p>Revise e libere o acesso dos alunos.</p></div><span>{pendingStudents.length}</span></header>
              <div className="professor-hub-panel-list">{pendingStudents.map((student) => <article key={student.id}><button type="button" onClick={() => openStudent(student.id)}><span className="professor-hub-student-avatar">{student.avatarUrl ? <img src={student.avatarUrl} alt={student.fullName} /> : initials(student.fullName)}</span><div><strong>{student.fullName}</strong><p>{student.email || "Cadastro em análise"}</p><small>Aguardando autorização</small></div><AdminChevronIcon /></button><button type="button" className="is-primary" onClick={() => void authorize(student)} disabled={busyId === student.id}><AdminCheckIcon />Autorizar</button></article>)}</div>
            </section>
          ) : null}

          {section === "library" ? (
            <section className="professor-hub-panel">
              <header><div><small>BIBLIOTECA</small><h1>Exercícios</h1><p>Catálogo usado pelo montador de treino.</p></div><button type="button" className="professor-hub-primary" onClick={() => setCreateExerciseOpen((current) => !current)}><AdminPlusIcon />Novo</button></header>
              {createExerciseOpen ? <form className="professor-hub-exercise-form" onSubmit={submitExercise}><label><span>Nome</span><input value={exerciseDraft.name} onChange={(event) => setExerciseDraft({ ...exerciseDraft, name: event.target.value })} required /></label><label><span>Grupo muscular</span><input value={exerciseDraft.muscleGroup} onChange={(event) => setExerciseDraft({ ...exerciseDraft, muscleGroup: event.target.value })} /></label><label><span>Equipamento</span><input value={exerciseDraft.equipment} onChange={(event) => setExerciseDraft({ ...exerciseDraft, equipment: event.target.value })} /></label><label className="is-wide"><span>GIF/vídeo</span><input value={exerciseDraft.mediaUrl} onChange={(event) => setExerciseDraft({ ...exerciseDraft, mediaUrl: event.target.value })} placeholder="/gifs/exercicio.gif" /></label><div className="professor-hub-form-actions"><button type="button" onClick={() => setCreateExerciseOpen(false)}>Cancelar</button><button type="submit" className="is-primary" disabled={busyId === "new-exercise"}>Salvar exercício</button></div></form> : null}
              <div className="professor-hub-library-grid">{exerciseLibrary.map((exercise) => <article key={exercise.id}><span><AdminDumbbellIcon /></span><div><strong>{exercise.name}</strong><p>{exercise.muscleGroup}{exercise.equipment ? ` · ${exercise.equipment}` : ""}</p><small>{exercise.defaultSets} séries · {exercise.defaultRepsMin}{exercise.defaultRepsMax !== exercise.defaultRepsMin ? `–${exercise.defaultRepsMax}` : ""} reps</small></div></article>)}</div>
            </section>
          ) : null}

          {section === "templates" ? (
            <section className="professor-hub-panel">
              <header><div><small>MODELOS</small><h1>Treinos salvos</h1><p>Modelos simples e programas completos já existentes.</p></div><button type="button" className="professor-hub-primary" onClick={() => navigate("/area-accqua/alunos")}><AdminPlusIcon />Montar</button></header>
              <div className="professor-hub-template-columns"><div><h2>Programas completos</h2>{programTemplates.length ? programTemplates.map((template) => <article key={template.id}><AdminLayersIcon /><div><strong>{template.name}</strong><p>{template.splitCode}</p></div></article>) : <p className="professor-hub-muted">Nenhum modelo completo salvo.</p>}</div><div><h2>Modelos simples</h2>{legacyTemplates.length ? legacyTemplates.map((template) => <article key={template.id}><AdminDumbbellIcon /><div><strong>{template.name}</strong><p>{template.focus || "Sem foco informado"}</p></div></article>) : <p className="professor-hub-muted">Nenhum modelo simples salvo.</p>}</div></div>
            </section>
          ) : null}
        </main>
      </div>

      {toast ? <div className="professor-hub-toast" role="status">{toast}</div> : null}
    </div>
  );
}
