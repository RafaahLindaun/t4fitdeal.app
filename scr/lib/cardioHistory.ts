import { loadCardioDashboard, type CardioActivity } from "./cardio";
import { listSyncQueue, type SyncStatus } from "./cardioSyncQueue";

export type CardioHistoryEntry = {
  key: string;
  activityType: CardioActivity;
  elapsedSeconds: number;
  calories: number;
  completedAt: string;
  syncStatus: SyncStatus;
  idempotencyKey: string;
};

export async function loadCardioHistory(userId: string): Promise<CardioHistoryEntry[]> {
  const [dashboard, queue] = await Promise.all([loadCardioDashboard(userId), listSyncQueue()]);
  const merged = new Map<string, CardioHistoryEntry>();
  for (const session of dashboard.recentSessions) {
    const key = session.idempotencyKey || session.id;
    merged.set(key, {
      key,
      activityType: session.activityType,
      elapsedSeconds: session.elapsedSeconds,
      calories: session.calories,
      completedAt: session.completedAt || session.startedAt,
      syncStatus: "synced",
      idempotencyKey: session.idempotencyKey,
    });
  }
  for (const item of queue.filter((entry) => entry.session.studentId === userId)) {
    const key = item.idempotency_key || item.id;
    const existing = merged.get(key);
    if (existing && item.sync_status === "synced") continue;
    merged.set(key, {
      key,
      activityType: item.session.activityType,
      elapsedSeconds: item.snapshot.elapsedSeconds,
      calories: item.snapshot.calories,
      completedAt: item.session.completedAt || item.updated_at || item.session.startedAt,
      syncStatus: item.sync_status,
      idempotencyKey: item.idempotency_key,
    });
  }
  return [...merged.values()]
    .sort((a, b) => String(b.completedAt).localeCompare(String(a.completedAt)))
    .slice(0, 40);
}
