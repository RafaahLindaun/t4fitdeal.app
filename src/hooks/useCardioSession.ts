import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  saveCardioSnapshot,
  startCardioSession,
  type CardioActivity,
  type CardioSessionRecord,
  type CardioSessionStatus,
  type CardioSnapshot,
  type CardioTiming,
} from "../lib/cardio";
import { useSyncQueue } from "./useSyncQueue";

export type CardioMachinePhase =
  | "idle"
  | "em_andamento"
  | "pausado"
  | "finalizado";

export type CardioSample = {
  elapsedSeconds: number;
  value: number;
};

type MachineState = {
  phase: CardioMachinePhase;
  elapsedSeconds: number;
  session: CardioSessionRecord | null;
  validForRanking: boolean;
};

type MachineAction =
  | { type: "RESTORE"; session: CardioSessionRecord }
  | { type: "START"; session: CardioSessionRecord }
  | { type: "TICK" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "FINISH"; validForRanking: boolean }
  | { type: "SYNC_RESULT"; validForRanking: boolean }
  | { type: "RESET" };

const initialState: MachineState = {
  phase: "idle",
  elapsedSeconds: 0,
  session: null,
  validForRanking: false,
};

function machineReducer(state: MachineState, action: MachineAction): MachineState {
  switch (action.type) {
    case "RESTORE":
      return {
        phase: "pausado",
        elapsedSeconds: Math.max(0, action.session.elapsedSeconds),
        session: action.session,
        validForRanking: action.session.validForRanking,
      };
    case "START":
      return {
        phase: "em_andamento",
        elapsedSeconds: 0,
        session: action.session,
        validForRanking: false,
      };
    case "TICK":
      return state.phase === "em_andamento"
        ? { ...state, elapsedSeconds: state.elapsedSeconds + 1 }
        : state;
    case "PAUSE":
      return state.phase === "em_andamento"
        ? { ...state, phase: "pausado" }
        : state;
    case "RESUME":
      return state.phase === "pausado"
        ? { ...state, phase: "em_andamento" }
        : state;
    case "FINISH":
      return {
        ...state,
        phase: "finalizado",
        validForRanking: action.validForRanking,
      };
    case "SYNC_RESULT":
      return { ...state, validForRanking: action.validForRanking };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

export type CardioStartConfig = {
  userId: string;
  prescriptionId: string | null;
  activityType: CardioActivity;
  timing: CardioTiming;
  targetDurationSeconds: number;
  targetSnapshot: Record<string, unknown>;
  source: "professor" | "free";
};

type UseCardioSessionOptions = {
  startConfig: CardioStartConfig;
  liveMetricValue: number;
  buildSnapshot: (
    elapsedSeconds: number,
    status: CardioSessionStatus,
  ) => CardioSnapshot;
  onPersistError?: () => void;
};

export function useCardioSession({
  startConfig,
  liveMetricValue,
  buildSnapshot,
  onPersistError,
}: UseCardioSessionOptions) {
  const [state, dispatch] = useReducer(machineReducer, initialState);
  const [busy, setBusy] = useState(false);
  const [samples, setSamples] = useState<CardioSample[]>([]);
  const syncQueue = useSyncQueue();

  const buildSnapshotRef = useRef(buildSnapshot);
  const metricRef = useRef(liveMetricValue);
  const persistErrorRef = useRef(onPersistError);
  const elapsedRef = useRef(0);

  useEffect(() => {
    buildSnapshotRef.current = buildSnapshot;
  }, [buildSnapshot]);

  useEffect(() => {
    metricRef.current = liveMetricValue;
  }, [liveMetricValue]);

  useEffect(() => {
    elapsedRef.current = state.elapsedSeconds;
  }, [state.elapsedSeconds]);

  useEffect(() => {
    persistErrorRef.current = onPersistError;
  }, [onPersistError]);

  useEffect(() => {
    if (state.phase !== "em_andamento") return;
    const timer = window.setInterval(() => dispatch({ type: "TICK" }), 1000);
    return () => window.clearInterval(timer);
  }, [state.phase]);

  useEffect(() => {
    if (state.phase !== "em_andamento") return;
    if (state.elapsedSeconds <= 0) return;

    setSamples((previous) => {
      const next = [
        ...previous,
        {
          elapsedSeconds: state.elapsedSeconds,
          value: Number(metricRef.current.toFixed(2)),
        },
      ];
      return next.slice(-180);
    });
  }, [state.elapsedSeconds, state.phase]);

  useEffect(() => {
    if (
      !state.session ||
      state.session.local ||
      state.phase === "idle" ||
      state.phase === "finalizado"
    ) {
      return;
    }

    const save = async () => {
      const status: CardioSessionStatus =
        state.phase === "em_andamento" ? "running" : "paused";
      const result = await saveCardioSnapshot(
        state.session!,
        buildSnapshotRef.current(elapsedRef.current, status),
      );
      if (!result.saved) persistErrorRef.current?.();
    };

    const heartbeat = window.setInterval(() => void save(), 15000);
    return () => window.clearInterval(heartbeat);
  }, [state.phase, state.session]);

  const restore = useCallback((session: CardioSessionRecord) => {
    setSamples([{
      elapsedSeconds: Math.max(0, session.elapsedSeconds),
      value: Number(metricRef.current.toFixed(2)),
    }]);
    dispatch({ type: "RESTORE", session });
  }, []);

  const start = useCallback(async () => {
    if (busy || state.phase !== "idle") return;
    setBusy(true);
    try {
      const created = await startCardioSession(startConfig);
      setSamples([{ elapsedSeconds: 0, value: Number(metricRef.current.toFixed(2)) }]);
      dispatch({ type: "START", session: created });
    } finally {
      setBusy(false);
    }
  }, [busy, startConfig, state.phase]);

  const pause = useCallback(async () => {
    if (!state.session || state.phase !== "em_andamento" || busy) return;
    dispatch({ type: "PAUSE" });
    const result = await saveCardioSnapshot(
      state.session,
      buildSnapshotRef.current(state.elapsedSeconds, "paused"),
    );
    if (!result.saved) persistErrorRef.current?.();
  }, [busy, state.elapsedSeconds, state.phase, state.session]);

  const resume = useCallback(async () => {
    if (!state.session || state.phase !== "pausado" || busy) return;
    dispatch({ type: "RESUME" });
    const result = await saveCardioSnapshot(
      state.session,
      buildSnapshotRef.current(state.elapsedSeconds, "running"),
    );
    if (!result.saved) persistErrorRef.current?.();
  }, [busy, state.elapsedSeconds, state.phase, state.session]);

  const finish = useCallback(async () => {
    if (!state.session || state.phase === "idle" || state.phase === "finalizado" || busy) {
      return { queued: false };
    }

    setBusy(true);
    try {
      const snapshot = buildSnapshotRef.current(state.elapsedSeconds, "completed");
      const key = await syncQueue.enqueueCardioCompletion(state.session, snapshot);
      dispatch({ type: "FINISH", validForRanking: false });
      syncQueue.retryCardio(key);
      return { queued: true };
    } finally {
      setBusy(false);
    }
  }, [busy, state.elapsedSeconds, state.phase, state.session, syncQueue]);

  const syncState = syncQueue.getSyncState(state.session?.idempotencyKey);

  useEffect(() => {
    if (syncState.status === "synced") {
      dispatch({ type: "SYNC_RESULT", validForRanking: syncState.validForRanking });
    }
  }, [syncState.status, syncState.validForRanking]);

  const retrySync = useCallback(() => {
    if (!state.session?.idempotencyKey) return;
    syncQueue.retryCardio(state.session.idempotencyKey);
  }, [state.session?.idempotencyKey, syncQueue]);

  const reset = useCallback(() => {
    setSamples([]);
    dispatch({ type: "RESET" });
  }, []);

  return {
    phase: state.phase,
    elapsedSeconds: state.elapsedSeconds,
    session: state.session,
    validForRanking: state.validForRanking,
    busy,
    samples,
    syncStatus: syncState.status,
    retrySync,
    restore,
    start,
    pause,
    resume,
    finish,
    reset,
  };
}
