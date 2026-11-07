"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Filter, Loader2, RotateCcw, Search } from "lucide-react";
import { Input } from "@/frontend/components/ui/input";
import { Select } from "@/frontend/components/ui/select";
import { Button } from "@/frontend/components/ui/button";
import {
  ATTENDANCE_STATUSES,
  LEVELS,
  REGISTRATION_STATUSES,
  TRADES,
} from "@/shared/constants";

export function RegistrationFilters({ showAttendance = true }: { showAttendance?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  function onSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    update("search", String(formData.get("search") ?? ""));
  }

  function reset() {
    startTransition(() => router.push(pathname));
  }

  const hasFilters = ["search", "status", "trade", "level", "date", "attendance", "class"].some(
    (key) => searchParams.get(key),
  );

  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(7,26,61,0.04)]">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <form onSubmit={onSearchSubmit} className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            name="search"
            defaultValue={searchParams.get("search") ?? ""}
            placeholder="Search visitor, student, reference or phone…"
            className="pl-10 pr-24"
          />
          <Button
            type="submit"
            size="sm"
            className="absolute right-1.5 top-1/2 h-8 -translate-y-1/2"
            disabled={pending}
          >
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Search
          </Button>
        </form>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:flex xl:items-center">
          <Select
            value={searchParams.get("status") ?? ""}
            onChange={(event) => update("status", event.target.value)}
            aria-label="Filter by registration status"
            className="h-9 min-w-[130px] text-[12px]"
          >
            <option value="">All statuses</option>
            {REGISTRATION_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>

          <Select
            value={searchParams.get("trade") ?? ""}
            onChange={(event) => update("trade", event.target.value)}
            aria-label="Filter by trade"
            className="h-9 min-w-[110px] text-[12px]"
          >
            <option value="">All trades</option>
            {TRADES.map((trade) => (
              <option key={trade.value} value={trade.value}>
                {trade.label}
              </option>
            ))}
          </Select>

          <Select
            value={searchParams.get("level") ?? ""}
            onChange={(event) => update("level", event.target.value)}
            aria-label="Filter by level"
            className="h-9 min-w-[110px] text-[12px]"
          >
            <option value="">All levels</option>
            {LEVELS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </Select>

          <Input
            type="date"
            value={searchParams.get("date") ?? ""}
            onChange={(event) => update("date", event.target.value)}
            aria-label="Filter by visit date"
            className="h-9 min-w-[140px] text-[12px]"
          />

          {showAttendance ? (
            <Select
              value={searchParams.get("attendance") ?? ""}
              onChange={(event) => update("attendance", event.target.value)}
              aria-label="Filter by attendance"
              className="h-9 min-w-[130px] text-[12px]"
            >
              <option value="">All attendance</option>
              {ATTENDANCE_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Select>
          ) : null}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={reset}
            disabled={!hasFilters}
            className="h-9"
          >
            <RotateCcw className="size-3.5" />
            Reset
          </Button>
        </div>
      </div>

      {hasFilters ? (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
          <Filter className="size-3" />
          Filters applied. Results update automatically.
        </p>
      ) : null}
    </div>
  );
}
