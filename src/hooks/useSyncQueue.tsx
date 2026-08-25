import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  syncQueuedCardioCompletion,
  type CardioSessionRecord,
  type CardioSnapshot,
} from "../lib/cardio";
import {
  deleteSyncQueueItem,
  listSyncQueue,
  putSyncQueueItem,
  type CardioSyncQueueItem,
  type SyncStatus,
} from "../lib/cardioSyncQueue";

type SyncState = {
  status: "idle" | SyncStatus;
  validForRanking: boolean;
};

type SyncQueueContextValue = {
  enqueueCardioCompletion: (
    session: CardioSessionRecord,
    snapshot: CardioSnapshot,
  ) => Promise<string>;
  retryCardio: (idempotencyKey: string) => void;
  getSyncState: (idempotencyKey?: string | null) => SyncState;
};

const SyncQueueContext = createContext<SyncQueueContextValue | null>(null);
const idleState: SyncState = { status: "idle", validForRanking: false };
const RETRY_DELAYS = [1000, 2000, 4000, 8000];

function delay(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

function emitDailySummaryInvalidation(item: CardioSyncQueueItem) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("accqua:daily-summary-invalidated", {
    detail: {
      userId: item.session.studentId,
      date: item.snapshot.status === "completed" ? new Date().toISOString().slice(0, 10) : "",
      source: "cardio",
    },
  }));
}

export function SyncQueueProvider({ children }: { children: ReactNode }) {
  const [states, setStates] = useState<Record<string, SyncState>>({});
  const inFlight = useRef(new Set<string>());

  const setSyncState = useCallback((key: string, state: SyncState) => {
    setStates((previous) => ({ ...previous, [key]: state }));
  }, []);

  const syncItem = useCallback(async (item: CardioSyncQueueItem) => {
    const key = item.idempotency_key;
    if (inFlight.current.has(key)) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setSyncState(key, { status: "pending", validForRanking: false });
      return;
    }

    inFlight.current.add(key);
    setSyncState(key, { status: "pending", validForRanking: false });

    try {
      let current = { ...item, sync_status: "pending" as const };
      for (let attempt = 1; attempt <= 5; attempt += 1) {
        current = {
          ...current,
          attempts: attempt,
          sync_status: "pending",
          updated_at: new Date().toISOString(),
        };
        await putSyncQueueItem(current);

        try {
          const result = await syncQueuedCardioCompletion(current.session, current.snapshot);
          if (result.saved) {
            await deleteSyncQueueItem(current.id);
            setSyncState(key, {
              status: "synced",
              validForRanking: result.validForRanking,
            });
            emitDailySummaryInvalidation(current);
            return;
          }
        } catch {
          // Infraestrutura nunca é propagada para a UI.
        }

        if (attempt < 5) await delay(RETRY_DELAYS[attempt - 1]);
      }

      const failed: CardioSyncQueueItem = {
        ...current,
        sync_status: "failed",
        updated_at: new Date().toISOString(),
      };
      await putSyncQueueItem(failed);
      setSyncState(key, { status: "failed", validForRanking: false });
    } finally {
      inFlight.current.delete(key);
    }
  }, [setSyncState]);

  const syncAll = useCallback(async () => {
    const items = await listSyncQueue();
    await Promise.all(items.map((item) => syncItem(item)));
  }, [syncItem]);

  useEffect(() => {
    let mounted = true;
    void listSyncQueue().then((items) => {
      if (!mounted) return;
      if (items.length) {
        setStates((previous) => {
          const next = { ...previous };
          for (const item of items) {
            next[item.idempotency_key] = {
              status: item.sync_status,
              validForRanking: false,
            };
          }
          return next;
        });
      }
      if (typeof navigator === "undefined" || navigator.onLine) void syncAll();
    });

    const onOnline = () => void syncAll();
    const onVisibility = () => {
      if (document.visibilityState === "visible") void syncAll();
    };
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      mounted = false;
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [syncAll]);

  const enqueueCardioCompletion = useCallback(async (
    session: CardioSessionRecord,
    snapshot: CardioSnapshot,
  ) => {
    const now = new Date().toISOString();
    const key = session.idempotencyKey;
    const item: CardioSyncQueueItem = {
      id: `cardio:${key}`,
      kind: "cardio_completion",
      idempotency_key: key,
      sync_status: "pending",
      attempts: 0,
      created_at: now,
      updated_at: now,
      session,
      snapshot,
    };

    // Write-ahead: armazenamento local acontece antes de qualquer tentativa remota.
    await putSyncQueueItem(item);
    setSyncState(key, { status: "pending", validForRanking: false });
    return key;
  }, [setSyncState]);

  const retryCardio = useCallback((idempotencyKey: string) => {
    if (!idempotencyKey) return;
    void listSyncQueue().then((items) => {
      const item = items.find((current) => current.idempotency_key === idempotencyKey);
      if (!item) return;
      const pending = { ...item, attempts: 0, sync_status: "pending" as const, updated_at: new Date().toISOString() };
      void putSyncQueueItem(pending).then(() => syncItem(pending));
    });
  }, [syncItem]);

  const getSyncState = useCallback((idempotencyKey?: string | null) => {
    if (!idempotencyKey) return idleState;
    return states[idempotencyKey] ?? idleState;
  }, [states]);

  const value = useMemo<SyncQueueContextValue>(() => ({
    enqueueCardioCompletion,
    retryCardio,
    getSyncState,
  }), [enqueueCardioCompletion, getSyncState, retryCardio]);

  return <SyncQueueContext.Provider value={value}>{children}</SyncQueueContext.Provider>;
}

export function useSyncQueue() {
  const value = useContext(SyncQueueContext);
  if (!value) throw new Error("useSyncQueue must be used inside SyncQueueProvider");
  return value;
}
