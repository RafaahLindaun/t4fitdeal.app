import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import AccquaLogo from "../components/AccquaLogo";
import PageHeader from "../components/PageHeader";
import { FilterPill } from "../components/DesignSystem";
import { MenuArrowIcon, NavCalendarIcon } from "../components/MenuIcons";
import { useAuth } from "../auth/AuthProvider";
import {
  classBlockMessage,
  classDateTime,
  classRequirementLabel,
  loadClassAgenda,
  localDateKey,
  reserveClass,
  subscribeToClassAgenda,
  type ClassAgendaItem,
} from "../lib/classes";
import "./aulas.css";

function dateLabel(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12);
  const today = localDateKey();
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = localDateKey(tomorrowDate);
  if (value === today) return "Hoje";
  if (value === tomorrow) return "Amanhã";
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(date);
}

function dateShort(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" })
    .format(new Date(year, month - 1, day, 12))
    .replace(".", "");
}

function timeLabel(value: string) {
  return value.slice(0, 5);
}

function ClassGlyph({ icon }: { icon: string }) {
  if (icon === "waves") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8c2.2 0 2.2 2 4.5 2S9.8 8 12 8s2.2 2 4.5 2S18.8 8 21 8M3 14c2.2 0 2.2 2 4.5 2S9.8 14 12 14s2.2 2 4.5 2 2.3-2 4.5-2" /></svg>;
  }
  if (icon === "droplet") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3s6 6.2 6 10.6a6 6 0 0 1-12 0C6 9.2 12 3 12 3Z" /></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3" /><path d="M3.5 19c.3-4 2.2-6 5.5-6s5.2 2 5.5 6" /><circle cx="17.2" cy="9.2" r="2.2" /><path d="M15.4 14.4c2.7-.4 4.4 1.2 4.8 4.3" /></svg>;
}

function shouldNudge(item: ClassAgendaItem) {
  if (item.myStatus === "reservado" || item.myStatus === "presente") return false;
  const starts = classDateTime(item.date, item.startTime).getTime();
  const delta = starts - Date.now();
  return delta > 0 && delta <= 48 * 60 * 60 * 1000;
}

function buttonCopy(item: ClassAgendaItem, reserving: boolean) {
  if (reserving) return "Reservando...";
  if (item.myStatus === "reservado" || item.myStatus === "presente") return "Vaga reservada ✓";
  if (item.remainingSpots <= 0 || item.blockReason === "full") return "Lotado";
  if (!item.canReserve) {
    if (item.blockReason === "membership_required") return "Matrícula necessária";
    if (item.blockReason === "membership_or_gympass_required") return "Regularizar acesso";
    return "Indisponível";
  }
  return "Marcar";
}

export default function Aulas() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const reduceMotion = useReducedMotion();
  const { user } = useAuth();
  const [typeFilter, setTypeFilter] = useState("all");
  const groupRefs = useRef<Record<string, HTMLElement | null>>({});

  const agendaQuery = useQuery({
    queryKey: ["classes-agenda", user?.id, localDateKey()],
    queryFn: () => loadClassAgenda(localDateKey(), 7),
    enabled: Boolean(user?.id),
    refetchInterval: 60_000,
  });

  useEffect(() => subscribeToClassAgenda(() => {
    void queryClient.invalidateQueries({ queryKey: ["classes-agenda"] });
    void queryClient.invalidateQueries({ queryKey: ["profile-dashboard"] });
  }), [queryClient]);

  const reserveMutation = useMutation({
    mutationFn: (item: ClassAgendaItem) => reserveClass(item.scheduleId, item.date),
    onSuccess: async () => {
      toast.success("Vaga reservada!");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["classes-agenda"] }),
        queryClient.invalidateQueries({ queryKey: ["profile-dashboard"] }),
      ]);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Não foi possível reservar a vaga."),
  });

  const items = agendaQuery.data ?? [];
  const types = useMemo(() => {
    const seen = new Map<string, string>();
    items.forEach((item) => seen.set(item.classTypeId, item.name));
    return [...seen.entries()];
  }, [items]);

  const filtered = useMemo(
    () => typeFilter === "all" ? items : items.filter((item) => item.classTypeId === typeFilter),
    [items, typeFilter],
  );

  const groups = useMemo(() => {
    const result = new Map<string, ClassAgendaItem[]>();
    filtered.forEach((item) => {
      const current = result.get(item.date) ?? [];
      current.push(item);
      result.set(item.date, current);
    });
    return [...result.entries()];
  }, [filtered]);

  const days = useMemo(() => {
    const start = new Date();
    start.setHours(12, 0, 0, 0);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return localDateKey(date);
    });
  }, []);

  return (
    <div className="classes-screen">
      <div className="classes-background" aria-hidden="true"><span /><i /></div>
      <main className="classes-shell">
        <PageHeader
          className="classes-header"
          ariaLabel="Agenda de aulas"
          left={
            <button type="button" className="classes-header-button" onClick={() => navigate("/menu-teste")} aria-label="Voltar">
              <MenuArrowIcon size={22} />
            </button>
          }
          center={<AccquaLogo compact />}
          right={<span className="classes-header-mark"><NavCalendarIcon size={22} /></span>}
        />

        <div className="classes-scroll">
          <div className="classes-content">
          <section className="classes-hero">
            <small>AGENDA ACCQUA</small>
            <h1>Aulas</h1>
            <p>Escolha sua aula e marque a vaga. A reserva não é automática.</p>
          </section>

          <div className="classes-type-filters" aria-label="Filtrar por modalidade">
            <FilterPill active={typeFilter === "all"} onClick={() => setTypeFilter("all")}>Todas</FilterPill>
            {types.map(([id, name]) => (
              <FilterPill key={id} active={typeFilter === id} onClick={() => setTypeFilter(id)}>{name}</FilterPill>
            ))}
          </div>

          <div className="classes-day-pills" aria-label="Próximos sete dias">
            {days.map((day) => (
              <button
                key={day}
                type="button"
                className={day === localDateKey() ? "is-today" : ""}
                onClick={() => groupRefs.current[day]?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" })}
              >
                <strong>{dateLabel(day).slice(0, 3)}</strong>
                <span>{dateShort(day)}</span>
              </button>
            ))}
          </div>

          {agendaQuery.isLoading ? (
            <section className="classes-state"><span className="classes-loader" /><strong>Carregando agenda</strong><p>Buscando horários e vagas disponíveis.</p></section>
          ) : agendaQuery.isError ? (
            <section className="classes-state is-error"><strong>Não foi possível carregar as aulas.</strong><p>Confirme se a migration da Build 1.3.4 já foi aplicada no Supabase.</p><button type="button" onClick={() => void agendaQuery.refetch()}>Tentar novamente</button></section>
          ) : groups.length === 0 ? (
            <section className="classes-state"><strong>Nenhuma aula neste período</strong><p>Os próximos horários cadastrados pela equipe aparecerão aqui.</p></section>
          ) : (
            <div className="classes-groups">
              {groups.map(([date, dayItems]) => (
                <section className="classes-day-group" key={date} ref={(node) => { groupRefs.current[date] = node; }}>
                  <header>
                    <div><small>{dateShort(date).toUpperCase()}</small><h2>{dateLabel(date)}</h2></div>
                    <span>{dayItems.length} {dayItems.length === 1 ? "aula" : "aulas"}</span>
                  </header>

                  <div className="classes-card-list">
                    {dayItems.map((item) => {
                      const reserved = item.myStatus === "reservado" || item.myStatus === "presente";
                      const blocked = !item.canReserve && !reserved;
                      const busy = reserveMutation.isPending && reserveMutation.variables?.scheduleId === item.scheduleId && reserveMutation.variables?.date === item.date;
                      const requirement = classRequirementLabel(item.requiresMembership, item.acceptsGympass);
                      return (
                        <article className={`class-card ${reserved ? "is-reserved" : ""} ${blocked ? "is-blocked" : ""}`} key={`${item.scheduleId}-${item.date}`}>
                          <div className="class-card-accent" style={{ background: item.accentColor || "#F2C230" }} />
                          <div className="class-card-top">
                            <span className="class-card-icon"><ClassGlyph icon={item.icon} /></span>
                            <div className="class-card-title"><h3>{item.name}</h3>{item.description ? <p>{item.description}</p> : null}</div>
                            <span className={`class-card-spots ${item.remainingSpots <= 3 ? "is-low" : ""}`}><strong>{item.remainingSpots}</strong><small>vagas</small></span>
                          </div>

                          <div className="class-card-meta">
                            <span><b>{timeLabel(item.startTime)}–{timeLabel(item.endTime)}</b><small>Horário</small></span>
                            <span><b>{item.location || "ACCQUA"}</b><small>Local</small></span>
                            <span><b>{item.professorName}</b><small>Professor</small></span>
                          </div>

                          <div className="class-card-requirement"><span>i</span><strong>{requirement}</strong></div>
                          {shouldNudge(item) ? <div className="class-card-nudge">🔔 Marque sua vaga</div> : null}
                          {blocked && item.blockReason !== "full" ? <p className="class-card-block-reason">{classBlockMessage(item.blockReason)}</p> : null}

                          <motion.button
                            type="button"
                            className={`class-card-action ${reserved ? "is-reserved" : ""}`}
                            whileTap={reduceMotion || blocked || reserved ? undefined : { scale: 0.975 }}
                            disabled={blocked || reserved || busy}
                            onClick={() => reserveMutation.mutate(item)}
                          >
                            {buttonCopy(item, busy)}
                          </motion.button>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
          </div>
        </div>
      </main>
    </div>
  );
}
