"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, CloudOff, Loader2, RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import { enqueueGone, listAttendanceQueue, syncAttendanceQueue, type AttendanceQueueItem } from "@/frontend/offline/attendance-queue";
import { formatDateTimeKigali } from "@/shared/utils";

export function OfflineQueuePanel({ actorId }: { actorId?: string }) {
  const [items, setItems] = useState<AttendanceQueueItem[]>([]);
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    setOnline(navigator.onLine);
    const queued = await listAttendanceQueue();
    setItems(
      queued.filter((item) =>
        actorId ? item.type !== "public_registration" : item.type === "public_registration",
      ),
    );
  }, [actorId]);

  const sync = useCallback(async () => {
    if (!navigator.onLine) return;
    setSyncing(true);
    try {
      await syncAttendanceQueue(actorId);
      await refresh();
    } finally {
      setSyncing(false);
    }
  }, [actorId, refresh]);

  useEffect(() => {
    void refresh();
    const handleOnline = () => void sync();
    const handleChange = () => void refresh();
    const handleRegistrationSynced = (event: Event) => {
      const { reference } = (event as CustomEvent<{ reference: string }>).detail;
      toast.success(`Registration submitted. Reference: ${reference}`);
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleChange);
    window.addEventListener("attendance-queue-updated", handleChange);
    window.addEventListener("registration-synced", handleRegistrationSynced);
    if (navigator.onLine) void sync();
    else void refresh();
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleChange);
      window.removeEventListener("attendance-queue-updated", handleChange);
      window.removeEventListener("registration-synced", handleRegistrationSynced);
    };
  }, [refresh, sync]);

  async function markGone(item: Extract<AttendanceQueueItem, { type: "check_in" }>) {
    if (item.departureAt) return;
    if (!window.confirm(`Mark ${item.input.fullName} as gone?`)) return;
    try {
      if (!actorId) return;
      await enqueueGone({ registrationOperationId: item.operationId }, actorId);
      if (navigator.onLine) await sync();
      await refresh();
      toast.success(navigator.onLine ? "Departure saved." : "Departure saved on this device. It will sync when online.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the departure.");
    }
  }

  return (
    <section className="space-y-3 rounded-2xl border border-line bg-white p-4 sm:p-5" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {online ? <CheckCircle2 className="size-4 text-emerald-600" /> : <CloudOff className="size-4 text-amber-600" />}
          <div>
            <p className="text-sm font-semibold text-navy">
              {online
                ? actorId
                  ? "Online attendance sync"
                  : "Online registration sync"
                : actorId
                  ? "Offline attendance mode"
                  : "Offline registration mode"}
            </p>
            <p className="text-xs text-slate-500">
              {items.length} pending record{items.length === 1 ? "" : "s"} · saved on this device
            </p>
          </div>
          {actorId && items.some((item) => item.type !== "public_registration" && item.actorId !== actorId) ? <Badge variant="warning">Other staff account</Badge> : null}
        </div>
        <Button type="button" size="sm" variant="outline" disabled={!online || syncing || items.length === 0} onClick={() => void sync()}>
          {syncing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw />}
          {syncing ? "Syncing" : "Retry sync"}
        </Button>
      </div>

      {items.length ? (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {items.map((item) => {
            const checkIn = item.type === "check_in" ? item : undefined;
            const publicRegistration = item.type === "public_registration" ? item : undefined;
            const person = checkIn?.input.fullName ?? publicRegistration?.input.fullName ?? "Existing attendance record";
            return (
              <li key={item.operationId} className="flex flex-wrap items-center justify-between gap-3 px-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-navy">{person}</p>
                  <p className="text-xs text-slate-500">
                    {checkIn
                      ? `${checkIn.input.studentFullName} · ${checkIn.input.className} · Arrival ${formatDateTimeKigali(checkIn.arrivalAt)}`
                      : publicRegistration
                        ? `${publicRegistration.input.studentFullName} · ${publicRegistration.input.className} · Saved ${formatDateTimeKigali(publicRegistration.createdAt)}`
                        : item.type === "gone"
                          ? `Departure ${formatDateTimeKigali(item.departureAt)}`
                          : ""}
                  </p>
                  {item.lastError ? <p className="mt-1 flex items-center gap-1 text-[11px] text-danger"><XCircle className="size-3" />{item.lastError}</p> : null}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={checkIn?.departureAt || item.type === "gone" ? "neutral" : "success"}>
                    {publicRegistration
                      ? "Registration · Pending sync"
                      : checkIn?.departureAt || item.type === "gone"
                        ? "Gone · Pending sync"
                        : "Present · Pending sync"}
                  </Badge>
                  {checkIn && actorId && !checkIn.departureAt ? (
                    <Button type="button" size="sm" variant="navy" onClick={() => void markGone(checkIn)}>Gone</Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
