import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { cn } from "@/shared/utils";

export function Brand({
  href = "/",
  variant = "dark",
  compact = false,
  className,
}: {
  href?: string;
  variant?: "dark" | "light";
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("group flex items-center gap-3", className)}>
      <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-sky via-primary to-navy text-white shadow-[0_8px_18px_-8px_rgba(20,86,160,0.8)]">
        <span className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_30%_20%,white,transparent_55%)]" />
        <GraduationCap className="relative size-5" />
      </span>
      <span className="min-w-0">
        <span
          className={cn(
            "block truncate text-[15px] font-bold leading-tight tracking-tight",
            variant === "light" ? "text-white" : "text-navy",
          )}
        >
          MUBILIGI
        </span>
        <span
          className={cn(
            "block truncate text-[10px] font-semibold uppercase tracking-[0.22em]",
            variant === "light" ? "text-sky-200/80" : "text-primary/60",
            compact && "hidden sm:block",
          )}
        >
          Visit Day
        </span>
      </span>
    </Link>
  );
}
