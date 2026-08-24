import { motion, useReducedMotion } from "framer-motion";
import ResponsiveDialog from "../ResponsiveDialog";
import { DietCloseIcon, DietInfoIcon } from "./DietIcons";

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export default function DietInfoSheet({ open, onOpenChange }: Props) {
  const reducedMotion = useReducedMotion();
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Como funciona Minha dieta"
      description="Aqui você acompanha sua energia do dia: quanto comeu, quanto bebeu de água e quanto gastou treinando. Toque em “Fotografar refeição” para registrar rápido com IA."
      ariaDescriptionId="diet-info-description"
      className="diet-info-dialog"
      closeButton={<button type="button" aria-label="Fechar informações"><DietCloseIcon /></button>}
    >
      <div className="diet-info-hero">
        <span className="diet-info-icon"><DietInfoIcon size={26} /></span>
        <p>Os números são estimativas para acompanhamento do dia e podem ser ajustados por você a qualquer momento.</p>
      </div>
      <motion.button type="button" className="diet-info-confirm" whileTap={reducedMotion ? undefined : { scale: 0.98 }} onClick={() => onOpenChange(false)}>Entendi</motion.button>
    </ResponsiveDialog>
  );
}
