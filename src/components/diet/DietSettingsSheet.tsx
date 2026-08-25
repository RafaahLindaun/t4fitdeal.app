import { useEffect, useState } from "react";
import ResponsiveDialog from "../ResponsiveDialog";
import type { DietProfile } from "../../lib/diet";
import { DietCloseIcon } from "./DietIcons";

export default function DietSettingsSheet({ open, onOpenChange, profile, busy, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; profile: DietProfile; busy: boolean; onSave: (input: Partial<DietProfile>) => Promise<void> }) {
  const [draft, setDraft] = useState(profile);
  useEffect(() => { if (open) setDraft(profile); }, [open, profile]);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Metas e dados"
      description="Ajuste os dados usados nas sugestões de água e calorias."
      ariaDescriptionId="diet-settings-description"
      className="diet-settings-dialog"
      bodyClassName="diet-settings-dialog-body"
      closeButton={<button type="button" aria-label="Fechar configurações"><DietCloseIcon /></button>}
    >
      <div className="diet-settings-form">
        <div className="diet-settings-grid">
          <label><span>Peso</span><div><input type="number" inputMode="decimal" value={draft.weightKg || ""} onChange={(e) => setDraft({ ...draft, weightKg: Number(e.target.value) || 0 })} /><small>kg</small></div></label>
          <label><span>Altura</span><div><input type="number" inputMode="decimal" value={draft.heightCm || ""} onChange={(e) => setDraft({ ...draft, heightCm: Number(e.target.value) || 0 })} /><small>cm</small></div></label>
        </div>

        <label className="diet-settings-select"><span>Referência da fórmula metabólica</span><select value={draft.sexForFormula} onChange={(e) => setDraft({ ...draft, sexForFormula: e.target.value as DietProfile["sexForFormula"] })}><option value="unspecified">Não informar</option><option value="female">Fórmula feminina</option><option value="male">Fórmula masculina</option></select><small>Usado apenas para a sugestão de Mifflin-St Jeor.</small></label>

        <div className="diet-settings-grid">
          <label><span>Meta de calorias</span><div><input type="number" inputMode="numeric" value={draft.dailyCalorieTarget || ""} onChange={(e) => setDraft({ ...draft, dailyCalorieTarget: Number(e.target.value) || 0 })} /><small>kcal</small></div></label>
          <label><span>Meta de água</span><div><input type="number" inputMode="numeric" value={draft.dailyWaterTargetMl || ""} onChange={(e) => setDraft({ ...draft, dailyWaterTargetMl: Number(e.target.value) || 0 })} /><small>ml</small></div></label>
        </div>

        <label className="diet-settings-select"><span>Fonte do gasto calórico</span><select value={draft.preferredCalorieSource} onChange={(e) => setDraft({ ...draft, preferredCalorieSource: e.target.value as DietProfile["preferredCalorieSource"] })}><option value="manual">Treinos registrados</option><option value="garmin">Garmin Connect (futuro)</option><option value="apple_health">Apple Health (futuro)</option><option value="google_fit">Google Fit (futuro)</option><option value="samsung_health">Samsung Health (futuro)</option></select><small>Se uma fonte ainda não estiver conectada, usamos os treinos registrados no ACCQUA.</small></label>

        <p className="diet-settings-disclaimer">As metas sugeridas são estimativas gerais e não substituem avaliação nutricional individual.</p>
        <button type="button" className="diet-settings-save" disabled={busy} onClick={async () => { try { await onSave(draft); onOpenChange(false); } catch { /* toast exibido pelo hook */ } }}>{busy ? "Salvando..." : "Salvar ajustes"}</button>
      </div>
    </ResponsiveDialog>
  );
}
