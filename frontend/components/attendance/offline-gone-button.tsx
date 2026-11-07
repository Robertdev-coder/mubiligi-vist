"use client";

import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/frontend/components/ui/button";
import { enqueueGone, syncAttendanceQueue } from "@/frontend/offline/attendance-queue";

export function OfflineGoneButton({
  registrationId,
  visitorName,
  actorId,
}: {
  registrationId: string;
  visitorName: string;
  actorId: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [marked, setMarked] = useState(false);

  async function markGone() {
    if (pending || marked || !window.confirm(`Mark ${visitorName} as gone?`)) return;
    setPending(true);
    try {
      await enqueueGone({ registrationId }, actorId);
      setMarked(true);
      if (navigator.onLine) {
        await syncAttendanceQueue(actorId);
        toast.success("Departure recorded.");
        router.refresh();
      } else {
        toast.success("Departure saved on this device. It will synchronize when online.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not record departure.");
      setMarked(false);
    } finally {
      setPending(false);
    }
  }

  if (marked) {
    return (
      <Button size="sm" variant="outline" className="h-8 px-2.5 text-[11px]" disabled>
        Gone · Pending sync
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      variant="navy"
      className="h-8 px-2.5 text-[11px]"
      onClick={() => void markGone()}
      disabled={pending}
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <LogOut className="size-3.5" />}
      Gone
    </Button>
  );
}
