import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/utils";

const tones = {
  blue: "bg-sky-soft text-primary ring-blue-100",
  navy: "bg-navy/5 text-navy ring-navy/10",
  green: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  amber: "bg-amber-50 text-amber-600 ring-amber-100",
  red: "bg-red-50 text-red-600 ring-red-100",
  sky: "bg-sky-50 text-sky-600 ring-sky-100",
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
} as const;

export type StatTone = keyof typeof tones;

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "blue",
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: StatTone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "card-hover group relative overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(7,26,61,0.04),0_12px_32px_-18px_rgba(7,26,61,0.22)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[12px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-navy">{value}</p>
          {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
        </div>
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset transition-transform duration-300 group-hover:scale-105",
            tones[tone],
          )}
        >
          <Icon className="size-5" />
        </span>
      </div>
    </div>
  );
}
