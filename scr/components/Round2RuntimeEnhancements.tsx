import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../lib/supabase";

const WEEK_DAYS = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
];

type ScheduleMode = "all" | "specific";
type AddState = "add" | "added" | "remove";

type AddSlot = {
  id: string;
  host: HTMLElement;
  original: HTMLButtonElement;
  name: string;
  mobileOuter: boolean;
};

function useDomTarget(selector: string, active = true) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!active) { setTarget(null); return; }
    let frame = 0;
    const scan = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => setTarget(document.querySelector<HTMLElement>(selector)));
    };
    scan();
    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => { window.cancelAnimationFrame(frame); observer.disconnect(); };
  }, [active, selector]);
  return target;
}

function readSelectedExerciseNames() {
  return new Set(
    Array.from(document.querySelectorAll<HTMLElement>(".admin-builder-exercise strong"))
      .map((element) => element.textContent?.trim() ?? "")
      .filter(Boolean),
  );
}

function Round2ExerciseStateControl({ slot }: { slot: AddSlot }) {
  const [revision, setRevision] = useState(0);
  const inRoutine = useMemo(() => readSelectedExerciseNames().has(slot.name), [revision, slot.name]);
  const [state, setState] = useState<AddState>(inRoutine ? "added" : "add");

  useEffect(() => {
    const observer = new MutationObserver(() => setRevision((value) => value + 1));
    const canvas = document.querySelector(".admin-builder-routine-canvas") ?? document.querySelector(".admin-builder-workspace");
    if (canvas) observer.observe(canvas, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inRoutine) setState("add");
    else if (state === "add") setState("added");
  }, [inRoutine, state]);

  const add = () => {
    slot.original.click();
    setState("added");
  };

  const remove = () => {
    const exercise = Array.from(document.querySelectorAll<HTMLElement>(".admin-builder-exercise"))
      .find((article) => article.querySelector("strong")?.textContent?.trim() === slot.name);
    const removeButton = exercise?.querySelector<HTMLButtonElement>(".admin-builder-delete-exercise");
    if (removeButton) removeButton.click();
    setState("add");
  };

  const activate = (event: React.MouseEvent | React.KeyboardEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (state === "add") add();
    else if (state === "added") setState("remove");
    else remove();
  };

  return <AnimatePresence mode="wait" initial={false}>
    <motion.span
      key={`${slot.id}-${state}`}
      role="button"
      tabIndex={0}
      className={`admin-builder-add-exercise-button is-${state === "add" ? "add" : state === "added" ? "added" : "remove"}`}
      initial={{ opacity: 0, scale: .82 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: .86 }}
      whileTap={{ scale: .92 }}
      transition={{ duration: .14 }}
      onClick={activate}
      onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") activate(event); }}
      aria-label={state === "add" ? `Adicionar ${slot.name}` : state === "added" ? `${slot.name} está no treino. Toque para revelar remoção.` : `Remover ${slot.name} do treino`}
    >
      <b aria-hidden="true">{state === "add" ? "+" : state === "added" ? "✓" : "×"}</b>
      <span>{state === "add" ? (slot.mobileOuter ? "Adicionar" : "") : state === "added" ? "No treino" : "Remover do treino"}</span>
    </motion.span>
  </AnimatePresence>;
}

function Round2ExerciseButtons({ active }: { active: boolean }) {
  const [slots, setSlots] = useState<AddSlot[]>([]);

  useEffect(() => {
    if (!active) { setSlots([]); return; }
    const owned = new Set<HTMLElement>();
    let frame = 0;
    const scan = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const next: AddSlot[] = [];
        const addSlot = (original: HTMLButtonElement, mobileOuter: boolean) => {
          const card = mobileOuter ? original : original.closest<HTMLElement>("article");
          const name = card?.querySelector("strong")?.textContent?.trim() ?? "";
          if (!name) return;
          let host = original.dataset.round2HostId
            ? document.querySelector<HTMLElement>(`[data-round2-slot="${original.dataset.round2HostId}"]`)
            : null;
          const id = original.dataset.round2HostId || `round2-add-${Math.random().toString(36).slice(2,10)}`;
          original.dataset.round2HostId = id;
          if (!host) {
            host = document.createElement("span");
            host.dataset.round2Slot = id;
            host.className = `round2-add-slot ${mobileOuter ? "is-mobile-result" : ""}`;
            if (mobileOuter) {
              const action = original.querySelector<HTMLElement>("b") ?? original;
              action.classList.add("round2-original-action-host");
              action.appendChild(host);
            } else {
              original.classList.add("round2-original-add-hidden");
              original.insertAdjacentElement("afterend", host);
            }
          }
          owned.add(host);
          next.push({ id, host, original, name, mobileOuter });
        };

        document.querySelectorAll<HTMLButtonElement>(".admin-builder-mobile-search-results > button").forEach((button) => addSlot(button, true));
        document.querySelectorAll<HTMLButtonElement>(".admin-builder-library-add-item").forEach((button) => addSlot(button, false));
        document.querySelectorAll<HTMLButtonElement>(".admin-v11-library-results > article > button.accqua-pressable").forEach((button) => addSlot(button, false));
        setSlots(next);
      });
    };
    scan();
    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      document.querySelectorAll<HTMLElement>("[data-round2-slot]").forEach((element) => element.remove());
      document.querySelectorAll<HTMLElement>(".round2-original-add-hidden").forEach((element) => element.classList.remove("round2-original-add-hidden"));
      document.querySelectorAll<HTMLElement>(".round2-original-action-host").forEach((element) => element.classList.remove("round2-original-action-host"));
    };
  }, [active]);

  return <>{slots.map((slot) => slot.host.isConnected ? createPortal(<Round2ExerciseStateControl key={slot.id} slot={slot}/>, slot.host, slot.id) : null)}</>;
}

function Round2BuilderCardioSchedule({ active, studentId }: { active: boolean; studentId: string }) {
  const target = useDomTarget(".admin-builder-cardio-fields", active);
  const [mode, setMode] = useState<ScheduleMode>("all");
  const [days, setDays] = useState<number[]>([]);
  const loadedStudentRef = useRef("");

  useEffect(() => {
    if (!active || !studentId || loadedStudentRef.current === studentId) return;
    loadedStudentRef.current = studentId;
    const localKey = `accqua:builder-cardio-schedule:${studentId}`;
    try {
      const local = JSON.parse(window.sessionStorage.getItem(localKey) || "null") as { mode?: ScheduleMode; days?: number[] } | null;
      if (local?.mode) { setMode(local.mode); setDays(Array.isArray(local.days) ? local.days : []); }
    } catch {}
    void supabase.rpc("get_staff_active_cardio_schedule_v1_6_5_7", { p_student_id: studentId }).then(({ data, error }) => {
      if (error || !data || typeof data !== "object") return;
      const row = data as Record<string, unknown>;
      const nextMode: ScheduleMode = row.scheduleMode === "specific" ? "specific" : "all";
      const nextDays = Array.isArray(row.weekDays) ? row.weekDays.map(Number).filter((day) => day >= 0 && day <= 6) : [];
      setMode(nextMode); setDays(nextDays);
    });
  }, [active, studentId]);

  useEffect(() => {
    if (!studentId) return;
    window.sessionStorage.setItem(`accqua:builder-cardio-schedule:${studentId}`, JSON.stringify({ mode, days }));
  }, [days, mode, studentId]);

  useEffect(() => {
    if (!active || !studentId) return;
    const capturePublish = (event: MouseEvent) => {
      const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>("button");
      if (!button || !document.querySelector(".admin-builder-screen.is-step-cardio") || !document.querySelector(".admin-builder-cardio-fields")) return;
      const isPublish = button.matches(".admin-builder-mobile-primary") || button.matches(".admin-builder-footer-actions .is-publish");
      if (!isPublish) return;
      if (mode === "specific" && !days.length) return;
      window.sessionStorage.setItem("accqua:pending-cardio-schedule", JSON.stringify({ studentId, mode, days, at: Date.now() }));
    };
    document.addEventListener("click", capturePublish, true);
    return () => document.removeEventListener("click", capturePublish, true);
  }, [active, days, mode, studentId]);

  if (!target) return null;
  return createPortal(
    <div className="admin-builder-cardio-schedule" aria-label="Dias do cardio prescrito">
      <span>Frequência do cardio</span>
      <div className="admin-builder-cardio-frequency">
        <button type="button" className={mode === "all" ? "is-active" : ""} aria-pressed={mode === "all"} onClick={() => setMode("all")}>Todos os dias</button>
        <button type="button" className={mode === "specific" ? "is-active" : ""} aria-pressed={mode === "specific"} onClick={() => setMode("specific")}>Dias específicos</button>
      </div>
      {mode === "specific" ? <div className="admin-builder-cardio-days">{WEEK_DAYS.map((day) => {
        const selected = days.includes(day.value);
        return <button type="button" key={day.value} className={selected ? "is-active" : ""} aria-pressed={selected} onClick={() => setDays((current) => selected ? current.filter((value) => value !== day.value) : [...current, day.value].sort())}>{day.label}</button>;
      })}</div> : null}
      {mode === "specific" && !days.length ? <small>Selecione pelo menos um dia.</small> : null}
    </div>,
    target,
  );
}

function Round2CardioScheduleSync({ activeBuilder }: { activeBuilder: boolean }) {
  const location = useLocation();
  const syncing = useRef(false);
  useEffect(() => {
    if (activeBuilder || syncing.current) return;
    let pending: { studentId?: string; mode?: ScheduleMode; days?: number[]; at?: number } | null = null;
    try { pending = JSON.parse(window.sessionStorage.getItem("accqua:pending-cardio-schedule") || "null"); } catch {}
    if (!pending?.studentId || !pending.mode || Date.now() - Number(pending.at ?? 0) > 5 * 60_000) return;
    syncing.current = true;
    let attempts = 0;
    const sync = async () => {
      attempts += 1;
      const { data, error } = await supabase.rpc("set_active_workout_cardio_schedule_v1_6_5_7", {
        p_student_id: pending!.studentId,
        p_schedule_mode: pending!.mode,
        p_week_days: pending!.mode === "specific" ? (pending!.days ?? []) : [],
      });
      if (!error && data === true) {
        window.sessionStorage.removeItem("accqua:pending-cardio-schedule");
        syncing.current = false;
        return;
      }
      if (attempts < 4) window.setTimeout(() => void sync(), 450 * attempts);
      else syncing.current = false;
    };
    const timer = window.setTimeout(() => void sync(), 300);
    return () => window.clearTimeout(timer);
  }, [activeBuilder, location.pathname, location.search]);
  return null;
}

function Round2ProfessorCardioSchedule({ active }: { active: boolean }) {
  const { user } = useAuth();
  const target = useDomTarget(".cardio-title-row", active);
  const [schedule, setSchedule] = useState<{ mode: ScheduleMode; days: number[]; notes: string } | null>(null);

  useEffect(() => {
    if (!active || !user?.id) { setSchedule(null); return; }
    let cancelled = false;
    void supabase.rpc("get_my_active_cardio_schedule_v1_6_5_7").then(({ data, error }) => {
      if (cancelled || error || !data || typeof data !== "object") return;
      const row = data as Record<string, unknown>;
      setSchedule({
        mode: row.scheduleMode === "specific" ? "specific" : "all",
        days: Array.isArray(row.weekDays) ? row.weekDays.map(Number).filter((day) => day >= 0 && day <= 6) : [],
        notes: String(row.notes ?? "").trim(),
      });
    });
    return () => { cancelled = true; };
  }, [active, user?.id]);

  if (!target || !schedule) return null;
  const prescribed = schedule.mode === "all" ? new Set(WEEK_DAYS.map((day) => day.value)) : new Set(schedule.days);
  return createPortal(
    <section className="cardio-professor-schedule" aria-label="Agenda do cardio definido pelo professor">
      <div><div><strong>Cardio definido pelo professor</strong><p>{schedule.mode === "all" ? "Prescrito para todos os dias." : "Dias destacados foram definidos na sua ficha."}</p></div></div>
      <div className="cardio-professor-week">{WEEK_DAYS.map((day) => <span key={day.value} className={`cardio-professor-day ${prescribed.has(day.value) ? "is-prescribed" : ""}`} title={prescribed.has(day.value) ? "Cardio definido pelo professor" : undefined}>{day.label}</span>)}</div>
      {schedule.notes ? <div className="cardio-professor-instructions"><strong>Orientações</strong><br/>{schedule.notes}</div> : null}
    </section>,
    target,
  );
}

export default function Round2RuntimeEnhancements() {
  const location = useLocation();
  const builderActive = location.pathname.includes("/area-accqua/montar/editor");
  const cardioActive = location.pathname === "/cardio";
  const studentId = useMemo(() => new URLSearchParams(location.search).get("student") ?? "", [location.search]);
  return <>
    <Round2ExerciseButtons active={builderActive}/>
    <Round2BuilderCardioSchedule active={builderActive} studentId={studentId}/>
    <Round2CardioScheduleSync activeBuilder={builderActive}/>
    <Round2ProfessorCardioSchedule active={cardioActive}/>
  </>;
}
