import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/utils";
import {
  ATTENDANCE_STATUS_LABEL,
  REGISTRATION_STATUS_LABEL,
  STATUS_BADGE,
} from "@/shared/constants";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset",
  {
    variants: {
      variant: {
        default: "bg-sky-soft text-primary ring-blue-200",
        navy: "bg-navy/5 text-navy ring-navy/15",
        success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
        warning: "bg-amber-50 text-amber-700 ring-amber-200",
        danger: "bg-red-50 text-red-700 ring-red-200",
        neutral: "bg-slate-100 text-slate-600 ring-slate-200",
        sky: "bg-sky-50 text-sky-700 ring-sky-200",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export function StatusBadge({ status }: { status: string }) {
  const label =
    REGISTRATION_STATUS_LABEL[status as keyof typeof REGISTRATION_STATUS_LABEL] ??
    ATTENDANCE_STATUS_LABEL[status as keyof typeof ATTENDANCE_STATUS_LABEL] ??
    status;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset",
        STATUS_BADGE[status] ?? STATUS_BADGE.expected,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}
