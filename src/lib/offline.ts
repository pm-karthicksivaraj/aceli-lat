// IndexedDB helpers for offline support using idb-keyval
import { get, set, del, keys, clear } from "idb-keyval";

const DRAFT_PREFIX = "draft_";
const SYNC_QUEUE_PREFIX = "sync_";

export interface DraftData {
  id: string;
  lenderId: string;
  typedNotes: string;
  audioBlobPath?: string;
  createdAt: number;
  updatedAt: number;
}

export interface SyncQueueEntry {
  id: string;
  type: "meeting" | "extraction";
  action: "create" | "update";
  data: Record<string, unknown>;
  status: "pending" | "syncing" | "failed";
  retryCount: number;
  createdAt: number;
}

// Draft operations
export async function saveDraft(draft: DraftData): Promise<void> {
  await set(`${DRAFT_PREFIX}${draft.id}`, draft);
}

export async function getDraft(id: string): Promise<DraftData | undefined> {
  return await get(`${DRAFT_PREFIX}${id}`);
}

export async function getAllDrafts(): Promise<DraftData[]> {
  const allKeys = await keys();
  const draftKeys = allKeys.filter((k) => String(k).startsWith(DRAFT_PREFIX));
  const drafts: DraftData[] = [];
  for (const key of draftKeys) {
    const draft = await get<DraftData>(key);
    if (draft) drafts.push(draft);
  }
  return drafts.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteDraft(id: string): Promise<void> {
  await del(`${DRAFT_PREFIX}${id}`);
}

// Sync queue operations
export async function addToSyncQueue(entry: SyncQueueEntry): Promise<void> {
  await set(`${SYNC_QUEUE_PREFIX}${entry.id}`, entry);
}

export async function getSyncQueue(): Promise<SyncQueueEntry[]> {
  const allKeys = await keys();
  const syncKeys = allKeys.filter((k) => String(k).startsWith(SYNC_QUEUE_PREFIX));
  const entries: SyncQueueEntry[] = [];
  for (const key of syncKeys) {
    const entry = await get<SyncQueueEntry>(key);
    if (entry) entries.push(entry);
  }
  return entries.sort((a, b) => a.createdAt - b.createdAt);
}

export async function updateSyncEntry(id: string, updates: Partial<SyncQueueEntry>): Promise<void> {
  const existing = await get<SyncQueueEntry>(`${SYNC_QUEUE_PREFIX}${id}`);
  if (existing) {
    await set(`${SYNC_QUEUE_PREFIX}${id}`, { ...existing, ...updates });
  }
}

export async function removeSyncEntry(id: string): Promise<void> {
  await del(`${SYNC_QUEUE_PREFIX}${id}`);
}

export async function clearAllOfflineData(): Promise<void> {
  await clear();
}

export async function getOfflineStorageSize(): Promise<number> {
  const allKeys = await keys();
  return allKeys.length;
}
