import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  type WorkoutExerciseRecord,
  type WorkoutPlanRecord,
} from "../lib/workout";
import {
  accquaOverlayTransition,
  accquaOverlayVariants,
  accquaWindowTransition,
  accquaWindowVariants,
} from "../lib/windowMotion";
import { WorkoutCheckIcon } from "./WorkoutIcons";
import { useTreinoStatus } from "../hooks/useTreinoStatus";
import { deriveRitmoSemanal, localDateKey } from "../lib/workoutStatus";
import ModalCloseButton from "./ModalCloseButton";
import PageHeader from "./PageHeader";

const WEEK_LABELS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const CALENDAR_WEEK_LABELS = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildMonthCells(reference: Date) {
  const year = reference.getFullYear();
  const month = reference.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const mondayOffset = (first.getDay() + 6) % 7;
  const cells: Array<{ date: Date; key: string; day: number; inMonth: boolean }> = [];
  for (let index = 0; index < 42; index += 1) {
    const date = new Date(year, month, 1 - mondayOffset + index);
    cells.push({ date, key: dateKey(date), day: date.getDate(), inMonth: date.getMonth() === month });
  }
  while (cells.length > 35 && cells[cells.length - 1].date > last && cells[cells.length - 7].date > last) cells.splice(-7);
  return cells;
}

function nextScheduledDay(planDays: number[], today: Date) {
  if (!planDays.length) return "Dias ainda não definidos";
  const names = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
  for (let offset = 0; offset < 8; offset += 1) {
    const day = (today.getDay() + offset) % 7;
    if (planDays.includes(day)) return offset === 0 ? "Hoje" : names[day];
  }
  return names[planDays[0]];
}

export default function WorkoutCalendarSheet({
  open,
  userId,
  plan,
  exercises,
  currentExerciseIndex,
  completedExerciseCount,
  onClose,
  onSelectExercise,
}: {
  open: boolean;
  userId: string;
  plan: WorkoutPlanRecord;
  exercises: WorkoutExerciseRecord[];
  currentExerciseIndex: number;
  completedExerciseCount: number;
  onClose: () => void;
  onSelectExercise: (index: number) => void;
}) {
  const now = useMemo(() => new Date(), []);
  const monthlyStatus = useTreinoStatus(userId, { periodo: "mes", reference: now });
  const monthCells = useMemo(() => buildMonthCells(now), [now]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeWithEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeWithEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeWithEscape);
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  const canonicalDates = monthlyStatus.data?.completedDates ?? [];
  const trainedDates = new Set(canonicalDates);
  const planDays = plan.weekDays;
  const rhythm = deriveRitmoSemanal(monthlyStatus.data, planDays, now);
  const remainingExercises = Math.max(0, exercises.length - completedExerciseCount);
  const trainedThisWeek = rhythm.completedPlannedDays;
  const remainingThisWeek = Math.max(0, rhythm.plannedDays - trainedThisWeek);
  const exerciseProgress = exercises.length ? Math.round((completedExerciseCount / exercises.length) * 100) : 0;
  const currentMonthLabel = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(now);
  const todayKey = localDateKey(now);

  return createPortal(
    <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          key="workout-calendar-window"
          className="workout-calendar-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Calendário de treinos"
          variants={accquaOverlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={accquaOverlayTransition}
          data-accqua-window-overlay
          data-accqua-motion-managed
        >
          <button className="workout-calendar-backdrop" type="button" onClick={onClose} aria-label="Fechar calendário" />
          <motion.section
            className="workout-calendar-sheet"
            variants={accquaWindowVariants.sheet}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={accquaWindowTransition}
            data-accqua-window-surface="sheet"
          >
            <PageHeader
              className="workout-calendar-page-header"
              ariaLabel="Cabeçalho do calendário de treinos"
              left={null}
              center={<div className="workout-calendar-heading"><span>PLANEJAMENTO DE TREINO</span><h2>Seu calendário</h2></div>}
              right={<ModalCloseButton onClick={onClose} ariaLabel="Fechar calendário" />}
            />

            <main className="workout-calendar-scroll">
              <p className="workout-calendar-intro">Acompanhe os dias planejados, o que já foi concluído e os exercícios que ainda faltam hoje.</p>

              <section className="workout-calendar-current">
                <div className="workout-calendar-current-copy"><span>TREINO EM ANDAMENTO</span><strong>{plan.name}</strong><p>Exercício {currentExerciseIndex + 1} de {exercises.length} • {remainingExercises} exercício(s) restante(s)</p></div>
                <div className="workout-calendar-progress"><strong>{exerciseProgress}%</strong><span>concluído</span></div>
              </section>

              <div className="workout-calendar-summary">
                <article><span>Dias treinados no mês</span><strong>{monthlyStatus.isError ? "—" : (monthlyStatus.data?.completedDates.length ?? 0)}</strong><small>{currentMonthLabel}</small></article>
                <article><span>Treinos feitos na semana</span><strong>{monthlyStatus.isError ? "—" : trainedThisWeek}</strong><small>{planDays.length ? `${remainingThisWeek} ainda previsto(s)` : "Sem frequência semanal definida"}</small></article>
                <article><span>Próximo dia planejado</span><strong className="text-value">{nextScheduledDay(planDays, now)}</strong><small>{planDays.length ? `${planDays.length} dia(s) planejado(s) por semana` : "Peça ao professor para definir os dias"}</small></article>
              </div>

              <section className="workout-calendar-week-section">
                <header><div><strong>Plano semanal</strong><span>Amarelo indica os dias definidos pelo professor.</span></div></header>
                <div className="workout-calendar-days">
                  {WEEK_LABELS.map((label, dayIndex) => {
                    const active = planDays.includes(dayIndex);
                    const today = now.getDay() === dayIndex;
                    return <div key={label} className={`${active ? "scheduled" : ""} ${today ? "today" : ""}`}>
                      <span>{label}</span>
                      {today ? <em className="workout-today-badge">HOJE</em> : null}
                      <strong>{active ? "TREINO" : "LIVRE"}</strong>
                      <i />
                    </div>;
                  })}
                </div>
              </section>

              <section className="workout-month-card">
                <div className="workout-month-title"><div><strong>{currentMonthLabel}</strong><span>Os dias amarelos representam treinos concluídos.</span></div><small>{monthlyStatus.isLoading ? "Atualizando..." : monthlyStatus.isError ? "Não foi possível atualizar" : `${trainedDates.size} registro(s)`}</small></div>
                <div className="workout-month-weekdays">{CALENDAR_WEEK_LABELS.map((label) => <span key={label}>{label}</span>)}</div>
                <div className="workout-month-grid">
                  {monthCells.map((cell) => {
                    const trained = trainedDates.has(cell.key);
                    const today = cell.key === todayKey;
                    return <div key={cell.key} className={`${cell.inMonth ? "" : "outside"} ${trained ? "trained" : ""} ${today ? "today" : ""}`}><span>{cell.day}</span>{trained ? <i /> : null}</div>;
                  })}
                </div>
              </section>

              <section className="workout-calendar-list">
                <div className="workout-calendar-list-title"><div><strong>Exercícios de hoje</strong><span>Toque em um exercício para abri-lo diretamente.</span></div><small>{completedExerciseCount}/{exercises.length}</small></div>
                <div className="workout-calendar-exercises">
                  {exercises.map((exercise, index) => {
                    const done = index < completedExerciseCount;
                    const current = index === currentExerciseIndex;
                    return <button type="button" key={exercise.id} className={`${done ? "done" : ""} ${current ? "current" : ""}`} onClick={() => { onSelectExercise(index); onClose(); }}>
                      <i>{done ? <WorkoutCheckIcon size={17} /> : index + 1}</i>
                      <div><strong>{exercise.name}</strong><span>{exercise.sets} séries • {exercise.repsMin}–{exercise.repsMax} repetições • {exercise.restSeconds}s de descanso</span></div>
                      {current ? <small>AGORA</small> : null}
                    </button>;
                  })}
                </div>
              </section>
            </main>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
