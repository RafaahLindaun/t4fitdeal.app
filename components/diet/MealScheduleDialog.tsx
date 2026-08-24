import ResponsiveDialog from "../ResponsiveDialog";
import { buildMealSchedule } from "../../lib/diet";
import { DietClockIcon, DietCloseIcon } from "./DietIcons";

type Props = { open: boolean; onOpenChange: (open: boolean) => void; calorieTarget: number };

export default function MealScheduleDialog({ open, onOpenChange, calorieTarget }: Props) {
  const schedule = buildMealSchedule(calorieTarget);
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Cronograma de refeições"
      description="Uma distribuição aproximada da sua meta diária para ajudar na organização. É uma sugestão de rotina, não uma prescrição nutricional."
      ariaDescriptionId="diet-schedule-description"
      className="diet-schedule-dialog"
      closeButton={<button type="button" aria-label="Fechar cronograma"><DietCloseIcon /></button>}
    >
      <div className="diet-schedule-target"><DietClockIcon size={20} /><span>Meta usada</span><strong>{Math.round(Math.max(0, calorieTarget))} kcal/dia</strong></div>
      <div className="diet-schedule-list">
        {schedule.map((item) => (
          <article key={item.key}>
            <div><strong>{item.label}</strong><span>{item.timeWindow}</span></div>
            <b>~{item.calories} kcal</b>
          </article>
        ))}
      </div>
      <p className="diet-schedule-note">Horários e proporções podem ser ajustados à sua rotina. O mais importante é usar o cronograma como referência, não como regra rígida.</p>
    </ResponsiveDialog>
  );
}
