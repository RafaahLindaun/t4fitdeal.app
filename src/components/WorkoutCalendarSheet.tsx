import { useEffect, useMemo, useState } from "react";
import {
  loadWorkoutCalendar,
  type WorkoutCalendarData,
  type WorkoutExerciseRecord,
  type WorkoutPlanRecord,
} from "../lib/workout";
import { WorkoutCheckIcon } from "./WorkoutIcons";

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
  const [loading, setLoading] = useState(false);
  const now = useMemo(() => new Date(), []);
  const monthCells = useMemo(() => buildMonthCells(now), [now]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);

    loadWorkoutCalendar(userId, plan).then((result) => {
      if (!active) return;
      setData(result);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [open, userId, plan.id]);

  if (!open) return null;

  const trainedDates = new Set(data?.trainedDates ?? []);
  const planDays = plan.weekDays;
  const remainingExercises = Math.max(
    0,
    exercises.length - completedExerciseCount,
  );
  const scheduledThisWeek = planDays.length;
  const trainedThisWeek = data?.trainedThisWeek ?? 0;
  const remainingThisWeek = Math.max(0, scheduledThisWeek - trainedThisWeek);

  return (
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
          <div>
            <span>SEU CALENDÁRIO</span>
            <h2>Treinos da semana</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </header>

        <div className="workout-calendar-summary">
          <article>
            <span>Treino atual</span>
            <strong>{plan.name}</strong>
            <small>
              Exercício {currentExerciseIndex + 1} de {exercises.length}
            </small>
          </article>
          <article>
            <span>Treinou no mês</span>
            <strong>{data?.trainedThisMonth ?? 0} dias</strong>
            <small>{data?.currentMonthLabel ?? "Carregando..."}</small>
          </article>
          <article>
            <span>Faltam na semana</span>
            <strong>
              {planDays.length ? remainingThisWeek : "—"}
            </strong>
            <small>
              {planDays.length
                ? `${trainedThisWeek} realizado(s)`
                : "Professor ainda não definiu os dias"}
            </small>
          </article>
        </div>

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
                <i />
              </div>
            );
          })}
        </div>

        <section className="workout-month-card">
          <div className="workout-month-title">
            <strong>
              {data?.currentMonthLabel ?? "Calendário"}
            </strong>
            {loading ? <span>Atualizando...</span> : <span>● treino concluído</span>}
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
              <strong>Treino de hoje</strong>
              <span>{remainingExercises} exercício(s) restante(s)</span>
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
                      <WorkoutCheckIcon size={15} />
                    ) : (
                      index + 1
                    )}
                  </i>
                  <div>
                    <strong>{exercise.name}</strong>
                    <span>
                      {exercise.sets} séries • {exercise.repsMin}–
                      {exercise.repsMax} reps
                    </span>
                  </div>
                  {current ? <small>AGORA</small> : null}
                </button>
              );
            })}
          </div>
        </section>
      </section>
    </div>
  );
}
