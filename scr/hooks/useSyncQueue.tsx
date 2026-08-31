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
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthProvider";

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

function localDateKey(value?: string | null) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function emitDailySummaryInvalidation(item: CardioSyncQueueItem) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("accqua:daily-summary-invalidated", {
    detail: {
      userId: item.session.studentId,
      date: item.snapshot.status === "completed"
        ? localDateKey(item.session.completedAt || item.session.startedAt)
        : "",
      source: "cardio",
    },
  }));
}

export function SyncQueueProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [states, setStates] = useState<Record<string, SyncState>>({});
  const inFlight = useRef(new Set<string>());

  const setSyncState = useCallback((key: string, state: SyncState) => {
    setStates((previous) => ({ ...previous, [key]: state }));
  }, []);

  const syncItem = useCallback(async (item: CardioSyncQueueItem) => {
    const key = item.idempotency_key;

    // Nunca sincroniza dados locais pertencentes a outra sessão autenticada.
    if (!userId || item.session.studentId !== userId) return;
    if (item.sync_status === "synced") {
      await deleteSyncQueueItem(item.id);
      return;
    }
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
            const synced: CardioSyncQueueItem = {
              ...current,
              sync_status: "synced",
              updated_at: new Date().toISOString(),
            };

            // Depois da confirmação remota, a fila deixa de ser histórico local.
            // O histórico canônico passa a ser o Supabase.
            await deleteSyncQueueItem(synced.id);
            setSyncState(key, { status: "synced", validForRanking: result.validForRanking });
            emitDailySummaryInvalidation(synced);
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("accqua:cardio-synced", {
                detail: { userId: synced.session.studentId, idempotencyKey: key },
              }));
              window.dispatchEvent(new CustomEvent("accqua:cardio-sync-state", {
                detail: { idempotencyKey: key, status: "synced" },
              }));
            }
            void queryClient.invalidateQueries({ queryKey: ["cardio-history", synced.session.studentId] });
            void queryClient.invalidateQueries({ queryKey: ["diet-dashboard", synced.session.studentId] });
            void queryClient.invalidateQueries({ queryKey: ["daily-summary", synced.session.studentId] });
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
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("accqua:cardio-sync-state", {
          detail: { idempotencyKey: key, status: "failed" },
        }));
      }
    } finally {
      inFlight.current.delete(key);
    }
  }, [queryClient, setSyncState, userId]);

  const syncAll = useCallback(async () => {
    if (!userId) return;
    const items = await listSyncQueue();
    const ownedItems = items.filter((item) => item.session.studentId === userId);

    await Promise.all(
      ownedItems
        .filter((item) => item.sync_status === "synced")
        .map((item) => deleteSyncQueueItem(item.id)),
    );

    await Promise.all(
      ownedItems
        .filter((item) => item.sync_status !== "synced")
        .map((item) => syncItem(item)),
    );
  }, [syncItem, userId]);

  useEffect(() => {
    let mounted = true;

    if (!userId) {
      setStates({});
      return () => {
        mounted = false;
      };
    }

    void listSyncQueue().then((items) => {
      if (!mounted) return;
      const ownedItems = items.filter((item) => item.session.studentId === userId);
      const next: Record<string, SyncState> = {};
      for (const item of ownedItems) {
        if (item.sync_status === "synced") continue;
        next[item.idempotency_key] = {
          status: item.sync_status,
          validForRanking: false,
        };
      }
      setStates(next);
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
  }, [syncAll, userId]);

  const enqueueCardioCompletion = useCallback(async (
    session: CardioSessionRecord,
    snapshot: CardioSnapshot,
  ) => {
    const now = new Date().toISOString();
    const key = session.idempotencyKey;

    if (!userId || session.studentId !== userId) {
      setSyncState(key, { status: "failed", validForRanking: false });
      return key;
    }

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
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("accqua:cardio-sync-state", {
        detail: { idempotencyKey: key, status: "pending" },
      }));
    }
    void queryClient.invalidateQueries({ queryKey: ["cardio-history", session.studentId] });
    return key;
  }, [queryClient, setSyncState, userId]);

  const retryCardio = useCallback((idempotencyKey: string) => {
    if (!idempotencyKey || !userId) return;
    void listSyncQueue().then((items) => {
      const item = items.find((current) =>
        current.idempotency_key === idempotencyKey &&
        current.session.studentId === userId
      );
      if (!item) return;
      const pending = {
        ...item,
        attempts: 0,
        sync_status: "pending" as const,
        updated_at: new Date().toISOString(),
      };
      void putSyncQueueItem(pending).then(() => syncItem(pending));
    });
  }, [syncItem, userId]);

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
