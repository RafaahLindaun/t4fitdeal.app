import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import clsx from "clsx";
import AccquaLogo from "../components/AccquaLogo";
import PageHeader from "../components/PageHeader";
import ResponsiveDialog from "../components/ResponsiveDialog";
import {
  AdminBackIcon,
  AdminCalendarIcon,
  AdminCheckIcon,
  AdminChevronIcon,
  AdminEditIcon,
  AdminPeopleIcon,
  AdminPlusIcon,
} from "../components/AdminIcons";
import { useAuth } from "../auth/AuthProvider";
import {
  CLASS_WEEKDAYS,
  addClassSchedules,
  classRequirementLabel,
  createClassType,
  loadClassManagement,
  loadStaffClassReservations,
  localDateKey,
  setClassScheduleActive,
  subscribeToClassAgenda,
  updateClassReservationStatus,
  updateClassSchedule,
  updateClassType,
  type AddClassScheduleInput,
  type ClassProfessor,
  type ClassSchedule,
  type ClassType,
  type ClassWeekday,
} from "../lib/classes";
import "./classes-admin.css";

type TypeDraft = {
  name: string;
  description: string;
  requiresMembership: boolean;
  acceptsGympass: boolean;
  icon: string;
  accentColor: string;
  active: boolean;
};

type ScheduleDraft = {
  weekdays: ClassWeekday[];
  startTime: string;
  endTime: string;
  location: string;
  professorId: string;
  capacity: number;
  active: boolean;
};

const DEFAULT_TYPE: TypeDraft = {
  name: "",
  description: "",
  requiresMembership: true,
  acceptsGympass: true,
  icon: "users",
  accentColor: "#F2C230",
  active: true,
};

const DEFAULT_SCHEDULE: ScheduleDraft = {
  weekdays: ["seg"],
  startTime: "18:00",
  endTime: "19:00",
  location: "",
  professorId: "",
  capacity: 20,
  active: true,
};

function nextDateForWeekday(weekday: ClassWeekday) {
  const target = CLASS_WEEKDAYS.findIndex((item) => item.value === weekday);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const delta = (target - today.getDay() + 7) % 7;
  const date = new Date(today);
  date.setDate(today.getDate() + delta);
  return localDateKey(date);
}

function typeToDraft(type: ClassType): TypeDraft {
  return {
    name: type.name,
    description: type.description,
    requiresMembership: type.requiresMembership,
    acceptsGympass: type.acceptsGympass,
    icon: type.icon || "users",
    accentColor: type.accentColor || "#F2C230",
    active: type.active,
  };
}

function scheduleToDraft(schedule: ClassSchedule): ScheduleDraft {
  return {
    weekdays: [schedule.weekday],
    startTime: schedule.startTime.slice(0, 5),
    endTime: schedule.endTime.slice(0, 5),
    location: schedule.location,
    professorId: schedule.professorId,
    capacity: schedule.capacity,
    active: schedule.active,
  };
}

function professorName(professors: ClassProfessor[], id: string) {
  return professors.find((professor) => professor.id === id)?.fullName || "Sem professor definido";
}

function TypeForm({ draft, setDraft, onSubmit, saving, submitLabel }: {
  draft: TypeDraft;
  setDraft: (next: TypeDraft) => void;
  onSubmit: (event: FormEvent) => void;
  saving: boolean;
  submitLabel: string;
}) {
  return (
    <form className="classes-admin-form" onSubmit={onSubmit}>
      <label>Nome da aula<input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Ex: Pilates" /></label>
      <label>Descrição<textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Descrição curta mostrada ao aluno" rows={3} /></label>
      <div className="classes-admin-grid-2">
        <label>Ícone<select value={draft.icon} onChange={(event) => setDraft({ ...draft, icon: event.target.value })}><option value="users">Grupo</option><option value="waves">Ondas</option><option value="droplet">Água</option></select></label>
        <label>Cor de destaque<input type="color" value={draft.accentColor} onChange={(event) => setDraft({ ...draft, accentColor: event.target.value })} /></label>
      </div>
      <div className="classes-admin-toggle-list">
        <label><span><strong>Exige matrícula ativa</strong><small>Bloqueia reserva quando a matrícula está vencida.</small></span><input type="checkbox" checked={draft.requiresMembership} onChange={(event) => setDraft({ ...draft, requiresMembership: event.target.checked })} /></label>
        <label><span><strong>Aceita Gympass como alternativa</strong><small>Com matrícula inativa, permite reservar se houver número do Gympass no Perfil.</small></span><input type="checkbox" checked={draft.acceptsGympass} onChange={(event) => setDraft({ ...draft, acceptsGympass: event.target.checked })} /></label>
        <label><span><strong>Modalidade ativa</strong><small>Quando desativada, deixa de aparecer para os alunos.</small></span><input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} /></label>
      </div>
      <button className="classes-admin-primary" type="submit" disabled={saving}>{saving ? "Salvando..." : submitLabel}</button>
    </form>
  );
}

function ScheduleForm({ draft, setDraft, professors, editing, onSubmit, saving }: {
  draft: ScheduleDraft;
  setDraft: (next: ScheduleDraft) => void;
  professors: ClassProfessor[];
  editing: boolean;
  onSubmit: (event: FormEvent) => void;
  saving: boolean;
}) {
  const toggleDay = (weekday: ClassWeekday) => {
    const next = draft.weekdays.includes(weekday)
      ? draft.weekdays.filter((item) => item !== weekday)
      : [...draft.weekdays, weekday];
    setDraft({ ...draft, weekdays: editing ? [weekday] : next });
  };
  return (
    <form className="classes-admin-form" onSubmit={onSubmit}>
      <fieldset className="classes-admin-weekdays"><legend>{editing ? "Dia da semana" : "Dias da semana"}</legend><div>{CLASS_WEEKDAYS.map((day) => <button type="button" key={day.value} className={draft.weekdays.includes(day.value) ? "is-active" : ""} onClick={() => toggleDay(day.value)}>{day.short}</button>)}</div></fieldset>
      <div className="classes-admin-grid-2"><label>Início<input required type="time" value={draft.startTime} onChange={(event) => setDraft({ ...draft, startTime: event.target.value })} /></label><label>Fim<input required type="time" value={draft.endTime} onChange={(event) => setDraft({ ...draft, endTime: event.target.value })} /></label></div>
      <label>Local<input list="accqua-class-locations" value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} placeholder="Piscina, Sala 1..." /><datalist id="accqua-class-locations"><option value="Piscina" /><option value="Sala 1" /><option value="Sala 2" /><option value="Área externa" /></datalist></label>
      <label>Professor responsável<select value={draft.professorId} onChange={(event) => setDraft({ ...draft, professorId: event.target.value })}><option value="">Equipe ACCQUA</option>{professors.map((professor) => <option key={professor.id} value={professor.id}>{professor.fullName}</option>)}</select></label>
      <label>Capacidade máxima<input min={1} max={500} type="number" value={draft.capacity} onChange={(event) => setDraft({ ...draft, capacity: Math.max(1, Number(event.target.value) || 1) })} /></label>
      {editing ? <div className="classes-admin-toggle-list"><label><span><strong>Horário ativo</strong><small>Desative para preservar o histórico sem mostrar novas vagas.</small></span><input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} /></label></div> : null}
      <button className="classes-admin-primary" type="submit" disabled={saving || !draft.weekdays.length}>{saving ? "Salvando..." : editing ? "Salvar horário" : `Adicionar ${draft.weekdays.length || ""} horário${draft.weekdays.length === 1 ? "" : "s"}`}</button>
    </form>
  );
}

export default function ClassesAdmin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile, loading, landingPath } = useAuth();
  const isStaff = Boolean(profile && ["professor", "reception", "admin"].includes(profile.role));
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [typeDialog, setTypeDialog] = useState<{ open: boolean; type: ClassType | null }>({ open: false, type: null });
  const [typeDraft, setTypeDraft] = useState<TypeDraft>(DEFAULT_TYPE);
  const [scheduleDialog, setScheduleDialog] = useState<{ open: boolean; type: ClassType | null; schedule: ClassSchedule | null }>({ open: false, type: null, schedule: null });
  const [scheduleDraft, setScheduleDraft] = useState<ScheduleDraft>(DEFAULT_SCHEDULE);
  const [reservationsDialog, setReservationsDialog] = useState<{ open: boolean; type: ClassType | null; schedule: ClassSchedule | null }>({ open: false, type: null, schedule: null });
  const [reservationDate, setReservationDate] = useState(localDateKey());

  const managementQuery = useQuery({ queryKey: ["classes-management"], queryFn: loadClassManagement, enabled: isStaff });

  useEffect(() => subscribeToClassAgenda(() => {
    void queryClient.invalidateQueries({ queryKey: ["classes-management"] });
    void queryClient.invalidateQueries({ queryKey: ["staff-class-reservations"] });
  }), [queryClient]);

  useEffect(() => {
    if (!expanded.size && managementQuery.data?.types.length) setExpanded(new Set([managementQuery.data.types[0].id]));
  }, [expanded.size, managementQuery.data?.types]);

  const saveTypeMutation = useMutation({
    mutationFn: async () => {
      if (typeDialog.type) return updateClassType(typeDialog.type.id, typeDraft);
      return createClassType({
        name: typeDraft.name,
        description: typeDraft.description,
        requiresMembership: typeDraft.requiresMembership,
        acceptsGympass: typeDraft.acceptsGympass,
        icon: typeDraft.icon,
        accentColor: typeDraft.accentColor,
      });
    },
    onSuccess: async () => {
      toast.success(typeDialog.type ? "Modalidade atualizada." : "Nova modalidade criada.");
      setTypeDialog({ open: false, type: null });
      await queryClient.invalidateQueries({ queryKey: ["classes-management"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Não foi possível salvar a modalidade."),
  });

  const saveScheduleMutation = useMutation({
    mutationFn: async () => {
      if (!scheduleDialog.type) throw new Error("Modalidade não encontrada.");
      const base: AddClassScheduleInput = {
        classTypeId: scheduleDialog.type.id,
        weekdays: scheduleDraft.weekdays,
        startTime: scheduleDraft.startTime,
        endTime: scheduleDraft.endTime,
        location: scheduleDraft.location,
        professorId: scheduleDraft.professorId,
        capacity: scheduleDraft.capacity,
      };
      if (scheduleDialog.schedule) {
        return updateClassSchedule(scheduleDialog.schedule.id, { ...base, weekday: scheduleDraft.weekdays[0] ?? scheduleDialog.schedule.weekday, active: scheduleDraft.active });
      }
      return addClassSchedules(base);
    },
    onSuccess: async () => {
      toast.success(scheduleDialog.schedule ? "Horário atualizado." : "Horário adicionado.");
      setScheduleDialog({ open: false, type: null, schedule: null });
      await queryClient.invalidateQueries({ queryKey: ["classes-management"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Não foi possível salvar o horário."),
  });

  const reservationsQuery = useQuery({
    queryKey: ["staff-class-reservations", reservationsDialog.schedule?.id, reservationDate],
    queryFn: () => loadStaffClassReservations(reservationsDialog.schedule!.id, reservationDate),
    enabled: reservationsDialog.open && Boolean(reservationsDialog.schedule?.id && reservationDate),
  });

  const checkinMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "presente" | "faltou" | "reservado" }) => updateClassReservationStatus(id, status),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["staff-class-reservations"] }),
        queryClient.invalidateQueries({ queryKey: ["classes-agenda"] }),
      ]);
    },
    onError: () => toast.error("Não foi possível atualizar a presença."),
  });

  const data = managementQuery.data;
  const schedulesByType = useMemo(() => {
    const map = new Map<string, ClassSchedule[]>();
    data?.schedules.forEach((schedule) => map.set(schedule.classTypeId, [...(map.get(schedule.classTypeId) ?? []), schedule]));
    return map;
  }, [data?.schedules]);

  if (loading) return <div className="classes-admin-loading">Carregando Área ACCQUA...</div>;
  if (!isStaff) return <Navigate to={landingPath} replace />;

  const openType = (type: ClassType | null) => {
    setTypeDraft(type ? typeToDraft(type) : DEFAULT_TYPE);
    setTypeDialog({ open: true, type });
  };

  const openSchedule = (type: ClassType, schedule: ClassSchedule | null) => {
    setScheduleDraft(schedule ? scheduleToDraft(schedule) : DEFAULT_SCHEDULE);
    setScheduleDialog({ open: true, type, schedule });
  };

  const openReservations = (type: ClassType, schedule: ClassSchedule) => {
    setReservationDate(nextDateForWeekday(schedule.weekday));
    setReservationsDialog({ open: true, type, schedule });
  };

  return (
    <div className="classes-admin-screen">
      <main className="classes-admin-shell">
        <PageHeader
          className="classes-admin-header"
          left={<button type="button" onClick={() => navigate("/area-accqua")} aria-label="Voltar"><AdminBackIcon /></button>}
          center={<AccquaLogo compact />}
          right={<button type="button" className="is-add" onClick={() => openType(null)} aria-label="Adicionar modalidade"><AdminPlusIcon /></button>}
        />

        <div className="classes-admin-scroll">
          <section className="classes-admin-hero"><span><AdminCalendarIcon size={27} /></span><div><small>ÁREA STAFF</small><h1>Gestão de aulas</h1><p>Horários, vagas, responsáveis e check-in em uma única fonte.</p></div></section>

          <div className="classes-admin-summary"><article><strong>{data?.types.filter((item) => item.active).length ?? 0}</strong><span>modalidades ativas</span></article><article><strong>{data?.schedules.filter((item) => item.active).length ?? 0}</strong><span>horários ativos</span></article><article><strong>{data?.professors.length ?? 0}</strong><span>professores</span></article></div>

          {managementQuery.isLoading ? <div className="classes-admin-state">Carregando horários...</div> : managementQuery.isError ? <div className="classes-admin-state is-error"><strong>Não foi possível abrir a gestão de aulas.</strong><p>Aplique o SQL da Build 1.3.4 no Supabase e tente novamente.</p><button type="button" onClick={() => void managementQuery.refetch()}>Tentar novamente</button></div> : (
            <section className="classes-admin-types">
              <header><div><small>MODALIDADES</small><h2>Tipos de aula</h2></div><button type="button" onClick={() => openType(null)}><AdminPlusIcon size={18} /> Nova aula</button></header>
              {(data?.types ?? []).map((type) => {
                const schedules = schedulesByType.get(type.id) ?? [];
                const isOpen = expanded.has(type.id);
                return (
                  <article className={clsx("classes-admin-type-card", !type.active && "is-inactive")} key={type.id}>
                    <button type="button" className="classes-admin-type-head" onClick={() => setExpanded((current) => { const next = new Set(current); if (next.has(type.id)) next.delete(type.id); else next.add(type.id); return next; })}>
                      <i style={{ background: type.accentColor }} />
                      <span><strong>{type.name}</strong><small>{classRequirementLabel(type.requiresMembership, type.acceptsGympass)} · {schedules.filter((item) => item.active).length} horários</small></span>
                      {!type.active ? <b>INATIVA</b> : null}
                      <AdminChevronIcon className={isOpen ? "is-open" : ""} />
                    </button>
                    {isOpen ? (
                      <div className="classes-admin-type-body">
                        <div className="classes-admin-type-actions"><button type="button" onClick={() => openType(type)}><AdminEditIcon size={17} /> Editar modalidade</button><button type="button" className="is-primary" onClick={() => openSchedule(type, null)}><AdminPlusIcon size={17} /> Adicionar horário</button></div>
                        {type.description ? <p className="classes-admin-type-description">{type.description}</p> : null}
                        <div className="classes-admin-schedules">
                          {schedules.length ? schedules.map((schedule) => (
                            <div className={clsx("classes-admin-schedule", !schedule.active && "is-inactive")} key={schedule.id}>
                              <div className="classes-admin-schedule-main"><strong>{CLASS_WEEKDAYS.find((day) => day.value === schedule.weekday)?.label} · {schedule.startTime.slice(0, 5)}–{schedule.endTime.slice(0, 5)}</strong><span>{schedule.location || "ACCQUA"} · {professorName(data?.professors ?? [], schedule.professorId)}</span><small>{schedule.capacity} vagas {schedule.active ? "· ativo" : "· desativado"}</small></div>
                              <div className="classes-admin-schedule-actions"><button type="button" onClick={() => openReservations(type, schedule)}><AdminPeopleIcon size={17} /> Reservas</button><button type="button" onClick={() => openSchedule(type, schedule)}><AdminEditIcon size={17} /> Editar</button><button type="button" className={schedule.active ? "is-danger" : "is-enable"} onClick={async () => { try { await setClassScheduleActive(schedule.id, !schedule.active); toast.success(schedule.active ? "Horário desativado sem apagar o histórico." : "Horário reativado."); await queryClient.invalidateQueries({ queryKey: ["classes-management"] }); } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível alterar o horário."); } }}>{schedule.active ? "Desativar" : "Reativar"}</button></div>
                            </div>
                          )) : <div className="classes-admin-empty">Nenhum horário cadastrado. Use “Adicionar horário” e selecione vários dias de uma vez.</div>}
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </section>
          )}
        </div>
      </main>

      <ResponsiveDialog open={typeDialog.open} onOpenChange={(open) => setTypeDialog((current) => ({ ...current, open }))} title={typeDialog.type ? "Editar modalidade" : "Nova modalidade"} description="Nome, descrição e regras de acesso exibidas ao aluno." className="classes-admin-dialog">
        <TypeForm draft={typeDraft} setDraft={setTypeDraft} saving={saveTypeMutation.isPending} submitLabel={typeDialog.type ? "Salvar modalidade" : "Criar modalidade"} onSubmit={(event) => { event.preventDefault(); if (!typeDraft.name.trim()) return; saveTypeMutation.mutate(); }} />
      </ResponsiveDialog>

      <ResponsiveDialog open={scheduleDialog.open} onOpenChange={(open) => setScheduleDialog((current) => ({ ...current, open }))} title={scheduleDialog.schedule ? "Editar horário" : `Adicionar horário · ${scheduleDialog.type?.name ?? "Aula"}`} description={scheduleDialog.schedule ? "O histórico de reservas será preservado." : "Selecione vários dias para criar o mesmo horário de uma vez."} className="classes-admin-dialog">
        <ScheduleForm draft={scheduleDraft} setDraft={setScheduleDraft} professors={data?.professors ?? []} editing={Boolean(scheduleDialog.schedule)} saving={saveScheduleMutation.isPending} onSubmit={(event) => { event.preventDefault(); if (scheduleDraft.endTime <= scheduleDraft.startTime) { toast.error("O horário de fim precisa ser depois do início."); return; } saveScheduleMutation.mutate(); }} />
      </ResponsiveDialog>

      <ResponsiveDialog open={reservationsDialog.open} onOpenChange={(open) => setReservationsDialog((current) => ({ ...current, open }))} title={`Reservas · ${reservationsDialog.type?.name ?? "Aula"}`} description={reservationsDialog.schedule ? `${CLASS_WEEKDAYS.find((day) => day.value === reservationsDialog.schedule?.weekday)?.label} · ${reservationsDialog.schedule.startTime.slice(0, 5)}` : undefined} className="classes-admin-dialog classes-admin-reservations-dialog">
        <div className="classes-admin-reservation-date"><label>Data da aula<input type="date" value={reservationDate} onChange={(event) => setReservationDate(event.target.value)} /></label></div>
        {reservationsQuery.isLoading ? <div className="classes-admin-state">Carregando reservas...</div> : reservationsQuery.data?.length ? <div className="classes-admin-reservation-list">{reservationsQuery.data.map((reservation) => <article key={reservation.reservationId}><span className={clsx("classes-admin-attendance-dot", `is-${reservation.status}`)}>{reservation.status === "presente" ? <AdminCheckIcon size={15} /> : null}</span><div><strong>{reservation.studentName}</strong><small>{reservation.gympassNumber ? `Gympass: ${reservation.gympassNumber}` : reservation.membershipValidUntil ? `Matrícula até ${new Date(`${reservation.membershipValidUntil}T12:00:00`).toLocaleDateString("pt-BR")}` : "Sem Gympass informado"}</small></div><div className="classes-admin-checkin-actions"><button type="button" className={reservation.status === "presente" ? "is-active" : ""} disabled={checkinMutation.isPending} onClick={() => checkinMutation.mutate({ id: reservation.reservationId, status: "presente" })}>Presente</button><button type="button" className={reservation.status === "faltou" ? "is-active is-missed" : ""} disabled={checkinMutation.isPending} onClick={() => checkinMutation.mutate({ id: reservation.reservationId, status: "faltou" })}>Faltou</button></div></article>)}</div> : <div className="classes-admin-empty">Nenhum aluno reservou vaga para esta data.</div>}
      </ResponsiveDialog>
    </div>
  );
}
