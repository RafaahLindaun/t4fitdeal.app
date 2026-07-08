import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AppShell, { Card } from "../components/AppShell";
import Icon from "../components/Icon";
import { useAuth } from "../context/AuthContext";
import { durationClock } from "../lib/format";
import { supabase } from "../lib/supabase";

const types = [
  ["Esteira", "run"], ["Bike", "bike"], ["Elíptico", "refresh"], ["Escada", "chart"],
  ["Remo", "dumbbell"], ["Natação", "swim"], ["Caminhada", "user"],
] as const;

const kcalPerMinute: Record<string, number> = { Esteira: 8.4, Bike: 7, Elíptico: 7.5, Escada: 9, Remo: 8, Natação: 8.5, Caminhada: 4.5 };
const kmPerMinute: Record<string, number> = { Esteira: .12, Bike: .35, Elíptico: .10, Escada: .03, Remo: .16, Natação: .045, Caminhada: .075 };

export default function Cardio() {
  const { user } = useAuth();
  const [type, setType] = useState("Esteira");
  const [goalMinutes, setGoalMinutes] = useState(30);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [saved, setSaved] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState("");
  const interval = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    interval.current = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => { if (interval.current) window.clearInterval(interval.current); };
  }, [running]);

  const elapsedMinutes = elapsed / 60;
  const kcal = Math.round(elapsedMinutes * (kcalPerMinute[type] || 7));
  const distance = elapsedMinutes * (kmPerMinute[type] || .1);
  const pace = distance > 0 ? elapsedMinutes / distance : 0;
  const progress = Math.min(100, (elapsed / Math.max(goalMinutes * 60, 1)) * 100);

  async function connectBluetooth() {
    try {
      const bluetooth = (navigator as Navigator & { bluetooth?: { requestDevice: (options: unknown) => Promise<{ name?: string }> } }).bluetooth;
      if (!bluetooth) { setConnectedDevice("Bluetooth não disponível neste navegador"); return; }
      const device = await bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: ["heart_rate"] });
      setConnectedDevice(device.name || "Dispositivo conectado");
    } catch { setConnectedDevice("Conexão cancelada"); }
  }

  async function finish() {
    if (!user || elapsed < 10) return;
    setRunning(false);
    const { error } = await supabase.from("cardio_sessions").insert({
      user_id: user.id, cardio_type: type, duration_seconds: elapsed, kcal,
      distance_km: Number(distance.toFixed(2)), pace: Number(pace.toFixed(2)),
      heart_rate_avg: null,
    });
    if (!error) setSaved(true);
  }

  return <AppShell title="Bora pro Cardio!" back right={<div className="header-actions"><Link className="mode-chip" to="/treino"><Icon name="dumbbell"/><span>Treino</span></Link><button className="icon-button"><Icon name="calendar"/></button></div>}>
    <div className="cardio-type-icons">{types.map(([label, icon]) => <button key={label} className={type === label ? "active" : ""} onClick={() => { setType(label); setSaved(false); }} title={label}><Icon name={icon}/><span>{label}</span></button>)}</div>
    <Card className="cardio-visual"><div className="runner-graphic"><span className="runner-head"/><span className="runner-body"/><span className="runner-arm"/><span className="runner-leg one"/><span className="runner-leg two"/><span className="treadmill"><i/><b/></span></div><div className="cardio-visual-copy"><span><Icon name="heart"/> CARDIO</span><h2>{type}</h2><p>Registre o tempo e acompanhe suas métricas.</p></div></Card>
    <div className="cardio-main-metrics"><Card><Icon name="flame"/><small>Kcal</small><strong>{kcal}</strong></Card><div className="timer-ring" style={{ "--progress": `${progress * 3.6}deg` } as any}><small>TEMPO</small><strong>{durationClock(elapsed)}</strong><span>{Math.round(progress)}% da meta</span></div><Card><Icon name="clock"/><small>Pace estimado</small><strong>{pace ? `${pace.toFixed(1)}` : "—"}</strong><span>min/km</span></Card></div>
    <Card className="time-config-card"><div className="time-config-title"><Icon name="settings"/><div><strong>Configurar tempo</strong><small>Ajuste a duração antes ou durante o cardio.</small></div></div><div className="time-stepper"><button onClick={()=>setGoalMinutes(Math.max(5,goalMinutes-5))}><Icon name="minus"/></button><div><strong>{String(goalMinutes).padStart(2,"0")}:00</strong><small>minutos</small></div><button onClick={()=>setGoalMinutes(Math.min(180,goalMinutes+5))}><Icon name="plus"/></button></div><input className="range" type="range" min="5" max="120" step="5" value={goalMinutes} onChange={(e)=>setGoalMinutes(Number(e.target.value))}/><div className="quick-times">{[15,30,45,60].map(value=><button key={value} className={goalMinutes===value?"active":""} onClick={()=>setGoalMinutes(value)}>{value} min</button>)}</div></Card>
    <Card className="bluetooth-card"><div><span className="bluetooth-symbol">B</span><div><strong>Pulseira ou relógio</strong><small>{connectedDevice || "Conecte por Bluetooth para usar frequência cardíaca."}</small></div></div><button className="button small outline" onClick={connectBluetooth}>Conectar</button></Card>
    {saved && <div className="notice success"><Icon name="check"/><span>Cardio salvo no seu histórico.</span></div>}
    <div className="cardio-actions"><button className={`button large ${running ? "warning" : "primary"}`} onClick={()=>setRunning(!running)}><Icon name={running?"pause":"play"}/>{running ? "Pausar cardio" : elapsed ? "Continuar cardio" : "Iniciar cardio"}</button>{elapsed > 0 && <button className="button outline large" onClick={finish}><Icon name="check"/>Concluir cardio</button>}</div>
  </AppShell>;
}
