import { Drawer } from "vaul";
import { motion, useReducedMotion } from "framer-motion";
import { DietInfoIcon } from "./DietIcons";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function DietInfoSheet({ open, onOpenChange }: Props) {
  const reducedMotion = useReducedMotion();

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="diet-drawer-overlay" />
        <Drawer.Content className="diet-info-drawer" aria-describedby="diet-info-description">
          <div className="diet-drawer-handle" />
          <div className="diet-info-hero">
            <span className="diet-info-icon"><DietInfoIcon size={26} /></span>
            <div>
              <Drawer.Title>Como funciona Minha dieta</Drawer.Title>
              <Drawer.Description id="diet-info-description">
                Aqui você acompanha sua energia do dia: quanto comeu, quanto bebeu de água e quanto gastou treinando. Toque em “Fotografar refeição” para registrar rápido com IA.
              </Drawer.Description>
            </div>
          </div>
          <motion.button
            type="button"
            className="diet-info-confirm"
            whileTap={reducedMotion ? undefined : { scale: 0.98 }}
            onClick={() => onOpenChange(false)}
          >
            Entendi
          </motion.button>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
