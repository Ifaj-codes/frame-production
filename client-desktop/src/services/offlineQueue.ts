import { api } from "../api";

export interface OfflineEvent {
  clientEventId: string;
  eventType: "CLOCK_IN" | "CLOCK_OUT";
  timestamp: string;
  date: string;
}

const STORAGE_KEY = "frame_offline_queue";

export async function getOfflineQueue(): Promise<OfflineEvent[]> {
  if (window.electronAPI) {
    try {
      const q = await window.electronAPI.loadOfflineQueue();
      if (Array.isArray(q)) return q;
    } catch (e) {}
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveOfflineQueue(queue: OfflineEvent[]): Promise<void> {
  if (window.electronAPI) {
    try {
      await window.electronAPI.saveOfflineQueue(queue);
    } catch (e) {}
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export async function enqueueOfflineEvent(eventType: "CLOCK_IN" | "CLOCK_OUT"): Promise<OfflineEvent> {
  const queue = await getOfflineQueue();
  const now = new Date();
  const evt: OfflineEvent = {
    clientEventId: `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    eventType,
    timestamp: now.toISOString(),
    date: now.toISOString().split("T")[0]
  };
  queue.push(evt);
  await saveOfflineQueue(queue);
  return evt;
}

export async function flushOfflineQueue(): Promise<number> {
  const queue = await getOfflineQueue();
  if (queue.length === 0) return 0;

  try {
    const res = await api.post("/attendance/sync-offline", { events: queue });
    if (res.data && res.data.success) {
      await saveOfflineQueue([]);
      return res.data.syncedCount || queue.length;
    }
  } catch (err) {
    console.warn("Failed to flush offline queue:", err);
  }
  return 0;
}
