import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  loadWorkoutCalendar,
  type WorkoutCalendarData,
  type WorkoutExerciseRecord,
  type WorkoutPlanRecord,
} from "../lib/workout";
import { WorkoutCheckIcon } from "./WorkoutIcons";
import { useTreinoStatusHoje } from "../hooks/useTreinoStatusHoje";

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

  const cells: Array<{
    date: Date;
    key: string;
    day: number;
    inMonth: boolean;
  }> = [];

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(year, month, 1 - mondayOffset + index);
    cells.push({
      date,
      key: dateKey(date),
      day: date.getDate(),
      inMonth: date.getMonth() === month,
    });
  }

  while (
    cells.length > 35 &&
    cells[cells.length - 1].date > last &&
    cells[cells.length - 7].date > last
  ) {
    cells.splice(-7);
  }

  return cells;
}

function nextScheduledDay(planDays: number[], today: Date) {
  if (!planDays.length) return "Dias ainda não definidos";

  const names = [
    "domingo",
    "segunda-feira",
    "terça-feira",
    "quarta-feira",
    "quinta-feira",
    "sexta-feira",
    "sábado",
  ];

  for (let offset = 0; offset < 8; offset += 1) {
    const day = (today.getDay() + offset) % 7;
    if (planDays.includes(day)) {
      return offset === 0 ? "Hoje" : names[day];
    }
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
  const [data, setData] = useState<WorkoutCalendarData | null>(null);
  const treinoStatus = useTreinoStatusHoje(userId);
  const [loading, setLoading] = useState(false);
  const now = useMemo(() => new Date(), []);
  const monthCells = useMemo(() => buildMonthCells(now), [now]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    loadWorkoutCalendar(userId, plan).then((result) => {
      if (!active) return;
      setData(result);
      setLoading(false);
    });

    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeWithEscape);

    return () => {
      active = false;
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeWithEscape);
    };
  }, [open, userId, plan.id, onClose]);

  if (!open || typeof document === "undefined") return null;

  const canonicalDates = treinoStatus.data?.completedDates ?? [];
  const trainedDates = new Set(canonicalDates);
  const planDays = plan.weekDays;
  const remainingExercises = Math.max(
    0,
    exercises.length - completedExerciseCount,
  );
  const scheduledThisWeek = planDays.length;
  const trainedThisWeek = canonicalDates.filter((key) => key >= (data?.weekStartKey ?? "") && key <= (data?.weekEndKey ?? "zzzz")).length;
  const remainingThisWeek = Math.max(0, scheduledThisWeek - trainedThisWeek);
  const exerciseProgress = exercises.length
    ? Math.round((completedExerciseCount / exercises.length) * 100)
    : 0;

  return createPortal(
    <div
      className="workout-calendar-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Calendário de treinos"
    >
      <button
        className="workout-calendar-backdrop"
        type="button"
        onClick={onClose}
        aria-label="Fechar calendário"
      />

      <section className="workout-calendar-sheet">
        <header className="workout-calendar-header">
          <div className="workout-calendar-heading">
            <span>PLANEJAMENTO DE TREINO</span>
            <h2>Seu calendário</h2>
            <p>
              Acompanhe os dias planejados, o que já foi concluído
              e os exercícios que ainda faltam hoje.
            </p>
          </div>

          <button
            type="button"
            className="workout-calendar-close"
            onClick={onClose}
            aria-label="Fechar calendário"
          >
            <span className="workout-close-icon" aria-hidden="true" />
          </button>
        </header>

        <section className="workout-calendar-current">
          <div className="workout-calendar-current-copy">
            <span>TREINO EM ANDAMENTO</span>
            <strong>{plan.name}</strong>
            <p>
              Exercício {currentExerciseIndex + 1} de {exercises.length}
              {" • "}
              {remainingExercises} exercício(s) restante(s)
            </p>
          </div>

          <div className="workout-calendar-progress">
            <strong>{exerciseProgress}%</strong>
            <span>concluído</span>
          </div>
        </section>

        <div className="workout-calendar-summary">
          <article>
            <span>Dias treinados no mês</span>
            <strong>{canonicalDates.filter((key) => key.slice(0,7) === dateKey(now).slice(0,7)).length}</strong>
            <small>{data?.currentMonthLabel ?? "Carregando calendário"}</small>
          </article>
          <article>
            <span>Treinos feitos na semana</span>
            <strong>{trainedThisWeek}</strong>
            <small>
              {planDays.length
                ? `${remainingThisWeek} ainda previsto(s)`
                : "Sem frequência semanal definida"}
            </small>
          </article>
          <article>
            <span>Próximo dia planejado</span>
            <strong className="text-value">
              {nextScheduledDay(planDays, now)}
            </strong>
            <small>
              {planDays.length
                ? `${planDays.length} dia(s) planejado(s) por semana`
                : "Peça ao professor para definir os dias"}
            </small>
          </article>
        </div>

        <section className="workout-calendar-week-section">
          <header>
            <div>
              <strong>Plano semanal</strong>
              <span>Amarelo indica os dias definidos pelo professor.</span>
            </div>
          </header>

          <div className="workout-calendar-days">
            {WEEK_LABELS.map((label, dayIndex) => {
              const active = planDays.includes(dayIndex);
              const today = now.getDay() === dayIndex;
              return (
                <div
                  key={label}
                  className={`${active ? "scheduled" : ""} ${
                    today ? "today" : ""
                  }`}
                >
                  <span>{label}</span>
                  <strong>{today ? "HOJE" : active ? "TREINO" : "LIVRE"}</strong>
                  <i />
                </div>
              );
            })}
          </div>
        </section>

        <section className="workout-month-card">
          <div className="workout-month-title">
            <div>
              <strong>
                {data?.currentMonthLabel ?? "Calendário mensal"}
              </strong>
              <span>
                Os dias amarelos representam treinos concluídos.
              </span>
            </div>
            <small>{loading || treinoStatus.isLoading ? "Atualizando..." : `${trainedDates.size} registro(s)`}</small>
          </div>

          <div className="workout-month-weekdays">
            {CALENDAR_WEEK_LABELS.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div className="workout-month-grid">
            {monthCells.map((cell) => {
              const trained = trainedDates.has(cell.key);
              const today = cell.key === data?.todayKey;
              return (
                <div
                  key={cell.key}
                  className={`${cell.inMonth ? "" : "outside"} ${
                    trained ? "trained" : ""
                  } ${today ? "today" : ""}`}
                >
                  <span>{cell.day}</span>
                  {trained ? <i /> : null}
                </div>
              );
            })}
          </div>
        </section>

        <section className="workout-calendar-list">
          <div className="workout-calendar-list-title">
            <div>
              <strong>Exercícios de hoje</strong>
              <span>
                Toque em um exercício para abri-lo diretamente.
              </span>
            </div>
            <small>
              {completedExerciseCount}/{exercises.length}
            </small>
          </div>

          <div className="workout-calendar-exercises">
            {exercises.map((exercise, index) => {
              const done = index < completedExerciseCount;
              const current = index === currentExerciseIndex;
              return (
                <button
                  type="button"
                  key={exercise.id}
                  className={`${done ? "done" : ""} ${
                    current ? "current" : ""
                  }`}
                  onClick={() => {
                    onSelectExercise(index);
                    onClose();
                  }}
                >
                  <i>
                    {done ? (
                      <WorkoutCheckIcon size={17} />
                    ) : (
                      index + 1
                    )}
                  </i>
                  <div>
                    <strong>{exercise.name}</strong>
                    <span>
                      {exercise.sets} séries • {exercise.repsMin}–
                      {exercise.repsMax} repetições •{" "}
                      {exercise.restSeconds}s de descanso
                    </span>
                  </div>
                  {current ? <small>AGORA</small> : null}
                </button>
              );
            })}
          </div>
        </section>
      </section>
    </div>,
    document.body,
  );
}
