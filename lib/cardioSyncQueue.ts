import type { CardioSessionRecord, CardioSnapshot } from "./cardio";

export type SyncStatus = "pending" | "synced" | "failed";

export type CardioSyncQueueItem = {
  id: string;
  kind: "cardio_completion";
  idempotency_key: string;
  sync_status: Exclude<SyncStatus, "synced">;
  attempts: number;
  created_at: string;
  updated_at: string;
  session: CardioSessionRecord;
  snapshot: CardioSnapshot;
};

const DB_NAME = "accqua-offline-queue";
const DB_VERSION = 1;
const STORE_NAME = "sync_queue";
const FALLBACK_KEY = "accqua.sync_queue.v1";

function canUseIndexedDb() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function canUseLocalStorage() {
  return typeof window !== "undefined" && "localStorage" in window;
}

function readFallback(): CardioSyncQueueItem[] {
  if (!canUseLocalStorage()) return [];
  try {
    const raw = window.localStorage.getItem(FALLBACK_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed as CardioSyncQueueItem[] : [];
  } catch {
    return [];
  }
}

function writeFallback(items: CardioSyncQueueItem[]) {
  if (!canUseLocalStorage()) return;
  try {
    window.localStorage.setItem(FALLBACK_KEY, JSON.stringify(items));
  } catch {
    // A fila em memória continua funcionando mesmo com storage indisponível.
  }
}

function openQueueDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("indexeddb unavailable"));
  });
}

async function idbPut(item: CardioSyncQueueItem) {
  const db = await openQueueDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(item);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("indexeddb write failed"));
  });
  db.close();
}

async function idbDelete(id: string) {
  const db = await openQueueDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("indexeddb delete failed"));
  });
  db.close();
}

async function idbList(): Promise<CardioSyncQueueItem[]> {
  const db = await openQueueDb();
  const result = await new Promise<CardioSyncQueueItem[]>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve((request.result ?? []) as CardioSyncQueueItem[]);
    request.onerror = () => reject(request.error ?? new Error("indexeddb read failed"));
  });
  db.close();
  return result;
}

export async function listSyncQueue(): Promise<CardioSyncQueueItem[]> {
  if (canUseIndexedDb()) {
    try {
      const indexedItems = await idbList();
      const merged = new Map<string, CardioSyncQueueItem>();
      for (const item of [...readFallback(), ...indexedItems]) {
        const previous = merged.get(item.id);
        if (!previous || String(item.updated_at) >= String(previous.updated_at)) {
          merged.set(item.id, item);
        }
      }
      const items = [...merged.values()];
      writeFallback(items);
      return items;
    } catch {
      return readFallback();
    }
  }
  return readFallback();
}

export async function putSyncQueueItem(item: CardioSyncQueueItem) {
  const fallback = readFallback().filter((current) => current.id !== item.id);
  fallback.push(item);
  writeFallback(fallback);

  if (canUseIndexedDb()) {
    try {
      await idbPut(item);
    } catch {
      // localStorage já recebeu o write-ahead.
    }
  }
}

export async function deleteSyncQueueItem(id: string) {
  writeFallback(readFallback().filter((item) => item.id !== id));
  if (canUseIndexedDb()) {
    try {
      await idbDelete(id);
    } catch {
      // A próxima leitura ainda pode usar o fallback já limpo.
    }
  }
}
