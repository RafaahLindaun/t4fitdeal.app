import { type ChangeEvent } from "react";
import { Drawer } from "vaul";
import { motion, useReducedMotion } from "framer-motion";
import { useMealCapture } from "../../hooks/useMealCapture";
import type { MealItem } from "../../lib/diet";
import { DietCameraIcon, DietCheckIcon, DietCloseIcon, DietPlusIcon, DietSparkIcon } from "./DietIcons";

function n(value: string) { const parsed = Number(value); return Number.isFinite(parsed) ? Math.max(0, parsed) : 0; }

export default function MealCaptureSheet({ open, onOpenChange, userId, onSaved }: { open: boolean; onOpenChange: (open: boolean) => void; userId: string; onSaved: () => Promise<void> }) {
  const reducedMotion = useReducedMotion();
  const capture = useMealCapture(userId, onSaved);

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void capture.selectFile(file);
  };

  const updateItem = (index: number, patch: Partial<MealItem>) => {
    if (!capture.draft) return;
    const items = capture.draft.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item);
    capture.updateItems(items);
    capture.updateTotals(
      items.reduce((sum, item) => sum + n(String(item.calorias)), 0),
      {
        proteina_g: items.reduce((sum, item) => sum + n(String(item.proteina_g)), 0),
        carbo_g: items.reduce((sum, item) => sum + n(String(item.carbo_g)), 0),
        gordura_g: items.reduce((sum, item) => sum + n(String(item.gordura_g)), 0),
      },
    );
  };

  const addItem = () => {
    if (!capture.draft) return;
    capture.updateItems([...capture.draft.items, { nome: "Novo item", quantidade_estimada_g: 0, calorias: 0, proteina_g: 0, carbo_g: 0, gordura_g: 0 }]);
  };

  const close = () => { capture.reset(); onOpenChange(false); };

  return (
    <Drawer.Root open={open} onOpenChange={(value) => value ? onOpenChange(true) : close()}>
      <Drawer.Portal>
        <Drawer.Overlay className="diet-drawer-overlay" />
        <Drawer.Content className="diet-meal-drawer" aria-describedby="diet-meal-description">
          <div className="diet-drawer-handle" />
          <header className="diet-drawer-header">
            <div><Drawer.Title>Registrar refeição</Drawer.Title><Drawer.Description id="diet-meal-description">Fotografe um prato ou rótulo e revise antes de salvar.</Drawer.Description></div>
            <button type="button" onClick={close} aria-label="Fechar registro de refeição"><DietCloseIcon /></button>
          </header>

          {capture.stage === "capture" ? (
            <div className="diet-capture-stage">
              <div className="diet-capture-mode" role="radiogroup" aria-label="Tipo de imagem">
                <button type="button" className={capture.mode === "prato" ? "is-active" : ""} onClick={() => capture.setMode("prato")}>Prato / comida</button>
                <button type="button" className={capture.mode === "rotulo" ? "is-active" : ""} onClick={() => capture.setMode("rotulo")}>Rótulo nutricional</button>
              </div>
              <label className="diet-camera-cta">
                <input type="file" accept="image/*" capture="environment" onChange={handleFile} />
                <span><DietCameraIcon size={31} /></span>
                <strong>Abrir câmera</strong>
                <small>{capture.mode === "rotulo" ? "Enquadre a tabela nutricional inteira" : "Fotografe o prato de cima, com boa luz"}</small>
              </label>
              <p className="diet-ai-note"><DietSparkIcon size={17} /> A estimativa por imagem é aproximada. Revise os valores antes de registrar.</p>
            </div>
          ) : null}

          {capture.stage === "analyzing" ? (
            <div className="diet-analyzing" role="status" aria-live="polite"><span><DietSparkIcon size={30} /></span><strong>Analisando sua refeição...</strong><p>Enviando a imagem com segurança e estruturando calorias e macronutrientes.</p><i /></div>
          ) : null}

          {capture.stage === "review" && capture.draft ? (
            <div className="diet-review-stage">
              <div className="diet-review-preview"><img src={capture.draft.previewUrl} alt="Prévia da refeição" /><span className={capture.draft.confidence < .6 ? "is-low" : ""}>Confiança {Math.round(capture.draft.confidence * 100)}%</span></div>
              {capture.draft.confidence < .6 ? <div className="diet-low-confidence"><strong>Revise antes de salvar</strong><p>A confiança ficou abaixo de 60%. Nada será registrado sem sua confirmação.</p></div> : null}

              <div className="diet-review-items">
                {capture.draft.items.map((item, index) => (
                  <article key={index} className="diet-review-item">
                    <input aria-label={`Nome do item ${index + 1}`} value={item.nome} onChange={(event) => updateItem(index, { nome: event.target.value })} />
                    <div className="diet-review-fields">
                      <label><span>Qtd. g</span><input type="number" inputMode="decimal" value={item.quantidade_estimada_g} onChange={(event) => updateItem(index, { quantidade_estimada_g: n(event.target.value) })} /></label>
                      <label><span>kcal</span><input type="number" inputMode="decimal" value={item.calorias} onChange={(event) => updateItem(index, { calorias: n(event.target.value) })} /></label>
                      <label><span>Proteína</span><input type="number" inputMode="decimal" value={item.proteina_g} onChange={(event) => updateItem(index, { proteina_g: n(event.target.value) })} /></label>
                      <label><span>Carbo</span><input type="number" inputMode="decimal" value={item.carbo_g} onChange={(event) => updateItem(index, { carbo_g: n(event.target.value) })} /></label>
                      <label><span>Gordura</span><input type="number" inputMode="decimal" value={item.gordura_g} onChange={(event) => updateItem(index, { gordura_g: n(event.target.value) })} /></label>
                    </div>
                  </article>
                ))}
                <button type="button" className="diet-add-food" onClick={addItem}><DietPlusIcon size={17} /> Adicionar item</button>
              </div>

              <div className="diet-review-total"><div><span>Total estimado</span><strong>{Math.round(capture.draft.caloriesTotal)} kcal</strong></div><small>P {Math.round(capture.draft.macros.proteina_g)}g · C {Math.round(capture.draft.macros.carbo_g)}g · G {Math.round(capture.draft.macros.gordura_g)}g</small></div>

              <motion.button type="button" className="diet-confirm-meal" disabled={capture.saving} whileTap={reducedMotion ? undefined : { scale: .98 }} onClick={async () => { const saved = await capture.confirm(); if (saved) onOpenChange(false); }}><DietCheckIcon /> {capture.saving ? "Salvando..." : "Confirmar e registrar"}</motion.button>
            </div>
          ) : null}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
