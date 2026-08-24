import ResponsiveDialog from "../ResponsiveDialog";
import type { Recipe } from "../../lib/diet";
import { DietCloseIcon, DietHeartIcon } from "./DietIcons";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  alternative: Recipe | null;
  busy?: boolean;
  onKeep: () => void | Promise<void>;
  onSwap: () => void | Promise<void>;
};

export default function HealthNudgeDialog({ open, onOpenChange, itemName, alternative, busy = false, onKeep, onSwap }: Props) {
  if (!alternative) return null;
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Uma alternativa para a próxima"
      description={`Quer mesmo registrar ${itemName}? Se topar, na próxima refeição que tal experimentar ${alternative.name}?`}
      ariaDescriptionId="diet-health-nudge-description"
      className="diet-health-nudge"
      closeButton={<button type="button" aria-label="Fechar sugestão"><DietCloseIcon /></button>}
    >
      <div className="diet-health-nudge-card">
        <span><DietHeartIcon size={21} /></span>
        <div><small>SUGESTÃO ACCQUA</small><strong>{alternative.name}</strong><p>{Math.round(alternative.macros.calorias)} kcal · P {Math.round(alternative.macros.proteina_g)}g · C {Math.round(alternative.macros.carbo_g)}g · G {Math.round(alternative.macros.gordura_g)}g</p></div>
      </div>
      <div className="diet-health-nudge-actions">
        <button type="button" className="is-secondary" disabled={busy} onClick={() => void onKeep()}>Adicionar mesmo assim</button>
        <button type="button" className="is-primary" disabled={busy} onClick={() => void onSwap()}>Trocar por {alternative.name}</button>
      </div>
    </ResponsiveDialog>
  );
}
