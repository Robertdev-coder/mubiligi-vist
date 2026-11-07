"use client";

import type { RegistrationInput } from "@/shared/validation/schemas";

export interface QueuedCheckIn {
  type: "check_in";
  operationId: string;
  departureOperationId: string;
  actorId: string;
  input: RegistrationInput;
  arrivalAt: string;
  arrivalTimezone: string;
  departureAt?: string;
  departureTimezone?: string;
  createdAt: string;
  retryCount: number;
  lastError?: string;
}

export interface QueuedGone {
  type: "gone";
  operationId: string;
  actorId: string;
  registrationId?: string;
  registrationOperationId?: string;
  departureAt: string;
  departureTimezone: string;
  createdAt: string;
  retryCount: number;
  lastError?: string;
}

export type AttendanceQueueItem = QueuedCheckIn | QueuedGone;
const DB_NAME = "mubiligi-visitday";
const STORE = "attendance-queue";
let openPromise: Promise<IDBDatabase> | undefined;
let syncPromise: Promise<void> | undefined;

function database(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("Offline storage is unavailable in this browser."));
  if (openPromise) return openPromise;

  openPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE, { keyPath: "operationId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open offline attendance storage."));
  });
  return openPromise;
}

async function transaction<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = operation(tx.objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Offline storage request failed."));
    tx.onabort = () => reject(tx.error ?? new Error("Offline storage transaction aborted."));
  });
}

export async function listAttendanceQueue(): Promise<AttendanceQueueItem[]> {
  const items = await transaction<AttendanceQueueItem[]>("readonly", (store) => store.getAll());
  return items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function enqueueCheckIn(
  input: RegistrationInput,
  actorId: string,
): Promise<QueuedCheckIn> {
  const item: QueuedCheckIn = {
    type: "check_in",
    operationId: crypto.randomUUID(),
    departureOperationId: crypto.randomUUID(),
    actorId,
    input,
    arrivalAt: new Date().toISOString(),
    arrivalTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    createdAt: new Date().toISOString(),
    retryCount: 0,
  };
  await transaction("readwrite", (store) => store.put(item));
  window.dispatchEvent(new Event("attendance-queue-updated"));
  return item;
}

export async function enqueueGone(
  target: { registrationId?: string; registrationOperationId?: string },
  actorId: string,
): Promise<void> {
  if (Boolean(target.registrationId) === Boolean(target.registrationOperationId)) {
    throw new Error("Choose exactly one attendance record to mark gone.");
  }
  const createdAt = new Date().toISOString();
  const departureAt = createdAt;
  const departureTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const queue = await listAttendanceQueue();
  const pendingCheckIn = target.registrationOperationId
    ? queue.find((item): item is QueuedCheckIn => item.type === "check_in" && item.operationId === target.registrationOperationId)
    : undefined;

  if (pendingCheckIn) {
    pendingCheckIn.departureAt = departureAt;
    pendingCheckIn.departureTimezone = departureTimezone;
    await transaction("readwrite", (store) => store.put(pendingCheckIn));
  }

  const item: QueuedGone = {
    type: "gone",
    operationId: pendingCheckIn?.departureOperationId ?? crypto.randomUUID(),
    actorId,
    registrationId: target.registrationId,
    registrationOperationId: target.registrationOperationId,
    departureAt,
    departureTimezone,
    createdAt,
    retryCount: 0,
  };
  await transaction("readwrite", (store) => store.put(item));
  window.dispatchEvent(new Event("attendance-queue-updated"));
}

export async function syncAttendanceQueue(actorId: string): Promise<void> {
  if (syncPromise) return syncPromise;
  syncPromise = (async () => {
    if (!navigator.onLine) return;
    const queue = await listAttendanceQueue();
    for (const item of queue) {
      if (item.actorId !== actorId) continue;
      try {
        const response = await fetch("/api/offline-sync", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(item),
        });
        if (response.ok) {
          await transaction("readwrite", (store) => store.delete(item.operationId));
        } else {
          const result = await response.json().catch(() => null) as { error?: string } | null;
          await transaction("readwrite", (store) =>
            store.put({ ...item, retryCount: item.retryCount + 1, lastError: result?.error ?? "Synchronization failed." }),
          );
        }
      } catch (error) {
        await transaction("readwrite", (store) =>
          store.put({
            ...item,
            retryCount: item.retryCount + 1,
            lastError: error instanceof Error ? error.message : "Network error.",
          }),
        );
        break;
      }
    }
    window.dispatchEvent(new Event("attendance-queue-updated"));
  })().finally(() => {
    syncPromise = undefined;
  });
  return syncPromise;
}

