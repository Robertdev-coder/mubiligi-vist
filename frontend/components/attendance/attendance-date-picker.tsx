"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { CalendarDays, Loader2 } from "lucide-react";
import { Input } from "@/frontend/components/ui/input";
import { Button } from "@/frontend/components/ui/button";
import { todayKigali } from "@/shared/utils";

export function AttendanceDatePicker({ date }: { date: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function go(value: string) {
    const params = new URLSearchParams();
    if (value) params.set("date", value);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          type="date"
          value={date}
          onChange={(event) => go(event.target.value)}
          className="h-9 w-[170px] pl-9 text-[12px]"
          aria-label="Attendance date"
        />
      </div>
      <Button
        size="sm"
        variant="outline"
        className="h-9"
        onClick={() => go(todayKigali())}
        disabled={pending || date === todayKigali()}
      >
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
        Today
      </Button>
    </div>
  );
}
