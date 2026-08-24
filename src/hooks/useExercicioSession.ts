import { useCallback, useEffect, useReducer, useRef, useState } from "react";

export type ExercisePhase =
  | { value: "executando_serie" }
  | { value: "descanso"; totalSeconds: number; endsAt: number }
  | { value: "confirmando_serie" }
  | { value: "proxima_serie" }
  | { value: "fim_exercicio" };

type MachineAction =
  | { type: "RESET" }
  | { type: "START_REST"; seconds: number }
  | { type: "ADJUST_REST"; seconds: number }
  | { type: "REST_FINISHED" }
  | { type: "CONFIRM_SUCCESS"; hasNextSeries: boolean }
  | { type: "NEXT_SERIES_READY" };

function reducer(state: ExercisePhase, action: MachineAction): ExercisePhase {
  switch (action.type) {
    case "RESET":
      return { value: "executando_serie" };
    case "START_REST": {
      if (state.value !== "executando_serie") return state;
      const seconds = Math.max(0, Math.round(action.seconds));
      if (seconds === 0) return { value: "confirmando_serie" };
      return {
        value: "descanso",
        totalSeconds: seconds,
        endsAt: Date.now() + seconds * 1000,
      };
    }
    case "ADJUST_REST": {
      if (state.value !== "descanso") return state;
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((state.endsAt - now) / 1000));
      const nextRemaining = Math.min(600, Math.max(0, remaining + action.seconds));
      if (nextRemaining === 0) return { value: "confirmando_serie" };
      return {
        value: "descanso",
        totalSeconds: Math.max(1, Math.min(600, state.totalSeconds + action.seconds), nextRemaining),
        endsAt: now + nextRemaining * 1000,
      };
    }
    case "REST_FINISHED":
      return state.value === "descanso" ? { value: "confirmando_serie" } : state;
    case "CONFIRM_SUCCESS":
      if (state.value !== "confirmando_serie") return state;
      return action.hasNextSeries ? { value: "proxima_serie" } : { value: "fim_exercicio" };
    case "NEXT_SERIES_READY":
      return state.value === "proxima_serie" ? { value: "executando_serie" } : state;
    default:
      return state;
  }
}

export function useExercicioSession({
  exerciseId,
  totalSets,
  restSeconds,
  onNaturalRestFinished,
}: {
  exerciseId: string | null;
  totalSets: number;
  restSeconds: number;
  onNaturalRestFinished?: () => void;
}) {
  const [phase, dispatch] = useReducer(reducer, { value: "executando_serie" });
  const [setNumber, setSetNumber] = useState(1);
  const naturalFinishHandled = useRef(false);

  useEffect(() => {
    setSetNumber(1);
    naturalFinishHandled.current = false;
    dispatch({ type: "RESET" });
  }, [exerciseId]);

  useEffect(() => {
    if (phase.value !== "proxima_serie") return;
    const timer = window.setTimeout(() => {
      setSetNumber((value) => Math.min(totalSets, value + 1));
      naturalFinishHandled.current = false;
      dispatch({ type: "NEXT_SERIES_READY" });
    }, 360);
    return () => window.clearTimeout(timer);
  }, [phase.value, totalSets]);

  const startRest = useCallback(() => {
    if (phase.value !== "executando_serie") return;
    naturalFinishHandled.current = false;
    dispatch({ type: "START_REST", seconds: restSeconds });
  }, [phase.value, restSeconds]);

  const finishRest = useCallback((natural = true) => {
    if (phase.value !== "descanso") return;
    if (natural && !naturalFinishHandled.current) {
      naturalFinishHandled.current = true;
      onNaturalRestFinished?.();
    }
    dispatch({ type: "REST_FINISHED" });
  }, [onNaturalRestFinished, phase.value]);

  const adjustRest = useCallback((seconds: number) => {
    if (phase.value !== "descanso") return;
    dispatch({ type: "ADJUST_REST", seconds });
  }, [phase.value]);

  const confirmSuccess = useCallback(() => {
    if (phase.value !== "confirmando_serie") return;
    dispatch({ type: "CONFIRM_SUCCESS", hasNextSeries: setNumber < totalSets });
  }, [phase.value, setNumber, totalSets]);

  return {
    phase,
    setNumber,
    startRest,
    finishRest,
    adjustRest,
    confirmSuccess,
    canEditValues: phase.value === "executando_serie" || phase.value === "confirmando_serie",
  };
}
