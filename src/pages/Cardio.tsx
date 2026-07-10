import { useEffect, useMemo, useState } from "react";
import AppShell, { SmallIconButton } from "../components/AppShell";
import { Panel, SectionTitle, Stat } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import { saveCardioSession } from "../lib/data";

const cardioOptions = ["Esteira", "Bike", "Escada", "Elíptico", "Corrida", "Caminhada"];

export default function Cardio() {
  const { user } = useAuth();
  const [type, setType] = useState("Esteira");
  const [targetMinutes, setTargetMinutes] = useState(30);
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let timer: number | undefined;
    if (running) {
      timer = window.setInterval(() => setSeconds((prev) => prev + 1), 1000);
    }
    return () => { if (timer) window.clearInterval(timer); };
  }, [running]);

  const kcal = useMemo(() => Math.round(seconds / 6.5), [seconds]);
  const distance = useMemo(() => (seconds / 900).toFixed(2), [seconds]);
  const pace = useMemo(() => `${Math.max(4, 10 - Math.floor(seconds / 600))}:20`, [seconds]);
  const formatted = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  const toggle = async () => {
    if (running) {
      setRunning(false);
      if (user && seconds > 0) {
        await saveCardioSession({
          student_id: user.id,
          type,
          duration_seconds: seconds,
          calories: kcal,
          distance_km: Number(distance),
        });
      }
      return;
    }
    setRunning(true);
  };

  const reset = () => {
    setRunning(false);
    setSeconds(0);
  };

  return (
    <AppShell title="Bora pro Cardio!" subtitle="Modo cardio mais leve e intuitivo." action={<div className="flex gap-8"><SmallIconButton label="Meta" icon="calendar" /><SmallIconButton label="Info" icon="info" /></div>}>
      <Panel>
        <div className="cardio-figure">
          <div className="cardio-figure-media">🏃‍♂️</div>
          <div>
            <div className="pill">Modo cardio</div>
            <h3>{type}</h3>
            <p>Configure o tempo, conecte sua pulseira e acompanhe tudo em tempo real.</p>
          </div>
        </div>
        <div className="stats-grid three">
          <Stat label="Cronômetro" value={formatted} />
          <Stat label="Kcal" value={kcal} />
          <Stat label="Pace estimado" value={pace} />
        </div>
        <div className="stats-grid two">
          <Stat label="Distância" value={`${distance} km`} small />
          <Stat label="Tempo meta" value={`${targetMinutes} min`} small />
        </div>
      </Panel>

      <Panel>
        <SectionTitle title="Configurações" />
        <div className="stack-14">
          <label className="stack-8"><span>Meta de tempo</span><input className="range" type="range" min="10" max="90" step="5" value={targetMinutes} onChange={(e) => setTargetMinutes(Number(e.target.value))} /><strong>{targetMinutes} min</strong></label>
          <label className="stack-8"><span>Pulseira Bluetooth</span><button className="secondary-btn small" type="button">Conectar</button></label>
        </div>
      </Panel>

      <Panel>
        <SectionTitle title="Tipos de cardio" />
        <div className="chip-grid">
          {cardioOptions.map((item) => (
            <button key={item} className={`chip ${item === type ? "active" : ""}`} onClick={() => setType(item)}>{item}</button>
          ))}
        </div>
        <div className="workout-actions top-space">
          <button className="primary-btn" onClick={toggle}>{running ? "Pausar cardio" : "Iniciar cardio"}</button>
          <button className="ghost-btn small" onClick={reset}>Resetar</button>
        </div>
      </Panel>
    </AppShell>
  );
}
